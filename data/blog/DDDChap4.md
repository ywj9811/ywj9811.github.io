---
title: 도메인 주도 개발 시작하기 Chap4
date: '2024-04-04'
tags: ['JAVA', '스터디', '기술서적', '도메인 주도 개발 시작하기']
draft: false
summary: 도메인 주도 개발 시작하기 챕터4 레지토리 모델 구현
---
# 도메인 주도 개발 시작하기 챕터4 레지토리 모델 구현

## JPA를 이용한 레포지토리 구현

### 모듈 위치

2장에서 언급한 것과 같이 레포지토리 인터페이스는 애그리거트와 같이 도메인 영역에 속하고, 레포지토리를 구현한 클래스는 인프라스트럭처 영역에 속한다.

### 레포지토리 기능 구현

레포지토리는 기본 기능 두가지를 제공해야 한다.

- ID로 애그리거트 조회하기
- 애그리거트 저장하기

## 매핑 구현

### 엔티티와 밸류 기본 매핑 구현

애그리거트 루트는 엔티티이므로 `@Entity` 를 이용한다.

그리고 한 테이블에 엔티티와 밸류 데이터가 함께 존재한다면

밸류는 `@Embeddable` 로 매핑 설정을 한다.

그리고 밸류 타입 프로터티에는 `@Embedded` 로 매핑 설정한다.

![Untitled](/static/images/DDD/7.png)

이것을 예시로 본다면

Order는 루트 엔티티이기 때문에 `@Entity` 를 붙이고

내부의 Orderer과 ShippingInfo는 `@Embeddable` 을 사용한다.

이때 ShippingInfo는 Address와 Receiver를 밸류로 가지고 있기 때문에 마찬가지로 한단계 더 진행하게 된다.

### 기본 생성자

원래는 밸류 타입이 불변 타입으로 사용되기 때문에 생성 시점에 필요한 값을 모두 전달받으므로 기본 생성자가 필요 없다.

하지만, JPA의 `@Entity` 와 `@Embeddable` 의 특성상 기본 생성자가 필요하기 때문에, 이때는 기본 생성자를 protected와 같이 접근 제어자를 통해 관리해줄 수 있다.

### 필드 접근 방식

JPA는 필드와 메소드의 두 가지 방식으로 매핑을 처리할 수 있는데, 메소드 방식을 사용하려면 각각의 프로퍼티를 위한 get과 set이 필요하다.

하지만, 공개 get,set을 사용하게 되면 도메인의 의도가 사라지고 객체가 아닌 데이터 기반으로 엔티티를 구현할 가능성이 높아진다.

따라서 객체로서 제 역할을 하기위해 외부로 역할이 잘 드러나는 이름으로 메소드를 생성해주는 것이 좋다.

### AttributeConverter를 이용한 밸류 매핑 처리

int, long, String, LocalDate와 같은 타입은 DB테이블의 한 개 컬럼에 매핑이 된다.

하지만 밸류 타입의 프로퍼티를 한 개 컬럼에 매핑하기 위해서는 어떻게 해야 할까.

```java
public class Length {
	private int value;
	private String unit;
}
```

이것을 10000mm와 같이 하나로 합쳐서 저장하고 싶은 경우가 있을 수 있다.

두 개 이상의 프로퍼티를 가진 밸류 타입을 한 개 컬럼에 매핑하려면 `@Embeddable` 어노테이션으로 처리할 수 없다.

이때 `AttributeConverter` 를 사용하면 된다.

```java
public interface AttributeConverter<X,Y> {
    public Y convertToDatabaseColumn (X attribute);
    public X convertToEntityAttribute (Y dbData);
}
```

여기서 X는 밸류타입이고 Y는 DB 타입이다.

이것을 구현하여 사용하면 되는데, 예를 들어서 Money 밸류타입을 위한 AttribueConverter는 다음과 같을 수 있다.

```java
@Converter(autoApply = true)
public class MoneyConverter implements AttributeConverter<Money, Integer> {
	@Override
	public Integer ConvertToDatabaseColumn(Money money) {
		return money == null ? null : money.getValue();
	}
	
	@Override
	public Money convertToEntityAttribute(Integer value) {
		return value == null ? null : new Money(value);
	}
}
```

`AttributeConverter` 인터페이스를 구현한 클래스는 `@Converter` 를 사용하는데, 이때 `autoApply = true` 는 모델에 출현하는 모든 Money 타입의 프로퍼티에 대해 해당 컨버터를 자동으로 적용한다는 뜻이다.

기본은 false이다.

만약 false인 기본값을 사용한다면

`@Converter(converter = MoneyConverer.class)` 를 해당 프로피터 위에 지정해야 한다.

### 밸류 컬렉션 : 별도 테이블 매핑

밸류 컬렉션을 별도 테이블로 매핑할 때는 

`@ElementCollection` → fetchType설정,

과

 `@CollectionTable` → joinColumns을 통해 외부키로 사용할 컬럼을 지정한다.

두개를 함께 사용한다.

### 밸류 컬렉션 : 한개 컬럼 매핑

만약 밸류 컬렉션을 별도 테이블이 아닌 한 개 컬럼에 저장해야 하는 경우가 있는데, Set를 DB에는 콤마로 구분해서 저장하는 경우가 있을 수 있다.

이때는 위에서 배운 것을 활용하여 `AttributeConverter` 를 통해 구현할 수 있다.

### 밸류를 이용한 ID 매핑

만약 밸류 타입을 식별자로 사용한다면

