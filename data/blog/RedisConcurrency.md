---
title: 레디스의 분산락을 활용한 동시성 제어
date: '2024-05-19'
tags: ['spring Boot', '기술', 'Redis']
draft: false
summary: Redis를 활용한 대학원 김선배의 멘토링 동시성 제어
---
대학원 김선배가 제공하는 서비스 중 멘토링은 선배와 후배가 같은 멘토링에 대해 접근할 수 있다.

따라서 선배가 멘토링 상태 변경을 할 때 동시에 후배도 상태 변경을 시도할 수 있다는 것이다.

이렇게 되면 선배는 수락을 했지만, 후배는 멘토링 환불 요청을 보내 둘 다 대기중의 멘토링을 조회한 것으로 되어 본래는 둘 중 하나만 수행되어야 하지만 둘 다 성공이 되어 여러 문제로 번질 수 있다.

멘토링은 서비스의 핵심 부분으로 멘토링 상태 변경을 동시에 접근할 수 없도록 락을 걸어서 해결하고자 한다.

**여기서 사용할 방법은 Redis의 Redisson을 통한 분산 락 이다.**

Mysql을 통한 락과 Redis를 통한 락 모두 가능한 상황이었지만, 현재 이미 Redis가 도입되어 사용중이고 현재는 단일 시스템이지만 추후 분산 환경이 되어도 유지가 가능한 시스템을 위해 Redis를 선택하게 되었다.

그렇다면 우선 분산락이 무엇인지 이해하고 진행하도록 하자.

## 분산락이란?

분산락이란 여러 서버(프로세스)가 접근하는 공유 데이터를 제어하기 위한 기술이다.

락을 획득한 프로세스 혹은 스레드만이 공유 자원(Critical Section)에 접근할 수 있도록 하는 것으로 분산락의 장점은 단일 서버가 아닌 분산 환경에서도 프로세스들의 원자적 연산을 가능하도록 한다는 것이다.

![Untitled](/static/images/distributeLock.png)

## Redis의 Redisson선정 이유

우선 분산락을 위해서는 Redis, Mysql, Zookeeper 등등을 활용할 수 있다고 한다.

그중 Redis를 선택한 이유는 현재 사용중이기 때문에 추가적인 인프라 작업이 필요 없기 때문이다.

하지만 이러한 이유라면 Mysql 역시 사용중이기 때문에 불충분한 이유가 될텐데, 개인적으로 Mysql은 사용하기 위해서 I/O 작업이 필요하다는 점과 RDS에 부하를 주는 것 보다는 Redis를 활용하는 것이 더 낫다고 판단했기 때문이다.

그렇게 Redis를 선택하게 되었고, Redis에서 Lock을 활용할 수 있는 방식은 Lettuce와 Redisson이 있지만 그 중에서 Redisson을 선택하게 되었다.

그 이유는 Lettuce가 제공하는 Lock의 방식 보다 Redisson이 제공하는 Lock의 방식이 더 효율적이기 때문이다.

## 락 획득 방식

우선, Lettuce의 경우 `setnx` 명령어를 통해 분산락을 구현하게 되어있는데 이는 락을 획득하려는 **스레드가 락의 획득 가능 여부를 반복적으로 확인하는 스핀 락(Spin Lock) 방식이다.**

⚠️ 이러한 스핀 락의 경우 락을 획득할 수 없다면 계속해서 확인을 하며 얻을 때 까지 기다리게 되는 이른바 Busy Waiting의 방식으로 수행된다.

따라서 Lettuce의 `setnx` 를 사용하면 스핀락을 활용하기 때문에 Redis에 심한 부하가 걸리게 되며 이를 해결하기 위해서는 `sleep()` 을 활용한 스레드를 잠시 멈추는 것이 방법인데 이는 성능 저하를 가져오기 때문에 좋지 않다.

그리고 별도로 개발자가 타임아웃을 지정하지 않으면 별도의 타임아웃이 지정되지 않아 자칫하면 DeadLock 상태에 빠져 무한정 대기하게 되는 위험성이 존재한다.

따라서 Redisson을 사용하게 된 것이다.

### Redisson의 락 획득 방식

Redisson의 경우 별도의 Lock Interface를 지원하고 있다.

이를 통해 락에 대해 타임아웃과 같은 설정을 지원하기 때문에 Lettuce보다 락을 안전하게 사용할 수 있다.

**Redisson의 락 획득 방식은 Lettuce의 스핀 락 방식과 다르게 Pub/Sub 방식을 사용한다.**

이는 락을 획득하고자 하면 Subscribe를 하고 락이 해제되면 신호를 받아 바로 락을 획득하는 방식이다.

