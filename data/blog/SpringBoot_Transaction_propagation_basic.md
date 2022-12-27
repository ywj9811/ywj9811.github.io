---
title: Spring Transaction propagation(전파) 기본
date: '2022-12-27'
tags: ['spring boot', 'Transaction', '인프런', '김영한', '기술']
draft: false
summary: 스프링 트랜잭션 전파 기본에 대해서. 트랜잭션이 둘 이상 있을 때 어떻게 동작하는지 알아보고, 스프링이 제공하는 트랜잭션 전파의 개념에 대해서 알아보자.
---

## **트랜잭션 전파 - 커밋, 롤백**

**트랜잭션이 둘 이상 있을 때 어떻게 동작하는지 자세히 알아보고, 스프링이 제공하는 트랜잭션 전파(propagation) 이라는 개념도 알아보자.**

**간단한 예제 코드로 트랜잭션을 실행시켜 보자.**

```java
@Slf4j
@SpringBootTest
public class BasicTxTest {

    @Autowired
    PlatformTransactionManager txManager;

    @TestConfiguration
    static class Config {
        //트랜잭션 매니저 직접 등록
        @Bean
        public PlatformTransactionManager transactionManager(DataSource dataSource) {
            return new DataSourceTransactionManager(dataSource);
        }
    }

    @Test
    void commit() {
        log.info("트랜잭션 시작");
        TransactionStatus status = txManager.getTransaction(new DefaultTransactionAttribute());

        log.info("트랜잭션 커밋 시작");
        txManager.commit(status);
        log.info("트랜잭션 커밋 완료");
    }

    @Test
    void rollback() {
        log.info("트랜잭션 시작");
        TransactionStatus status = txManager.getTransaction(new DefaultTransactionAttribute());

        log.info("트랜잭션 롤백 시작");
        txManager.rollback(status);
        log.info("트랜잭션 롤백 완료");
    }
}
```

**⚠️ 실행하기 이전에 트랜잭션 관련 로그 확인을 위해 아래 코드를 `application.properties`에 반드시 추가!**

```java
logging.level.org.springframework.transaction.interceptor=TRACE
logging.level.org.springframework.jdbc.datasource.DataSourceTransactionManager=
DEBUG
#JPA log
logging.level.org.springframework.orm.jpa.JpaTransactionManager=DEBUG
logging.level.org.hibernate.resource.transaction=DEBUG
#JPA SQL
logging.level.org.hibernate.SQL=DEBUG
```

**그럼 이제 위의 예제 코드를 확인해 보자.**

**현재는 `commit()`과 `rollback()`에서 각각 하나씩의 트랜잭션을 실행하고 있기 때문에 실행하게 되면 하나의 트랜잭션을 획득하는 모습을 확인할 수 있다.**

> **`txManager.getTransaction(new DefaultTransactionAttribute());` 이 코드를 이용해 트랜잭션 매니저에서 트랜잭션을 획득한다.**

- **`commit()` 실행 결과**
  ![propagation1](/static/images/propagation/propagation1.png)
- **`rollback()` 실행 결과**
  ![propagation2](/static/images/propagation/propagation2.png)

**위의 결과에서 `conn0` 하나만 획득하는 모습을 확인할 수 있을 것이다.**

### **트랜잭션 두 번 사용**

**이제 트랜잭션 두개가 각각 따로 사용되는 모습을 확인해 보자.**

```java
@Test
void doubleCommit() {
	log.info("트랜잭션1 시작");
	TransactionStatus tx1 = txManager.getTransaction(new DefaultTransactionAttribute());
	log.info("트랜잭션1 커밋");
	txManager.commit(tx1);

	log.info("트랜잭션2 시작");
	TransactionStatus tx2 = txManager.getTransaction(new DefaultTransactionAttribute());
	log.info("트랜잭션2 커밋");
	txManager.commit(tx2);
}
```

**위의 테스트 코드는 트랜잭션1이 시작되고 커밋된 이후 트랜잭션2가 시작되고 커밋되는 트랜잭션 두개가 각각 사용되는 예제이다.**

![propagation3](/static/images/propagation/propagation3.png)

**실행 결과는 위와 같이 나오게 되는데 여기서 주의해서 살펴볼 점이 있다.**

**`conn0` 이라는 커넥션을 획득하게 되는데 트랜잭션1과 트랜잭션2가 획득하는 커넥션이 다르다는 것이다.**

**즉, 트랜잭션1을 시작하고 커넥션 풀에서 `conn0` 을 획득하고 커밋하면 다시 커넥션 풀에 반납한다.**

