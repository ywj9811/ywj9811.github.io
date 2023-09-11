---
title: Modern Java in Action chap2
date: '2023-08-01'
tags: ['JAVA', '기술서적', Modern_Java_In_Action]
draft: false
summary: Modern Java in Action 2장 동작 파라미터화 코드 전달하기
---
# 동작 파라미터화 코드 전달하기

## 동작 파라미터화를 이용하면 어떤 부분이 좋아질 수 있을까

**동작 파라미터화**를 이용하면 자주 바뀌는 요구사항에 효과적으로 대응할 수 있다.

> **만약 룸메이트에게 빵, 치즈, 와인 등의 식료품을 사달라고 부탁을 하는 로직이라면?**
> 
> - goAndBuy() 라는 메소드를 호출할 수 있을 것이다.
> 
> **하지만 어느날 급한 일이 생겨 우체죽에 가서, 이 고객 번호를 통해 소포를 가져오라고 해야 한다면?**
> 
> - go() 라는 메소드로 포괄적으로 수행할 수 있게 할 수 있을 것이다.
> - 이때 **원하는 동작을 파라미터로 전달하는 것**과 같은 것이다.

## 변화하는 요구사항에 대응하기

예시를 하나 잡아보도록 하자.

기존의 농장 재고 목록 어플리케이션에 기능을 추가한다고 가정해보자.

### 녹색 사과 필터링

💡Color enum 이 존재한다고 가정 (RED, GREEN)

```java
public static List<Apple> filterGreenApples(List<Apple> inventory) {
	List<Apple> result = new ArrayList<>();
	for (Apple apple : inventory) {
		if (GREEN.equals(apple.getColor()) {
			result.add(apple);
		}
	}
	return result;
}
```

이렇게 작성할 수 있을 것이다.

하지만, 만약 녹색 사과 뿐만 아닌 빨간 사과도 필터링을 하고 싶다고 마음이 바뀌었다면 어떻게 할 것인가.

같은 구조의 `filterRedApples` 를 만들고 사용할 수 있을 것이다. 하지만 나중에 더 다양한 색을 원한다면 대응하기 힘들어질 것이다.

이 때 활용하기 좋은 규칙이 있다.

**→ 비슷한 코드가 반복 된다면 코드를 추상화 하자**

### 색을 파라미터화

```java
public static List<Apple> filterApplesByColor(List<Apple> inventory, Color color) {
  List<Apple> result = new ArrayList<>();
  for (Apple apple : inventory) {
    if (apple.getColor() == color) {
      result.add(apple);
    }
  }
  return result;
}
```

이렇게 색을 파라미터로 넘겨서 처리할 수 있을 것이다.

이제 농부는 아래와 같이 호출해서 사용할 수 있다.

```java
List<Apple> greenApples = filterApplesByColor(inventory, Color.GREEN);
List<Apple> redApples = filterApplesByColor(inventory, Color.RED);
```

근데 이때 갑자기 색 이외에 무게를 기준으로 필터링 하고 싶다고 한다.

그렇다면 지금까지의 로직으로는 불가피하게 반복적인 코드를 또 추가해야 할 것이다.

```java
public static List<Apple> filterApplesByWeight(List<Apple> inventory, int weight) {
  List<Apple> result = new ArrayList<>();
  for (Apple apple : inventory) {
    if (apple.getWeight() > weight) {
      result.add(apple);
    }
  }
  return result;
}
```

이런식으로 하게 되면 이는 **소프트웨어 공학의 DRY 원칙 (같은 것을 반복하지 말 것)을 어기는 것**이다.

그한 모든 속성으로 필터링을 해야할까.

`filterApple(List<Apple> inventory, Color color, int weight, boolean flag)` 이런식으로 메소드를 작성하는 것은 정말 형편없기 딱이 없을 것이다.

대체 true, false는 무엇을 의미하는 것이고, 앞으로의 변경에는 어떻게 대처할지 좋지 않은 코드가 나왔다.

이때 어떤 기준으로 사과를 필터링할 것인지 효과적으로 전달할 수 있다면 좋을텐데, 이 방식을 이제 **동작 파라미터화를 통해** 얻을 수 있다.

# 동작 파라미터화

사과의 어떤 속성에 기초해서 boolean값을 반환하게 할 수 있을 것이다. (사과가 녹색인가? 혹은 사과가 150이상인가?)

