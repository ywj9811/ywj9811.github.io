---
title: 임베디드 타입(복합 값 타입)
date: '2023-03-14'
tags: ['spring boot', 'JPA', '인프런', '김영한', '기술']
draft: false
summary: 임베디드 타입이란? 그리고 사용법과 주의 사항을 알아보자
---

## 임베디드 타입

**새로운 값 타입을 직접 정의하는 것을 말하는 것으로 JPA는 이것을 임베디드 타입**이라고 한다.

이는 **기본 값 타입을 모아서** 만들기 때문에 복합 값 타입이라고 불린다.

### 예시를 보며 알아보도록 하자

![embadded1](/static/images/valueType/embaddedType1.png)

이런 구조를 가지는 회원 엔티티가 있을 때 이름, 근무 시작일, 근무 종료일, 주소 도시, 주소 번지, 주소 우편번호를 가지고 있다.

하지만 이것을 좀 더 필요에 맞게 구조를 개편 시킬 수 있을 듯 하다.

![embadded1](/static/images/valueType/embaddedType2.png)

이런 식으로 **startDate, endDate를 workPeriod**로, **city, street, zipcode를 homeAddress**로 임베디드 타입을 사용하며 만들 수 있다.

![embadded1](/static/images/valueType/embaddedType3.png)

**임베디드 타입은 이런 식으로 사용되는 방식을 이야기 하는 것이다.**

### 임베디드 타입 사용법

```java
@Entity
@Table(name = "MEMBER")
public class Member extends BaseEntity {
    @Id @Column(name = "MEMBER_ID")
    @GeneratedValue
    private Long id;
    private String username;
    @Embedded
    private Period wordPeriod;
    @Embedded
    private Address homeAddress;
}
```

이렇게 **@Embedded** 를 값 타입 사용하는 곳에 표시하고

```java
@Embeddable
public class Period {
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    public Period() {
    }
}

@Embeddable
public class Address {
		private String city;
		private String street;
		private String zipcode;

    public Address() {
    }
}

```

이런 식으로 **@Embeddable** 이라는 어노테이션을 값 타입 정의하는 곳에 표시하면 된다.

**이때 주의할 점 : 기본 생성자가 필수이다!**

이렇게 임베디드 타입을 사용하게 되면 다음과 같은 장점이 있다.

- **재사용**
- **높은 응집도**
- **예를 들어 `Period.isWork()` 처럼 해당 값 타입만 사용하는 의미 있는 메소드를 만들 수 있다.**
- **임베디드 타입을 포함한 모든 값 타입은, 값 타입을 소유한 엔티티에 생명주기를 의존함**

이렇게 생성하게 되면 엔티티 객체에서는 임베디드 타입으로 사용하지만 테이블에서 살펴보면 이전과 마찬가지로 하나의 테이블에 컬럼이 들어가게 된다.

![embadded1](/static/images/valueType/embaddedType4.png)

이런식으로 엔티티와 테이블의 차이를 확인할 수 있다.

### @AttributeOverride : 속성 재정의

임베디드 타입을 사용하는 방법은 알겠다. 하지만 만약 **하나의 엔티티 내부에 Address가 HomeAddress, WorkAddress 이렇게 두개가 필요하다면 어떻게 해야할까?**

그냥 사용하게 된다면 이전에 설명한 것과 같이 하나의 테이블에 임베디드 타입에서 설정한 이름과 같이 컬럼이 생성된다.

**따라서 Address를 두개 가져다가 사용하게 되면 컬럼 명이 중복되어 오류가 발생하게 될 것이다.**

**이때 @AttributeOverrides, @AttributeOverride 를 사용해서 컬럼 명을 재정의 해주면 된다.**

```java
@Entity
@Table(name = "MEMBER")
public class Member extends BaseEntity {
    @Id @Column(name = "MEMBER_ID")
    @GeneratedValue
    private Long id;
    private String username;
    @Embedded
    private Period wordPeriod;
    @Embedded
    private Address homeAddress;

    @Embedded
    @AttributeOverrides({@AttributeOverride(name = "city", column = @Column(name = "WORK_CITY")),
            @AttributeOverride(name = "street", column = @Column(name = "WORK_STREET")),
            @AttributeOverride(name = "zipcode", column = @Column(name = "WORK_ZIPCODE"))})
    private Address workAddress;
    //공통된 임베디드 값 타입으로 두가지를 만들기 위해서는 위와 같이 어노테이션을 사용하면 된다.
}
```

