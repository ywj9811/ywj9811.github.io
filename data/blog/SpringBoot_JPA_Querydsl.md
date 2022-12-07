---
title: Querydsl
date: '2022-12-09'
tags: ['spring boot', 'JPA', '인프런', '김영한', '기술']
draft: false
summary: Querydsl은 무엇일까?그냥 Query를 직접 작성하면 어떤 불편한 점이 있을까? 에 대해서 우선 생각해보자.
---

## **Querydsl은 무엇일까?**

### **그냥 Query를 직접 작성하면 어떤 불편한 점이 있을까? 에 대해서 우선 생각해보자**

- **Query는 문자, Type-check 가 불가능 하다.**
- **따라서 실행하기 전까지 작동 여부를 확인할 수 없다.**

### **QueryDSL 을 사용하게 되면**

**쿼리를 Java로 Type-safe 하게 개발할 수 있게 지원해준다.**

**주로 JPA 쿼리(JPQL)에 사용한다.**

**이는 DSL**

- **Domain(도메인)**
- **Specific(특화)**
- **Language(언어)**

**이 뜻에서 알 수 있다.**

**즉 특정한 도메인에 초점을 맞춘 제한적인 표현력을 가진 쿼리에 특화된 프로그래밍 언어인 것이다.**
![querydslprocess](/static/images/querydslprocess.png)
**작동은 위와 같은 방식으로 진행되게 된다.**

---

## **이제 본격적으로 Querydsl 을 살펴보도록 하자.**

### **설정**

```java
{
	...
	...
	//Querydsl 추가
	implementation 'com.querydsl:querydsl-jpa'
	annotationProcessor "com.querydsl:querydsl-apt:${dependencyManagement.importedProperties['querydsl.version']}:jpa"
	annotationProcessor "jakarta.annotation:jakarta.annotation-api"
	annotationProcessor "jakarta.persistence:jakarta.persistence-api"
}

//Querydsl 추가, 자동 생성된 Q클래스 gradle clean으로 제거
clean {
	delete file('src/main/generated')
}
```

**`build.gradle` 에 위의 코드를 추가하여 설치하도록 하자.**

### **확인**

**이제 Q타입이 생성 되었는지 확인해야 한다.**

**ex) Item 도메인 → QItem 이 생성되어야 한다.**

**빌드 방식에 따라서 두가지 방식으로 확인해야 한다.**
![querydslbuild](/static/images/querydslbuild.png)

1. **Gradle 방식의 경우 (ItelliJ 기준 오른쪽 바에 Gradle)**

   - **Gradle → Tasks → build → clean**
   - **Gradle → Tasks → other → compileJava**

   **위 단계를 순서대로 거치게 되면 project bar에**

   **build → generated → sources → annotationProcessor → java/main 하위에 생성된 모습을 확인해야 한다.**

2. **IntelliJ IDEA 방식의 경우**

   - **Build → Build Project 혹은 Build → Rebuild 혹은 main() 을 실행하면 된다.**

   **이후에 src/main/generated 하위에 생성된 모습을 확인해야 한다.**

**⚠️ Querydsl의 경우 ItelliJ의 버전이 달라지거나 Gradle의 버전이 달라지는 경우 설정 방식이 달라지는 경우가 있다. 이 경우 `querydsl gradle` 로 검색하면 금방 해결할 수 있을 것이다. ⚠️**

---

### **Querydsl 적용**

**우선 레포지토리에 적용하는 방법을 확인해 보도록 하자.**

```java
@Repository
@Transactional
public class JpaItemRepositoryV3 implements ItemRepository {
    private final EntityManager em;
    private final JPAQueryFactory query;

    public JpaItemRepositoryV3(EntityManager em) {
        this.em = em;
        this.query = new JPAQueryFactory(em);
    }

    @Override
    public Item save(Item item) {
        em.persist(item);
        return item;
    }

    @Override
    public void update(Long itemId, ItemUpdateDto updateParam) {
        Item findItem = em.find(Item.class, itemId);
        findItem.setItemName(updateParam.getItemName());
        findItem.setQuantity(updateParam.getQuantity());
        findItem.setPrice(updateParam.getPrice());
    }

    @Override
    public Optional<Item> findById(Long id) {
        Item item = em.find(Item.class, id);
        return Optional.ofNullable(item);
    }

    @Override
    public List<Item> findAll(ItemSearchCond cond) {
        String itemName = cond.getItemName();
        Integer maxPrice = cond.getMaxPrice();

        return query
                .select(item)
                .from(item)
                .where(likeItemName(itemName), maxPrice(maxPrice))
                .fetch();
    }

    private BooleanExpression maxPrice(Integer maxPrice) {
        if (maxPrice != null) {
            return item.price.loe(maxPrice);
        }
        return null;
    }

    private BooleanExpression likeItemName(String itemName) {
        if (StringUtils.hasText(itemName)) {
            return item.itemName.like("%" + itemName + "%");
        }
        return null;
    }
}
```