**그리고 트랜잭션2가 시작되며 커넥션 풀에서 `conn0` 을 획득하고 다시 커밋하면 반납하는 것으로 이름이 같지만 둘은 서로 완전 다른 커넥션이라는 점이다.**

![propagation4](/static/images/propagation/propagation4.png)

**동작하는 방식은 위와 같은 그림으로 표현될 수 있다.**

**따라서 두개의 트랜잭션은 서로 다른 것으로 서로에게 영향을 끼치지 않는다.**

**트랜잭션1은 커밋하고 트랜잭션2는 롤백하는 것에 아무 문제가 없다.**

![propagation5](/static/images/propagation/propagation5.png)

**이런 식으로 작동하게 되는 것이다.**

### **전파 기본**

**이전까지는 크게 어렵지 않은 내용들이었다.**

**그렇다면 이제 트랜잭션을 각각 사용하는 것이 아니라 트랜잭션이 이미 진행중이며 아직 커밋 혹은 롤백이 되지 않은 상태에서 추가로 트랜잭션을 수행할 때 어떻게 해야 하는가에 대해서 알아보자.**

**이때 기존 트랜잭션과 별도의 트랜잭션을 진행해야 하는 것일까 아니면 기존 트랜잭션을 그대로 이어 받아서 트랜잭션을 수행해야 하는 것일까?**

**이에 대해서 어떻게 동작할지 결정하는 것이 트랜잭션 전파(propagation) 이다.**

![propagation6](/static/images/propagation/propagation6.png)

**현재 수행중이고 아직 끝나지 않은 상태의 트랜잭션을 외부 트랜잭션 그리고 현 상태에서 실행되는 트랜잭션을 내부 트랜잭션이라고 한다.**

![propagation7](/static/images/propagation/propagation7.png)

**스프링의 경우 이 외부 트랜잭션과 내부 트랜잭션을 묶어서 하나의 트랜잭션으로 만들어준다.**

**즉, 내부 트랜잭션이 외부 트랜잭션에 참여하는 것이다.**

**이것이 기본 동작 방식이다.**

![propagation8](/static/images/propagation/propagation8.png)
**그리고 스프링은 이 기본 동작 방식에 대해 이해를 돕기 위해서 물리 트랜잭션과 논리 트랜잭션이라는 개념으로 나눈다.**

**논리 트랜잭션들은 외부, 내부 트랜잭션 들을 의미한다.**

**그리고 이 모든 논리 트랜잭션은 하나의 물리 트랜잭션으로 묶인다.**

- **물리 트랜잭션**
  **: 우리가 이해하는 실제 데이터베이스에 적용되는 트랜잭션을 뜻한다. 실제 커넥션을 통해서 트랜잭션을 시작하고, 실제 커넥션을 통해서 커밋, 롤백하는 단위이다.**
- **논리 트랜잭션**
  **: 트랜잭션 매니저를 통해 트랜잭션을 사용하는 단위이다.**

### **원칙**

### **모든 논리 트랜잭션이 커밋되어야 물리 트랜잭션이 커밋된다.**

### **하나의 논리 트랜잭션이라도 롤백되면 물리 트랜잭션은 롤백된다.**

### **⚠️물리 트랜잭션은 외부 트랜잭션만이 관여할 수 있다⚠️**

**그렇다면 이제 간단한 예제를 통해서 스프링 전파에 대해서 알아보자.**

### **기본 커밋**

```java
@Test
void inner_commit() {
	log.info("외부 트랜잭션 시작");
	TransactionStatus outer = txManager.getTransaction(new DefaultTransactionAttribute());
	log.info("outer.isNewTransaction() = {}", outer.isNewTransaction());

	log.info("내부 트랜잭션 시작");
	TransactionStatus inner = txManager.getTransaction(new DefaultTransactionAttribute());
	log.info("inner.isNewTransaction() = {}", inner.isNewTransaction());

	log.info("내부 트랜잭션 커밋");
	txManager.commit(inner);

	log.info("외부 트랜잭션 커밋");
	txManager.commit(outer);
}
```

**위 코드를 살펴보면**

**`outer` 트랜잭션이 수행되는 도중 `inner` 트랜잭션이 추가된다.**

**이 경우 어떻게 진행되게 될까**

**외부 트랜잭션인 `outer` 에 내부 트랜잭션인 `inner` 가 추가되는 것이다.**

![propagation9](/static/images/propagation/propagation9.png)

**결과를 보면 위와 같이 나오게 되는데**

1. **외부 트랜잭션 시작**
   - **여기서 트랜잭션 관련 코드가 나오게 된다. (트랜잭션 획득)**
