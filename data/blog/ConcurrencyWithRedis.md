---
title: Redis를 활용한 동시성 제어
date: '2023-10-01'
tags: ['MySQL', '기술']
draft: false
summary: Redis를 활용한 동시성 제어, 분산 락에 대해
---
## 분산 락이란?

자바 스프링 기반의 웹 어플리케이션은 기본적으로 멀티 스레드 환경에서 구동된다.

따라서 여러 스레드가 함께 접근할 수 있는 공유 자원에 대해 Race Condition이 발생할 수 있는데, 이를 방지하기 위해 처리를 할 필요가 있다.

자바에서는 이를 위해 `synchronized` 라는 키워드를 제공하여 사용할 수 있게 하는데, 이는 모니터 기반으로 **mutual exclution(상호 배제)** 기능을 제공하는 것으로 같은 프로세스 상에서만 이를 보장해 주기 때문에 여러 서버를 운영한다면 한계가 생긴다.

이를 해결하기 위해 락을 활용할 수 있는데, 이전에 작성한 **비관적, 낙관적 락 이외에 분산 락 또한 존재**한다.

**어플리케이션 서버 n개와 DB서버 1개의 경우는 비관적, 낙관적 락과 비교하며 결정할 수 있지만 DB서버 n개의 경우는 분산 락을 사용할 수 밖에 없다.**

## Redis를 활용한 분산 락

Redis의 락을 활용하는 방법에는 Redis Client인 Lettuce와 Redisson이 있다.

### Lettuce

`setnx` 명령어를 활용하여 분산 락을 구현한다.

이는 락을 획득하려는 스레드가 락의 획득 가능 여부의 확인을 반복적으로 확인하는 스핀 락(Spin Lock) 방식이다.

```
💡**Spin Lock**
	Spin Lock은 Lock을 얻을 수 없다면, 계속해서 Lock을 확인하며 얻을 때 까지
	기다리는 이른바 busy waiting 방식을 활용한다.
```

Redis의 Lock 획득, 삭제 로직

```java
public boolean lock(String key) {
    return redisTemplate
            .opsForValue()
            .setIfAbsent(key+"_lock", "lock", Duration.ofMillis(10000));
}

public void unLock(String key) {
		redisTemplate.delete(key+"_lock");
}
```

그리고 이를 활용하면 아래와 같이 코드를 작성할 수 있다.

```java
@RequiredArgsConstructor
@Service
@Slf4j
public class BookServiceWithRedis {
		private final BookRepository bookRepository;
	  private final RedisRepository redisRepository;

		public void orderBookByRedisWithSpinLock(Long id) throws InterruptedException {
		    int wait = 0;
		    while (!redisRepository.lock(id.toString())) {
		        wait++;
		        Thread.sleep(50);
		        //계속해서 lock을 확인하면 너무 자주 확인하니 (n)ms대기
		        log.info("ThreadID : {} 대기 - {}번째", Thread.currentThread().getId(), wait);
		    } // 락을 획득하기 위해 대기
		
		    try {
		        Book book = bookRepository.findById(id).orElseThrow();
		        int count = book.minusStock();
		        log.info("count : {}", count);
		        bookRepository.saveAndFlush(book);
		    } finally {
		        redisRepository.deleteLock(id.toString());
		        // 락 해제
		    }
		}
}
```

로직은 단순하다.

우선, Redis에 해당 키값의 Lock을 획득하려고 한다.

이 획득 시도가 성공하면 `True` 실패하면 `false` 가 반환되는데, 이를 통해 획득에 실패하면 다시 획득할때 까지 시도하는 그런 방식이다.

그렇게 획득을 한다면, 서비스 로직을 동작하고 자신의 락을 해제시켜주는 것이다.

### Lecture 활용시 장단점

우선 Lecture를 통해 구현하면 `setnx` 를 통해 동작하는데 이 경우 장단점이 존재한다.

- **장점**
    - 기본 제공되는 Redis Client인 Lecture 하나만 활용하여 간단하게 구현할 수 있다.
- 단점
    - Spin Lock 방식을 활용하기 때문에, Redis 서버에 강한 부하가 걸릴 수 있다.
        - 이를 해결하기 위해 `sleep()` 을 도입하였지만 이때문에 성능 저하가 발생하기도 하며 그래도 부하를 막을수는 없다.
    - Lock의 타임아웃이 지정되어 있지 않다.
        - 따라서 불운하게 어떤 오류가 발생하였을 때 락이 해제되지 못한다면, 무한 대기가 발생하게 될 것이다.
            - 물론, 이를 위해서 락을 획득하기 위한 최대 대기 시간을 설정 하기도 한다.

