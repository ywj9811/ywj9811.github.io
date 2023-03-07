---
title: 연관 관계 매핑
date: '2023-03-07'
tags: ['spring boot', 'JPA', '인프런', '김영한', '기술']
draft: false
summary: 연관 관계 매핑을 왜 사용할까, 그리고 어떻게 사용해야 할까
---

# 연관 관계 매핑

## 연관 관계를 왜 사용하는 것일까?

> **객체 지향 설계를 위해서**

### 객체를 테이블에 맞춰 모델링 하는 경우

![Assosiation](/static/images/Persist/assosiation1.png)

```java
@Entity
public class Member {
	@Id @GeneratedValue
	@Column(name = "MEMBER_ID")
	private Long id;

	@Column(name = "USERNAME")
	private String name;

	@Column(name = "TEAM_ID")
	private Long teamId;
	…
}

@Entity
public class Team {
	@Id @GeneratedValue
	@Column(name = "TEAM_ID")
	private Long id;

	private String name;
	…
}
```

이 경우 외래 키 식별자를 직접 다루어야 한다.

```java
//팀 저장
Team team = new Team();
team.setName("TeamA");
em.persist(team);

//회원 저장
Member member = new Member();
member.setName("member1");
member.setTeamId(team.getId());
em.persist(member);
```

이 경우 두개의 객체가 서로 연관 관계가 없다.

따라서 조회할 경우 서로 연관 관계가 없다.

**이는 테이블과 객체 사이의 차이점 때문에 발생하는 문제이다.**

- 테이블은 외래 키로 조인을 사용하여 연관된 테이블을 찾는다.
- 객체는 참조를 사용해서 연관된 객체를 갖는다.

### 객체 연관 관계 사용한 객체 지향 모델링

**단방향 연관 관계 저장**

![association2](/static/images/Persist/assosiation2.png)

```java
@Entity
public class Member {
	@Id @GeneratedValue
	@Column(name = "MEMBER_ID")
	private Long id;

	@Column(name = "USERNAME")
	private String name;

	@ManyToOne
	@JoinColumn(name = "TEAM_ID")
	private Team team;
	…
}

@Entity
public class Team {
	@Id @GeneratedValue
	@Column(name = "TEAM_ID")
	private Long id;

	private String name;
	…
}
```

이는 이전과 다르게 객체를 필드에 직접 가지고 있다.

```java
//팀 저장
Team team = new Team();
team.setName("TeamA");
em.persist(team);

//회원 저장
Member member = new Member();
member.setName("member1");
member.setTeam(team);
em.persist(member);
```

이렇게 되면 객체가 서로 연관 관계를 가지고 있기 때문에 조회시 참조를 통해 조회할 수 있다.

```java
//조회
Member findMember = em.find(Member.class, member.getId());

//참조를 사용해서 연관관계 조회
Team findTeam = findMember.getTeam();
```

⚠️**참고**

**연관 관계 수정 (객체 지향 모델링)**

```java
//새로운 팀B
Team teamB = new Team();
teamB.setName("TeamB");
em.persist(teamB);

//회원1에 새로운 팀B 설정
member.setTeam(teamB);
```

## 양방향 연관 관계와 연관 관계의 주인

### 양방향 매핑

![Association3](/static/images/Persist/assosiation3.png)

```java
@Entity
public class Member {
	@Id @GeneratedValue
	@Column(name = "MEMBER_ID")
	private Long id;

	@Column(name = "USERNAME")
	private String name;

	@ManyToOne
	@JoinColumn(name = "TEAM_ID")
	private Team team;
	…
}

@Entity
public class Team {
	@Id @GeneratedValue
	@Column(name = "TEAM_ID")
	private Long id;

	private String name;

	@OneToMany(mappedBy = "team") //team이라는 변수 이름으로 객체를 참조하고 있으니
	List<Member> members = new ArrayList<>();
	…
}
```

이렇게 Member 엔티티는 이전에 단방향과 동일하게 작성하되, Team 엔티티에 컬렉션을 추가해주면 된다.

이 때 Team 하나가 여러개의 Member를 가지기 때문에 리스트로 만들면서 **`@OneToMany`** 를 사용하는 것이다.

그리고 이때는 JoinColumn이 아닌, **`mappedBy`**를 사용한다.

```java
//조회
Team findTeam = em.find(Team.class, team.getId());

//역방향 조회
int memberSize = findTeam.getMembers().size();
```

이와 같이 **양방향으로 연관 관계를 가지고 있기 때문에** Team을 조회하여도 Member에 관한 내용을 확인할 수 있다.

### ⚠️ 객체와 테이블이 관계를 맺는 차이

- **객체 연관 관계 : 2개**
  회원 → 팀 연관 1개 (단방향)
  팀 → 회원 연관 1개 (단방향)
  이렇게 현재 객체는 2개의 연관 관계를 가지고 있다. (2개의 단방향 관계)
- **테이블 연관 관계 : 1개**
  회원 < → 팀의 연관 관계 1개 (양방향)
  외래 키 하나로 양방향 연관 관계를 가질 수 있다. (양쪽으로 조인 가능)
  **`SELECT * FROM MEMBER M JOIN TEAM T ON M.TEAM_ID = T.TEAM_ID`**
  **`SELECT * FROM TEAM T JOIN MEMBER M ON T.TEAM_ID = M.TEAM_ID`**

**이 차이를 알고 있어야 한다!**

### 연관 관계의 주인

위와 같이 테이블은 양방향 연관 관계도 외래 키 하나로 연관 관계를 가질 수 있는데, 이때 두개의 테이블중 하나가 외래 키를 관리해야 한다.

그렇다면 어떤 테이블이 외래키를 담당해야 할까?

![Association4](/static/images/Persist/assosiation4.png)

이 연관 관계의 주인만이 외래 키를 관리할 수 있다.

그리고 주인이 아닌 쪽은 읽기만 가능하다.

주인인 경우 `@JoinColumn`을 사용하고 주인이 아닌 경우 **`mappedBy`** 를 사용할 것이다.

즉, 외래 키가 있는 곳을 주인으로 정하도록 하자.

**→ 여기서는 Member가 주인이다.**

코드를 작성할 때 주인에 상대 값을 입력해줘야 한다.

물론 객체 지향을 위해서 주인이 아니어도 값을 입력해주도록 하자.