즉, 계속해서 락을 확인하는 방식과 다르게 락이 해제되면 락이 해제 되었다는 신호를 받고 락을 획득할 수 있는 것이다.

## 분산락 적용

김선배의 멘토링 업데이트 코드에 분산락을 적용하여 동시에 변경하여 발생할 수 있는 이슈를 방지해보자.

어떻게 할 수 있을까.

### 각각의 메소드에 적용

우선 분산락이 필요한 모든 메소드에 직접 작성하는 방법을 채택할 수 있다.

```java
@Service
@Slf4j
@RequiredArgsConstructor
public class MentoringManageUseCase {
    ...

    public ApplyingResponse applyMentoring(User user, MentoringApplyRequest request) {
        ...
    }

    @Transactional
    public void updateCancel(User user, Long mentoringId) {
        ...
    }

    @Transactional
    public void updateDone(User user, Long mentoringId) {
        ...
    }

    @Transactional
    public void updateRefuse(User user, Long mentoringId, MentoringRefuseRequest request) {
        ...
    }

    @Transactional
    public Boolean updateExpected(User user, Long mentoringId, MentoringDateRequest dateRequest) {
        ...
    }

    @Scheduled(fixedDelay = 1000*60*10)
    @Transactional
    public void sendFinishMessage() {
        ...
    }
}
```

이렇게 메소드가 있는데, 이 메소드들 중 분산락이 필요한 메소드는 `applyMentoring` 과 `sendFinishMesage` 를 제외한 모든 메소드다.

그렇다면 이제 이 메소드들에 모두 적용을 해보자.

```java
@Service
@Slf4j
@RequiredArgsConstructor
public class MentoringManageUseCase {
    ...
    private final RedissonClient redissonClient;

    public ApplyingResponse applyMentoring(User user, MentoringApplyRequest request) {
        ...
    }

    @Transactional
    public void updateCancel(User user, Long mentoringId) throws InterruptedException {
        String lockKey = "mentoring" + mentoringId;
        RLock lock = redissonClient.getLock(lockKey);
        try {
            boolean available = lock.tryLock(5, 5, SECONDS);
            if (!available)
                throw new IllegalArgumentException();
            log.info("lock 획득 {}", lockKey);
            
            ...
            
        } catch (Exception ex) {
            log.info("예외 발생 {}", ex.getMessage());
            throw ex;
        } finally {
            log.info("lock 반환 {}", lockKey);
            lock.unlock();
        }
    }

    @Transactional
    public void updateDone(User user, Long mentoringId) throws InterruptedException {
        String lockKey = "mentoring" + mentoringId;
        RLock lock = redissonClient.getLock(lockKey);
        try {
            boolean available = lock.tryLock(5, 5, SECONDS);
            if (!available)
                throw new IllegalArgumentException();
           
            ...
            
        }
        catch (Exception ex) {
            log.info("예외 발생 {}", ex.getMessage());
            throw ex;
        } finally {
            log.info("lock 반환 {}", lockKey);
            lock.unlock();
        }
    }

    @Transactional
    public void updateRefuse(User user, Long mentoringId, MentoringRefuseRequest request) throws InterruptedException {
        String lockKey = "mentoring" + mentoringId;
        RLock lock = redissonClient.getLock(lockKey);
        try {
            boolean available = lock.tryLock(5, 5, SECONDS);
            if (!available)
                throw new IllegalArgumentException();
            
            ...
            
        } catch (Exception ex) {
            log.info("예외 발생 {}", ex.getMessage());
            throw ex;
        } finally {
            log.info("lock 반환 {}", lockKey);
            lock.unlock();
        }
    }

    @Transactional
    public Boolean updateExpected(User user, Long mentoringId, MentoringDateRequest dateRequest) throws InterruptedException {
        String lockKey = "mentoring" + mentoringId;
        RLock lock = redissonClient.getLock(lockKey);
        try {
            boolean available = lock.tryLock(5, 5, SECONDS);
            if (!available)
                throw new IllegalArgumentException();
            
            ...
            
        } catch (Exception ex) {
            log.info("예외 발생 {}", ex.getMessage());
            throw ex;
        } finally {
            log.info("lock 반환 {}", lockKey);
            lock.unlock();
        }
    }

    @Scheduled(fixedDelay = 1000*60*10)
    @Transactional
    public void sendFinishMessage() {
        ...
    }
}
```

이렇게 멘토링 관련 작업에서는 Lock을 획득하고 작업할 수 있도록 했다.

하지만, 중복코드가 많이 보인다.