`@Id` 대신 `@EmbeddedId` 를 사용하면 된다.

이때 주의할 점은 JPA에서 식별자는 Serializable 타입이어야 하므로, 식별자로 사용할 밸류 타입은 Serializable 인터페이스를 상속받아야 한다.

### 별도 테이블에 지정하는 밸류 매핑

애그리거트에서 루트 엔티티를 뺀 나머지 구성 요소는 대부분 밸류이다.

루트 엔티티 외에 또 다른 엔티티가 있다면 진짜 엔티티인지 의심해봐야 한다. 단지 별도 테이블에 저장한다고 해서 엔티티인 것은 아니다.

주문 애그리거트도 OrderLine을 별도 테이블에 저장하지만 이것은 엔티티가 아니고 밸류이다.

밸류가 아니라 엔티티가 확실하다면 해당 엔티티가 다른 애그리거트가 아닌지 확인해봐야 한다.

단적인 예를 들어 Review와 Product의 관계를 보자.

상품과 리뷰는 함께 보여주는데, 이 두가지는 하나의 애그리거트에 들어가지 않는다.

왜냐 두개는 함께 생성되는 것도 아니고, 함께 변경되는 것도 아니다.

그럼에도 밸류인데 다른 테이블에 저장되는 경우가 있다고 가정하자.

![Untitled](/static/images/DDD/8.png)

ArticleContent는 밸류이기 때문에 `@Embeddable` 로 매핑한다.

하지만, ArticleContent와 매핑되는 테이블은 Article과 매핑되는 테이블과 다르다.

이때 밸류를 매핑 한 테이블을 지정하기 위해 `@SecondaryTable` 과 `@AttributeOverride` 를 사용한다.

```java
@Entity
@SecondaryTable(
	name = "article_content",
	pkJoinColumns = @PrimaryKeyJoinColumn(name = "id")
)

public class Article {
	...
	
	@AttributeOverrides({
		@AttributeOverride(
			name = "content",
			column = @Column(table=="article_content", name="content")
		),
		@AttributeOvveride(
			name = "contentType",
			column = @Column(table="article_content", name="content_type")
		)
})
@Embedded
private ArticleContent content;
```

이렇게 사용하게 되는데

- `@SecondaryTable` 여시서 name속성은 밸류를 저장할 테이블을 지정하는 것이고, pkJoinColumns은 밸류 테이블에서 엔티티 테이블로 조인할 때 사용하는 컬럼을 지정한다.
- `@AttributeOverride` 이것은 해당 밸류 데이터가 저장된 테이블 이름을 지정한다.

이때 문제는 모두 조인해서 가져오는 즉시 로딩 방식을 사용하게 된다.

이 문제를 해결하고자 각각 엔티티로 구분해서 지연 로딩 방식으로 설정할 수 있지만, 이것은 밸류인 모델을 엔티티로 만드는 것이기 때문에 그닥 좋은 방식은 아니다.

다만 조회 전용 기능을 구현하는 방법은 좋은 방식으로 나중에 살펴보도록 할 것이다.

### ID참조와 조인 테이블을 이용한 단방향 M-N매핑

```java
@Entity
public class Product {
	@EmbeddedId
	private ProductId id;

	@ElementCollection
	@CollectionTable(
		name = "Product_category",
		joinColumns = @JoinColumn(name="product_id")
	)
	private Set<CategoryId> categoryIds;
	...
}

```

이 코드는 Product에서 Category로 단방향 M-N 연관을 ID참조 방식으로 구현한 것이다.

ID 참조를 이용한 애그리거트 단방향 M-N연관은 밸류 컬렉션 매핑과 동일한 방식으로 설정되는데, 차이점은 집합의 값에 밸류 대신 연관을 맺는 식별자가 온다는 점이다.

이를 통해 영속성 전파나 로딩 전략에 대한 고민을 없앨 수 있다.

## 애그리거트 로딩 전략

애그리거트 루트를 로딩하면 루트에 속한 모든 객체가 완전한 상태여야 한다는 점을 항상 기억해야 한다.

이를 위해서 즉시 로딩을 사용할 수 있지만, 사용 시점에 가져오는 지연 로딩 방식을 사용해도 문제가 되지 않는다.

## 애그리거트의 영속성 전파

애그리거트가 완전한 상태여야 한다는 것은 애그리거트 루트를 조회할 때 뿐만 아니라 저장할때, 삭제할때도 하나로 처리해야 함을 의미한다.

## 도메인 구현과 DIP

DIP에 대해서 살펴볼 때와 다르게, 이번 장에서 구현한 레포지토리는 DIP 원칙을 위반하고 있다.

`@Entity` `@Table` `@Id` 등의 어노테이션은 특정 기술에 특화된 코드로 이와 같은 코드가 사용되면 특정 기술에 의존하는 코드가 되게 된다.

이는 기존에 DIP에서 이야기 하는 도메인 모델은 구현 기술에 의존하면 안되다는 것에 위배된다.

하지만 DIP를 적용하는 주된 이유에 대해서 잠시 살펴보면 저수준 구현이 변경되더라도 고수준이 영향을 받지 않도록 하기 위함인데, 레포지토리와 도메인 모델의 구현 기술은 사실상 거의 변하지 않는다.

따라서 이렇게 변경이 거의 없는 상황에서 변경을 미리 대비하는 것은 과할 수 있다.

그렇기 때문에 이러한 부분의 도메인 모델에 대해서는 타협을 하는 합리적인 선택 또한 생각해볼 수 있다.