---
title: Spring Data JPA
date: '2022-12-07'
tags: ['spring boot', 'JPA', '인프런', '김영한', '기술']
draft: false
summary: Spring Data JPA? Spring + Spring Data JPA + JPA 이렇게 합쳐져서 사용되는 것으로 JpaRepository 인터페이스를 통해서 구현할 수 있다.
---

## **Spring Data JPA?**

**Spring + Spring Data JPA + JPA 이렇게 합쳐져서 사용되는 것으로**

**`JpaRepository 인터페이스`를 통해서 구현할 수 있다.**

**그럼 어떤 기능이 생기게 될까**

- **메소드 이름으로 쿼리 생성**
- **`@Query` 를 통해 쿼리문을 직접 작성할 수 있음**
- **`@Modifying` 을 통해 수정 쿼리도 직접 정의할 수 있음**

**이런 기능들을 가져와서 사용할 수 있게 된다!**

---

## **본격적으로 Spring Data JPA의 내부를 살펴보도록 하자**

**`JpaRepository 인터페이스`를 통해서 기본적인 CRUD 기능을 제공한다.**

![SDJPA](/static/images/SDJPA.png)

> **참고로 위 `CrudRepository`의 `findOne()` 이 `findById()` 로 변경 됐다.**

```java
public interface ItemRepository extends JpaRepository<Member, Long> {
}
```

**`JpaRepository 인터페이스` 를 상속받는 인터페이스를 만들어 내부에 추가적인 코드를 작성할 수 있는데 이때 `<>` 에는 `<Entity, EntityId>` 를 넣어주면 된다.**

**그럼 앞으로 `ItemRepository` 라는 인터페이스를 통해 `JpaRepository` 가 제공하는 기본 CRUD 기능을 모두 사용할 수 있다.**

> **개발자는 구현 클래스 없이 인터페이스만 만들면 기본 CRUD 기능을 사용할 수 있다.**

### **쿼리 메소드 기능**

**Spring Data JPA 는 인터페이스에 메소드만 적어두면, 메소드 이름을 분석해서 쿼리를 자동으로 만들고 실행해주는 기능을 제공한다.**

**순수 JPA 를 통한 레포지토리와 비교를 해보면**

```java
public List<Member> findByUsernameAndAgeGreaterThan(String username, int age) {
		return em.createQuery("select m from Member m where m.username = :username and m.age > :age")
					.setParameter("username", username)
					.setParameter("age", age)
					.getResultList();
}
```

**이렇게 다소 복잡한 내용을 작성해야 한다.**

**하지만 Spring Data JPA가 제공하는 쿼리 메소드 기능을 사용하면**

```java
public interface MemberRepository extends JpaRepository<Member, Long> {

		List<Member> findByUsernameAndAgeGreaterThan(String username, int age);

}
```

**이렇게 `findByUsernameAndAgeGreaterThan(String username, int age)` 라는 메소드 한줄로 끝이 나게 된다.**

**내용이 자동으로 작성되어 실행되는 것이다.**

> 1. **Spring Data JPA 는 메소드 이름을 분석해서 필요한 JPQL을 만들고 실행한다.**
> 2. **만들어진 JPQL은 JPA가 SQL로 번역해서 실행하게 된다.**

**이러한 순서로 작동하게 되는 것이다.**

### ⚠️물론 아무런 메소드 이름으로 지어도 되는 것은 아니고 특정 규칙을 지켜야 한다.⚠️

- **조회: `find…By` , `read…By` , `query…By` , `get…By`**
  **예:) `findHelloBy` 처럼 ...에 식별하기 위한 내용(설명)이 들어가도 된다.**
- **COUNT: `count…By` 반환타입 long**
- **EXISTS: `exists…By` 반환타입 boolean**
- **삭제: `delete…By` , `remove…By` 반환타입 long**
- **DISTINCT: `findDistinct` , `findMemberDistinctBy`**
- **LIMIT: `findFirst3` , `findFirst` , `findTop` , `findTop3`**

