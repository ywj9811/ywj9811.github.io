---
title: 도메인 주도 개발 시작하기 Chap2
date: '2024-03-20'
tags: ['JAVA', '스터디', '기술서적', '도메인 주도 개발 시작하기']
draft: false
summary: 도메인 주도 개발 시작하기 챕터2 아케텍처 개요
---
# 도메인 주도 개발 시작하기 챕터2 아키텍처 개요

## 아키텍처

### 네개의 영역

‘표현’, ‘응용’, ‘도메인’, ‘인프라스트럭처’는 아키텍처를 설계할 때 출현하는 전형적인 네가지 영역이다.

스프링 MVC 프레임워크가 표현 영역을 위한 기술에 해당한다.

웹 어플리케이션에서 표현 영역의 사용자는 웹 브라우저를 사용하는 사람이거나 Rest API를 호출하는 외부 시스템일 수 있는 것이다.

여기서 표현 영역은 HTTP 요청을 응용 영역이 필요로 하는 형식으로 변환해서 응용 영역에 전달하고 응용 영역의 응답을 HTTP 응답으로 변환하여 전송한다.

응용 영역은 기능을 구현하기 위해 도메인 영역의 도메인 모델을 사용한다.

응용 서비스는 로직을 직접 수행하기 보다는 도메인 모델에 로직 수행을 위임한다.

즉, 도메인 영역은 도메인 모델을 구현하고 여기서 도메인의 핵심 로직을 구현하는 것이다.

마지막으로 인프라스트럭처 영역은 구현 기술에 대한 것을 다루는 것으로, RDBMS 연동을 처리하거나 SMTP를 이용한 메일 발송 기능, 외부의 REST API 호출 등등을 처리한다.

### 계층 구조 아키텍처

네 영역을 구성할 때 많이 사용하는 아키텍처는 다음과 같다.

![Untitled](/static/images/DDD/2-1.png)

이는 상위 계층에서 하위 계층으로의 의존만 존재하고 하위 계층은 상위 계층에 의존하지 않는다.

계층 구조를 엄격하게 적용한다면 상위 계층은 바로 아래의 계층에만 의존을 가져야 하지만, 편리함을 위해 약간은 유연하게 적용하기도 한다.

이제 위의 구조를 가지는 예시를 한번 보자. (Drools는 BRMS 엔진으로 아래 코드는 Repository 같은 의미로 이해하자)

```java
public class DroolsRuleEngine {
	private KieContainer kContainer;

	public DroolsRuleEngine() {
		kieServices ks = KieServices.Factory.get();
		kContainer = ks.getKieClassPathContainer();
	}

	public void evalute(String sessionNmae, List<?> facts) {
		KieSession kSession = kContainer.newKieSession(sessionName);
		try {
			facts.forEach(x -> kSession.insert(x));
			kSession.fireAllRules();
		} finally {
			kSession.dispose();
		}
	}
}
```

이때 응용 영역은 가격 계산을 위해 인프라스트럭처 영역인 `DroolsRuleEngine` 를 사용한다.

```java
public class CalculateDiscountService {
	private DroolsRuleEngine ruleEngine;

	public CalculateDiscountService() {
		ruleEngine = new DroolsRuleEngine();
	}

	public Money calculateDiscount(List<OrderLine> orderLines, String customerId) {
		Customer customer = findCustomer(customerId);

		MultableMoney money = new MultableMoney(0);
		List<?> facts = Arrays.asList(customer, money);
		facts.addAll(orderLines);
		ruleEngine.evalute("discountCalculation", facts);
		return money.toImmutableMoney();
	}	
	...
}
```

이렇게 작성하게 되면 `CalculateDiscountService` 가 동작하긴 하겠지만, 이 코드는 두가지 문제점을 가지고 있다.

1. `CalculateDiscountService` 만 테스트하기 어렵다.
    - 이를 테스트 하기 위해서는 `RuleEngine` 이 완벽하게 동작해야 한다.
    그러기 위해서 관련 설정 파일을 모두 만든 후 비로소 올바르게 동작하는지 확인할 수 있다.
