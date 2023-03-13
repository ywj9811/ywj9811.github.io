---
title: 프록시 및 지연 로딩
date: '2023-03-12'
tags: ['spring boot', 'JPA', '인프런', '김영한', '기술']
draft: false
summary: 프록시에 대해서 그리고 지연 로딩이란?
---

## 프록시란?

**실제 엔티티 객체 대신에 사용되는 객체**로 실제 엔티티 클래스와 상속 관계 및 위임 관계에 있다.

프록시 객체는 실제 엔티티 클래스를 상속 받아서 만들기 때문에 **실제 엔티티와 겉모습은 일치한다.**

### 프록시를 왜 써야할까

![proxy1](/static/images/Proxy/proxy1.png)

위와 같은 관계를 맺고 있는 데이터베이스가 있다.

**이때 우리는 Member를 조회하기 위해서는 항상 Team을 함께 조회해야 할까?**

분명 Member에서 Team을 제외하고 유저 이름만 확인하는 경우도 있을 것이다.

이때 프록시의 개념이 들어가는 것이다.

### 프록시 기초

- **`em.find()` VS `em.getRefrence()`**
  **`em.find()` : 데이터베이스를 통해서 실제 엔티티 객체** 조회
  **`em.getRefrence()` : 데이터베이스 조회를 미루는 가짜(프록시) 엔티티 객체** 조회

### 프록시 특징

![proxy2](/static/images/Proxy/proxy2.png)

위와 같은 모습으로 프록시는 생성되게 되는데**, 프록시 객체는 실제 객체의 참조를 보관**하고 있는 것이다.

그래서 프록시 객체를 호출하면 **프록시 객체는 실제 객체의 메소드를 호출**한다.

```java
Member member = em.getReference(Member.class, “id1”);
```

이렇게 프록시 객체를 얻을 수 있다.

**프록시 객체를 얻었지만 아직은 select 쿼리를 수행하지 않는다.**

왜냐하면 아직 Member 객체에 관련된 동작을 수행하지 않았기 때문이다.

```java
member.getName();
```

하지만 위와 같은 코드를 실행시키게 되면 이때 select 쿼리가 실행되는 모습을 확인할 수 있다.

**즉, 엔티티가 사용될 때 까지 기다렸다가 필요한 순간에 조회하는 것이다.**

**이는 프록시가 지연 로딩과 연관된 개념임을 나타내는 점이기도 하다.**

![proxy3](/static/images/Proxy/proxy3.png)

위의 과정을 그림과 함께 살펴볼 수 있는데, `em.getRefrence()` 를 통해서 프록시 객체를 얻지만 그때까지는 실제 Entity 객체가 생성되지 않는다.

**이때 직접 Member 엔티티를 사용하기 위해 메소드를 사용하게 되면 그 시점에서 프록시 객체가 초기화 요청을 하게 되면서 실제 엔티티를 참조하게 된다.**

**이 과정에서 조회된 Member 엔티티는 영속성 객체로 저장되게 된다.**

**⚠️ 그렇다면 이미 영속성 객체에 Member 객체가 있다면?**

- **당연하게도 `getRefrece()` 호출과 동시에 실제 엔티티가 반환되게 된다. (이미 영속성 객체로 저장되어 있으니까?)**

### 프록시에 대해서 알아 보았으니 즉시 로딩과 지연 로딩에 대해서 한번 살펴보도록 하자

이전과 같은 물음을 다시 던져보자

**우리는 Member를 조회하기 위해서는 항상 Team을 함께 조회해야 할까?**

### 필요한 경우에만 Team을 조회하고 싶다면?

## 지연 로딩 LAZY를 이용해서 프록시로 조회

```java
@Entity
public class Member {
	@Id
	@GeneratedValue
	private Long id;

	@Column(name = "USERNAME")
	private String name;

	@ManyToOne(fetch = FetchType.LAZY) //**
	@JoinColumn(name = "TEAM_ID")
	private Team team;
 ..
}
```

