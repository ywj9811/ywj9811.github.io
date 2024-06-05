---
title: SpringBatch QuerydslItemReader 라이브러리 만들기
date: '2024-06-05'
tags: ['spring batch','기술']
draft: false
summary: SpringBatch QuerydslItemReader 라이브러리 만들기
---

참고 : https://jojoldu.tistory.com/473 (현 인프런 CTO 님, 이동욱 개발자 블로그)

## 서론

개인적으로, SpringBatch에서 제공해주는 ItemReader의 경우 모두 텍스트 기반으로 하드 코딩 해야한다는 점이 큰 불만이었다.

현재는 JdbcItemReader를 사용하고 있는데, 많은 회사에서 QuerydslItemReader를 직접 구현하여 사용하고 있는 것을 확인하고 라이브러리가 존재하면 가져다가 사용할까? 싶기도 했지만 대부분이 SpringBatch 4 를 기반으로 작성되어 있고 SpringBoot2.xx 기반이라 오류가 발생하기에, 공부도 할겸, SpringBatch 5와 SpringBoot3.xx에 맞게 직접 만들어서 라이브러리로 만들어볼까 한다.

## QueryDslItemReader

![Untitled](/static/images/library1.png)

우선, 기본적으로 Chunk 지향 구조는 위와 같이 동작한다.

- `doReadPage()`
    - `page(offset)` 와`pageSize(limit)` 을 통해서 데이터를 가지고 온다.
- `read()`
    - `doReadPage()` 로 가져온 데이터들을 하나씩 processor로 전달한다.
    - 만약 `doReadPage()` 로 가져온 데이터를 모두 processor로 전달하면, 다음 페이지를 가져오도록 다시 `doReadPage()` 를 호출한다.

위의 내용을 알아둔 채 진행하도록 하자.

SpringBatch의 AbstractPagingItemReader를 구현하는 QueryDslItemReader를 만들어 사용할 것인데,

이미 AbstractPagingItemReader를 구현하는 JpaPagingItemReader가 있으니 이를 수정하여 만들 것이다.

JpaPagingItemReader 에서 JPQL이 수행되는 부분이 `doReadPage()` 인데, 이 부분을 Querydsl의 쿼리를 수행하도록 변경하면 된다.

```java
...

	@Override
	@SuppressWarnings("unchecked")
	protected void doReadPage() {

		EntityTransaction tx = null;

		if (transacted) {
			tx = entityManager.getTransaction();
			tx.begin();

			entityManager.flush();
			entityManager.clear();
		} // end if

		Query query = createQuery().setFirstResult(getPage() * getPageSize()).setMaxResults(getPageSize());

		if (parameterValues != null) {
			for (Map.Entry<String, Object> me : parameterValues.entrySet()) {
				query.setParameter(me.getKey(), me.getValue());
			}
		}

		if (results == null) {
			results = new CopyOnWriteArrayList<>();
		}
		else {
			results.clear();
		}

		if (!transacted) {
			List<T> queryResult = query.getResultList();
			for (T entity : queryResult) {
				entityManager.detach(entity);
				results.add(entity);
			} // end if
		}
		else {
			results.addAll(query.getResultList());
			tx.commit();
		} // end if
	}

...
```

이제, 이 JpaPagingItemReader를 수정하여 QueryDslPagingItemReader를 만들어 보자.