boolean을 반환하는 함수를 `Predicate` 라 하는데, 이를 통해 선택 조건을 결정하는 인터페이스를 정의하자.

```java
public interface ApplePredicate {
	boolean test (Apple apple)
}
```

이를 통해 다양한 선택 조건을 대표하는 여러 버전의 `ApplePredicate` 를 정의할 수 있다.

```java
class AppleWeightPredicate implements ApplePredicate {
  @Override
  public boolean test(Apple apple) {
    return apple.getWeight() > 150;
  }
}

class AppleColorPredicate implements ApplePredicate {
  @Override
  public boolean test(Apple apple) {
    return apple.getColor() == Color.GREEN;
  }
}

class AppleRedAndHeavyPredicate implements ApplePredicate {
  @Override
  public boolean test(Apple apple) {
    return apple.getColor() == Color.RED && apple.getWeight() > 150;
  }
}
```

이런식으로 말이다.

<aside>
📌 **즉, ApplePredicate는 사과 선택 전략을 캡슐화 하는 것이다.**

이를 **전략 디자인 패턴** (strategy design pattern) 이라고 한다.

이는 각 알고리즘을 캡슐화하는 알고리즘 패밀리를 정의한 후 각 런타임에 알고리즘을 선택하는 기법이다.

**ApplePredicate == 알고리즘 패밀리**

**AppleHeavyWeightPredicate == 전략**

</aside>

이제 `filterApples` 에서 `ApplePredicate` 객체를 받아 Apple의 조건을 검사하도록 메소드를 수정해야 할 것이다.

이렇게 **동작 파라미터화를 수행**할 수 있다.

### 추상적 조건으로 필터링

```java
public static List<Apple> filterApples(List<Apple> inventory, ApplePredicate p) {
	List<Apple> result = new ArrayList<>();
	for (Apple apple : inventory) {
		if (p.test(apple)) { //Predicate 객체로 검사 조건을 캡슐화
			result.add(apple); 
		}
	}
	return result;
}
```

이로써 굉장히 유연한 코드를 얻었다.

만약 농부가 또다른 조건을 추가하고 싶다면 그것을 적절하게 구현하는 클래스만 만들고 넘기면 된다.

→ `ApplePredicate` 를 구현하면 된다!

![Untitled](/static/images/modernJava/cap.png)

한가지 아쉬운 점이 있다.

메소드는 객체만 인수로 받기 때문에 `test()` 를 사용하기 위해서 우리는 `ApplePredicate` 객체로 감싸서 전달해야 한다. 그러기 위해서는 여러개의 클래스를 새롭게 정의해야 한다.

이는 **람다를 이용**해 여러개의 `ApplePredicate` 클래스를 정의하지 않고 **표현식을 `filterApples()` 메소드에 전달하는 방법**으로 해결할 수 있다.

## 복잡한 과정 간소화

위의 방식으로 작성하게 되면 코드에 대한 유연성은 확보할 수 있지만, **로직과 관련 없는 코드가 많이 추가**될 것이다.

### 첫번째 방법 - 익명 클래스

자바는 클래스의 선언과 인스턴스화를 동시에 수행할 수 있도록 **익명 클래스** 라는 기법을 제공한다.

익명 클래스는 자바의 지역 클래스와 비슷한 개념으로 말 그대로 이름이 없는 클래스이다.

**→ 클래스 선언과 인스턴스화를 동시에 할 수 있다. (즉석에서 필요한 구현 만들어 사용)**

```java
List<Apple> redApples = filterApple(inventory, new ApplePredicate() {
	public boolean test(Apple apple) {
		return RED.eqeuals(apple.getColor());
	}
}
```

하지만 이 방식에도 아직 부족한 점이 있다.

바로 너무 많은 공간을 차지한다…

코드의 **장황함은 나쁜 특성**이다.

장황한 코드는 구현하고 유지보수하는데 시간이 많이 걸리게 되며 읽는 즐거움 또한 빼앗는 코드이다.

### 두번째 방법 - 람다 표현식

**자바 8부터는 람다 표현식을 사용해서 훨씬 더 간단하게 표현할 수 있다.**

```java
List<Apple> redApples = 
		filterApples(inventory, (Apple apple) -> RED.equals(apple.getColor()));
```

굉장히 간단하게 표현할 수 있게 되었다.