**이렇게 지연 로딩 전략을 사용한다면? 아래와 같은 방식으로 작동하게 될 것이다.**

![proxy4](/static/images/Proxy/proxy4.png)

![proxy5](/static/images/Proxy/proxy5.png)

```java
Member member = em.find(Member.class, 1L);
```

이렇게 Member 엔티티를 처음 조회한 시점에는 Team을 조회하지 않는다.

**즉, 쿼리문에서 Join을 날리지 않는다.**

![proxy6](/static/images/Proxy/proxy6.png)

```java
Team team = member.getTeam();
```

**이렇게 Team을 사용하는 메소드를 동작시키는 순간 DB에서 Team을 조회하게 된다.**

**→ 기존에 Join을 사용하지 않고 조회를 하였기 때문에 영속성 컨텍스트에 Team이 들어있지 않다. 따라서 이번에는 추가로 Team을 조회하는 select를 날린다.**

## 즉시 로딩? EAGER

**동시에 사용할 일이 많아서 즉시 로딩 EAGER을 사용하면?**

```java
@Entity
public class Member {
    @Id
    @GeneratedValue
    private Long id;

    @Column(name = "USERNAME")
    private String name;

    @ManyToOne(fetch = FetchType.EAGER) //**
    @JoinColumn(name = "TEAM_ID")
    private Team team;
}
```

이렇게 즉시 로딩 전략을 사용한다면?

![proxy7](/static/images/Proxy/proxy7.png)

![proxy8](/static/images/Proxy/proxy8.png)

**Member를 조회하는 순간 Team도 함께 조회가 된다.**

**즉, Member와 함께 Team도 쿼리문에서 Join을 사용해서 DB에서 조회하게 된다.**

## 그렇다면 어떤 것을 주로 사용해야 할까?

즉시 로딩(EAGER)의 경우, 데이터베이스의 조회 횟수가 많아지게 되므로 **지연 로딩(LAZY)을 주로 사용하는 것이 좋다.**

또한 지연 로딩의 경우에는 프록시를 사용하기 때문에, 원하는 시점에 필요한 데이터를 로딩할 수 있어서 효율적이다.

혹여나 즉시 로딩을 사용하게 되면 JPQL 에서 N+1 이 발생할 수 있으니 주의해야 한다.

### ⚠️ N + 1 문제가 무엇일까?

```java
List<Member> members = em.createQuery("select m from Member m", Member.class)
	.getResultList();
System.out.println(members);
```

위와 같이 **JPQL을 직접 만들어서 작동시키게 되면 JPA 자동 생성이 아닌 직접 작성한 쿼리로 발생하기 때문에** Member 조회를 위해 한번, Team을 가져오기 위해 또 select 문이 날아가게 된다.

이렇게 **한번 조회하는데 두번의 쿼리가 나가게 되는데** 만약 멤버가 많아지고 모두 다른 팀에 속하게 된다면 N + 1 문제가 심각해질 수 있다.

```sql
Hibernate:
 	select
        	....
 	from
        	Member member0_

Hibernate:
    select
        team0_.TEAM_ID as team_id1_7_0_,
        team0_.name as name2_7_0_
    from
        Team team0_
    where
        team0_.TEAM_ID=?
```

위와 같이 두개가 나가게 되는 것을 확인할 수 있다.

### !참고! @ManyToOne, @OneToOne은 기본이 즉시 로딩이기 때문에 LAZY로 설정해주도록 하자.

## 지연 로딩 활용

- Member와 Team이 자주 함께 사용 → 즉시 로딩
- Member와 Order는 가끔 함께 사용 → 지연 로딩
- Order와 Product는 자주 함께 사용 → 즉시 로딩

이렇게 가정을 했을 때

![proxy9](/static/images/Proxy/proxy9.png)

![proxy10](/static/images/Proxy/proxy10.png)
이런 방식으로 동작하게 된다. 이는 이해를 위해 만든 것이니 즉시 로딩을 사용한 것이다.

### 실제로 구현할 때는 **가능한 모든 연관 관계에서 지연 로딩을 사용하도록 하자.**