```java
public class QueryDslPagingItemReader<T> extends AbstractPagingItemReader<T> {
    protected final Map<String, Object> jpaPropertyMap = new HashMap<>();
    protected EntityManagerFactory entityManagerFactory;
    protected EntityManager entityManager;
    protected Function<JPAQueryFactory, JPAQuery<T>> queryFunction;

    private boolean transacted = true;// default value

    public QueryDslPagingItemReader() {
        setName(ClassUtils.getShortName(QueryDslPagingItemReader.class));
    }

    public QueryDslPagingItemReader(EntityManagerFactory entityManagerFactory, int pageSize,
                                    Function<JPAQueryFactory, JPAQuery<T>> queryFunction) {
        this();
        this.entityManagerFactory = entityManagerFactory;
        this.queryFunction = queryFunction;
        setPageSize(pageSize);
    }

    /**
     * Create a query using an appropriate query provider (entityManager OR
     * queryProvider).
     */
    /**
     * 이 부분이 private이기 때문에 새롭게 작성하게 된 것! override할 수 없어서
     */
//    private Query createQuery() {
//        if (queryProvider == null) {
//            return entityManager.createQuery(queryString);
//        }
//        else {
//            return queryProvider.createQuery();
//        }
//    }
    /**
     * By default (true) the EntityTransaction will be started and committed around the
     * read. Can be overridden (false) in cases where the JPA implementation doesn't
     * support a particular transaction. (e.g. Hibernate with a JTA transaction). NOTE:
     * may cause problems in guaranteeing the object consistency in the
     * EntityManagerFactory.
     * @param transacted indicator
     */
    public void setTransacted(boolean transacted) {
        this.transacted = transacted;
    }

    @Override
    protected void doOpen() throws Exception {
        super.doOpen();

        entityManager = entityManagerFactory.createEntityManager(jpaPropertyMap);
        if (entityManager == null) {
            throw new DataAccessResourceFailureException("Unable to obtain an EntityManager");
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    protected void doReadPage() {
        clearIfTransacted();

        JPQLQuery<T> query = createQuery()
                .offset(getPage() * getPageSize())
                .limit(getPageSize());

        initResults();

        fetchQuery(query);
    }

    protected void clearIfTransacted() {
        if (transacted) {
            entityManager.clear();
        }
    }

    protected JPAQuery<T> createQuery() {
        JPAQueryFactory queryFactory = new JPAQueryFactory(entityManager);
        return queryFunction.apply(queryFactory);
    }

    protected void initResults() {
        if (CollectionUtils.isEmpty(results)) {
            results = new ArrayList<>();
        } else {
            results.clear();
        }
    }

    protected void fetchQuery(JPQLQuery<T> query) {
        if (!transacted) {
            List<T> queryResult = query.fetch();
            for (T entity : queryResult) {
                entityManager.detach(entity);
                results.add(entity);
            }
        } else {
            results.addAll(query.fetch());
        }
    }

    @Override
    protected void doClose() throws Exception {
        entityManager.close();
        super.doClose();
    }
}
```

우선, Querydsl에서 람다 표현식으로 쿼리를 받기 위해 `Function<JPAQueryFactory, JPAQuery<T>>` 를 사용하였고, 이를 통해 JPAQueryFactory를 JPAQuery로 만들 수 있도록 하여 Reader에서 람다 표현식으로 원하는 쿼리를 만들 수 있도록 되어있다.

이제 이어서 메소드를 살펴보자.

- `doOpen()`
    
    ```java
    @Override
    protected void doOpen() throws Exception {
        super.doOpen();
    
        entityManager = entityManagerFactory.createEntityManager(jpaPropertyMap);
        if (entityManager == null) {
            throw new DataAccessResourceFailureException("Unable to obtain an EntityManager");
        }
    }
    ```
    
    - SpringBatch가 시작되면, Reader를 세팅하며 `doOpen()` 을 호출하면서 EntityManager가 세팅된다.
- `doReadPage()`
    
    ```java
    @Override
    protected void doReadPage() {
        clearIfTransacted();
    
        JPAQuery<T> query = createQuery()
                .offset(getPage() * getPageSize())
                .limit(getPageSize());
    
        initResults();
    
        fetchQuery(query);
    }
    
    protected void clearIfTransacted() {
        if (transacted) {
            entityManager.clear();
        }
    }
    
    protected JPAQuery<T> createQuery() {
        JPAQueryFactory queryFactory = new JPAQueryFactory(entityManager);
        return queryFunction.apply(queryFactory);
    }
    
    protected void initResults() {
        if (CollectionUtils.isEmpty(results)) {
            results = new ArrayList<>();
        } else {
            results.clear();
        }
    }
    
    protected void fetchQuery(JPQLQuery<T> query) {
        if (!transacted) {
            List<T> queryResult = query.fetch();
            for (T entity : queryResult) {
                entityManager.detach(entity);
                results.add(entity);
            }
        } else {
            results.addAll(query.fetch());
        }
    }
    ```
    
    - 이어서 `doReadPage()` 가 수행되는데, 현재의 페이지 * pageSize 만큼을 offset으로 하며 pageSize만큼만 조회한다.
        
        그리고, `clearIfTransacted()` 가 뭔가 허전한 이유는 아래 자료를 참고하면 된다.
        
        https://jojoldu.tistory.com/414 
        (기존의 코드는 fetchJoin이 적용되지 않아 n+1 문제가 발생한다고 한다.)
        

