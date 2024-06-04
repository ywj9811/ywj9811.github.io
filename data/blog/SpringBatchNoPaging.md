---
title: SpringBatch PagingItemReader 사용시 페이징 문제
date: '2024-06-05'
tags: ['spring batch','기술']
draft: false
summary: SpringBatch PagingItemReader 건너뛰는 문제와 해결
---
## 문제 개요

대학원 김선배의 배치 처리에는 1주일에 한번씩 선배의 정산 테이블을 새롭게 만들어주는 작업이 필요하다.

하지만 여기서 JpaPagingItemReader를 사용하게 되었을 때 문제가 발생하는게 있다.

바로, 같은 조건의 대상을 조회하여 업데이트를 시킬 때 문제가 되는 것이다.

예를 들어 우리의 서비스에서는 이번주에 가입한 선배의 경우 다음주의 정산이 미리 생성되어 있기 때문에 해당 선배는 제외하고 정산을 생성해주어야 한다.

이를 위해서 

```sql
select ~
from ~
where ~ not in (select ~ from ~ where salary_date = ?)
```

이러한 쿼리문이 존재한다.

이때 `where ~ not in (select ~ from ~ where salary_date = ?)` 여기서 문제가 발생하는 것이다.

**바로 3000개의 정산을 생성하는 처리를 하고 ChunkSize를 50으로 하면 50개가 업데이트되면 다음 50개는 업데이트 되지 않는 문제였다.**

물론 Paging을 사용하지 않는 방식으로 우선 해결 했었지만, 이유를 알기 위해서 꽤나 오랜 시간이 걸렸다.

## 원인

이것은 Paging의 원리에 따른 것인데, Paging처리를 할 때 `offset` 과 `limit` 을 통해 이루어지고 있다.

그렇다면 SpringBatch에서는 Chunk단위로 트랜잭션을 처리하고 작업을 진행하게 되는데, 기존의 문제를 예로 들어 50개의 묶음을 업데이트 처리하게 되면 앞선 50개의 데이터가 조건문에 걸리게 되어 2950개만 조회되게 되는 상황이 온다.

하지만 페이지는 하나 올라갔기 때문에 51~100을 조회하게 되는데, 그렇게 되면 50만큼씩 데이터가 당겨져 기존의 다음 순서가 아닌, 다다음 순서가 조회되게 되는 것이다.

그렇게 3000개를 진행하게 되면 50개씩 스킵이 되고, 약 1500개만 업데이트가 진행되는 것이다.

## 해결책

이를 해결하기 위해서는 단순한 방식과, 직접 수정하는 방식이 있다.

### 단순한 방식

Paging을 사용하지 않는 것이다.

Cursor기반으로 동작하는 Jdbc를 사용하면 된다.

`JdbcCursorItemReader` 를 사용하면 DataBase Cursor를 옮기는 방식으로 처음 조회했던 결과가 갱신되지 않고 데이터를 건너뛰지 않고 모두 업데이트 할 수 있다.

### 직접 수정하는 방식

`PagingReader` 를 직접 개선하는 것이다.

나는 이 방식을 사용했다.

기존의 배치에 `QuerydslItemReader` 를 활용하는 방식으로 수정하며 ItemReader를 전체적으로 모두 만들게 되었는데 이러한 과정에서 해당 문제를 해결하고 진행했다.

이 과정에서 인프런 CTO 이동욱님의 블로그와 깃허브를 굉장히 많이 참고하였다.

(사실 해당 깃허브의 라이브러리를 그대로 사용하려고 했으나, 버전이 안맞아 직접 만들어 사용하게 되었다.)

단순하게 수정을 하는 것은 간단하다.

그저 `JpaPagingItemReader` 에서 사용하는 `getPage()` 가 언제나 0을 반환하도록 오버라이드 하면 된다.

```java
JpaPagingItemReader<Salary> reader = new JpaPagingItemReader<>(){
       @Override
       public int getPage() {
           return 0;
       }
};
```

이렇게 사용할 수 있다.

다만, `QueryDslItemReader` 를 만드는 과정에서 수정한 내용은 다음과 같다.

```java
...
    @Override
    @SuppressWarnings("unchecked")
    protected void doReadPage() {

        JPQLQuery<T> query = createQuery()
                .offset(0)
                .limit(getPageSize());

        initResults();

        fetchQuery(query);
    }
...
```

`doReadPage` 에서 offset을 항상 0으로 하여 언제나 0부터 PageSize 까지만 읽을 수 있도록 수정하였다.

이렇게 하게 되면 수정이 반영되어도, 페이지가 뒤로 넘어가지 않아서 데이터를 스킵하는 문제가 발생하지 않게 된다.