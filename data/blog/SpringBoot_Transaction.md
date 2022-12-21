---
title: Spring Transaction 소개
date: '2022-12-20'
tags: ['spring boot', 'Transaction', '인프런', '김영한', '기술']
draft: false
summary: 스프링 트랜잭션 소개. 트랜잭션은 시작, 커밋, 롤백으로 단순하게 추상화 할 수 있으며 스프링은 이를 인터페이스로 만들고 구현해서 제공해주고 있다. 이에 대해서 살펴보고 자세히 알아보도록 하자.
---

## 스프링 트랜잭션 소개

**스프링을 사용하지 않는다면, 트랜잭션을 사용하기 위해서는 JDBC와 JPA가 각각의 다른 방식으로 설정을 해줘야 한다.**

**하지만 스프링의 경우 `PlatformTransactionManager` 라는 인터페이스를 통해 트랜잭션을 추상화 한다.**

```java
package org.springframework.transaction;

public interface PlatformTransactionManager extends TransactionManager {

	TransactionStatus getTransaction(@Nullable TransactionDefinition definition) throws TransactionException;

	void commit(TransactionStatus status) throws TransactionException;

	void rollback(TransactionStatus status) throws TransactionException;
}
```

**트랜잭션은 이렇게 트랜잭션 시작(획득), 커밋, 롤백으로 단순하게 추상화 할 수 있다.**

![transaction1](/static/images/transaction/transaction1.png)

**이런 식으로 구현하여 사용하면 되는데, 스프링의 경우 추상화 뿐만 아니라 그에 따른 구현체도 모두 제공하고 있다.**

**따라서 필요한 구현체를 스프링 빈으로 등록하고 주입 받아서 사용하면 되는 것이다.**

**하지만 스프링 부트의 경우 어떤 데이터 접근 기술을 사용하는지 자동으로 인식해서 적절한 트랜잭션 매니저를 선택해서 *스프링 빈으로 등록해주기 때문에 트랜잭션 매니저를 선택하고 등록하는 과정도 생략*할 수 있다.**

### **스프링 트랜잭션 사용 방식**

**선언적 트랜잭션 관리 vs 프로그래밍 방식 트랜잭션 관리**

- **선언적 트랜잭션 관리**
  - **`@Transaction` 어노테이션 하나만 선언하여 매우 편리하게 트랜잭션을 사용하는 것이다.**
  - **이름 그대로 해당 로직에 트랜잭션을 적용하겠다 라고 어딘가에 선언하기만 하면 트랜잭션이 적용되는 방식이다.**
- **프로그래밍 방식 트랜잭션 관리**
  - **트랜잭션 매니저 또는 트랜잭션 템플릿 등을 사용해서 트랜잭션 관련 코드를 직접 작성하는 것을 프로그래밍 방식 트랜잭션 관리라고 한다.**

**이중에 선언적 트랜잭션 관리가 훨씬 실용적이고 간편하기 때문에 실무에서는 대부분 선언적 트랜잭션 관리를 사용한다고 한다.**

---

### **선언적 트랜잭션과 AOP**

**`@Transactional` 을 통한 선언적 트랜잭션 관리를 사용하게 되면 기본적으로 프록시 방식의 AOP가 적용된다.**

![transaction2](/static/images/transaction/transaction2.png)

**이렇게 프록시를 도입하게 되면 트랜잭션 처리를 위한 객체와 비즈니스 로직을 처리하는 서비스 객체를 명확하게 분리할 수 있다.**

```java
public class TransactionProxy {
	private MemberService target;

	public void logic() {
	//트랜잭션 시작
	TransactionStatus status = transactionManager.getTransaction(..);

	try {
		//실제 대상 호출
		target.logic();
		transactionManager.commit(status); //성공시 커밋
		} catch (Exception e) {
		transactionManager.rollback(status); //실패시 롤백
		throw new IllegalStateException(e);
		}

	}
}
```

**위의 경우 프록시 적용 전 코드**

```java
@Transaction
public class Service {

	public void logic() {
		//트랜잭션 관련 코드 제거, 순수 비즈니스 로직만 남음
		bizLogic(fromId, toId, money);
	}

}
```

**이렇게 `@Transaction` 을 통해서 프록시와 함께 진행하게 되면 순수 비즈니스 로직만 남겨둘 수 있다.**

**즉 스프링은 `@Transaction` 어노테이션을 통해 AOP를 처리하기 위해 필요한 스프링 빈들도 모두 자동으로 등록해서 처리할 수 있도록 도와주는 것이다.**

---

## **위의 방식들이 제대로 작동하는지 코드를 통해 확인해보자**

### **1. 트랜잭션 동작 확인**

**선언적 트랜잭션 방식을 사용하게 되면 단순하게 `@Transaction` 어노테이션 하나로 트랜잭션을 적용할 수 있기 때문에, 관련 코드가 눈에 보이지 않고 AOP를 기반으로 동작하기 때문에 실제 트랜잭션이 적용되고 있는지 확인하기 어렵다.**

**이 경우에 어떻게 확인할 수 있는지 알아보도록 하자.**

