---
title: Spring Transaction 예외와 커밋, 롤백
date: '2022-12-22'
tags: ['spring boot', 'Transaction', '인프런', '김영한', '기술']
draft: false
summary: 스프링 트랜잭션에서는 상황에 따라서 커밋하거나 롤백하게 되는데 어떤 기준으로 진행이 되며 어떻게 활용하면 될지 알아보도록 하자.
---

## **예외와 트랜잭션 커밋, 롤백 기본**

**프로젝트를 진행하던 도중 예외가 발생했는데, 내부에서 예외를 처리하지 못하고 트랜잭션 범위(`@Transactional` 가 적용된 AOP) 밖으로 예외를 던지면 어떻게 될까?**

![transaction14](/static/images/transaction/transaction14.png)

**예외 발생시 스프링 트랜잭션 AOP는 예외의 종류에 따라 트랜잭션을 커밋하거나 롤백한다.**

- **언체크 예외인 `RuntimeException`, `Error` 와 그 하위 예외가 발생하면 롤백**
- **체크 예외인 `Exception` 과 그 하위 예외들은 커밋**

**이 동작을 코드로 확인해보자.**

```java
@SpringBootTest
public class RollbackTest {
    @Autowired
    RollbackService rollbackService;

    @Test
    void runtimeException() {
        Assertions.assertThatThrownBy(() -> rollbackService.runtimeException())
                        .isInstanceOf(RuntimeException.class);
    }

    @Test
    void checkedException() {
        Assertions.assertThatThrownBy(() -> rollbackService.checkedException())
                .isInstanceOf(MyException.class);
    }

    @Test
    void rollbackFor() {
        Assertions.assertThatThrownBy(() -> rollbackService.rollbackFor())
                .isInstanceOf(MyException.class);
    }

    @TestConfiguration
    static class RollbackTestConfig {
        @Bean
        RollbackService rollbackService() {
            return new RollbackService();
        }
    }

    @Slf4j
    static class RollbackService {

        //런타임 예외 발생 : 롤백
        @Transactional
        public void runtimeException() {
            log.info("call runtimeException");
            throw new RuntimeException();
        }

        //체크 예외 발생 : 커밋
        @Transactional
        public void checkedException() throws MyException {
            log.info("call checkedException");
            throw new MyException();
        }

        //체크 예외 rollbackFor 지정 : 롤백
        @Transactional(rollbackFor = MyException.class)
        public void rollbackFor() throws MyException {
            log.info("call rollbackFor");
            throw new MyException();
        }
    }

    static class MyException extends Exception {}
}
```

**위의 코드를 통해 테스트를 진행할 것이다.**

**이때 롤백 되는지 커밋 되는지 정보 로그를 찍기 위해 `application.properties` 에 다음과 같은 기능을 넣어주도록 하자.**

```java
logging.level.org.springframework.transaction.interceptor=TRACE
logging.level.org.springframework.jdbc.datasource.DataSourceTransactionManager=DEBUG

#JPA log
logging.level.org.springframework.orm.jpa.JpaTransactionManager=DEBUG
logging.level.org.hibernate.resource.transaction=DEBUG
```

**지금은 JPA를 사용하기 때문에 `JpaTransactionManager` 가 실행되고, 여기의 로그를 출력하는 것이다.**

**테스트 코드를 이제 하나하나 실행시키도록 하자.**

- **`runtimeException()` 메소드 실행**
  **`runtimeException` 이 발생하기 때문에 트랜잭션이 롤백되게 된다.**
  ![transaction15](/static/images/transaction/transaction15.png)
  **이렇게 로그에 rollback이 찍혀있는 모습을 확인할 수 있다.**
- **`checkedException()` 메소드 실행**
  **이는 `Exception` 을 상속 받은 `MyException` 을 발생 시키기 때문에 트랜잭션 커밋이 된다.**
  ![transaction16](/static/images/transaction/transaction16.png)
  **이렇게 로그에 commit이 찍혀있는 모습을 확인할 수 있다.**