### 더 다양한 필터를 위해 - 리스트 형식으로 추상화

```java
public interface Predicate<T> {
	boolean test(T t);
}

public static <T> List<T> filter(List<T> list, Predicate<T> p {
	List<T> result = new ArrayList<>();
	for (T e : list) {
		if (p.test(e)) {
			result.add(e);
		}
	}
	return result;
}
```

이렇게 만들게 되면, 앞으로 사과 뿐만 아닌 **바나나, 오렌지, 문자열** 등의 리스트에 필터 메소드를 사용할 수 있을 것이다.

여기에 람다를 사용하면 아래와 같다.

```java
List<Apple> redApples =
		filter(inventory, (Apple apple) -> RED.equals(apple.getColor()));

List<Integer> evenNumber = 
		filter(numbers, (Integer i) -> i % 2 == 0);
```

이렇게 사용할 수 있을 것이다.

# 실전 예제

지금까지 **동작 파라미터화** 패턴은 동작을 캡슐화한 다음 메소드로 전달하여 **메소드의 동작을 파라미터화** 한다는 것을 알아 보았다.

### Comparator로 정렬하기

정렬의 기준이 바뀌는 경우는 자주 발생할 수 있다.

이를 위한 유연한 코드는 어떻게 만들 수 있을까.

```java
public interface Comparator<T> {
	int compare(T o1, T o2);
}
// 이는 java.util 에 존재하는 객체이다.
// 이를 통해 sort 메소드의 동작을 파라미터화 할 수 있을 것이다.
```

우선 익명 클래스를 사용하여 작성하는 예제를 확인해보자.

```java
inventory.sort(new Comparator<Apple>() {
	public int compare(Apple a1, Apple a2) {
		return a1.getWeight().compareTo(a2.getWeight());
	}
};
```

이런식으로 농부의 요구사항에 맞는 `Comparator`를 만들어 `sort`메소드에 전달할 수 있을 것이다.

그럼 이것에 람다 표현식을 사용하면 어떻게 할 수 있을까.

```java
inventory.sort((Apple a1, Apple a2) 
		-> a1.getWeight().compareTo(a2.getWeight());
```

이렇게 더 간략하게 작성할 수 있을 것이다.

### Runnable로 코드 블록 실행하기

자바 스레드를 이용하면 병렬로 코드 블록을 실행할 수 있다.

어떤 코드를 실행할 것인지 스레드에게 어떻게 알려줄 수 있을까.

자바 8 이전 까지는 Thread 생성자에 객체만을 전달할 수 있었기에 보통 결과를 반환하지 않는 `void run` 메소드를 포함하는 익명 클래스가 `Runnalbe` 인터페이스를 구현하도록 하는 것이 일반적인 방법이었다.

이는 `java.lang` 에 존재하는 인터페이스다.

`Runnable` 을 이용하여 다양한 동작을 스레드로 실행할 수 있다.

```java
Thread t = new Tread(new Runnable() {
	public void run() {
		System.out.println("Hello world");
	}
});
```

자바 8 이후부터는 람다 표현식을 사용할 수 있기에 다음과 같이 구현할 수 있다.

```java
Thread t = new Thread(() -> System.out.println("Hello world"));
```

### Callable을 결과로 반환하기

이 개념이 어색할 수 있는데, 우선은 `Callable` 인터페이스를 이용해 결과를 반환하는 테스크를 만든다는 사실만 알아둬도 된다. (이 개념은 내가 어색하다...)

이는 `java.util.concurrent` 에 존재하는 인터페이스다.

```java
public interface Callable<V> {
	V call();
}
// 이러한 인터페이스다.
```

아래와 같이 실행 서비스에 테스크를 제출해서 위 코드를 활용할 수 있다.

```java
ExecutorService executorService = Executors.newCacheTreadPool();
Future<String> threadName = executorService.submit(new Callable<String>() {
	@Override
	public String call() throws Exception {
		return Thread.currentThread().getName();
	}
});
```

이 코드를 람다로 나타내면 아래와 같다.

```java
Future<String> threadName = executorService.submit(
		() -> Thread.currentThread().getName());
```

이렇게 **동작 파라미터화와 람다**를 더한 사용법을 살펴 보았는데, 람다의 경우 3장에서 자세히 살펴볼 것이기 때문에 로직은 걱정하지 않아도 된다.