```java
@Slf4j
@SpringBootTest
public class TxBasocTest {

    @Autowired
    BasicService basicService;

    @Test
    void proxyCheck() {
        log.info("aop class = {}", basicService.getClass());
        Assertions.assertThat(AopUtils.isAopProxy(basicService)).isTrue();
    }
    // 프록시 여부 체크
    // 이 프록시가 서비스를 참조해서 작동하게 되는 것이다.

    @Test
    void txTest() {
        basicService.tx();
        basicService.nonTx();
    }

    @TestConfiguration
    static class TxApplyBasicConfig {
        @Bean
        BasicService basicService() {
            return new BasicService();
        }
    }

    @Slf4j
    static class BasicService {

        @Transactional
        public void tx() {
            log.info("call tx");
            boolean txActive = TransactionSynchronizationManager.isSynchronizationActive();
            log.info("tx active={}", txActive);
        }

        public void nonTx() {
            log.info("call nonTx");
            boolean txActive = TransactionSynchronizationManager.isSynchronizationActive();
            log.info("tx active={}", txActive);
        }
    }
}
```

**`TransactionSynchronizationManager.isSynchronizationActive();` 이를 통해서 트랜잭션이 동작하고 있는지에 대한 값을 True false로 반환받게 된다.**

**`AopUtils.isAopProxy(basicService))` 이는 AOP 방식으로 트랜잭션이 실행되고 있는지 확인하는 것이다.**

**`proxyCheck() 테스트` 를 작동 시키면 아래의 log롤 통해 프록시가 작동하고 있는 모습을 확인할 수 있다.**

![transaction3](/static/images/transaction/transaction3.png)

**`txTest() 테스트` 를 작동 시키면 하나는 `@Transaction` 이 있고 하나는 없는 상태에서 트랜잭션 작동 유무 체크를 진행하는 것으로 아래와 같이 나오는 것을 확인할 수 있다.**

**그 전에 `application.properties` 에 아래 코드를 추가하도록 하자.**

```java
logging.level.org.springframework.transaction.interceptor=TRACE
```

![transaction1](/static/images/transaction/transaction4.png)

**확인을 해보면 `Getting transaction` 를 통해 시작하고 `Completing transaction` 를 통해서 트랜잭션이 종료되는 모습을 확인할 수 있다.**

### **2. 트랜잭션 적용 위치에 따른 우선순위 파악**

**스프링에서 우선순위는 항상 `더 구체적이고 자세한 것이 높은 우선순위를 가진다.` 이것을 명심하고 진행하면 편하다.**

**이에서 벗어나는 것들만 기억하면 되는 것이다.**

**그렇다면 트랜잭션의 경우에서 우선순위가 적용되는 모습을 코드를 통해 확인해보도록 하자.**

```java
@SpringBootTest
public class TxLevelTest {

    @Autowired
    LevelService levelService;

    @Test
    void orderTest() {
        levelService.write();
        levelService.read();
    }

    @TestConfiguration
    static class TxLevelTestConfig {
        @Bean
        LevelService levelService() {
            return new LevelService();
        }
    }

    @Slf4j
    @Transactional(readOnly = true)
    static class LevelService {

		//@Transactional(readOnly = false) 디폴트로 false가 되어있기 때문에 따로 추가할 필요가 없다
        @Transactional
        public void write() {
            log.info("call write");
            printTxInfo();
        }

        public void read() {
            log.info("call read");
            printTxInfo();
        }

        private void printTxInfo() {
            boolean txActive = TransactionSynchronizationManager.isActualTransactionActive();
            log.info("tx active = {}", txActive);
            boolean readOnly = TransactionSynchronizationManager.isCurrentTransactionReadOnly();
            log.info("tx readOnly = {}", readOnly);
        }
    }
}
```

**위 코드를 제대로 살펴보기 이전에 알아두어야 할 것들이 있다.**

**스프링의 `@Transaction` 에는 다음과 같은 규칙이 있다.**

- **우선순위 규칙**
- **클래스에 적용하면 아래의 메소드에 자동 적용**

**그렇다면 위의 코드는 어떤 옵션이 들어있고 어떻게 우선순위가 적용되고 있을까**

**우선 `LevelService` 클래스에 `@Transaction(readOnly = true)` 어노테이션이 붙어있다.**

**이는 해당 클래스의 메소드에는 모두 적용되고 있는 것이다.**

**하지만 아래의 메소드인 `write()` 메소드에는 `@Transaction` 이 다시 붙어있다.**

> **원래 기본 `@Transaction` 어노테이션은 디폴트로 `readOnly = false` 이다.**

**그렇다면 `write()` 메소드는 faslse 혹은 true 둘 중 하나를 선택해야 할 것이다.**

**이때 메소드가 클래스보다 더 구체적이기 때문에 false를 선택하게 되는 것이다.**

![transaction5](/static/images/transaction/transaction5.png)

**이렇게 로그를 확인해보면 트랜잭션은 모두 동일하게 시작되고 있으며 readOnly의 경우 `write()`는 false 그리고 `read()`는 true가 나오는 모습을 볼 수 있다.**

### **`@Transaction` 의 우선순위**

1. **클래스의 메소드**
2. **클래스**
3. **인터페이스의 메소드 (인터페이스에 적용하는 방식은 권장되지 않는다)**
4. **인터페이스**

**이렇게 우선순위를 가져가게 된다.**
