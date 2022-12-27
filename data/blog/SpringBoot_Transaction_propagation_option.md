---
title: Spring Transaction propagation(전파) 옵션
date: '2022-12-28'
tags: ['spring boot', 'Transaction', '인프런', '김영한', '기술']
draft: false
summary: 스프링 트랜잭션 전파 옵션에 대해서. 기본으로 사용되는 옵션과 때때로 사용할 수 있는 옵션에 대해서 살펴보도록 하자.
---

## **트랜잭션 전파 옵션**

### **REQUIRED_NEW**

**외부 트랜잭션과 내부 트랜잭션을 완전히 분리해서 각각 별도의 물리 트랜잭션을 사용하는 방법이다.**

**즉 커밋과 롤백도 각각 일어나게 된다.**

**따라서 내부 트랜잭션에서 롤백을 하게 되어도 외부 트랜잭션에는 영향을 끼치지 않는다.**

**물론 반대의 경우도 마찬가지이다.**

![propagation16](/static/images/propagation/propagation16.png)

**이렇게 물리 트랜잭션을 분리하기 위해서는 내부 트랜잭션을 시작할 때 `REQUIRES_NEW` 옵션을 사용하면 된다.**

**이는 새로운 DB 커넥션을 가진다는 뜻이다.**

```java
@Test
void inner_rollback_requires_new() {
	log.info("외부 트랜잭션 시작");
	TransactionStatus outer = txManager.getTransaction(new DefaultTransactionAttribute());
	log.info("outer.isNewTransaction() = {}", outer.isNewTransaction()); //True

	log.info("내부 트랜잭션 시작");
	DefaultTransactionAttribute definition = new DefaultTransactionAttribute();
	definition.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
	TransactionStatus inner = txManager.getTransaction(definition);
	log.info("inner.isNewTransaction() = {}", inner.isNewTransaction()); //True

	log.info("내부 트랜잭션 롤백");
	txManager.rollback(inner); //롤백

	log.info("외부 트랜잭션 커밋");
	txManager.commit(outer); //커밋
	/**
	* 이 경우 PROPAGATION_REQUIRES_NEW 에 의해서 내부의 경우에 트랜잭션을 새로 생성하기 때문에 롤백이 되어도 커밋이 되게 된다.
	* 각각 작동하게 됨
	*/
}
```

**위의 코드를 살펴보면 `inner` 에 `PROPAGATION_REQUIRES_NEW` 를 적용시켰다.**

**이 옵션은 새로운 물리 트랜잭션을 만들어서 시작하게 하는 것이다.**

![propagation17](/static/images/propagation/propagation17.png)

**위와 같은 결과가 나오게 되는데, 살펴보면 외부 트랜잭션의 경우 `conn0` 이 생성되며 내부 트랜잭션이 시작될 때 `conn1` 이 새롭게 생성되는 모습을 확인할 수 있다.**

**따라서 `conn1` 이 롤백을 진행하여도 `conn0` 은 다른 커넥션이기 때문에 커밋을 진행할 수 있는 것이다.**

![propagation18](/static/images/propagation/propagation18.png)

**이와 같이 진행이 되게 된다.**

**즉 두개의 물리 트랜잭션이 동작하게 된다.**

> **`RQUIRES_NEW` 옵션을 사용하면 물리 트랜잭션이 명확하게 분리되지만**
>
> **⚠️데이터베이스 커넥션이 동시에 2개 사용된다는 점을 유의해야 한다!⚠️**

### **그 외 다양한 옵션들**

**전파 옵션을 별도로 지정하지 않으면 디폴트로 `REQUIRED` 가 적용이 된다.**

- **`REQUIRED` : 가장 많이 사용하는 기본 설정으로 기존 트랜잭션이 없으면 생성하고 있다면 참여한다.**
- **`REQUIRES_NEW` : 항상 새로운 트랜잭션을 생성한다.**

**이 외에 나머지는 거의 사용하지 않으니 존재만 알고 있으면 된다.**

- **`SUPPORT` : 트랜잭션을 지원한다는 뜻으로 기존 트랜잭션이 없으면 없는대로 진행하고 있으면 참여한다.**
- **`NOT_SUPPORT` : 트랜잭션을 지원하지 않는다는 의미로 기존에 있어도 없어도 없이 진행한다.**
- **`MANDATORY` : 의무 사항으로 기존 트랜잭션이 무조건 있어야 한다는 뜻이다. 만약 기존 트랜잭션이 없다면 예외가 발생한다.**
- **`NEVER` : 트랜잭션을 사용하지 않는다는 의미로 만약 기존에 트랜잭션이 있다면 예외가 발생한다.**
- **`NESTED` : 중첩 트랜잭션 → 새로운 트랜잭션을 만들지만 외부의 트랜잭션에 영향을 받는다. 하지만 외부 트랜잭션에는 영향을 끼칠 수 없다.**