위의 코드를 보면 **homeAddress와 workAddress가 모두 Address 타입**으로 생성되고 있다.

```java
@Embedded
@AttributeOverrides({@AttributeOverride(name = "city", column = @Column(name = "WORK_CITY")),
        @AttributeOverride(name = "street", column = @Column(name = "WORK_STREET")),
        @AttributeOverride(name = "zipcode", column = @Column(name = "WORK_ZIPCODE"))})
private Address workAddress;
//공통된 임베디드 값 타입으로 두가지를 만들기 위해서는 위와 같이 어노테이션을 사용하면 된다.
```

해당 코드를 자세히 살펴보면

마찬가지로 **@Embedded** 어노테이션을 달아서 임베디드 타입을 사용함을 명시한다.

그리고

**@AttributeOverrides** 어노테이션 내부에 **@AttributeOverride**를 통해 어떤 필드(**name = “”**) 을 어떤 컬럼명으로 저장할지(**column = “”**) 을 통해서 결졍해주면 된다.

## 값 타입과 불변 객체

값 타입을 사용하면 객체를 좀 더 단순화 하여 사용할 수 있지만 **값 타입을 단순하고 안전하게 다룰 수 있어야 한다.**

### 주의! 값 타입 공유 참조

임베디드 타입의 경우 여러 엔티티에서 공유될 수 있는데 이 부분을 매우 주의해야 한다.

**→ side effect가 발생할 수 있다**

![embadded1](/static/images/valueType/embaddedType5.png)

이게 무슨 말인지 코드와 함께 살펴보도록 하자.

```java
public class Main {
    public static void main(String[] args) {
        EntityManagerFactory emf = Persistence.createEntityManagerFactory("hello");
        EntityManager em = emf.createEntityManager();

        EntityTransaction tx = em.getTransaction();

        tx.begin();

        try {
            Address address = new Address("city", "street", "10000");

            Member member1 = new Member();
            member1.setUsername("meber1");
            member1.setHomeAddress(address);
            member1.setWordPeriod(new Period());
            em.persist(member1);

            Member member2 = new Member();
            member2.setUsername("member2");
            member2.setHomeAddress(address);
            member2.setWordPeriod(new Period());
            em.persist(member2);

            //여기서 side effect 발생 위험
            member1.getHomeAddress().setCity("new City");
            //분명 member1의 Address를 수정함
            //하지만 member2의 Address도 함께 수정됨!
            //임베디드 타입 하나의 객체를 여러개의 엔티티에서 공유하면 위험함
            //따라서 객체를 따로 따로 생성하여 사용하도록! 그리고 set을 삭제하여 !!불변!!하도록 만들어야 한다 (생성자로만 값을 생성할 수 있도록)
            tx.commit();
        } catch (Exception e) {
            tx.rollback();
        } finally {
            em.close();
        }
    }
}
```

위 코드를 살펴보면

**Address 임베디드 타입 객체 address를 만든다.**

**Member 객체 member1 과 member2가 있다.**

**이때 member1과 member2에 같은 address를 넣어준 상황에서 큰 문제가 발생할 수 있다.**

**바로 member1의 address를 수정했을 때 Address의 같은 참조 값을 공유하고 있는 member2 객체의 값도 함께 변경되는 것이다.**

**→ update 쿼리가 두개 날아가는 것을 확인할 수 있을 것이다.**

이 문제는 모르다가 나중에 알게 된다면 큰 문제로 발전할 수 있는 것이다.

### 어떻게 사용해야 할까

같은 참조 값을 사용하게 된다면 큰 문제가 발생할 수 있기 때문에 같은 값을 넣고 싶더라도 새로운 객체를 생성하여 넣어주도록 해야 한다.

**→ Setter를 사용하면 안된다!**