**쿼리 메소드 필터 조건**

> **스프링 데이터 JPA 공식 문서 참고**
>
> - [**https://docs.spring.io/spring-data/jpa/docs/current/reference/html/#repositories.limit-query-result**](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/#repositories.limit-query-result)
> - [**https://docs.spring.io/spring-data/jpa/docs/current/reference/html/#jpa.query-methods.query-creation**](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/#jpa.query-methods.query-creation)

---

### **JPQL 직접 사용**

**쿼리 메소드를 통해 자동으로 생성되는 기능을 사용해도 좋지만 만약 조건이 많아 메소드의 이름이 지나치게 길어지는 경우 JPQL을 직접 사용하기도 한다.**

**이때는 `@Qeury` 와 함께 JPQL을 작성해주면 된다.**

```java
@Query("select i from Item  i where i.itemName like :itemName and i.price <= :price")
List<Item> findItems(@Param("itemName") String itemName, @Param("price") Integer price);
```

**위와 같이 작성해서 사용하는 것으로**

**`"select i from Item i where i.itemName like :itemName and i.price <= :price"` 이렇게 파라미터로 받는 부분은 `:itemName` , `:price` 와 같이 `:` 를 붙여서 사용한다.**

**그리고 메소드에서 파라미터로 넘겨주기 위해 받는 값은 `@Param` 을 통해 꼭 지정해 주도록 한다.**

> **참고로 JPQL 대신에 SQL을 직접 작성할 수 있는 기능 또한 제공되고 있다.**

---

## **Spring Data JPA 적용하기**

**Spring Data JPA에 대해서 살펴 보았으니 제대로 적용해서 사용해 보도록 하자.**

**`build.gradle` 에 필요한 라이브러리를 추가하도록 하자.**

```java
//JPA, 스프링 데이터 JPA 추가
implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
```

**해당 라이브러리의 경우 JPA, 하이버네이트, Spring Data JPA, 그리고 JDBC 관련 기능이 모두 들어있기 때문에 한번만 추가해주면 된다.**

---

**⚠️참고⚠️**

**현재 최신 버전인 5.6.7.Final 에서 버그가 있어서**

```java
ext["hibernate.version"] = "5.6.5.Final"
```

**`build.gradle` 에 해당 코드를 추가해서 버전을 낮추도록 하자.**

---

### **JpaRepository 인터페이스 상속받는 인터페이스 생성**

```java
/**
 * <>에는 순서대로 Entity이름과 pk타입(우리는 Long을 사용중이니 Long)
 */
public interface SpringDataJpaItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByItemNameLike(String itemName);

    List<Item> findByPriceLessThanEqual(Integer price);

    /**쿼리 메소드가 너무 길어질 경우 쿼리를 직접 실행하자
     * List<Item> findByItemNameLikeAndPriceLessThanEqual(String itemName, Integer price); 이렇게 메소드로 작성하면 너무 길어짐
     * 따라서 아래와 같이 직접 쿼리문을 작성해서 실행시키자
     */
    @Query("select i from Item  i where i.itemName like :itemName and i.price <= :price")
    List<Item> findItems(@Param("itemName") String itemName, @Param("price") Integer price);
    /**
     * @Param 을 넣어주어야 쿼리문에 매칭이 된다!
     */
}
```

**위의 코드를 보면 `JpaRepository<Item, Long>` 을 상속받고 있는데 이를 통해서 기본적인 CRUD 기능은 자동으로 사용할 수 있게 된다.**

**추가로 이름으로 검색하거나, 가격으로 검색하는 기능과 같은 부분은 공통으로 제공하는 기능이 아니기 때문에 쿼리 메소드 기능 혹은 `@Query` 를 통해서 직접 추가해주면 된다.**

> - **`findAll()` : 코드에 보이지는 않지만 기본으로 제공되는 메소드로 모두 조회**
> - **`findByItemNameLike` : 해당 이름을 포함하면 조회**
> - **`findByPriceLessThanEqual` : 가격이 해당 파라미터보다 작거나 같으면 조회**
> - **`findByItemNameLikeAndPriceLessThanEqual` : 해당 이름을 포함하고 가격이 해당 파라미터보다 작거나 같을 경우 조회**
> - **하지만 마지막의 경우 메소드의 이름이 너무 길어지기 때문에 직접 쿼리로 작성하여 `findItems` 라는 이름의 메소드로 구현했다.**

**물론 위의 경우도 동적 쿼리를 사용한다면 좋겠지만 Spring Data JPA 의 경우 아직 동적 쿼리는 편리하지 않기 때문에 후에 다루도록 하겠다.**

---

**해당 인터페이스를 통해 레포지토리 작성**

```java
@Repository
@Transactional
@RequiredArgsConstructor
public class JpaItemRepositoryV2 implements ItemRepository {

    private final SpringDataJpaItemRepository repository;

    @Override
    public Item save(Item item) {
        return repository.save(item);
    }

    @Override
    public void update(Long itemId, ItemUpdateDto updateParam) {
        Item findItem = repository.findById(itemId).orElseThrow();
        findItem.setItemName(updateParam.getItemName());
        findItem.setPrice(updateParam.getPrice());
        findItem.setQuantity(updateParam.getQuantity());
    }

    @Override
    public Optional<Item> findById(Long id) {
        return repository.findById(id);
        //반환 타입이 Optional 임
    }

    @Override
    public List<Item> findAll(ItemSearchCond cond) {
        String itemName = cond.getItemName();
        Integer maxPrice = cond.getMaxPrice();

        if (StringUtils.hasText(itemName) && maxPrice != null) {
            return repository.findItems("%" + itemName + "%", maxPrice);
        } else if (StringUtils.hasText(itemName)) {
            return repository.findByItemNameLike("%" + itemName + "%");
        } else if (maxPrice != null) {
            return repository.findByPriceLessThanEqual(maxPrice);
        }
        return repository.findAll();
    }
}
```

**우선 `SpringDataJpaItemRepository` 을 주입 받고 있는 모습을 확인할 수 있다.**

**위의 레포지토리에서는 `SpringDataJpaItemRepository` 객체를 생성하여 해당 객체를 사용하고 있는데**

**`save` 의 경우 기본으로 제공되는 CRUD 기능인 `.save()` 를 사용하고 있으며**

**`update` 의 경우에도 기본으로 제공되는 기능을 통해 우선 `findById()` 를 하여 해당 객체를 얻어온 뒤 `set` 을 통해 값을 변경하면 자동으로 `update` 가 되도록 하고 있다.**

**그리고 `findById` 의 경우 또한 마찬가지로 기본 제공 CRUD 기능인 `findById()` 를 그대로 사용하고 있다.**

**다만 마지막인 `findAll()` 의 경우만**

```java
@Override
public List<Item> findAll(ItemSearchCond cond) {
		String itemName = cond.getItemName();
		Integer maxPrice = cond.getMaxPrice();

		if (StringUtils.hasText(itemName) && maxPrice != null) {
				return repository.findItems("%" + itemName + "%", maxPrice);
		} else if (StringUtils.hasText(itemName)) {
				return repository.findByItemNameLike("%" + itemName + "%");
		} else if (maxPrice != null) {
        return repository.findByPriceLessThanEqual(maxPrice);
    }
    return repository.findAll();
}
```

**이렇게 조건에 따라서 이전에 생성한 쿼리 메소드와 `@Query` 를 이용하는 모습을 볼 수 있다.**

---

**이후에 `JpaItemRepositoryV2` 를 통해서 해당하는 메소드를 사용하며 JPA를 Spring Data JPA와 함께 사용할 수 있다.**
