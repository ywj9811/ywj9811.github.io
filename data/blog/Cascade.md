---
title: 영속성 전이 및 고아 객체 관리
date: '2023-03-13'
tags: ['spring boot', 'JPA', '인프런', '김영한', '기술']
draft: false
summary: CASCADE란? 그리고 고아 객체 관리에 대해해서
---

### 특정 엔티티를 영속 상태로 만들 때 연관된 엔티티도 함께 영속 상태로 만들고 싶을 때

**ex) 부모 엔티티를 저장할 때 자식 엔티티도 함께 저장**

### 영속성 전이 : 저장

```java
@OneToMany(mappedBy="parent", cascade=CascadeType.PERSIST)
```

![cascade](/static/images/cascade.png)

이렇게 부모가 여러 혹은 하나의 자식을 가지고 있을 때 영속 상태로 함께 하게 해주는 것이다.

**⚠️ 영속성 전이는 연관 관계 매핑과 전혀 관련 없이 연관된 엔티티도 함께 영속화 할 수 있는 편의를 제공하는 것이다.**

대표적인 속성 3가지를 알아보도록 하자.

- **ALL : 모두 적용 → 아래 두가지 모두 적용**
- **PERSIST : 영속 → 부모가 영속화 되면 자식도 영속화**
- **REMOVE : 삭제 → 부모가 삭제되면 자식도 동시에 삭제**

이렇게 3가지를 필요에 따라서 사용할 수 있다.

### 고아 객체

고아 객체란 부모 엔티티와 연관 관계가 끊어진 자식 엔티티를 말하는 것으로 고아 객체 관리를 위한 속성이 있다.

**`orphanRemoval=true` 이렇게 하게 되면 고아 객체를 자동으로 삭제해준다.**

개념적으로 부모를 제거하면 자식이 고아가 되기 때문에 이 기능을 사용하게 되면 부모를 제거할 때 자식도 함께 제거되게 된다. → **`CascadeType.REMOVE` 와 비슷하게 동작**

## ⚠️ 주의 : 참조하는 곳이 하나일 때 사용! 특정 엔티티가 개인 소유할 떄 사용!

즉, @OneToOne 혹은 @OneToMany만 사용할 수 있다.

## 영속성 전이 + 고아 객체, 생명 주기

- **`CascadeType.ALL` + `orphanRemoval=true`**
- 이렇게 두가지를 모두 활성화 하면 부모 엔티티를 통해서 자식의 생명 주기를 관리할 수 있다.

## 💡근데, CascadeType.REMOVE와 orphanRemoval=true 는 뭐가 다른 것일까?💡

우선 Team과 Member 엔티티를 설정하고 알아보도록 하자.

## CascadeType.REMOVE

```java
// Team.java
@Entity
public class Team {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToMany(mappedBy = "team", fetch = FetchType.LAZY)
    private List<Member> members = new ArrayList<>();

    public Team() {
    }

		public void addMember(Member member) {
        members.add(member);
        member.setTeam(this);
    }
}

// Member.java
@Entity
public class Member {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn
    private Team team;

    public Member() {
    }
}
```

이런 환경을 가지고 있다.

**이는 부모 엔티티가 삭제되면 자식 엔티티도 함께 삭제될 수 있도록 해주는 영속성 관리이다.**

**즉, 부모가 자식의 삭제 생명 주기를 관리하는 것이다.**

여기서 CascadeType.PERSIST를 함께 사용하거나 Cascade.ALL을 사용하게 된다면 자식의 생명 주기 전체를 관리하게 되는 것이다.

**어쨌든, CascadeType.REMOVE 를 설정하였을 때 부모와 자식 엔티티의 관계를 제거하게 되어도 자식 엔티티는 삭제되지 않고 그대로 남아있다.**

왜냐하면 그저 관계를 제거했을 뿐이기 때문이다.

```java
@DisplayName("CascadeType.REMOVE - 부모 엔티티(Team)에서 자식 엔티티(Member)를 제거하는 경우")
@Test
void cascadeType_Remove_InCaseOfMemberRemovalFromTeam() {
    // given
    Member member1 = new Member();
    Member member2 = new Member();

    Team team = new Team();

    team.addMember(member1);
    team.addMember(member2);

    teamRepository.save(team);

    // when
    team.getMembers().remove(0);

    // then
    List<Team> teams = teamRepository.findAll();
    List<Member> members = memberRepository.findAll();

    assertThat(teams).hasSize(1);
    assertThat(members).hasSize(2);
}
```

위의 코드를 살펴보면 Team의 `List<Member>` 에 member 객체 두개를 저장했다.

그리고 해당 리스트에서 하나를 삭제했다.

**그러면 삭제된 member객체는 부모를 잃어버린 것이다.**

**하지만 member 테이블을 조회해보면 두개의 객체가 그대로 남아있는 모습을 확인할 수 있다.**

**즉, 부모와 자식의 관계를 끊어도 자식이 테이블에서 삭제되는 것은 아니다**.

## orphanRemoval=true

**`orphanRemoval=true` 또한 부모 엔티티가 삭제되면 자식 엔티티도 삭제된다.**

**`CascadeType.PERSIST` 를 함께 사용하면, 이때도 부모가 자식의 생명 주기 전체를 관리하게 된다.**

이 **`orphanRemoval=true`** 옵션은 **부모 엔티티와 자식 엔티티의 관계가 끊어져 자식이 고아가 된다면 해당 고아 객체는 사라지게 되는 것**이다.

```java
// Team.java
@Entity
public class Team {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToMany(
        mappedBy = "team",
        fetch = FetchType.LAZY,
        cascade = CascadeType.PERSIST,
        orphanRemoval = true
    )
    private List<Member> members = new ArrayList<>();
}
```

**이렇게 Team 객체가 이전과 다르게 `orphanRemoval = true` 옵션을 가지고 있다.**

그럼 이전과 마찬가지로 부모와 자식의 관계를 끊고 확인해보도록 하자.

```java
@DisplayName("orphanRemoval = true - 부모 엔티티(Team)을 삭제하는 경우")
@Test
void orphanRemoval_True_InCaseOfTeamRemoval() {
    // given
    Member member1 = new Member();
    Member member2 = new Member();

    Team team = new Team();

    team.addMember(member1);
    team.addMember(member2);

    teamRepository.save(team);

    // when
    team.getMembers().remove(0);

    // then
    List<Team> teams = teamRepository.findAll();
    List<Member> members = memberRepository.findAll();

    assertThat(teams).hasSize(1);
    assertThat(members).hasSize(1);
}
```

이 또한 이전과 마찬가지로 **Member 객체 두개를 생성하여 각각 Team의 List에 저장**을 했다.

그리고 Team의 리스트에서 하나를 삭제했다.

**그러면 이번에는 member 테이블을 조회하면 이전과 다르게 1개만 조회 되는 모습을 확인할 수 있다.**

## 비교

- **부모 엔티티 삭제**
  **`CascadeType.REMOVE` 와 `orphanRemoval = true`** 모두 부모 엔티티를 삭제하면 자식 엔티티도 삭제된다.
- **부모 엔티티에서 자식 엔티티 제거**
  **`CascadeType.REMOVE`** 의 경우 테이블에는 자식 엔티티가 그대로 남아있다.
  하지만 **`orphanRemoval = true`** 의 경우 테이블에서 자식 엔티티가 제거된다.
