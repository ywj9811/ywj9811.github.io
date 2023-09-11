---
title: Modern Java in Action chap1
date: '2023-07-30'
tags: ['JAVA', '기술서적', Modern_Java_In_Action]
draft: false
summary: Modern Java in Action 1장 자바 8,9,10,11 무슨 일이 일어나고 있는가
---
## 자바 8, 9, 10, 11 무슨일이 일어나고 있나

### 들어가기 앞서..

이 책에 대한 소개를 먼저 하도록 하자.

자바 8의 새로운 기능은 자바 1.0 이후 21년간의 가장 큰 변화이다.

```java
Collectioins.sort(inventory, new Comparator<Aplle>() {
	public int compare(Apple a1, Apple a2) {
		return a.getWeight().compareTo(a2.getWeight());
	}
});
// 이런식으로 작성하던 코드가

inventory.sort(comparing(Apple::getWeight));
// 자바8 이후부터 이렇게 간단히 구현될 수 있다.
```

그래서 자바 8에서 나타난 큰 변화와 그 변화로 인해 생겨난 기능을 설명하고 사용할 수 있도록 해주는 책이다.

물론 자바 9,10 그리고 11까지 다루기도 한다!

### 챕터1 에서는 자바 8의 전반적인 기능과 전체적인 책의 내용을 간단히 훑고 넘어간다.

자바 8에서 제공하는 기능의 핵심은 아래와 같다.

- 스트림 API
- 메소드에 코드를 전달하는 기법
- 인터페이스의 디폴트 메소드

이러한 기능들에 대한 설명은 책 전체적으로 하겠지만, 책의 내용을 제대로 들어가기 앞서 자바 8의 설계 기반이 되는 3개의 개념을 살펴보고 가도록 하자.

### 개념 1. 스트림 처리

**스트림** 처리란 무엇인가.

**스트림이란** 한번에 한개씩 만들어지는 연속적인 데이터 항목들의 모임이다.

예를 들어 자동차 생산 공장 라인을 생각해볼 수 있다.

자동차 생산 공장은 여러 자동차로 구성된 스트림을 처리하는데, 각각의 작업장에서는 자동차를 받아서 수리한 다음 다음 작업장에서 다른 작업을 처리할 수 있도록 넘겨준다.

**조립 라인은 자동차를 물리적인 순서로 한개씩 운반하지만 각각의 작업장에서는 동시에 작업을 처리한다.**

이러한 방식으로 이루어지는 것을 자바 8의 `java.util.stream` 에서 제공하는 스트림 API가 제공해준다.

위의 패키지에 정의된 `Stream<T>` 는 T형식으로 구성된 일련의 항목을 의미한다.

→ 우선은 단순하게 스트림 API가 조립 라인처럼 어떤 항목을 연속으로 제공하는 어떤 기능이라고 생각하자.

스트림 API의 핵심은 우리가 하려는 작업을 고수준으로 추상화하여 일련의 스트림으로 만들어 처리할 수 있다는 것과 스트림 파이프라인을 이용하여 입력 부분을 여러 CPU 코어에 쉽게 할당할 수 있다는 것이다.

이는 스레드라는 복잡한 작업 없이 공짜로 병렬성을 얻을 수 있게 해준다.

이 스트림API는 이후에 4장~7장까지 다룰 것이다.

### 개념 2. 동작 파라미터화로 메소드에 코드 전달

만약 2013UK001, 2014US002, … 와 같은 형식을 가지는 송장 번호가 있을 때 만약 우리가 2013, 2014와 같이 연도를 기준으로 송장 번호를 정렬하기 위해서는 어떻게 할까.

우리는 지정하는 순서대로 자료를 정리할 수 있도록 `sort` 메소드에 명령을 내려야 한다.

그러기 위해서 우리는 연도를 비교할 수 있는 `compareUsingYear` 과 같은 메소드를 구현할 수 있다. 

위의 자바 8 코드 예시를 위해 작성된 코드와 같이 `Comparator 객체`를 만들어 `sort`에 넘겨주는 방식도 있겠지만 복잡하며, 기존 동작을 단순하게 재활용한다는 측면 또한 존재한다.

**이때 자바 8은 메소드를 다른 메소드의 인수로 넘겨주는 기능을 제공한다.**

