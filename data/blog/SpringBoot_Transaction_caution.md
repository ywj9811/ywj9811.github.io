---
title: Spring Transaction 주의 사항
date: '2022-12-21'
tags: ['spring boot', 'Transaction', '인프런', '김영한', '기술']
draft: false
summary: 스프링 트랜잭션에 대해서 주의할 부분이 몇가지 있다. 그 중에서 실무에서 많이 겪는 문제라고 하며 이해하지 못한다면 머리가 아플 수 있는 부분에 대해서 다루도록 하자.
---

## **프록시 내부 호출**

**`@Transaction` 을 사용하면 스프링의 트랜잭션 AOP가 적용된다.**

### **트랜잭션 AOP는 기본적으로 프록시 방식의 AOP를 사용하는데 `@Transaction` 을 적용하면 프록시 객체가 요청을 먼저 받아서 트랜잭션을 처리하고, 실제 객체를 호출하는 방식으로 진행되는 것이다.**

**따라서 트랜잭션을 적용하려면 항상 프록시를 통해서 대상 객체를 호출해야 한다.**

### **이렇게 해야 프록시에서 먼저 트랜잭션을 적용하고, 이후에 대상 객체를 호출하는 것이다.**

**만약 프록시를 거치지 않고 대상 객체를 직접 호출하게 되면 AOP가 적용되지 않고, 트랜잭션도 적용되지 않는다.**

**AOP를 적용하면 스프링은 대상 객체 대신에 프록시를 스프링 빈으로 등록한다.**

**따라서 스프링은 의존관계 주입시에 항상 객체 대신에 프록시 객체를 주입한다.**

**프록시 객체가 주입되기 때문에 대상 객체를 직접 호출하는 문제는 일반적으로 발생하지 않는다.**

### **하지만 대상 객체의 내부에서 메소드 호출이 발생하면 프록시를 거치지 않고 대상 객체를 직접 호출하는 문제가 발생한다.**

**이렇게 되면 `@Transaction` 이 있어도 트랜잭션이 적용되지 않는다.**

**이게 무슨 의미인지 코드를 통해 확인해 보자.**

```java
@Slf4j
@SpringBootTest
public class InternalCallV1Test {

    @Autowired CallService callService;

    @Test
    void printProxy() {
        log.info("callService class = {}", callService.getClass());
    }

    @Test
    void internalCall() {
        callService.internal();
    }

    @Test
    void externalCall() {
        callService.external();
    }

    @TestConfiguration
    static class InternalCallV1TestConfig {
        @Bean
        CallService callService() {
            return new CallService();
        }
    }

    @Slf4j
    static class CallService {
        public void external() {
            log.info("call external");
            printTxInfo();
            internal();
        }

        @Transactional
        public void internal() {
            log.info("call internal");
            printTxInfo();
        }

        private void printTxInfo() {
            boolean txActive = TransactionSynchronizationManager.isActualTransactionActive();
            log.info("tx active = {}", txActive);
        }
    }
}
```

**위의 코드를 확인해 보면**

**`external()` 의 경우 트랜잭션을 선언하지 않았다.**

**하지만 `internal()` 은 트랜잭션을 선언한 상태이다.**

**위에서 설명한 것과 같이 `@Transaction` 이 하나라도 있다면 트랜잭션 프록시 객체가 만들어지고, `callService 빈`을 주입 받으면 트랜잭션 프록시 객체가 대신 주입되게 된다.**

- **이를 확인하기 위해서 위의 `printProxy()` 테스트 메소드를 실행하면 아래와 같이 나오게 된다.**
  ![transcation6](/static/images/transaction/transaction6.png)
  **결과를 보면 `callService` 를 주입 받았고 해당 클래스를 출력해보면 뒤에 CGLIB… 와 같은 내용이 붙어있는 것을 확인할 수 있다.**
  **이것이 프록시 객체가 호출되었음을 알려주는 것이다.**
  ***
