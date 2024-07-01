---
title: 페이징 성능 개선
date: '2024-07-01'
tags: ['spring boot', '기술']
draft: false
summary: No Offset과 커버링 인덱스를 통한 페이징 성능 개선
---
## 기존 페이징 방식의 문제점

주로 사용되는 Paging기법은 offset과 limit을 활용하는 방식이다.

하지만, 이 방식의 경우 페이지가 굉장히 많아지게 된다면 성능에서 문제가 생길 수 있다.

이유는 아래와 같이, 뒷 페이지를 읽기 위해서는 앞에서 읽었던 행들을 사용하지 않더라도 읽어야한다는 특징 때문이다.

결국 offset이 10000이고, limit이 50이면, 10050개를 읽어야 하기 때문이다.

![Untitled](/static/images/paging.png)

이때 Page가 offset, limit이 페이지당 노출시킬 데이터의 수이다.

## No Offset 방식을 활용한 개선

이때 No Offset 방식을 사용하게 되면, 조회 시작 부분을 인덱스로 빠르게 찾아 매번 첫번째 페이지만 읽을 수 있도록 하는 방식이다.

기존의 방식은 아래와 같을 것이다.

```sql
select * from item
where 조건문
order by id desc
offset 페이지번호
limit 페이지사이즈
```

이를 아래와 같이 변경하는 것이다.

```sql
select * from item
where 조건문 and id < 마지막조회id
order by id desc
limit 페이지사이즈
```

이를 통해서 id (pk 혹은 인덱스)를 기반으로 조건을 걸어주고, 이를 기반으로 이후의 데이터만 limit만큼 조회하게 하여, 기존의 수많은 데이터를 불필요하게 읽어버리는 성능 낭비를 줄이는 것이다.

### 문제점

하지만, 모든 상황에서 No Offset 을 활용할 수 있는 것은 아니다.

마지막으로 조회한 데이터를 기반으로 다음 데이터를 가져오는 방식으로, offset을 사용하지 않는 것인데 이를 위해서는 무한 스크롤과 같이 특정 페이지를 이동하는 것이 아닌, 다음 페이지만 뜨게 하는 방식에서만 사용할 수 있다.

만약 1번 페이지를 보고 있다가 9번 페이지를 보게 된다면, 이러한 방식은 불가능할 것이다.

사용할 수 없는 경우가 또 있다.

예시로 보여준 경우는 where에서 사용되는 기준 Key가 중복이 가능한 경우이다.

이 경우는 정확한 결과를 반환할 수 없기 때문에 사용할 수 없다.

이렇게 No Offset 기법을 사용할 수 없는 경우들이 있다.

이러한 경우에는 아래에서 소개할 기법을 활용하며 개선할 수 있다.

## 커버링 인덱스 방식을 활용한 개선

커버링 인덱스란, 쿼리를 충족시키는 데 필요한 모든 데이터를 갖고 있는 인덱스를 이야기 한다.

> SELECT, WHERE, ORDER BY, GROUP BY 등에 사용되는 모든 컬럼이 인덱스의 구성요소인 경우를 얘기합니다.
> 

이렇게 소개되는 모습을 확인할 수 있다.

```sql
select * from item
where 조건문
order by id desc
offset 페이지번호
limit 페이지사이즈
```

이러한 기존의 코드를 다음과 같이 변경하는 방식이다.

```sql
select *
from item as i
join (select id
				from item
				where 조건문
				order by id desc
				offset 페이지번호
				limit 페이지사이즈) as temp
				on temp.id = i.id
```

이때, 커버링 인덱스가 사용된 부분은 `join` 절의 부분이다.

즉, 아래의 쿼리가 커버링 인덱스가 사용된 부분이다.

```sql
select id
from item
where 조건문
order by id desc
offset 페이지번호
limit 페이지사이즈
```

위의 쿼리에서는 select 절을 비롯해, order by, where 등 모든 쿼리 내 모든 항목이 인덱스 컬럼으로만 이루어지게 해야한다.

그렇게 하여 인덱스 내부에서 쿼리가 완성될 수 있도록 하는 방식이다.

그렇다면 이러한 커버링 인덱스를 사용하면 왜 빨라지는 것일까.

그것은 위에서 설명한 기존의 페이징 방식에서 문제가 되는 부분을 해결하기 때문이다.