2. **내부 트랜잭션 시작**
   - **여기서는 트랜잭션 관련 코드가 나오지 않는다. (트랜잭션 참여)**
3. **내부 트랜잭션 커밋**
4. **외부 트랜잭션 커밋**
5. **전체 트랜잭션 커밋**

**이런 순서로 진행되는 것이다.**

![propagation10](/static/images/propagation/propagation10.png)

![propagation11](/static/images/propagation/propagation11.png)

**이렇게 동작이 된다.**

> **즉, 트랜잭션 매니저에 커밋을 호출한다고 항상 실제 커넥션에 물리 커밋이 발생하는 것은 아니라는 것이다.**

### **외부 트랜잭션 롤백**

**위에서 설명한 것과 같이 논리 트랜잭션 하나라도 롤백이 된다면 물리 트랜잭션은 롤백된다.**

**만약 외부 트랜잭션이 롤백하게 된다면 물리 트랜잭션이 롤백으로 처리되기 때문에 내부 트랜잭션이 어떻게 동작을 했던간에 롤백되게 된다.**

```java
@Test
void outer_rollback() {
	log.info("외부 트랜잭션 시작");
	TransactionStatus outer = txManager.getTransaction(new DefaultTransactionAttribute());

	log.info("내부 트랜잭션 시작");
	TransactionStatus inner = txManager.getTransaction(new DefaultTransactionAttribute());
	log.info("내부 트랜잭션 커밋");
	txManager.commit(inner);

	log.info("외부 트랜잭션 롤백");
	txManager.rollback(outer);
}
```

**위 테스트를 실행하게 되면 아래와 같이 결과가 나오게 된다.**

![propagation12](/static/images/propagation/propagation12.png)

**물리 트랜잭션은 롤백으로 처리되는 것을 확인할 수 있다.**

![propagation13](/static/images/propagation/propagation13.png)

**1단계 이전의 과정은 이전과 동일하다.**

### **내부 롤백**

**만약 외부 트랜잭션이 아니라 내부 트랜잭션이 롤백을 하게 된다면 어떻게 될까?**

**결과는 이전에 살펴본 내용과 같이 논리 트랜잭션이 롤백이 되니 물리 트랜잭션도 롤백으로 처리될 것이다.**

**하지만 물리 트랜잭션에는 외부 트랜잭션만 접근할 수 있다고 했는데 내부 트랜잭션이 롤백하면 어떻게 인식하고 롤백으로 처리되게 되는 것일까?**

```java
@Test
void inner_rollback() {
	log.info("외부 트랜잭션 시작");
	TransactionStatus outer = txManager.getTransaction(new DefaultTransactionAttribute());

	log.info("내부 트랜잭션 시작");
	TransactionStatus inner = txManager.getTransaction(new DefaultTransactionAttribute());
	log.info("내부 트랜잭션 롤백");
	txManager.rollback(inner);
	//rollback-only 표시함 (이를 통해 외부 트랜잭션이 커밋을 하더라도 최종적으로 롤백으로 처리함)

	log.info("외부 트랜잭션 커밋");
	assertThatThrownBy(() -> txManager.commit(outer))
					.isInstanceOf(UnexpectedRollbackException.class);
	//내부에서 롤백이 발생하여 최종적으로 커밋에서 롤백으로 바뀌게 되면 UnexpectedRollbackException 이 발생하게 된다.
	//즉, 외부에서 커밋하려 하는데 rollback-only가 true일 경우 UnexpectedRollbackException을 발생시키는 것이다.
	}
```

**이때 실행을 하게 되면 이전에는 확인하지 못한 로그를 확인할 수 있다.**

![propagation14](/static/images/propagation/propagation14.png)

**내부 트랜잭션을 롤백하게 되면 위와 같이 `rollback-only` 를 마킹하게 된다.**

**그리고 `assertThatThrownBy(() -> txManager.commit(outer)).isInstanceOf(UnexpectedRollbackException.class);`**

**이렇게 `UnexpectedRollbackException` 이 발생하게 되는 것을 확인할 수 있다.**

**즉, 만약 `rollback-only` 이 마킹되어 `rollback-only = true` 인데 외부 트랜잭션이 커밋을 하게 되면 `UnexpectedRollbackException` 이 발생하게 된다.**

![propagation15](/static/images/propagation/propagation15.png)

**이렇게 동작된다.**
**지금까지 트랜잭션 전파에 대한 개념과 기본에 대해서 알아보았고 다음번에는 전파 옵션에 대해서 살펴보도록 하겠다.**