- **`rollbackFor()` 메소드 실행**
  **이는 `@Transactional(rollbackFor = MyException.class)` 이 선언되어 있는 메소드를 호출하는 것으로 `MyException` 이 발생하게 돼도 커밋이 아닌 롤백을 진행하게 된다.**
  ![transaction17](/static/images/transaction/transaction17.png)
  **이렇게 로그에 commit이 아닌 rollback이 찍혀있는 모습을 확인할 수 있다.**

## **예외와 트랜잭션 커밋, 롤백 활용**

**지금까지 스프링에서 체크 예외는 커밋하고, 언체크 예외는 롤백하는 모습을 확인했다.**

**그렇다면 왜 체크 예외는 커밋하고 언체크 예외는 롤백하는 것일까?**

### **스프링은 기본적으로 체크 예외는 비즈니스 의미가 있을 때 사용하고, 언체크 예외는 복구 불가능한 예외로 가정하기 때문이다.**

**따라서 상황에 따라서 rollbackFor 옵션을 활용하는 것이다.**

---

### **그렇다면 비즈니스 의미가 있는 비즈니스 예외란 무슨 뜻일까?**

**그에 대해 예제를 통해서 살펴보도록 하자.**

- **비즈니스 요구사항**
  **주문을 하는데 상황에 따라 다음과 같이 조치한다.**
  1. **정상 : 주문시 결제를 성곡하면 주문 데이터를 저장하고 결제 상태를 완료로 처리**
  2. **시스템 예외 : 주문시 내부에 복구가 불가능한 예외가 발생하면 전체 데이터를 롤백**
  3. **비즈니스 예외 : 주문시 결제 잔고가 부족하면 주문 데이터를 저장하고, 결제 상태를 대기로 처리**
     - **이 경우 고객에게 잔고 부족을 알리고 별도의 계좌로 입금하도록 안내**

**이때 잔고가 부족하면 `NotEnoughMoneyException` 이라는 체크 예외가 발생한다고 가정하자.**

**이 예외는 시스템에 문제가 있어서 발생한 시스템 예외가 아닌 비즈니스 상황에서 고객의 사정으로 발생한 예외인 것이다.**

**이런 예외는 매우 중요하고 반드시 처리해야 하는 경우가 많으므로 체크 예외를 고려할 수 있는 것이다.**

**이제 코드를 살펴보자.**

### **NotEnoughMoneyException**

```java
public class NotEnoughMoneyException extends Exception {

    public NotEnoughMoneyException(String message) {
        super(message);
    }
}
```

**결제 잔고가 부족하면 발생하는 예외로 `Exception` 을 상속 받아서 체크 예외가 된다.**

### **Order**

```java
@Entity
@Table(name = "orders")
@Getter
@Setter
public class Order {
    @Id
    @GeneratedValue
    private Long id;

    private String userName; //정상, 예외, 잔고 부족 이렇게 넘길겨
    private String payStatus; //대기, 완료
}
```

**JPA를 사용하는 Order 엔티티이다.**

**현재는 간단하게 구현하기 위해서 `@Getter`, `@Setter` 를 사용하였지만 사실 엔티티에 `@Setter` 를 사용하는 것은 좋지 않다.**

**`@Table(name = "orders")` 는 자동으로 테이블을 생성할 때 이름이 order가 되어 오류가 발생하는 것을 막기 위해 따로 이름을 지정해준 것이다.**

> **테이블의 이름이 order가 되는 경우 예약어와 중복되어 오류가 발생할 수 있다.**

- **id는 Pk키로 사용하기 위해**
- **userName은 정상, 예외, 잔고 부족 이런 식으로 처리 프로세스를 위해**
- **payStatus는 결제 결과를 위해**

### **OrderRepository**

```java
public interface OrderRepository extends JpaRepository<Order, Long> {}
```

**스프링 데이터 JPA를 사용한다.**

**따라서 기본으로 제공되는 함수만 사용하기 때문에 인터페이스만 생성했다.**