## Redisson

Redisson 또한 Lecttuce와 같은 Redis Client이다.

이는 **Pub-sub 방식**으로 Lock을 구현한다. **(Redis는 Message Broker를 지원한다.)**

이는 별도의 채널을 만들고, 락을 점유중인 스레드의 락이 해제될 때마다 대기중인 스레드에게 알림을 보내주어 대기중인 스레드가 락 점유를 시도하는 방식이다.

**→ 즉, Lettuce의 Spin Lock과 다르게 계속해서 시도하는 요청을 보내는 방식이 아니다.**

Redis의 subscribe 명령어로 채널을 구독하고, publish 명령어로 메시지를 전달한다.

이를 기반으로 동작하는데, 동작 방식을 보도록 하자.

### 동작 방식

1. RedissonClient의 `getLock()` 을 통해 어떤 락을 획득 시도할지 RLock객체를 만든다.
2. RLock의 `tryLock()` 를 통해 락 획득을 시도하고 획득할 경우 true를 반환한다.
    1. 이미 점유 중일 경우 **pubsub**를 이용하여 메시지가 올 때까지 대기하다가 락이 해제되었다는 메시지를 받으면 락 획득을 시도한다.
3. 만약 TimeOut이 된다면 실패로 false를 반환한다.

```java
@RequiredArgsConstructor
@Service
@Slf4j
public class BookServiceWithRedis {
		private final BookRepository bookRepository;
		private final RedissonClient redissonClient;
		
		public void orderBookByRedisWithRedisson(Long id) {
        RLock lock = redissonClient.getLock(id.toString()+"_Redisson");
        try {
            boolean available = lock.tryLock(3, 1, TimeUnit.SECONDS);
            if (!available) {
                throw new RuntimeException("Lock을 획득하지 못했습니다.");
            }
            Book book = bookRepository.findById(id).orElseThrow();
            book.minusStock();
            bookRepository.saveAndFlush(book);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        } finally {
            lock.unlock();
        }
    }
}
```

이때, `tryLock()` 을 좀 더 살펴보면 다음과 같다.

- 첫번째 파라미터 : 총 획득을 시도할 대기 시간.
- 두번째 파라미터 : 획득시 락이 언제 만료될 것인가.
- 세번째 파라미터 : 위의 파라미터들의 단위는 무엇인가.

따라서 위의 코드를 살펴보면, 3초동안 시도할 것이며 락은 획득 1초 뒤 만료된다는 것을 알 수 있다.

### Redisson 활용시 장단점

- **장점**
    - 타임아웃을 설정하여 데드락 방지 및 만료
        - `tryLock()` 의 첫번째 파라미터로 락 획득 시도의 대기 시간을 설정하여 만료시 false가 반환될 수 있다.
        - 뿐만 아니고, 락 획득 이후 만료 시간을 설정하여 만약 해제되지 않더라도 자동으로 만료시 락이 삭제된다.
    - Spin Lock을 사용하지 않음
        - Spin Lock은 busy waiting 방식이기 때문에 Redis에 부하를 심하게 주게 된다. 하지만, Redisson은 **pubsub**를 이용하기 때문에 Redis에 부하를 가하지 않을 수 있다.
- 단점
    - 별도의 라이브러를 추가하여 사용해야 한다.

## 비관적, 낙관적 락과 분산 락

위에서 설명한 바와 같이 1개의 DB서버를 사용하는 경우에는 비관적, 낙관적 락과 비교하여 사용할 수 있지만, 분산 DB환경에서는 Redis와 같은 도구를 사용하여 분산 락을 구현해야 한다.

### 분산 서버, 싱글 DB

이 경우에는 비관적, 낙관적 락을 비교하여 적당한 락을 사용하는 것이 좋다.

테스트 결과 싱글 DB에 비관적 락을 사용한 경우보다 Redis의 Redisson을 사용한 분산 락이 더 오래 걸리는 결과가 나왔다.

(물론, 좋은 설정과 환경이 있다면 더 좋을지도 모르지만… 개인적으로 테스트 결과 그렇게 나왔다.)

![Untitled](/static/images/redisLock.png)

### 분산/싱글 서버, 분산 DB

이 경우에는 비관적, 낙관적 락을 사용하여 할 수 없기 때문에 Redis와 같이 도구를 사용하여 분산 락을 구현하여 사용해야 한다.

따라서 이 경우에 Redis를 사용한다면 Lecture과 Redisson중 어떤 것이 더 효과적으로 사용될 수 있는지 따져보고 결정하도록 하자.