이러한 기능을 **동작 파라미터화** 라고 한다.

즉, `compareUsingYear` 를 `sort` 에 파라미터로 넘겨주는 것이다.

### 개념 3. 병렬성과 공유 가변 데이터

스트림 메소드로 전달하는 코드는 다른 코드와 동시에 실행하더라도 안전하게 실행될 수 있어야 한다. 보통 다른 코드와 동시에 실행 하더라도 안전하게 실행할 수 있는 코드를 만들기 위해서는 공유된 가변 데이터에 접간하지 않아야 한다.

물론 기존처럼 synchronized를 이용하여 공유된 가변 데이터를 보호하는 규칙을 만들 수 있지만, 이는 시스템 성능에 악영향을 미친다.

자바 8 이후로는 스트림을 이용하여 쉽게 병렬성을 활용할 수 있다.

**여기까지 3개의 개념을 알아 보았으니, 자바 8에 추가된 새로운 개념을 하나씩 살펴보도록 하자.**

## 자바 함수

기존의 자바 프로그래밍 언어에서는 다양한 구조체가 값의 구조를 표현하는데 도움이 될 수 있었지만, 이러한 모든 구조체를 자유롭게 전달할 수는 없었다.

이 점을 해결하여 1급 시민 (1급 객체)로 가득찬 세계를 만들면 좋지 않을까.

<aside>
💡 **1급 시민이란?**

</aside>

**1급 시민의 조건 3가지**

1. 변수나 데이타에 할당 할 수 있어야 한다.

2. 객체의 인자로 넘길 수 있어야 한다.

3. 객체의 리턴값으로 리턴 할수 있어야 한다.

위의 3가지 조건을 만족하는 값들을 의미한다.

### 메소드와 람다를 1급 시민으로

우선 **메소드 참조**라는 새로운 기능을 알아보자.

예를 들어 디렉토리에서 모든 숨겨진 파일을 필터링 한다고 가정해보자.

그렇다면 우선 주어진 파일이 숨겨져 있는지 여부를 알려주는 메소드를 구현해야 한다. 다행히 File 클래스는 이미 `isHidden` 메소드를 제공한다. 이는 File클래스를 인수로 받아 boolean 을 반환하는 메소드이다.

```java
File[] hiddenFiles = new File(".").listFiles(new FileFilter() {
	public boolean accept(File file) {
		return file.isHidden();
	}
});
```

자바 8 이전에는 위와 같이 FileFilter로 isHidden을 감싼 다음에 FileFilter를 인스턴스화 하는 방식을 이용해야 했다.

하지만 이는 복잡한 방식이고 가독성이 떨어진다.

```java
File[] hiddenFiles = new File(".").listFiles(File::isHidden);
```

`isHidden` 이란 **함수**가 이미 준비되어 있기 때문에 자바 8 에서는 위와 같이 **메소드 참조** 를 용해서 listFIles에 직접 전달할 수 있다. **(’함수’라는 단어 사용함 주의깊게 봐라)**

`::` 라는 메소드 참조를 사용하게 되면 “이 메소드를 값으로 사용하라” 라는 의미를 사용할 수 있다.

자바 8부터는 기존에 객체 참조 (new로 객체 참조 생성함)과 같이 `File::isHidden` 을 사용하여 **메소드 참조**를 만들어 전달할 수 있게 된 것이다.

### 람다 : 익명 함수

자바 8에서는 메소드를 1급 시민으로 취급할 뿐 아니라 **람다를** 포함하여 함수도 값으로 취급할 수 있다.

예를 들면 `(int x) -> x+1` 와 같이 ‘x라는 인수로 호출하면 x+1을 반환’ 이라는 동작을 수행하도록 코드를 구현할 수 있다.

이를 이용하게 되면 이용할 수 있는 편리한 클래스나 메소드가 없을 때 직접 구현하여 가져오는 것이 아닌 이러한 람다 문법을 통해 간결하게 코드를 구현할 수 있다.

람다 문법으로 구현된 프로그램을 **함수형 프로그래밍 (‘함수를 1급 값으로 넘겨주는 프로그램’) 이라 한다.**

이어서 코드를 넘겨주는 예제를 확인해 보자.