이제 QueryDslItemReader를 만들었으니 사용할 수 있다.

```java
@Bean
public QueryDslPagingItemReader<CreateSalary> salaryReader() {
    return new QueryDslPagingItemReader<Salary>(entityManagerFactory, CHUNK_SIZE, queryFactory ->
             queryFactory.selectFrom(salary)
                     .where(salary.salaryId.eq(1L))
		);
}
```

## QueryDslZeroPagingItemReader

SpringBatch에서 PagingItemReader 사용시 페이징 문제가 발생하는 경우가 있다.

특정 조건을 걸어놓고 조회를 하는데, processor혹은 writer에서 해당 조건에 걸리게 수정되는 경우다.

이를 해결하기 위해서는 https://www.ywj9811.vercel.app/blog/SpringBatchNoPaging 블로그에 포스팅 한것과 같이 계속 offset을 0으로 유지해주면 된다.

그렇게 QueryDslZeroPagingItemReader도 만들어서 사용할 수 있는데, 방법은 간다하게 `doReadPage()` 만 수정해주면 된다.

```java
public class QueryDslZeroPagingItemReader<T> extends QueryDslPagingItemReader<T> {

    public QueryDslZeroPagingItemReader() {
        super();
        setName(ClassUtils.getShortName(QueryDslZeroPagingItemReader.class));
    }

    public QueryDslZeroPagingItemReader(EntityManagerFactory entityManagerFactory,
                                        int pageSize,
                                        Function<JPAQueryFactory, JPAQuery<T>> queryFunction) {
        this();
        setTransacted(true);
        super.entityManagerFactory = entityManagerFactory;
        super.queryFunction = queryFunction;
        setPageSize(pageSize);
    }

    @Override
    @SuppressWarnings("unchecked")
    protected void doReadPage() {

        JPQLQuery<T> query = createQuery()
                .offset(0)
                .limit(getPageSize());

        initResults();

        fetchQuery(query);
    }
}
```

## QueryDslNoOffsetPagingItemReader

대부분의 RDBMS도 그렇고, 현재 사용중인 Mysql은 페이징이 뒤로 갈수록 느려진다는 특징이 있다.

```sql
select *
FROM members
WHERE 조건문
ORDER BY id DESC
OFFSET 페이지 번호
LIMIT 페이지 사이즈 
```

이유는 아래와 같이, 뒷 페이지를 읽기 위해서는 앞에서 읽었던 행들을 사용하지 않더라도 읽어야한다는 특징 때문이다.

결국 offset이 10000이고, limit이 50이면, 10050개를 읽어야 하는 것이다.

![Untitled](/static/images/library2.png)

이를 해결하기 위해서 커버링 인덱스를 사용하는 방식과, offset을 제거하는 방식이 있다.

### 커버링 인덱스 방식

이는 기존의 SQL을 다음과 같이 변경하여 사용하는 방식이다.

```sql
SELECT *
FROM members as m
JOIN (
	SELECT id
	FROM members
	WHERE 조건문
	ORDER BY id DESC
	OFFSET 페이지번호
	LIMIT 페이지사이즈
) as temp 
ON temp.id = m.id
```

이는 어째서 이득을 가져오는 것일까.

뒷 페이지를 읽을 때 성능이슈를 발생시키는 부분은, **인덱스를 통해 검색을 하더라도 대상이 되는 행을 읽어오기 위해 나머지 값에 대한 데이터 블록에 접근하는 시간이 오래걸리는 부분이다.**

