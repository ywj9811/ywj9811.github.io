---
title: JPA 시작
date: '2022-12-06'
tags: ['spring boot', 'JPA', '인프런', '김영한', '기술']
draft: false
summary: JPA란 무엇일까? Java Persistence API 를 의미하는 것으로 자바 진영의 대표 ORM 기술 표준이다.
---

# JPA 시작

## **JPA란 무엇일까?**

**Java Persistence API 를 의미하는 것으로 자바 진영의 대표 ORM 기술 표준이다.**

## **ORM이란 무엇일까?**

- **Objet-relational mapping(객체 관계 매핑)**
- **객체는 객체대로 설계**
- **관계형 데이터 베이스는 관계형 데이터베이스대로 설계**
- **ORM 프레임워크가 중간에서 매핑**
- **대중적인 언어에는 대부분 ORM 기술이 존재**

**ORM은 위의 특징을 가지고 있다.**
![JPAtec1](/static/images/JPAtec1.png)
**JPA는 위와 같은 위치에서 동작한다.**

---

## **그렇다면 JPA를 왜 사용해야 할까**

- **SQL 중심적인 개발에서 객체 중심으로 개발**
- **생산성**
  - **저장 : jpa.persitst(member)**
  - **조회 : Member member = jpa.find(memberId)**
  - **수정 : member.setName(”변경할 이름”)**
  - **삭제 : jpa.remove(member)**
    **직접 SQL을 작성하지 않고 위와 같은 방식으로 간단하게 처리할 수 있다.**
- **유지보수**
  - **기존 SQL의 경우 필드가 변경될 경우 모든 SQL을 수정해야 하는 등 복잡하다.**
  - **하지만 JPA의 경우 필드를 추가하기만 하면 SQL은 자동으로 수정되게 된다.**
- **성능**
  - **1차 캐시**
    - **1차 캐시 방식을 통해서 SQL을 한번만 실행하여 조회 성능을 향상 시킬 수 있다.**
  - **트랜잭션을 지원하는 쓰기 지연**
    - **트랜잭션을 커밋할 때 까지 INSERT SQL을 모아두고 한번에 처리할 수 있다.**
    - **UPDATE, DELETE와 같은 방식 또한 한번에 처리할 수 있다.**
- **표준**

**위와 같은 이점을 JPA를 사용하므로 써 얻을 수 있다.**

---

# **JPA 시작을 위한 설정**

## **1. 라이브러리 추가 및 설정**

```java
//JPA, 스프링 데이터 JPA 추가
implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
```

**`build.gradle`에 위의 라이브러리를 추가해주면 사용할 수 있다.**

> **참고로 jpa와 mybatis를 위한 라이브러리는 jdbc를 이미 포함하고 있기 때문에 jdbc를 따로 준비할 필요는 없다**

**그리고**

```sql
#JPA log
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE
```

**위의 코드를 `applictaion.properties`에 추가해 준다.**

**`org.hibernate.SQL=DEBUG` 이것은 하이버네이트가 생성하고 실행하는 SQL을 확인할 수 있게 해준다.**

**`org.hibernate.type.descriptor.sql.Basic.Binder=TRACE` 이것은 SQL에 바인딩 되는 파라미터를 확인할 수 있게 해준다.**

**만약 `spring.jpa.show-sql=true` 이 설정을 사용하게 되면 SQL을 `System.out` 을 통해서 출력시키기 되는데 위에 우리가 추가한 설정은 로그를 통해 확인해주기 때문에 위의 방식을 사용하도록 하자.**

## **2. ORM 매핑**

**JPA에서 가장 중요한 부분은 객체와 테이블을 매핑하는 것이다.**

**JPA가 제공하는 어노테이션을 사용해서 Item 객체와 테이블을 매핑해보자**

```java
@Data
@Entity
public class Item {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_name", length = 10)
    private String itemName;
    /**
     * 사실 itemName의 경우 item_name과
     * 자동으로 매칭이 되기 때문에 @Column은 생략해도 상관없다.
     */
    private Integer price;
    private Integer quantity;

    public Item() {
        /**
         * JPA는 기본 생성자가 필수이다 (public 혹은 protected)
         */
    }

    public Item(String itemName, Integer price, Integer quantity) {
        this.itemName = itemName;
        this.price = price;
        this.quantity = quantity;
    }
}
```

**`@Entity` : JPA가 사용하는 객체라는 뜻으로 이 어노테이션이 있어야 JPA가 인식할 수 있다.**

**이러한 객체를 JPA에서는 엔티티라고 한다. (DB의 테이블과 같은 이름을 가지도록 하자 혹은 직접 지정해줄 수 있기도 하다)**

**`@Id` : 테이블의 PK와 해당 필드를 매핑한다.**

**`@GeneratedValue(strategy = GenerationType.IDENTITY)` : PK 생성 값을 데이터 베이스에서 생성하는 IDENTITY 방식을 사용한다는 것이다(auto increment)**

**`@Column` : 객체의 필드를 테이블의 컬럼과 매핑한다.**

- **`@Column(name = "item_name", length = 10)` 이렇게 지정하게 되면 itemName이 item_name이라고 인식되게 된다.**
- **하지만 카멜케이스와 언더스코어 방식은 자동으로 매칭이 되기 때문에 현재는 사용하지 않아도 된다.**
- **`length = 10` : JPA 의 매핑 정보로 DDL(create table)도 생성할 수 있는데, 그때 컬럼의 길이 값으로 활용되게 된다(varchar(10)) 이런식으로 사용**

**💡JPA는 public 혹은 protected 의 기본 생성자가 필수이다!💡**