2. 구현 방식을 변경하기 어렵다.
    - 코드만 보면 Drools의 제공 타입을 직접 사용하지 않기 때문에 Drools에 의존한다고 보지 않을 수 있지만, 세션 이름을 직접 사용하기도 하고 불필요한 타입을 사용하기도 한다.

즉, 인프라스트럭처에 의존하면 ‘테스트 어려움’ 과 ‘기능 확장의 어려움’을 겪게 된다.

## DIP

고수준 모듈이란, 의미 있는 단일 기능을 제공하는 모듈이다.

저수준 모듈이란, 하위 기능을 실제로 구현한 모듈이다.

위에서 살펴본 `CalculateDiscountService` 는 고수준 모듈이다.

그리고 JPA를 사용해서 고객 정보를 읽어오는 모듈과 Drools로 룰을 실행하는 모듈이 저수준 모듈이 된다.

고수준 모듈이 제대로 동작하기 위해서는 저수준 모듈을 사용해야 한다. 하지만, 이렇게 되면 위에서 살펴본 두가지 문제가 발생한다.

DIP는 저수준 모듈이 고수준 모듈에 의존하도록 바꿔 문제를 해결하게 한다.

이를 위한 비결로 추상화한 인터페이스가 있다.

`CalculateDiscountService` 는 룰 적용을 Drools로 했는지, 자바로 했는지 중요하지 않다.

```java
public interface RuleDiscounter {
	Money appyRules(Customer customer, List<OrderLine> orderLines);
}
```

이렇게 인터페이스를 만들고

```java
public class CalculateDiscountService {
	private RuleDiscounter ruleDiscounter;

	public CalculateDiscountService(RuleDiscounter ruleDiscounter) {
		this.ruleDiscounter = ruleDiscounter;
	}

	public Money calculateDiscounte(List<OrderLine> orderLines, String customerId) {
		Customer customer = findCustomer(customerId);
		return ruleDiscounter.appyRules(customer, orderLines);
	}
	...
}
```

이렇게 만들게 되면 Drools에 직접 의존하는 부분이 없다.

그리고 실제로 사용하는 `RuleDiscounter` 구현 객체는, `RuleDiscounter`를 상속받아 구현한 Drools 관련 코드가 되는 것이다.

이때 `RuleDiscounter` 는 ‘룰을 이용한 할인 금액 계산’ 이라는 고수준 모듈의 개념 이기에 Drools 관련 코드인 저수준 모듈이 고수준 모듈에 의존하는 형식이 된다.

이를 통해 위에서 지적한 두가지 문제를 해결할 수 있다.

1. 테스트가 어렵다.
    - 테스트를 위해서는 이제 인터페이스에 대한 대역 객체를 사용해서 테스트를 진행할 수 있다.
2. 구현 방식 변경이 어렵다.
    - 만약 구현 방식을 변경하고 싶다면 사용하는 구현 객체를 변경하면 되는 것이다.

### 주의 사항

DIP를 잘못 생각하면 단순히 인터페이스와 구현 클래스를 분리하는 정도로 받아들일 수 있는데, DIP의 핵심은 고수준 모듈이 저수준 모듈에 의존하지 않도록 하기 위함이다.

우리가 작성한 코드를 보면 ‘룰을 이용한 할인 금액 계산’ 이라는 고수준 모듈의 관점에서 도출을 했다.

만약 저수준 모듈의 관점에서 도출을 하게 된다면 잘못된 적용이 될 수 있다.

### DIP와 아키텍처

인프라스트럭처 계층이 가장 하단에 위치하는 계층형 구조와 달리 DIP를 적용하면 인프라스트럭처 영역이 응용 영역과 도메인 영역에 의존하는 구조가 된다.

![Untitled](/static/images/DDD/2-2.png)

## 도메인 영역의 주요 구성요소

도메인 영역은 도메인의 핵심 모델을 구현한다고 설명했다.

그렇다면 이전에 살펴본 엔티티와 밸류 타입 이외에 어떤 요소가 있는지 살펴보자.