하지만, 커버링 인덱스를 사용하게 되면 위의 쿼리와 같이 사용하게 되는데 이는 인덱스만 조회를 하고, 해당 인덱스를 기반으로 나머지 데이터를 얻을 수 있기 때문에 성능이 개선된다.

![Untitled](/static/images/library3.png)

### offset을 제거하는 방식

```sql
SELECT * 
FROM members
WHERE 조건문
AND id < 마지막조회 ID #직전 조회 결과의 마지막 id
ORDER BY id DESC
LIMIT 페이지 사이즈 
```

offset을 제거하는 방식은 말 그대로 offset을 제거하고 쿼리를 작성하는 방식이다.

위와 같이 id 기반으로 범위를 정해놓고 limit만 사용한다면 offset을 사용할때와 다르게 특정 위치부터 읽기 시작하기 때문에 기존의 문제를 해결할 수 있다.

### offset제거 방식 사용

QueryDslNoOffsetPagingItemReader 이름에서 알 수 있듯 offset을 제거하는 방식을 사용한다.

이유는 다음과 같다.

- **JPQL에서는 from절에 서브쿼리를 지원하지 않는다..!**

물론, UI상 페이징 버튼이 필요한 경우, 마지막 조회 ID를 알 수 없는 경우 등등 offset제거의 버전을 사용할 수 없는 경우도 있지만, 현재 상황에서는 고려하지 않아도 되는 상황이라 상관은 없을 것 같다.

(위와 같이 불가능한 경우는 QueryDslNoOffsetPagingItemReader는 사용하지 못할 수 있다.)

이를 위해서는 기존의 페이징 쿼리에 다음과 같은 쿼리가 자동으로 추가되어야 한다.

```sql
AND id < 마지막조회ID # 직전 조회 결과의 마지막 id
ORDER BY id DESC
LIMIT 페이지사이즈
```

- offset이 제거된 limit 쿼리
- 조회된 페이지의 마지막 id 값 캐싱
- 캐시된 마지막 id값을 다음 페이지 쿼리 조건문에 추가
- 정렬 기준에 따라 조회 조건에 마지막 id의 조건이 자동 포함
    - ASC : id > 마지막 id
    - DESC : id < 마지막 id

그리고 id는 형식상 id로 표현한 것으로, 숫자 이외에 문자열 또한 사용될 수 있어야 한다.

이를 위해서 몇가지 클래스를 추가로 만들어 필요에 따라 알맞은 조건을 만들 수 있도록 해야한다.

- QueryDslNoOffsetOptions
    - 어떤 필드를 기준으로 사용할지 결정하는 추상 클래스
    - NumberOptions와 StringOptions 처럼 하위 구현체를 만들어 사용
- Expression
    - where, order by 조건을 만들어주는 클래스
    - 정렬 조건이 asc인지 desc인지에 따라 where에서 조건을 설정

이러한 내용을 고려한채 우선, 완성된 QueryDslNoOffsetPagingItemReader를 보자.

```java
public class QueryDslNoOffsetPagingItemReader<T> extends QueryDslPagingItemReader<T> {

    private QueryDslNoOffsetOptions<T> options;

    private QueryDslNoOffsetPagingItemReader() {
        super();
        setName(ClassUtils.getShortName(QueryDslNoOffsetPagingItemReader.class));
    }

    public QueryDslNoOffsetPagingItemReader(EntityManagerFactory entityManagerFactory,
                                            int pageSize,
                                            QueryDslNoOffsetOptions<T> options,
                                            Function<JPAQueryFactory, JPAQuery<T>> queryFunction) {
        super(entityManagerFactory, pageSize, queryFunction);
        setName(ClassUtils.getShortName(QueryDslNoOffsetPagingItemReader.class));
        this.options = options;
    }

    @Override
    @SuppressWarnings("unchecked")
    protected void doReadPage() {
        JPQLQuery<T> query = createQuery().limit(getPageSize());

        initResults();

        fetchQuery(query);

        resetCurrentIdIfNotLastPage();
    }

    @Override
    protected JPAQuery<T> createQuery() {
        JPAQueryFactory queryFactory = new JPAQueryFactory(entityManager);
        JPAQuery<T> query = queryFunction.apply(queryFactory);
        options.initKeys(query, getPage()); // 제일 첫번째 페이징시 시작해야할 ID 찾기

        return options.createQuery(query, getPage());
    }

    private void resetCurrentIdIfNotLastPage() {
        if (isNotEmptyResults()) {
            options.resetCurrentId(getLastItem());
        }
    }

    // 조회결과가 Empty이면 results에 null이 담긴다
    private boolean isNotEmptyResults() {
        return !CollectionUtils.isEmpty(results) && results.get(0) != null;
    }

    private T getLastItem() {
        return results.get(results.size() - 1);
    }
}
```

