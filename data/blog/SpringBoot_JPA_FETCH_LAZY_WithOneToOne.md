---
title: OneToOne 양방향은 FetchType.LAZY가 동작하지 않는다
date: '2024-01-07'
tags: ['spring boot', 'JPA', '기술']
draft: false
summary: OneToOne에서 양방향 관계를 맺는 경우 FetchType.LAZY가 동작하지 않을 수 있다.
---
### 제목 그대로 @OneToOne의 양방향은 FetchType.LAZY가 되지 않을 수 있다.

물론, 특정한 경우에 있어서다.

```java
@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long paymentId;

    @OneToOne(fetch = FetchType.LAZY)
    private Mentoring mentoring;

    ...
}

@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
public class Mentoring {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long mentoringId;

    @OneToOne(mappedBy = "mentoring", fetch = FetchType.LAZY)
		private Payment payment;

		...
}
```

이러한 관계를 가지고 있을 때 Payment를 조회하면 mentoring이 LAZY로 조회되는 모습을 확인할 수 있다.

하지만 Mentoring을 조회하면 Payment가 LAZY로 설정되어 있음에도 불구하고 조회하는 즉시 쿼리문이 추가로 발생하는 모습을 확인할 수 있다.

즉, 관계의 주인에서는 LAZY로 조회가 가능하지만 주인이 아닌 곳에서 조회를 하게 되면 LAZY로 설정하여도 동작하지 않는 것이다.

### LAZY가 동작하지 않는 이유

이유를 알아보면 프록시와 관련된 문제이다.

Payment 테이블에는 `mentoring_id`가 있어서 외래키 조건을 만족하며, 객체 그래프 탐색에서 Non-Null을 만족해 프록시를 생성할 수 있다. 

**하지만, Mentoring을 조회할때는 Payment에 대한 id값을 가지고 있지 않기 때문에 객체 그래프 탐색을 하기 위해서는 프록시가 아닌 실제로 조회해야하는 상황이 발생해 N+1 문제가 발생하는 것이다.** 

**→ 프록시는 Null을 가질 수 없음**

우리가 `@OneToMany`를 사용할 때 프록시가 적용되는 것을 확인할 수 있는데, 그 이유는 `mappedBy` 속성을 주게 되면 insertable, updatable의 속성이 false로 설정되어 있기에

 `List<A> list = new ArrayList<>();` 필드에서 바로 초기화를 해주기 때문에 Non-null 조건을 만족해 프록시를 설정하기 때문이다.

### 해결

그렇다면 어떻게 해결할 수 있을까?

N+1은 조회할 개수가 많아지면 문제가 심각해질 수 있다.

1. 구조 변경하기
    - 양방향 매핑이 반드시 필요한 상황인지 다시한번 생각할 필요가 있다.
        - 양방향 매핑보다는 단방향을 지향하고자 하기도 하니 고민을 해보자.
    - OneToOne 양방향 → OneToMany로 변경할 수 있는지 생각해본다.
- 구조를 유지한채 해결하기
    - Mentoring을 통해 조회하는 것이 아닌 Payment를  조회하며 Mentoring을 함께 조회한다.
    - Mentoring을 통해서만 조회해야 하는 상황이라면, Mentoring을 조회하고 결과로 얻은 List를 활용하여 `In` 을 사용하기
        
        ```java
        @Override
        public List<DoneSeniorMentoringInfo> findAllBySeniorAndDone(Senior inputSenior) {
            List<Mentoring> mentorings = queryFactory.selectFrom(mentoring)
                    .distinct()
                    .join(mentoring.user, user)
                    .fetchJoin()
                    .where(mentoring.senior.eq(inputSenior), mentoring.status.eq(DONE))
                    .orderBy(mentoring.createdAt.desc())
                    .fetch();
        
            List<Payment> payments = queryFactory.selectFrom(payment)
                    .distinct()
                    .join(payment.salary, salary)
                    .fetchJoin()
                    .where(payment.mentoring.in(mentorings))
                    .fetch();
        
            List<DoneSeniorMentoringInfo> doneSeniorMentoringInfos = mentorings.stream()
                    .map(mentoring -> {
                        Payment payment = payments.stream()
                                .filter(p -> p.getMentoring() == mentoring)
                                .findFirst()
                                .orElseThrow();
                            return mapToSeniorDoneInfo(mentoring, payment);
                    })
                    .toList();
            return doneSeniorMentoringInfos;
        }
        ```
        
        이렇게 `In` 을 활용하여 N+1을 해결할 수 있다.