기존의 방식에서는 후반의 페이지를 조회하는 경우 이전에 페이지를 사용하지 않지만 모두 읽고, 버린다고 했었다.

즉, 사용하지 않는 데이터지만 내부의 값을 읽는 시간이 소모된다.

따라서 커버링 인덱스를 사용하게 되면, 불필요한 데이터를 읽어들이는 부분을 없애고, 인덱스 기반으로 빠르게 원하는 페이지까지 이동한 후 해당 페이지 부터 원하는 모든 데이터를 읽어오도록 하는 것이다.

### Querydsl에서의 문제점

하지만 이러한 커버링 인덱스를 Querydsl에서 사용하기 위해서는 쿼리를 두개 작성해야 한다.

왜냐하면, JPQL 자체에서 from절에 대해 서브쿼리를 지원하지 않기 때문이다.

따라서 이러한 문제를 해결하기 위해 다음과 같이 작성하면 된다.

```sql
List<Long> ids = queryFactory
					.select(item.id)
					.from(item)
					.where(item.name.like(input+"%")
					.orderBy(item.id.desc())
					.limit(pageSize)
					.offset(pageNo * pageSize)
					.fetch();
	
if (CollectionUtils.isEmpty(ids)) {
		return new ArrayList<>();
}

return qeuryFactory
				.select(~~~)
				.from(item)
				.where(item.id.in(ids))
				.orderBy(item.id.desc())
				.fetch()
```

이렇게 사용하게 되면, 원하던 커버링 인덱스의 방식을 따라 작성할 수 있다.

### 문제점

기존의 페이징 처리 기법보다 훨씬 좋은 성능을 제공할 수 있는 커버링 인덱스 이지만, 단점이 존재한다.

No Offset을 사용할 수 없다면 커버링 인덱스를 사용하는게 좋을텐데, 다만 인덱스에 대해 조절이 필요하다.

왜냐하면 커버링 인덱스는 위에서 설명한 바와 같이 쿼리의 모든 항목이 인덱스에 포함되어야 하기 때문에 느린 쿼리가 발생할 때 마다 인덱스가 신규 생성될 수 있다.

성능은 No Offset이 더 좋지만, 상황에 따라서 커버링 인덱스를 사용해야 하는 경우가 있을수도 있다.

커버링 인덱스를 사용하는 경우 인덱스에 대한 주의가 필요할 것이다!

---

## 페이징 성능 개선 적용

지금까지, No Offset과 커버링 인덱스를 활용한 페이징 처리 성능 개선을 알아보았다.

이러한 내용을 기반으로 기존의 대학원 김선배 서비스에서 사용중인 페이징 처리에 대해서 개선을 해보고자 한다.

그렇다면 우선 어떤 방식을 사용해서 개선을 진행할 것인지 결정해야 한다.

No Offset을 사용하기 위해서는 위에서 살펴본 것과 같이 무한 스크롤과 같은 경우에 적용하기 용이하고, 숫자를 눌러서 이동하는 페이징 처리의 경우 해당 기술을 사용할 수 없다.

마침 우리의 서비스는 선배 리스트를 무한 스크롤 형태로 제공되고 있다.

따라서 No Offset 방식을 사용하는 것이 첫번째 옵션이었다.

하지만 우리의 경우 정렬 조건이 조회수와 닉네임의 사전순인데 이를 No Offset에 어떻게 적용 시킬 수 있을지와 현재 API는 몇번 페이지인지를 받고 있는데, 이것이 아닌 마지막 조회 값을 받는 그런식으로 변경을 해야 하기 때문에 프론트가 기존의 API에 대해 변경을 할 수 있는지가 결정에 영향을 끼치게 되었다.

위와 같은 부분을 고려하였을 때 현재 프론트가 기존의 API를 변경하지 않고 그대로 사용하면서 백에서 SQL 코드 수정을 통해 성능을 개선할 수 있는 커버링 인덱스 기법을 사용하게 되었다.

우선, 기존의 Querydsl 코드는 다음과 같았다.