- 엔티티 (Entity)
    - 고유의 식별자를 가지는 객체로 도메인의 공유한 개념을 표현한다.
- 밸류 (Value)
    - 고유의 식별자를 갖지 않는 객체로 주로 개념적으로 하나인 값을 표현한다.
- 애그리거트 (Aggregate)
    - 연관된 엔티티와 밸류를 개념적으로 하나로 묶는다.
- 리포지토리 (Repository)
    - 도메인 모델의 영속성을 처리한다. (객체를 로딩하거나 저장하는 기능)
- 도메인 서비스 (Domain Service)
    - 특정 엔티티에 속하지 않는 도메인 로직을 제공한다.
    만약 도메인 로직이 여러 엔티티와 밸류를 필요로 하면 도메인 서비스에서 로직을 구현한다.

### 엔티티와 밸류

이전에 살펴본 내용 이외의 내용을 추가로 살펴보자.

도메인 모델을 처음 만나면 테이블의 엔티티와 도메인 모델의 엔티티를 구분하지 못해 동일하게 사용하곤 한다.

이 둘의 차이점은 도메인 모델의 엔티티는 데이터와 함께 도메인 기능을 함께 제공한다는 점이다.

도메인 모델의 엔티티는 단순히 데이터를 담고 있는 데이터 구조 보다는 데이터와 함께 기능을 제공하는 객체이다.

도메인 관점에서 기능을 구현하고 기능 구현을 캡슐화 하여 데이터가 임의로 변경되는 것을 막는다.

또한 도메인 모델의 엔티티는 두개 이상의 데이터가 개념적으로 하나인 경우 밸류 타입을 이용해서 표현할 수 있다는 것이다.

### 애그리거트

이는 관련 객체를 하나로 묶은 군집이다.

주문을 예시로 보자.

주문이라는 도메인 개념은 ‘주문’, ‘배송지 정보’, ‘주문자’, ‘주문 목록’, ‘총 결제 금액’의 하위 모델로 구성된다.

이를 표현한 모델을 하나로 묶어 ‘주문’ 이라는 상위 개념으로 표현할 수 있다.

이를 통해 개별 객체 간의 관계가 아닌 애그리거트 간의 관계로 도메인 모델을 이해하고 구현하게 되며, 이를 통해 큰 틀에서 도메인 모델을 관리할 수 있다.

### 리포지토리

도메인 객체를 지속적으로 사용하려면, RDMS, NoSQL 등등과 같은 물리적인 저장소에 도메인 객체를 보관해야 한다.

이를 위한 도메인 모델이 리포지토리인데, 엔티티나 밸류가 요구사항에서 도출되는 도메인 모델이라면 리포지토리는 구현을 위한 도메인 모델이다.

이는 애그리거트 단위로 도메인 객체를 저장하고 조회할 수 있는 기능을 정의한다.

## 인프라스트럭처 개요

인프라스트럭처는 표현 영역, 응용 영역, 도메인 영역을 지원하는데, 도메인 객체의 영속성 처리, 트랜잭션, SMTP 클라이언트, REST 클라이언트 등 다른 영역에서 필요로 하는 프레임워크, 구현 기술, 보조 기능을 지원한다.

DIP에서 언급한 것처럼 도메인 영역과 응용 영역에서 인프라스트럭처의 기능을 직접 사용하는 것은 좋지 않다.

하지만, 아예 없앨 필요는 없을 수 있다.

예를 들어 스프링을 사용할 때 `@Transactional` 이나 `@Entity` 같은 어노테이션은 특정 기술에 의존하게 만들기는 하지만, 이것이 오히려 관리하기 더 편리하게 해주기 때문에 사용하는 것이 좋을 수 있다.

즉, 구현의 편리함은 DIP가 주는 다른 장점만큼 중요하기 때문에 DIP의 장점을 과하게 해치지 않는 범위에서 응용 영역과 도메인 영역에서 구현 기술에 대한 의존을 가져가는 것이 나쁘지 않을 수 있다.