만약 Apple 클래스와 Apples 리스트를 포함하는 변수 inventory가 있을 때를 예시로 보도록 하자.

모든 녹색 사과를 선택해서 필터링 하려면 아래와 같이 구현했을 것이다.

(이렇게 특정 항목을 선택해서 반환하는 동작을 **filter** 라고 한다.)

```java
public static List<Apple> filterGreenApples(List<Apple> inventory) {
	List<Apple> result = new ArrayList<>();
	
	for (Apple apple : inventory) {
		if (GREEN.equals(apple.getColor())) {
			result.add(apple);
		}
	} return result;
}
```

그런데 누군가는 만약 150그램 이상의 사과를 필터링해야 한다면 아래와 같이 구현할 것이다.

```java
public static List<Apple> filterHeavyApples(List<Apple> inventory) {
	List<Apple> result = new ArrayList<>();
	
	for (Apple apple : inventory) {
		if (apple.getWeight() > 150)) {
			result.add(apple);
		}
	} return result;
}
```

이는 단 한줄의 코드만 다르고 나머지 코드는 모두 동일하다.

**이때 자바 8은 코드를 인수로 넘겨줄 수 있기에 이런 중복 코드를 작성하지 않아도 된다.**

```java
public static boolean isGreenApple(Apple apple) {
	return GREEN.eqauls(apple.getColor());
}

public static boolean isHeavyApple(Apple apple) {
	return apple.getWeight() > 150;
}

// 이렇게 목적을 위한 메소드를 구현한 후

static List<Apple> filterApples(List<Apple> inventory, Predicate<Apple> p) {
	List<Apple> list = new ArrayList<>();
	for (Apple apple : inventory) {
		if (p.test(apple) {
			result.add(apple)
		}
	}	
	return result;
}
```

이런식으로 구현한 후 `filterApple(inventory, Apple::isGreenApple);` 혹은 `filterApple(inventory, Apple::isHeavyApple);` 로 각각 호출하여 동작시킬 수 있다.

(자세한 동작 방법은 이후에 다루도록 한다.)

- **Predicate 인터페이스란?**
    
    <aside>
    💡 **Predicate는 무엇이지?**
    
    </aside>
    
    위의 코드에서 `Predicate<T>` 를 사용했는데 이것은 무엇일까.
    
    - argument를 받아 boolean값을 반환하는 함수형 인터페이스
    - functional method: `test()`
    
    > **함수형 인터페이스란?**
    > 
    > - = SAM interface; Single Abstract Method Interface
    > - : **1개의 추상 메소드**를 갖고 있는 인터페이스➕ default나 static 메소드의 제한 X
    > - **@FunctionalInterface** 어노테이션 사용➕ 없어도 동작하지만 함수형 인터페이스 조건에 부합되는지 검사해주므로 사용하는 것이 좋다.
    > - Java8부터 지원된 람다는 함수형 인터페이스로 접근 가능
    > - Predicate 외에도 Consumer, Supplier, Function, Comparator 등이 있다.
    
    다시 이어서 Predicate에 대해서 이야기 하자면,
    
    ```java
    @FunctionalInterface
    public interface Predicate<T> {
        // 주어진 arguments를 검증
        boolean test(T t);
    
        // 다른 Predicate와 연결하는 역할 &&
        default Predicate<T> and(Predicate<? super T> other) {
            Objects.requireNonNull(other);
            return (t) -> test(t) && other.test(t);
        }
    
        // test()의 반대 결과 반환 (ex: true -> false)
        default Predicate<T> negate() {
            return (t) -> !test(t);
        }
    
        // 다른 Predicate와 연결하는 역할 ||
        default Predicate<T> or(Predicate<? super T> other) {
            Objects.requireNonNull(other);
            return (t) -> test(t) || other.test(t);
        }
    
        // 동일한지 체크
        static <T> Predicate<T> isEqual(Object targetRef) {
            return (null == targetRef)
                    ? Objects::isNull
                    : object -> targetRef.equals(object);
        }
    
        @SuppressWarnings("unchecked")
        static <T> Predicate<T> not(Predicate<? super T> target) {
            Objects.requireNonNull(target);
            return (Predicate<T>)target.negate();
        }
    }
    ```
    
    이렇게 구성되어 있는 인터페이스로 아래의 예제를 통해 확인해볼 수 있다.
    
    ```java
    // 예제1. - test()
    @Test
    public void test() {
    	Predicate<Integer> predicate = (num) -> num < 10;
    	// num이 10보다 작으면 true
    	assertThat(predicate.test(5)).isTrue();
    }
    
    // 예제2. - and()
    @Test
    public void test() {
        Predicate<Integer> predicate1 = (num) -> num < 10;
        Predicate<Integer> predicate2 = (num) -> num > 5;
    		// 두개의 조건이 모두 만족하는지 &&
        assertThat(predicate1.and(predicate2).test(7)).isTrue();
    }
    
    // 예제3. - negate()
    @Test
    public void test() {
        Predicate<Integer> originPredicate = (num) -> num < 10;
        Predicate<Integer> negatePredicate = originPredicate.negate();
    		// test()와 반대로 return하는 것 -> 참이면 false 반환
        assertThat(negatePredicate.test(5)).isFalse();
    }
    
    // 예제4. - or()
    @Test
    public void test() {
        Predicate<Integer> predicate1 = (num) -> num < 10;
        Predicate<Integer> predicate2 = (num) -> num > 5;
    		// ||와 같은 역할
        assertThat(predicate1.or(predicate2).test(3)).isTrue();	// predicate1만 충족
        assertThat(predicate1.or(predicate2).test(12)).isTrue();	// predicate2만 충족
    }
    
    // 예제5. - isEqual()
    // 두 객체가 동일한지 판단
    // Stream에서 사용될 수 있다.
    @Test
    public void test1() {
        Predicate<Integer> predicate = Predicate.isEqual(5);
        assertThat(predicate.test(5)).isTrue();
        assertThat(predicate.test(6)).isFalse();
    }
    
    @Test
    public void test2() {
        Stream<Integer> stream = IntStream.range(1, 10).boxed();
        stream.filter(Predicate.isEqual(5))
                .forEach(System.out::println);
    }
    ```
    

