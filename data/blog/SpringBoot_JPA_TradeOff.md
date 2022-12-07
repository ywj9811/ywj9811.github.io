---
title: 클래스 의존 관계와 트레이드 오프
date: '2022-12-09'
tags: ['spring boot', 'JPA', '인프런', '김영한', '기술']
draft: false
summary: 지금까지 작성한 프로젝트는 위와 같은 의존 관계를 가지고 있다. 이 경우 중간에서 JpaItemRepositoryV2가 어댑터 역할을 해준 덕분에 ItemService가 사용하는 ItemRepository 인터페이스를 그대로 유지할 수 있고 클라이언트인 ItemService의 코드를 변경하지 않을 수 있었다. 하지만...
---

## 클래스 의존 관계와 트레이드 오프에 대해서

![DI1](/static/images/DI1.png)

![DI2](/static/images/DI2.png)

### **지금까지 작성한 프로젝트는 위와 같은 의존 관계를 가지고 있다.**

**이 경우 중간에서 `JpaItemRepositoryV2` 가 어댑터 역할을 해준 덕분에 `ItemService` 가 사용하는 `ItemRepository` 인터페이스를 그대로 유지할 수 있고 클라이언트인 `ItemService` 의 코드를 변경하지 않을 수 있었다.**

### **하지만…**

**런타임 객체 의존 관계를 살펴보면 실질적인 구조에 비해 전체 구조가 너무 복잡해진 모습을 확인할 수 있다.**

**즉, 전체 구조가 너무 복잡하고 사용하는 클래스도 너무 많아지는 단점이 있다.**

**이러한 단점이 있지만 유지보수 관점에서 `ItemService` 를 변경하지 않고, `ItemRepository` 의 구현체를 변경하면 된다는 장점이 있기도 하다.**

**이는 DI, OCP 원칙을 지킬 수 있다는 말이다.**

**하지만 어댑터 코드(구현체)와 실제 코드까지 함께 유지보수 해야 한다는 문제도 함께 발생한다.**

### **이런 단점들을 해결하기 위해서는 완전 다른 선택을 할 수 있다.**

**`ItemService` 코드를 일부 고쳐서 직접 Spring Data JPA 를 사용하는 방법이다.**

**이 방식은 DI, OCP 원칙을 포기하는 대신에 복잡한 어댑터를 제거하고 구조를 단순하게 가져가는 방식이다.**
![DI3](/static/images/DI3.png)

![DI4](/static/images/DI4.png)
**이는 `ItemService` 에서 Spring Data JPA 로 만든 레포지토리를 직접 참조하는 것이다.**

**물론 이렇게 되면 `ItemService` 코드를 변경해야 한다.**

### **이것이 바로 트레이드 오프이다.**

- **DI, OCP를 지키기 위해 어댑터를 도입하고, 더 많은 코드를 유지한다.**
- **어댑터를 제거하고 구조를 단순하게 만들지만 DI, OCP를 포기하고 `ItemService` 코드를 직접 변경한다.**

**즉, 구조의 안정성 VS 단순한 구조와 개발의 편리성 사이의 트레이드 오프인 것이다.**

**이 부분은 개발하는 개발자가 상황에 따라서 적절한 선택을 가져가야 하는 것이다.**

---

## **실용적인 구조**

**지금까지는 구조의 안정성을 가져가는 코드를 작성해 왔으니 실용적인 구조를 한번 구현해 보도록 하자.**
![DI5](/static/images/DI5.png)

**이렇게 Spring Data JPA 와 Querydsl 을 구분하여 각각 인터페이스와 레포지토리를 생성한다.**

```java
public interface ItemRepositoryV2 extends JpaRepository<Item, Long> {
}
```

```java
@Repository
public class ItemQueryRepositoryV2 {
	private final JPAQueryFactory query;

	public ItemQueryRepositoryV2(EntityManager em) {
		this.query = new JPAQueryFactory(em);
	}

	public List<Item> findAll(ItemSearchCond cond) {
		return query.select(item)
						.from(item)
						.where(
										maxPrice(cond.getMaxPrice()),
										likeItemName(cond.getItemName())
						)
						.fetch();
	}

	private BooleanExpression likeItemName(String itemName) {

		if (StringUtils.hasText(itemName)) {
			return item.itemName.like("%" + itemName + "%");
		}

		return null;
	}

	private BooleanExpression maxPrice(Integer maxPrice) {
		if (maxPrice != null) {
			return item.price.loe(maxPrice);
		}
		return null;
	}
}
```

**이렇게 되면 CRUD와 단순 조회는 Spring Data JPA가 담당하고, 복잡한 조회 쿼리의 경우 Querydsl 가 담당하게 된다.**

**물론 `ItemService` 의 경우 기존과 같이 `ItemRepository` 를 사용할 수 없기 때문에 코드를 변경해 주어야 한다.**

```java
@Service
@RequiredArgsConstructor
@Transactional
public class ItemServiceV2 implements ItemService {
	private final ItemRepositoryV2 itemRepositoryV2;
	private final ItemQueryRepositoryV2 itemQueryRepositoryV2;

	@Override
	public Item save(Item item) {
		return itemRepositoryV2.save(item);
	}

	@Override
	public void update(Long itemId, ItemUpdateDto updateParam) {
		Item findItem = findById(itemId).orElseThrow();
		findItem.setItemName(updateParam.getItemName());
		findItem.setPrice(updateParam.getPrice());
		findItem.setQuantity(updateParam.getQuantity());
	}

	@Override
	public Optional<Item> findById(Long id) {
		return itemRepositoryV2.findById(id);
	}

	@Override
	public List<Item> findItems(ItemSearchCond cond) {
		return itemQueryRepositoryV2.findAll(cond);
	}
}
```

**`ItemService` 의 코드를 보면**

**`private final ItemRepositoryV2 itemRepositoryV2;`**

**`private final ItemQueryRepositoryV2 itemQueryRepositoryV2;`**

**이렇게 각각 의존하고 있다.**

**단순 CRUD의 경우 `itemRepositoryV2` 를 그리고 복잡한 쿼리의 경우 `itemQueryRepositoryV2` 를 사용하고 있다.**

**그리고 `ItemService` 의 의존성이 변했기 때문에 다시 설정을 변경해야 한다.**

```java
@Configuration
@RequiredArgsConstructor
public class V2Config {

    private final EntityManager em;
    private final ItemRepositoryV2 itemRepositoryV2;

    @Bean
    public ItemService itemService() {
        return new ItemServiceV2(itemRepositoryV2, itemQueryRepository());
    }

    @Bean
    public ItemQueryRepository itemQueryRepository() {
        return new ItemQueryRepository(em);
    }

}
```

---

**여기까지 마치게 되면 이제 구조적인 장점을 포기하고 실용적인 방식으로 트레이드 오프한 코드를 작성하게 된 것이다.**