```java
@Override
public Page<Senior> findAllBySearchSenior(String search, String sort, Pageable pageable) {
    List<Senior> seniors = queryFactory.selectFrom(senior)
            .distinct()
            .leftJoin(senior.user, user)
            .fetchJoin()
            .where(
                    senior.info.totalInfo.like("%" + search + "%")
                            .or(senior.user.nickName.like("%" + search + "%")),
                    senior.user.isDelete.eq(FALSE)
            )
            .orderBy(orderSpecifier(sort))
            .orderBy(senior.user.nickName.asc()).
            offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

    ...
	
		return ~~
}

...

@Override
public Page<Senior> findAllByFieldSenior(String field, String postgradu, Pageable pageable) {
    List<Senior> seniors = queryFactory.selectFrom(senior)
            .distinct()
            .leftJoin(senior.user, user)
            .fetchJoin()
            .where(
                    fieldSpecifier(field),
                    postgraduSpecifier(postgradu),
                    senior.user.isDelete.eq(FALSE)
            )
            .orderBy(senior.hit.desc())
            .orderBy(senior.user.nickName.asc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();
	
		...
		
		return ~~
}
```

보이는 것과 같이, 일반적인 쿼리문에 Page단위로 조회하기 위해 offset과 limit을 사용하고 있다.

하지만, 이때 Senior엔티티를 조회하기 때문에 사용하지 않는 앞페이지의 데이터 또한 읽으며 성능을 낭비하게 된다.

이제, 커버링 인덱스를 적용하여 인덱스만 읽고 읽어온 인덱스를 기반으로 조회하도록 할 것이다.

```java
@Override
public Page<Senior> findAllBySearchSenior(String search, String sort, Pageable pageable) {
    List<Tuple> results = queryFactory.select(senior.seniorId, senior.user.nickName, senior.hit)
            .from(senior)
            .distinct()
            .leftJoin(senior.user, user)
            .where(
                    senior.info.totalInfo.like("%" + search + "%")
                            .or(senior.user.nickName.like("%" + search + "%")),
                    senior.user.isDelete.eq(FALSE)
            )
            .orderBy(orderSpecifier(sort))
            .orderBy(senior.user.nickName.asc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

    if (CollectionUtils.isEmpty(results)) {
        return new PageImpl<>(new ArrayList<>(), pageable, 0);
    }

    List<Senior> seniors = queryFactory.selectFrom(senior)
            .where(senior.seniorId.in(results.stream()
                    .map(tuple -> tuple.get(senior.seniorId))
                    .toList()))
            .leftJoin(senior.user, user)
            .fetchJoin()
            .orderBy(orderSpecifier(sort))
            .orderBy(senior.user.nickName.asc())
            .fetch();

		...
		
		return ~~
}

@Override
public Page<Senior> findAllByFieldSenior(String field, String postgradu, Pageable pageable) {
    List<Tuple> results = queryFactory.select(senior.seniorId, senior.user.nickName, senior.hit)
            .from(senior)
            .distinct()
            .leftJoin(senior.user, user)
            .where(
                    fieldSpecifier(field),
                    postgraduSpecifier(postgradu),
                    senior.user.isDelete.eq(FALSE)
            )
            .orderBy(senior.hit.desc())
            .orderBy(senior.user.nickName.asc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

    if (CollectionUtils.isEmpty(results)) {
        return new PageImpl<>(new ArrayList<>(), pageable, 0);
    }

    List<Senior> seniors = queryFactory.selectFrom(senior)
            .where(senior.seniorId.in(results.stream()
                    .map(tuple -> tuple.get(senior.seniorId))
                    .toList()))
            .leftJoin(senior.user, user)
            .fetchJoin()
            .orderBy(senior.hit.desc())
            .orderBy(senior.user.nickName.asc())
            .fetch();

		...
		
		return ~~
}
```

이렇게 기존의 코드를 변경하게 되었고, offset과 limit을 사용하는 부분에서는 사용할 인덱스 및 필요한 부분만 조회하고, 조회한 결과로 얻은 인덱스를 기반으로 필요한 전체 데이터를 조회하는 방식으로 개선하였다.

이를 통해 다음과 같은 개선의 성과를 얻게 되었다.

## 성과

**(데이터 24000개 기준 2400번 페이지 조회시)**

### 선배 검색을 통한 페이징 처리

- 기존 : 261ms
- **개선 : 143ms → 약 82%**

### 연구 분야 및 대학원 필터를 통한 페이징 처리

- 기존 : 255ms
- **개선 : 121ms → 약 110%**