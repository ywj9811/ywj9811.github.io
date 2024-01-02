---
title: N+1 그리고 해결
date: '2024-01-02'
tags: ['spring boot', 'JPA', '기술']
draft: false
summary: JPA의 N+1 문제와 해결
---
**N+1에 대해서 본격적으로 살펴보기에 앞서 몇가지 개념을 살펴보도록 하자.**

## FetchType.LAZY

JPA를 사용하다 보면 지연로딩을 위해 FetchType을 LAZY로 설정을 하는 것을 권장한다는 것을 많이 보았을 것이다.

왜 그렇게 사용해야 할까

이전에 작성했던 글을 살펴본다면 나오기도 하겠지만, 간단하게 살펴보자.

### FetchType.EAGER

LAZY를 살펴보기 앞서 우선 즉시 로딩(EAGER)에 대해서 알아보자.

공부할 때 실무에서 가장 쓰지 말아야 하는, 모든 문제의 첫번째 원인이 되는 것이 즉시 로딩이라고 배웠다.

만약 `@OneToMany` 를 사용하는 경우를 생각해보자.

User라는 테이블이 One, Board라는 테이블이 Many일 경우를 가정하고,

User를 조회하는 상황을 생각해보면,

```sql
select * from user #(여기서 끝나는 것이 아님)
# JPA는 각각의 user와 관련된 Board의 List를 가져오려 할 것이다.
select * from board where user_id = ?
# 이것을 조회된 user의 수 만큼 발생시키게 된다.
```

이렇게 N+1 문제가 바로 발생하게 되는 것이다. (N = User의 수)

즉, EAGER를 사용했을 때 이 특성으로 인해 무조건 추가의 쿼리가 발생하고 경우에 따라서는 무수히 많은 쿼리가 추가로 발생할 수 있기 때문에 사용하지 말라는 것이다.

### FetchType.LAZY

그렇다면 지연 로딩을 사용하면 N+1 이 발생하지 않을까?

**아니다.**

지연 로딩은 “사용”하는 시점에 로딩을 해주는 방법이다.

즉, 사용하는 시점이 된다면 결국 쿼리를 날리기 때문에 경우에 따라 처음부터 N+1이 발생하지는 않을 수 있지만, 어느 순간에 쿼리가 발생하게 될 것이다.

**결국 단순히 지연 로딩으로 변경하는 방법으로는 N+1의 발생을 막을 수 없다.**

물론, 즉시 로딩과 다르게 실제로 사용하는 시점에만 추가 쿼리를 날리도록 하여 효율적으로 사용할 수 있게 해주고, 예상치 못한 쿼리가 발생할 위험성이 적기 때문에 기본적으로 FetchType.LAZY를 사용하는 것이 좋다.

---

여기까지는 사실 JPA를 사용한 대부분의 사람들이 공부하고 이해하고 있는 내용일 것이다.

## FetchType.LAZY 에서의 N+1 문제 해결

즉시 로딩에서는 우리가 커스텀을 할 수 있는 부분이 없으니, 지연 로딩에서 우리가 필요한 객체들을 미리 다 가져와서 추가적으로 쿼리가 발생하지 않도록 만들 수 있다.

바로 `FetchJoin`을 활용하는 것이다.

이를 **JPQL**에 바로 작성하여 하드 코딩 하거나 `@EntityGraph` 를 사용하여 활용할 수 있다고 하지만, 나는 **Querydsl**을 사용할 것이다.

이번에는 실제로 프로젝트에서 N+1 문제가 발생했던 예시로 확인해볼 것이다.

```java
@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
public class Mentoring {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long mentoringId;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    private Senior senior;

    ...
}
```

```java
@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    ...
}
```

```java
@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
public class Senior {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long seniorId;

    @OneToOne(fetch = FetchType.LAZY)
    private User user;

		...
}
```

이렇게 엮여있는 DB의 테이블이 있었다.

이때 특정 Senior가 가지고 있는 Mentoring을 조회하여 정보를 보고 싶은데, 조회 결과에는 위의 Mentoring의 정보들과 연관된 User의 정보들이 나와야 한다.

만약 여기서 그냥 FetchType.LAZY를 사용한다면 어떻게 될까.

**우선, Senior를 기반으로 Mentoring을 검색할 것이다.**

**그리고 그렇게 나온 Mentoring의 개수만큼 해당하는 User를 찾는 쿼리를 날릴 것이다.**

⚠️ 만약 Mentoring이 3000개라면 3000번의 쿼리가 추가로 발생하게 되는 것이다. ⚠️

### Querydsl 에서의 FetchJoin

```java
@Override
public List<Mentoring> findAllBySeniorAndStatus(Senior inputSenior, Status status) {
    return queryFactory.selectFrom(mentoring)
            .distinct()
            .join(mentoring.user, user)
            .fetchJoin()
            .where(mentoring.senior.eq(inputSenior), mentoring.status.eq(status))
            .fetch();
}
```

이렇게 원하는 join에 fetchJoin을 하게 되면 이에 해당하는 데이터는 한번에 조회하게 될 것이고, 한번에 조회된 데이터를 기반으로 로직을 수행할 것이다.

그렇다면 N+1개의 쿼리가 1개의 쿼리로 줄어들게 되는 것이다.

단, 이때 주의할 점이 있는데 `distinct()` 를 사용해야 한다는 것이다.

왜냐하면 위의 경우에 senior를 기반으로 검색하는데 DB의 입장에서 fetchJoin 또한 join을 사용하는 것이기 때문에 중복이 발생한다.

즉, 예를 들어 **선배님** 이라는 senior를 기반으로 검색하면 **선배님-mentoring** 이 관계가 여러개 검색될 때 **선배님** 또한 여러번 나오게 되는 것이다.

따라서 `distinct()` 를 통해서 중복을 제거해줘야 한다.

> JPQL의 `distinct` 는 SQL에 DISTINCT를 추가해주기도 하지만, 어플리케이션에서 엔티티 중복 제거를 시켜주기 때문이다.
> 

---

![Untitled](/static/images/np1.png)

N+1이 발생할 때의 성능

![Untitled](/static/images/np2.png)

N+1을 해결한 이후 성능

**이렇게 성능 최적화가 이루어지게 된다.**