이것들을 제거하면 비교적 깔끔해질 수 있겠지만, try, catch, final 각각의 위치에서 필요한 정보가 있으며 중복 코드가 깔끔하게 존재하는 것이 아닌 여러 곳에 퍼져서 존재한다.

따라서 중복 코드를 제거하고자 하면 작업이 생각보다 복잡해지고 최대한 깔끔하게 해보면 기존의 형태를 많이 변경하게 되어 가독성이 떨어질 뿐더러 비즈니스 메소드가 변경되고 안좋은 상황이 나타난다.

그렇다면 다른 방법은 없을까?

### AOP 사용하여 Lock 획득과 비즈니스 로직을 분리

SpringBoot의 AOP를 이용하면 공통적인 로직과 각각의 비즈니스 로직을 깔끔하게 분리할 수 있다.

따라서 나는 SpringBoot의 AOP를 활용하여 구현하기로 했다.

```java
public class DistributeLockPointCut {
    @Pointcut("execution(* com.postgraduate.domain.mentoring.application.usecase.MentoringManageUseCase.*(..)) " +
            "&& !execution(* com.postgraduate.domain.mentoring.application.usecase.MentoringManageUseCase.sendFinishMessage(..)) " +
            "&& !execution(* com.postgraduate.domain.mentoring.application.usecase.MentoringManageUseCase.applyMentoring(..))"
    )
    public void allMentoringService() {}
}
```

우선 위와 같이 AOP를 적용할 PointCut을 정의하였는데, 이전에 살펴본 것과 같이 분산락을 사용하지 않을 두개의 메소드를 제외한 나머지 메소드는 모두 AOP를 적용하도록 했다.

```java
@Aspect
@Slf4j
@Component
@RequiredArgsConstructor
public class DistributeLockAspect {
    private final RedissonClient redissonClient;
    private final static String PREFIX = "mentoring";

    @Around("com.postgraduate.global.aop.lock.DistributeLockPointCut.allMentoringService()")
    public Object startDistributeLock(ProceedingJoinPoint joinPoint) throws Throwable {
        String lockKey = null;
        Object[] args = joinPoint.getArgs();
        for (Object arg : args) {
            if (arg instanceof Long) {
                lockKey = PREFIX + arg;
            }
        }
        RLock lock = redissonClient.getLock(lockKey);

        try {
            boolean available = lock.tryLock(5, 5, SECONDS);
            if (!available)
                throw new LockException();
            log.info("lock 획득 {}", lockKey);
            return joinPoint.proceed();
        } catch (Exception e) {
            log.error("예외 발생 {}", e.getMessage());
            throw e;
        } finally {
            lock.unlock();
            log.info("lock 반납 {}", lockKey);
        }
    }
}
```

그리고 위와 같이 분산락을 수행할 Aspect를 작성하였는데 `@Around` 를 사용하여 메소드 실행 전후 모두 동작하도록 하였다. 

이어서 내부 로직을 살펴보자.

우선, 키값을 위해 파라미터 값이 필요한데 `MentoringManageUseCase` 에서 분산락을 적용할 메소드는 Long을 두개 이상 받지 않기 때문에 넘어오는 파라미터를 검사하여 Long 타입의 파라미터가 `mentoringId` 라고 가정하고 진행을 할 수 있었다.

그렇게 ‘mentoring[mentoringId]’ 가 LockKey가 되어 락을 획득하고 반환하도록 구현하였으며 내용을 살펴보면 다음과 같다. 

우선 redissonClient를 통해 원하는 LockKey의 이름으로 RLock을 얻어오고 `lock.tryLock` 을 통해 락 획득을 시도한다.

여기서 `lock.tryLock(5, 5, SECONDS)` 를 살펴보면 받고있는 파라미터는 순선대로 최대 얼마나 기다릴 것인가, 최대 얼마나 락을 획득한 채로 있을 것인가, 단위는 무엇인가 이며 우선은 5초로 설정하였고 만약 얻지 못한다면 available이 false가 되어 아래에서 예외를 발생시키고 실패한다.

그렇게 락을 획득하는데 성공하게 되면 로그를 남기고 `joinPoint.proceed()` 를 통해 실제 호출된 메소드를 실행시켜 비즈니스 로직을 수행한다.

그리고 finally 를 통해 성공적으로 수행이 되거나 실패를 하거나 상관 없이 소유중인 락을 반환하도록 하며 AOP가 마무리된다.

이렇게 분산락을 위해 사용되는 로직과 비즈니스 로직을 분리하여 AOP를 사용하며 이전의 코드보다 깔끔하고 가독성 좋은 코드를 얻을 수 있다.