- **그리고 순서대로 테스트 메소드인 `internalCall()` 을 실행하게 되면 `callService` 의 트랜잭션이 선언된 `internal()` 를 호출하는 것으로 아래 결과를 통해 트랜잭션을 확인할 수 있다.**
  ![transcation7](/static/images/transaction/transaction7.png)
  **이는 아래 사진과 같은 구조로 올바르게 작동한 모습인 것이다.**
  ![transcation8](/static/images/transaction/transaction8.png)
  **`callService` 의 `internal()` 메소드를 호출하게 되면 `callService` 객체 대신에 프록시 객체가 호출되고 프록시 객체에서 `internal()` 메소드의 트랜잭션 처리를 하고 이후에 대상 객체의 `internal()` 메소드를 호출하는 방식으로 처리된 것이다.**
  > **순서를 살펴보면**
  >
  > 1. **클라이언트인 테스트 코드는 `callService.internal()` 을 호출한다. 여기서 `callService` 는 트랜잭션 프록시이다.**
  > 2. **`callService` 의 트랜잭션 프록시가 호출된다.**
  > 3. **`internal()` 메서드에 `@Transactional` 이 붙어 있으므로 트랜잭션 프록시는 트랜잭션을 적용한다.**
  > 4. **트랜잭션 적용 후 실제 `callService` 객체 인스턴스의 `internal()` 을 호출한다.** > **실제 `callService` 가 처리를 완료하면 응답이 트랜잭션 프록시로 돌아오고, 트랜잭션 프록시는 트랜잭션을 완료한다.**

---

### **그렇다면 본격적으로 문제가 되는 부분을 살펴보도록 하자**

- **이제 테스트 메소드인 `externalCall()` 를 호출해 보도록 하자.**
  **이는 `callService` 의 트랜잭션이 선언되지 않은 `external()` 메소드를 호출하는 것인데 해당 메소드를 살펴보면 `external()` 메소드는 트랜잭션이 선언되지 않은 메소드로 내부에서 트랜잭션이 선언된 `internal()` 메소드를 호출하고 있다.**
  **이 부분에서 문제가 발생하게 된다.**
  **결과를 살펴보면**
  ![transcation9](/static/images/transaction/transaction9.png)
  **트랜잭션 관련 코드가 전혀 보이지 않으며 트랜잭션 활성화가 false가 나오는 것을 확인할 수 있다.**
  ### **왜 이런 문제가 발생하는 것일까**
  !![transcation10](/static/images/transaction/transaction10.png)
  > **위의 그림에 따라서 해석을 해보면**
  >
  > 1. **클라이언트인 테스트 코드는 `callService.external()` 를 호출한다.**
  >
  >    **여기서 `callService` 는 트랜잭션 프록시가 된다.**
  >
  > 2. **`callService` 의 트랜잭션 프록시가 호출된다.**
  > 3. **이때 `external()` 메소드에는 `@Transactional` 이 없다.**
  >
  >    **따라서 트랜잭션 프록시는 트랜잭션을 사용하지 않는다.**
  >
  > 4. **트랜잭션을 적용하지 않고 (대상 객체)실제 `callService` 의 객체 인스턴스인 `external()` 을 호출하게 된다.**
  > 5. **이때 `external()` 은 내부에서 `internal()` 메소드를 호출하는데 여기서 `@Transactional` 을 만나게 되면서 문제가 생기는 것이다.**
  >    **즉 `external()` 을 처리할 때 프록시가 생성되어 트랜잭션이 선언되지 않은 것을 확인하고 이미 대상 객체에게 넘기게 되었는데 이후에 같은 대상 객체에 존재하며 트랜잭션이 되어있는 메소드를 호출하게 되어 프록시를 적용할 수 없어 문제가 발생하는 것이다.**

---

### **프록시 방식의 AOP 한계**

**`@Transactional` 를 사용하는 트랜잭션 AOP는 프록시를 사용한다.**

**프록시를 사용하면 메소드 내부 호출에 프록시를 적용할 수 없다.**

**이런 한계를 가지고 있는데 이 부분을 어떻게 처리할 수 있을까…**

**가장 단순한 방법은 내부 호출을 피하기 위해서 `internal()` 메소드와 같은 부분을 별도의 클래스로 분리하는 것이다.**

## **프록시 내부 호출 해결 방안**

**메소드 내부 호출 때문에 트랜잭션 프록시가 적용되지 않는 문제를 해결하기 위해서 `internal()` 메소드를 별도의 클래스로 분리해 보자.**