여기서 보면, `createQuery()` 가 좀 다르다.

`opions.initKeys(query, getPage())` 를 호출하고 있는데, 제일 첫번째 페이징시 시작해야할 ID를 찾는 작업이다.

```java
@Override
public void initKeys(JPAQuery<T> query, int page) {
    if(page == 0) {
        initFirstId(query);
        initLastId(query);

        log.debug("First Key= {}, Last Key = {}", currentId, lastId);
    }
}

@Override
protected void initFirstId(JPAQuery<T> query) {
    JPAQuery<T> clone = query.clone();
    boolean isGroupByQuery = isGroupByQuery(clone);

    if(isGroupByQuery) {
        currentId = clone
                .select(field)
                .orderBy(expression.isAsc()? field.asc() : field.desc())
                .fetchFirst();
    } else {
        currentId = clone
                .select(expression.isAsc()? field.min(): field.max())
                .fetchFirst();
    }

}

@Override
protected void initLastId(JPAQuery<T> query) {
    JPAQuery<T> clone = query.clone();
    boolean isGroupByQuery = isGroupByQuery(clone);

    if(isGroupByQuery) {
        lastId = clone
                .select(field)
                .orderBy(expression.isAsc()? field.desc() : field.asc())
                .fetchFirst();
    } else {
        lastId = clone
                .select(expression.isAsc()? field.max(): field.min())
                .fetchFirst();
    }
}

@Override
public JPAQuery<T> createQuery(JPAQuery<T> query, int page) {
    if(currentId == null) {
        return query;
    }

    return query
            .where(whereExpression(page))
            .orderBy(orderExpression());
}

private BooleanExpression whereExpression(int page) {
    return expression.where(field, page, currentId)
            .and(expression.isAsc()? field.loe(lastId) : field.goe(lastId));
}

private OrderSpecifier<N> orderExpression() {
    return expression.order(field);
}

//---------------------- 아래는 추상클래스 구현 부분 ------------------------

public boolean isGroupByQuery(JPAQuery<T> query) {
    return isGroupByQuery(query.toString());
}

public boolean isGroupByQuery(String sql) {
    return sql.contains("group by");
}
```

만약 page가 0이라면, 즉 첫번째 페이지라면 두 메소드를 호출하는데, 각각 다음과 같다.

- `initFirstId()`
    - 우선, groupBy가 있는지 판단 후 정렬된 기준과 동일하게 조회하여 첫번째 조회 결과를 Id로 선택
- `initLastId()`
    - 우선, groupBy가 있는지 판단 후 정렬된 기준과 반대로 조회하여 첫번째 조회 결과를 Id로 선택

그리고, `options.createQuery()` 를 호출하는데, 여기서는 이제 currentId와 lastId를 이용하여 적절한 where과 orderBy를 만들어서 쿼리를 만들어낸다.

이후 `resetCurrentIdIfNotLastPage()` 를 호출하는데, 여기서 currentId를 저장하고, 다음 페이지에서 활용하는 것이다.

이외에도 Options클래스에서 Expression을 사용하는 것들이 보이는데, 이는 where문 작성과 order에서 정렬 기준을 선택하는데 사용하기 위한 Enum클래스들이다.

자세한 코드는 깃허브에 존재한다.

https://github.com/ywj9811/querydsl-itemreader

물론, 이동욱 님의 깃허브를 참고해도 된다! 아주 약간 빼고는 거의 같다.

https://github.com/jojoldu/spring-batch-querydsl