### 메소드 전달에서 람다로

메소드를 값으로 전달하는 기능은 분명 유용한 기능이다. 하지만 `isHeavyApple` `isGreenApple` 과 같이 한두번만 사용할 메소드를 매번 정의하는 것은 좋다고 하기 애매하다.

이때 자바 8에서는 ‘익명 함수 혹은 람다’ 라고 하는 새로운 개념을 이용할 수 있게 해주었다.

```java
filterApples(inventory, (Apple a) -> GREEN.equals(a.getColor())); 
// 혹은
filterApples(inventory, (Apple a) -> a.getWeight() > 150);
// 심지어는 아래와 같이
filterApples(inventory, (Apple a) -> a.getWeight() > 150 || GREEN.equals(a.getColor())); 
```

이렇게 구현할 수 있게 된 것이다.

## 스트림

```java
class LegacyTest {
  private static void groupTransaction() {
    // 그룹화된 트랜잭션을 더할 Map 생성
    Map<Currency, List<Transaction>> transactionsByCurrencies = new HashMap<>();
    // 트랜잭션의 리스트를 반복
    for (Transaction transcation : transactions) {
      // 고가의 트랜잭션을 필터링
      if (transaction.getPrice() > 1000) {
        // 트랜잭션의 통화 추출
        Currency currency = transaction.getCurrency();
        List<Transaction> transactionsForCurrency = transactionsByCurrencies.get(currency);
        // 현재 통화의 그룹화된 맵에 항목이 없으면 새로 만든다.
        if (transactionsForCurrency == null) {
          transactionsForCurrency = new ArrayList<>();
          transactionsByCurrencies.put(currency, transactionsForCurrency);
        }
        // 현재 탐색된 트랜잭션을 같은 통화의 트랜잭션 리스트에 추가한다.
        transactionsForCurrency.add(transaction);
      }
    }
  }
}
```

만약 리스트에서 고가의 트랜잭션만 필터링한 다음 통화로 결과를 그룹화 해야한다는 가정이 있을 경우 과거에는 위와 같은 코드를 작성했을 것이다.

위의 코드는 중첩된 제어 흐름 문장이 많아서 코드를 한번에 이해하기 힘들다.

만약 스트림 API를 사용하게 되면 아래와 같이 풀어낼 수 있을 것이다.