### **OrderService**

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;

    //JPA는 트랜잭션 커밋 시점에 Order 데이터를 DB에 반영한다.
    @Transactional
    public void order(Order order) throws NotEnoughMoneyException {
        log.info("order 호출");
        orderRepository.save(order);

        log.info("결제 프로세스 진입");
        if (order.getUserName().equals("예외")) {
            log.info("시스템 예외 발생");
            throw new RuntimeException("시스템 예외");
        } else if (order.getUserName().equals("잔고부족")) {
            log.info("잔고 부족 비즈니스 예외 발생");
            order.setPayStatus("대기");
            throw new NotEnoughMoneyException("잔고가 부족합니다.");
        } else {
            log.info("정상 승인");
            order.setPayStatus("완료");
        }
        log.info("결제 프로세스 완료");
    }
}
```

**이렇게 간단하게 코드를 작성하고 테스트 코드를 통해 작동을 확인하도록 하자.**

### **OrderServiceTest**

```java
@Slf4j
@SpringBootTest
class OrderServiceTest {

    @Autowired OrderService orderService;
    @Autowired OrderRepository orderRepository;

    @Test
    void complete() throws NotEnoughMoneyException {
        //given
        Order order = new Order();
        order.setUserName("정상");

        //when
       try {
            orderService.order(order);
        } catch (NotEnoughMoneyException e) {
            log.info("고객에게 잔고 부족을 알리고 별도의 계좌로 입금하도록 안내");
        }

        //then
        Order findOrder = orderRepository.findById(order.getId()).get();
        assertThat(findOrder.getPayStatus()).isEqualTo("완료");
    }

    @Test
    void runtimeException() {
        //given
        Order order = new Order();
        order.setUserName("예외");

        //when
        assertThatThrownBy(() -> orderService.order(order))
                .isInstanceOf(RuntimeException.class);

        //then
        Optional<Order> orderOptional = orderRepository.findById(order.getId());
        assertThat(orderOptional.isEmpty()).isTrue();
    }

    @Test
    void bizException() {
        //given
        Order order = new Order();
        order.setUserName("잔고부족");

        //when
        try {
            orderService.order(order);
        } catch (NotEnoughMoneyException e) {
            log.info("고객에게 잔고 부족을 알리고 별도의 계좌로 입금하도록 안내");
        }

        //then
        Order findOrder = orderRepository.findById(order.getId()).get();
        assertThat(findOrder.getPayStatus()).isEqualTo("대기");
    }
}
```

**각각의 테스트를 실행하고 그 결과를 살펴보도록 하자.**

- **`complete()`**
  **사용자 이름을 “정상” 으로 설정했다.**
  **따라서 `orderService` 에서 프로세스가 정상 작동으로 진행되게 된다.**
  **`assertThat(findOrder.getPayStatus()).isEqualTo("완료");` 를 통해서 정상 진행됨을 확인할 수 있다.**
  ![transaction18](/static/images/transaction/transaction18.png)
  **이렇게 정상 작동 이후에 커밋되는 모습까지 확인할 수 있다.**
- **`runtimeException()`**
  **사용자 이름을 “예외” 로 설정했다.**
  **이 경우 `RuntimeException("시스템 예외")` 가 발생한다.**
  **런타임 예외로 롤백이 수행되었기 때문에 `Order` 에는 데이터가 비어있을 것이다.**
  **`assertThat(orderOptional.isEmpty()).isTrue();` 이것을 통해 비어있음을 검증할 수 있다.**
  ![transaction19](/static/images/transaction/transaction19.png)
- **`bizException()`**
  **사용자 이름을 “잔고부족” 으로 설정했다.**
  **이 경우 `NotEnoughMoneyException("잔고가 부족합니다.")` 가 발생한다.**
  **이는 체크 예외로 커밋이 수행되었기 때문에 `Order` 에는 데이터가 저장된다.**
  **그리고 데이터가 대기 상태로 저장이 되며**
  **`assertThat(findOrder.getPayStatus()).isEqualTo("대기");` 이를 통해서 검증할 수 있다.**
  ![transaction20](/static/images/transaction/transaction20.png)

---

**이렇게 간단한 예제를 통해서 비즈니스 예외 상황과 시스템 예외 상황을 가정하여 각각의 상황에서 롤백되거나 커밋되는 모습을 확인할 수 있었다.**

**물론 원하는 경우 rollbackFor를 통해서 비즈니스 상황에 따라서 롤백을 선택하며 사용하면 되는 것이다.**