**우선 Querydsl을 사용하기 위해서는 `JPAQueryFactory` 가 필요하다.**

**그리고 `JPAQueryFactory` 는 JPA 쿼리인 JPQL을 사용하기 때문에 `EntityManager` 이 필요하다.**

**Querydsl의 경우 조회에서 동적 쿼리를 위해서 사용하기 때문에 이외의 `save()` `find()` 등등의 경우 기존의 JPA 기본 기능을 사용하면 된다.**

```java
public List<Item> findAllOld(ItemSearchCond cond) {
  String itemName = cond.getItemName();
  Integer maxPrice = cond.getMaxPrice();

  BooleanBuilder builder = new BooleanBuilder();
  if (StringUtils.hasText(itemName)) {
  builder.and(item.itemName.like("%" + itemName + "%"));
  }
  if (maxPrice != null) {
		builder.and(item.price.loe(maxPrice));
		//loe는 LessOrEqual
	}

  List<Item> result = query
                .select(item)
                .from(item)
                .where(builder)
                .fetch();

	return result;
}
```

**위와 같이 `BooleanBuilder` 을 통해 원하는 `where` 조건을 넣어주면 된다.**

> **이 모든 방식은 자바 코드로 작성되기 때문에 동적 쿼리를 편리하게 작성할 수 있다.**

**위의 코드를 보면 전체 코드보다 살짝 긴 느낌이 있다.**

**전체 코드의 경우 위의 조건을 메소드로 분리해서 처리했기 때문이다.**

```java
		...
		...
		@Override
    public List<Item> findAll(ItemSearchCond cond) {
        String itemName = cond.getItemName();
        Integer maxPrice = cond.getMaxPrice();

        return query
                .select(item)
                .from(item)
                .where(likeItemName(itemName), maxPrice(maxPrice))
                .fetch();
    }

    private BooleanExpression maxPrice(Integer maxPrice) {
        if (maxPrice != null) {
            return item.price.loe(maxPrice);
        }
        return null;
    }

    private BooleanExpression likeItemName(String itemName) {
        if (StringUtils.hasText(itemName)) {
            return item.itemName.like("%" + itemName + "%");
        }
        return null;
    }
}
```

> **`BooleanExpression` 는 조건문을 담을 수 있고, null로 리턴할 수도 있다.**

**전체 코드의 경우 위와 같은 방식으로 리팩토링이 되어 있는데 살펴 보도록 하자.**

**`maxPrice(Integer maxPrice)` 메소드의 경우 maxPrice가 존재할 경우 `item.price.loe(maxPrice)` 로 반환하고 있다.**

**즉 maxPrice보다 작거나 같은 값이라는 조건을 반환하는 것이다.**

**그리고 만약 maxPrice가 null이라면 그대로 조건문을 null로 반환하고 있다.**

**`likeItemName(String itemName)` 메소드의 경우 `StringUtils.hasText()` 을 통해서 itemName에 값이 null이 아닌지 체크를 하고 null이 아닐 경우 `item.itemName.like("%" + itemName + "%");` 를 반환하고 있다.**

**이는 도메인의 itemName중 파라미터로 넘어오는 itemName을 포함하고 있는 것들이라는 조건을 반환하는 것이다.**

**만약 null이라면 마찬가지로 null을 반환하고 있다.**

**이렇게 조건절 메소드를 분리한 후 `.where(likeItemName(itemName), maxPrice(maxPrice))` 이렇게 where절에서 `likeItemName(itemName), maxPrice(maxPrice)` 를 순서대로 넣어주고 있다. ( `,` 를 기점으로 AND가 들어가게 된다.)**

### **왜 이런 방식을 사용했는가?**

**💡 메소드를 분리하여 재사용성을 가져갈 수 있다!**

---

**이제 위의 레포지토리를 사용하도록 Config 를 작성해보자**

```java
@Configuration
@RequiredArgsConstructor
public class QuerydslConfig {

    private final EntityManager em;

    @Bean
    public ItemService itemService() {
        return new ItemServiceV1(itemRepository());
    }

    @Bean
    public ItemRepository itemRepository() {
        return new JpaItemRepositoryV3(em);
    }
}
```

**위와 같은 Config를 사용하도록 설정을 하면 이제 JPA + Spring Data JPA + Querydsl을 사용하게 된다.**