```java
import static java.util.stream.Collectors.grupingBy;

Map<Currency, List<Transaction>> transactionsByCurrencies =
	transactions.stream()
		.filter((Transaction t) -> t.getPrice() > 1000)
		//고가의 트랜잭션 필터링
		.collect(groupingBy(Transaction::getCurrency));
		//통화로 그룹화
```

위와 같이 짧은 코드로 재탄생 할 수 있다.

스트림 API의 경우 이후에 자세히 사용하기 때문에, 우선 컬렉션API와는 상당히 다른 방식으로 데이터를 처리할 수 있다는 사실만 기억하자.

기존에는 for-each 루프를 통해 각 요소를 반복하는 **‘외부 반복’** 을 사용했다면 스트림 API에서는 내부에서 모든 데이터가 처리된다. 이와 같은 반복을 **‘내부 반복’** 이라고 한다.

### 멀티스레딩은 어렵다

기존의 자바 8이전의 모델에서는 멀티스레딩 모델을 다루기 어려웠다.

자바 8은 스트림 API를 통해 ‘컬렉션을 처리하면서 발생하는 모호함과 반복적인 코드 문제’ 그리고 ‘멀티코어 활용 어려움’ 이라는 두가지 문제를 모두 해결했다.

![Alt text](/static/images/image.png)

위와 같은 방식으로 처리할 수 있게 되었는데 이 방식은 컬렉션을 스트림으로 바꾸고 병렬로 처리한 다음에, 리스트로 다시 복원하는 것이다.

```java
import static java.util.stream.Collectors.toList;

List<Apple> heavyApples =
	inventory.stream().filter((Apple a) -> a.getWeight() > 150)
			.collect(toList());
//이러한 방식으로 순차 처리할 수 있으며

List<Apple> heavyApples =
	inventory.parallelStream().filter((Apple a) -> a.getWeight() > 150)
			.collect(toList());
//이러한 방식으로 병렬 처리할 수 있다.
```

### 디폴트 메소드와 자바 모듈

자바 8에서는 기존의 인터페이스를 쉽게 바꿀 수 있도록 디폴트 메소드를 지원한다.

디폴트 메소드가 실제로 사용된 예시를 확인해 보도록 하자.

자바 8 이전에는 `List<T>`(`List`가 구현하는 인터페이스인 `Collection<T>`도 마찬가지)가 `stream()`이나 `parallelStream()` 이라는 메소드를 지원하지 않고 있었다.

하지만 현재는 사용할 수 있는데, 우리가 기존에 알고있던 인터페이스에 대해서 생각해보자면 만약 `Collection` 인터페이스에 `stream()` 메소드를 추가하고 `ArrayList` 클래스에서 메소드를 구현하는 방식으로 만들었다면 이 인터페이스를 구현하는 모든 클래스에서 새로 추가된 메소드를 구현해야 된다는 것이다.

이는 거의 불가능에 가까울 것이다.

그렇다면 어떻게 이미 공개된 인터페이스를 변경할 수 있을까?

이를 위해서 자바 8에서는 기존의 구현 클래스에서 구현하지 않아도 되는 메소드를 인터페이스에 추가할 수 있는 기능을 제공하였는데, 이것이 **디폴트 메소드이다.**

다른 예시를 살펴보면 현재의 자바 8 이후의 `List`에서는 직접 `sort()` 메소드를 호출할 수 있다.

```java
default void sort(Comparator<? super E> c) {
	Collections.sort(this, c);
}
```

이는 List 인터페이스에 이렇게 디폴트 메소드 정의가 추가되었기 때문이다.

## 함수형 프로그래밍에서 가져온 다른 유용한 아이디어

일반적인 함수형 언어(SML, 오케멀, 하스켈)도 프로그램을 돕는 여러 장치를 제공하는데, 일례로 명시적으로 서술형의 데이터 형식을 이용해 null을 회피하는 기법이 있다.

자바 8에서는 `NullPointerException` 을 피하기 위해 `Optional<T>` 클래스를 제공한다.

이는 값이 없는 상황을 어떻게 처리할지 명시적으로 구현하는 메소드를 포함하고 있다.

1장에서는 전체적으로 가볍게 살펴보았고 2장 이후로 좀 더 자세히 하나하나 다뤄보도록 할 것이다.