```java
@Slf4j
@SpringBootTest
public class InternalCall2Test {

    @Autowired CallService callService;

    @Test
    void printProxy() {
        log.info("callService class = {}", callService.getClass());
    }

    @Test
    void externalCallV2() {
        callService.external();
    }

    @TestConfiguration
    static class InternalCallV1TestConfig {
        @Bean
        CallService callService() {
            return new CallService(internalService());
        }
        @Bean
        InternalService internalService() {
            return new InternalService();
        }
    }

    @Slf4j
    @RequiredArgsConstructor
    static class CallService {
        private final InternalService internalService;

        public void external() {
            log.info("call external");
            printTxInfo();
            internalService.internal();
        }

        private void printTxInfo() {
            boolean txActive = TransactionSynchronizationManager.isActualTransactionActive();
            log.info("tx active = {}", txActive);
        }
    }

    static class InternalService {
        @Transactional
        public void internal() {
            log.info("call internal");
            printTxInfo();
        }

        private void printTxInfo() {
            boolean txActive = TransactionSynchronizationManager.isActualTransactionActive();
            log.info("tx active = {}", txActive);
        }
    }
}
```

**위의 코드를 살펴보면 이전과 다르게 `internal()` 메소드를 `InternalService` 라는 클래스로 분리를 하였다.**

**즉 이를 통해서 메소드 내부 호출을 외부 호출로 변경한 것이다.**

**이번에 테스트 메소드인 `externalCallV2()` 를 호출하게 되면 `callService` 의 경우 `@Transactional` 이 없기 때문에 트랜잭션 프록시가 적용되지 않고 내부에서 다시 호출한 `InternalService` 의 경우 트랜잭션 관련 코드가 있기 때문에 트랜잭션 프록시가 적용되게 된다.**

![transcation11](/static/images/transaction/transaction11.png)

**따라서 `internal()` 메소드는 트랜잭션 처리가 올바르게 된다.**

![transcation12](/static/images/transaction/transaction12.png)

> **실제 호출되는 흐름을 살펴보도록 하자.**
>
> 1. **클라이언트인 테스트 코드는 `callService.external()` 을 호출한다.**
> 2. **`callService` 는 실제 `callService` 객체 인스턴스이다.**
> 3. **`callService` 는 주입 받은 `internalService.internal()` 을 호출한다.**
> 4. **`internalService` 는 트랜잭션 프록시이다. `internal()` 메서드에 `@Transactional` 이 붙어있으므로 트랜잭션 프록시는 트랜잭션을 적용한다.**
> 5. **트랜잭션 적용 후 실제 `internalService` 객체 인스턴스의 `internal()` 을 호출한다.**

---

## **초기화 시점**

**스프링 초기화 시점에서는 트랜잭션 AOP가 적용되지 않을 수 있다.**

```java
@SpringBootTest
public class InitTxTest {

    @Test
    void go() {
        // 초기화 코드는 스프링이 초기화 시점에서 실행
        //@PostConstruct 는 초기화 시점에서 자동으로 실행
        //@EventListener(ApplicationReadyEvent.class) 는 컨테이너가 로딩 완료시점에 자동으로 실행
    }

    @TestConfiguration
    static class InitTxTestConfig {
        @Bean
        Hello hello() {
            return new Hello();
        }
    }

    @Slf4j
    static class Hello {

        @PostConstruct
        @Transactional
        public void initV1() {
            boolean activeTx = TransactionSynchronizationManager.isActualTransactionActive();
            log.info("Hello init @PostConstruct tx active = {}", activeTx);
        }

        @EventListener(ApplicationReadyEvent.class)
        @Transactional
        public void initV2() {
            boolean activeTx = TransactionSynchronizationManager.isActualTransactionActive();
            log.info("Hello init @EventListener(ApplicationReadyEvent.class) tx active = {}", activeTx);
        }
    }
}
```

> **위 테스트 코드의 `go()` 의 경우 아무것도 없는 것을 볼 수 있는데, 초기화 단계에서 자동으로 실행되도록 작성을 하였기 때문에 아무것도 작성하지 않아도 `initV1()` 과 `initV2()` 모두 동작하게 된다.**

**결과를 보면 `initV1()` 의 경우 트랜잭션이 동작하지 않고 `initV2()` 의 경우에만 트랜잭션이 동작하는 모습을 확인할 수 있다.**

![transaction13](/static/images/transaction/transaction13.png)

**왜냐하면 초기화 코드가 먼저 호출되고 그 이후에 트랜잭션 AOP가 적용되기 때문이다.**

**따라서 `initV1()` 의 `@PostConstruct` 에 의한 초기화 시점에는 해당 메소드에서 트랜잭션을 획득할 수 없다.**

**하지만 `initV2()` 의 경우에는 `@EventListener(value = ApplicationReadyEvent.class)` 를 사용하여 트랜잭션 AOP를 포함한 스프링 컨테이너가 모두 생성되고 난 이후에 해당 이벤트에 맞춰서 메소드를 호출하기 때문에 트랜잭션이 적용된 것이다.**