```java
public Item() {}
```

**여기까지 기본 매핑 작업을 마치게 된다.**

## **3. Repository 작성**

**이제 매핑 작업을 완료 했으니 본격적으로 JPA를 사용하는 코드를 작성해야 한다.**

```java
@Slf4j
@Repository
@Transactional
@RequiredArgsConstructor
public class JpaItemRepository implements ItemRepository {

    private final EntityManager em;

    @Override
    public Item save(Item item) {
        em.persist(item);
        return item;
    }

    @Override
    public void update(Long itemId, ItemUpdateDto updateParam) {
        Item findItem = em.find(Item.class, itemId);
        findItem.setItemName(updateParam.getItemName());
        findItem.setPrice(updateParam.getPrice());
        findItem.setQuantity(updateParam.getQuantity());
        //여기서 아무것도 안해줘도 위의 코드만으로 update 쿼리가 작동함
    }

    @Override
    public Optional<Item> findById(Long id) {
        Item item = em.find(Item.class, id);
        //Type, 넘겨줄 값 순서대로 넣어주면 된다.
        return Optional.ofNullable(item);
    }

    @Override
    public List<Item> findAll(ItemSearchCond cond) {
        String jpql = "select i from Item i";
        //Item i 를 통해서 별칭을 i로 등록한 상태임(주의)
        //즉 select Item from Item 이러한 의미
        //테이블을 대상으로 하는 것이 아닌 Entity를 대상으로

        Integer maxPrice = cond.getMaxPrice();
        String itemName = cond.getItemName();
        if (StringUtils.hasText(itemName) || maxPrice != null) {
            jpql += " where";
        }
        boolean andFlag = false;
        if (StringUtils.hasText(itemName)) {
            jpql += " i.itemName like concat('%',:itemName,'%')";
            andFlag = true;
        }
        if (maxPrice != null) {
            if (andFlag) {
                jpql += " and";
            }
            jpql += " i.price <= :maxPrice";
        }
        log.info("jpql={}", jpql);
        TypedQuery<Item> query = em.createQuery(jpql, Item.class);
        if (StringUtils.hasText(itemName)) {
            query.setParameter("itemName", itemName);
        }
        if (maxPrice != null) {
            query.setParameter("maxPrice", maxPrice);
        }
        return query.getResultList();
    }
    /**
     * 현재 문제 : 동적 쿼리를 작성하기 매우매우 불편
     */
}
```

**우선 `private final EntityManager em` : 이는 스프링을 통해 엔티티 매니저를 주입받아야 하는 것이다.**

**이는 JPA의 모든 동작이 해당 매니저를 통해서 이루어지기 때문이다.**

**`@Transactional` : JPA의 모든 데이터 변경(등록, 수정, 삭제)는 트랜잭션 안에서 이루어져야 하기 때문에 추가하도록 하는데**

> **하지만 원래 트랜잭션의 경우 레포지토리가 아닌 서비스 계층에서 걸어주는 것이 맞다!**

**본격적으로 JPA의 실행을 살펴보면 놀라운 점을 확인할 수 있다.**

- **`INSERT` 의 경우**
  `em.persit(item)` **이렇게 한줄이면 Item 객체가 자동으로 Insert가 되게 된다.**
  **즉 `persist()` 메소드를 사용하면 된다.**
  **물론 SQL문 또한 자동으로 작성되어 처리되게 된다.**
- **`SELECT` 의 경우**
  **`em.find(Item.class, id);` 을 통해 해당하는 데이터를 조회할 수 있다.**
- **`UPDATE` 의 경우**
  **우선 `Item findItem = em.find(Item.class, itemId);` 의 조회를 통해 객체를 생성하고 해당 객체에 set을 해주면 자동으로 update가 된다.**
- **동적 쿼리의 경우 아직은 복잡한 방식으로 진행이 된다.**
  **하지만 이후에 추가적인 요소를 통해 간편하게 만들 수 있으니 추후에 살펴보도록 하자.**

**이후에 `Bean` 설정을 마치고 실행하면 동작하는 것을 확인할 수 있다.**

---

## JPA 예외 변환

**JPA의 경우 예외가 발생하면 JPA 예외가 발생한다.**

**`EntityManager` 는 순수한 JPA 기술이라 스프링과 관련이 없다.**

**따라서 여기서 예외가 발생하게 되면 JPA관련 예외를 발생 시키게 된다.**

**JPA의 경우 `PersistenceException` 과 그 하위 예외를 발생시킨다.**

**➕ 추가로 `IllegalStateException` 과 `IllegalArgumentException` 을 발생시킬 수 있다.**

---

**그렇다면 JPA 예외를 스프링 예외 추상화(`DataAccessException` )로 어떻게 변환하는 것일까**

**💡 `@Repository` 어노테이션에 의해 변환할 수 있다.**

**`@Repository` 에 대해 살펴보도록 하자.**

- **`@Repository` 가 붙은 클래스는 컴포넌트 스캔의 대상이 된다.**
- **`@Repository` 가 붙은 클래스는 예외 변환 AOP의 적용 대상이 된다.**
  - **스프링과 JPA를 함께 사용하는 경우 스프링은 JPA 예외 변환기 (PersistenceExceptionTranslator)를 등록한다.**
  - **예외 변환 AOP 프록시는 JPA 관련 예외가 발생하면 JPA 예외 변환기를 통해 발생한 예외를 스프링 데이터 접근 예외로 변환한다.**
    ![JPAaop](/static/images/JPAaop.png)
    **따라서 위와 같이 중간에 AOP Proxy를 통해서 예외를 변환시키게 된다.**
