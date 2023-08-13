---
title: Modern Java in Action chap3 (1)
date: '2023-08-13'
tags: ['JAVA', '기술서적']
draft: false
summary: Modern Java in Action 3장 람다 표현식 - 1
---
## 람다란 무엇인가

람다 표현식은 메소드로 전달할 수 있는 익명 함수를 단순화한 것이라고 할 수 있다.

다음은 람다의 특징이다.

- **익명**
    
    보통의 메소드와 달리 이름이 없으므로 **익명**이라고 표현한다. 구현해야 할 코드에 대한 걱정거리가 줄어든다.
    
- **함수**
    
    람다는 메소드처럼 특정 클래스에 종속되지 않으므로 **함수**라고 부른다.
    
    하지만 메소드처럼 파라미터 리스트, 바디, 반환 형식, 가능한 예외 리스트를 포함한다.
    
- **전달**
    
    람다 표현식을 메소드 인수로 전달하거나 변수로 저장할 수 있다.
    
- **간결성**
    
    익명 클래스처럼 많은 자질구래한 코드를 구현할 필요가 없다.
    

그러면 어떤 코드가 나올 수 있을까

예를 들어 기존의 커스텀 Comparator 객체를 기존보다 더 간단하게 구현할 수 있다.

```java
Comparator<Apple> byWeight = nwe Comparator<Apple>() {
	public int compare(Apple a1, Apple a2) {
		return a1.getWeight().compareTo(a2.getWeight());
	}
};
```

기존에는 이렇게 작성하여 사용했었다.

그렇다면 람다를 사용하면 어떻게 간단하게 작성할 수 있을까

```java
Comparator<Apple> byWeight = 
		(Apple a1, Apple a2) -> a1.getWeight().compareTo(a2.getWeight());
```

이렇게 훨씬 더 간단하게 작성할 수 있다.

이 코드를 어떻게 해석할 수 있는지는 아래에서 작성할 것이다.

우선 이렇게 사과 두개의 무게를 비교하는 코드를 전달할 수 있다는 것을 알아두자.

```java
(Apple a1, Apple a2) 이 부분은 람다 파라미터 (파라미터 리스트)

-> 이부분은 화살표

a1.getWeight().compareTo(a2.getWeight()); 이 부분은 람다 바디
```

이렇게 부를 수  있다.

## 어디에, 어떻게 람다를 사용할까

이전의 Chap2에서 작성한 필터 메소드에도 람다를 사용할 수 있다.

```java
List<Apple> greenApples = 
		filter(inventory, (Apple a) -> GREEN.equals(a.getColor()));
```

이런식으로 말이다.

이 경우에는 함수형 인터페이스 `Predicate<T>` 를 기대하는 `filter()` 메소드의 두번째 인수로 람다 표현식을 전달한 것이다.

그렇다면 함수형 인터페이스가 무엇인지 알아봐야 한다.

## 함수형 인터페이스

**함수형 메소드는 정확히 하나의 추상 메소드를 지정하는 인터페이스를 말한다.**

따라서 `Predicate<T>` 는 함수형 인터페이스다. 왜냐? `Predicate<T>` 는 오직 하나의 추상 메소드만 지정하기 때문이다.

```java
public interface Predicate<T> {
	boolean test (T t)
}
```

지금까지 살펴본 자바 API의 함수형 인터페이스는 `Comparator`, `Runnable` 이 있었다.

<aside>
📌 디폴트 메소드가 아무리 많더라도 **추상 메소드가 오직 하나**라면 함수형 인터페이스이다.

</aside>

그렇다면 함수형 인터페이스로 무엇을 할 수 있을까?

람다 표현식으로 함수형 인터페이스의 추상 메소드를 구현을 직접 전달할 수 있으므로 **전체 표현식을 함수형 인터페이스의 인스턴스로 취급**할 수 있다.

하나 더 예를 들어 보자면

```java
public interface Runnable {
	void run();
}
```

```java
process(() -> System.out.println("Hello World"));
```

이것은 `Runnable` 함수형 인터페이스를 이용한 람다 표현식이다.

→ 단 하나의 추상 메소드 `run()` 을 정의한 것이다.

## 함수 디스크립터

함수형 인터페이스의 추상 메소드 시그니처는 람다 표현식의 시그니처를 가리킨다.

그리고 **람다 표현식의 시그니처를** 서술하는 메소드를 **함수 디스크립터라**고 부른다.

> **함수 시그니처란 함수의 원형에 명시되는 매개변수 리스트**
> 

예를 들어 `Runnable` 인터페이스의 유일한 추상 메소드 `run()` 은 인수와 반환값이 없으므로 `Runnable` 인터페이스는 인수와 반환값이 없는 시그니처이다.

이전에 사용한 것들을 생각해보면 아래와 같다.

```java
() -> void 이것은 파라미터 리스트가 없으며 반환형은 void 임을 의미한다.
(Apple a1, Apple a2) -> int 이것은 두개의 Apple을 인수로 받으며 반환형은 int 임을 의미한다.
```

다시한번 생각하면 람다 표현식은 변수에 할당하거나, 함수형 인터페이스를 인수로 갖는 메소드로 전달할 수 있으며 함수형 인터페이스의 추상 메소드와 같은 시그니처를 갖는다는 사실을 우선 기억해두자.

```java
public void process(Runnable r) {
	r.run();
}

이것을

process(() -> System.out.println("Hello!!"));

이렇게 작성할 수 있다는 것!
```

## 람다 활용 : 실행 어라운드 패턴

람다와 동작 파라미터화로 유연하고 간결한 코드를 구현하는데 도움을 줄 수 있는 실용적인 예제를 살펴보자

![Alt text](/static/images/lamda1.png)

이와 같이 **설정 과정**과 **정리 과정**이 실제 자원을 처리하는 코드를 감싸고 있는 형식을 **실행 어라운드 패턴**이라고 부른다.

```java
public String processFile() throws IOException {
	try (BufferedReader br = new BufferedReader(new FileReader("data.txt")));
		return br.readLine(); // 이 부분이 실제 작업을 하는 부분
	}
}
```

이러한 코드 모양이 나올 것이다.

이때 간결하게 표현할 수 있는 방법을 알아 볼 것이다.

### 1단계 : 동작 파라미터화를 기억하라

현재 코드는 파일에서 한 번에 한 줄만 읽을 수 있다. 한 번에 두 줄을 읽거나 가장 자주 사용되는 단어를 반환하려면 어떻게 할까.

기존의 설정, 정리 과정을 재활용하면서 `processFile` 메소드만 다른 동작을 수행하도록 명령하면 좋을 것이다.

이때 `processFile` 의 동작을 파라미터화 하는 것이다.

`BufferedReader` 를 이용하여 다른 동작을 수행할 수 있도록 `processFile` 메소드로 동작을 전달해야 한다.

이때 람다를 사용할 수 있다.

→ `processFile` 메소드가 한 번에 두개의 행을 읽게 할 수 있도록 해보자.

`BufferedReader` 를 인수로 받아서 String을 반환하는 람다를 만들어야 한다.

```java
String result = processFile((BufferedReader br) ->
															br.readLine() + br.readLine());
```

### 2단계 : 함수형 인터페이스를 이용해서 동작 전달

함수형 인터페이스 자리에 람다를 사용할 수 있다.

따라서 `BufferedReader -> String` 과 IOException을 던질 수 있는 시그니처와 일치하는 함수형 인터페이스를 만들어서 사용할 수 있다.

이러한 인터페이스를 **BufferedReaderProcessor** 라고 만들고 사용해보자.

```java
@FunctionalInterface
public interface BufferedReaderProcessor {
	String process(BufferedReader br) throws IOException;
}

// 그리고 이것을 사용하기
public String processFile(BufferedReaderProcessor p) throws IOException {
	...
}
```

이렇게 정의한 인터페이스를 `ProcessFile` 메소드의 인수로 전달할 수 있다.

### 3단계 : 동작 실행

람다의 코드는함수형 인터페이스의 추상 메소드 구현을 직접 전달할 수 있다는 것을 앞에서 살펴보았다.

따라서 아래와 같이 표현할 수 있다.

```java
public String processFile(BufferdReaderProcessor p) throws IOException {
	try (BufferdReader br = new BubfferedReader(new FileReader("data.txt"))) {
		return p.process(br);
	}
}
```

이와 같은 `processFile` 메소드를 완성할 수 있다.

### 4단계 : 람다 전달

이제 람다를 이용해서 다양한 동작을 `processFile` 메소드에 전달하여 사용할 수 있다.

```java
// 한 행만 읽을 경우
String oneLine = processFile((BufferedReader br -> br.readLine()));
// 인터페이스의 추상 메소드를 br.readLine() 으로 구현

// 두 행을 읽을 경우
String twoLine = processFile((BufferedReader br 
																		-> br.readLine() + br.readLine()));
```

이와 같이 유연한 `processFile` 메소드를 만들 수 있다.

그렇다면 이제 다양한 람다를 전달하는 데 재활용 할 수 있는 자바 8에 추가도니 새로운 인터페이스를 살펴볼 것이다.

## 함수형 인터페이스 사용

앞에서 살펴본 것과 같이 함수형 인터페이스는 오직하나의 추상 메소드를 지정한다.

그리고 함수형 인터페이스의 추상 메소드는 람다 표현식의 시그니처를 묘사한다.

이러한 함수형 인터페이스의 추상 **메소드의 시그니처**를 **함수 디스크럽터**라고 한다.

이미 자바 API는 **Comparable**, **Runnable**, **Callable** 과 같은 다양한 함수형 인터페이스를 포함하고 있다.

자바 8 라이브러리 설계자들은 `java.util.function` 패키지로 여러 새로운 함수형 인터페이스를 제공한다.

이제, **Predicate**, **Consumer**, **Funtion** 인터페이스에 대해서 알아볼 것이다.

### Predicate

이 인터페이스는 `test`라는 추상 메소드를 정의하며 test는 Generic 형식의 T 객체를 인수로 받아 boolean을 반환한다.

T형식의 객체를 사용하는 불리언 표현식이 필요한 상황에서 Predicate 인터페이스를 사용할 수 있다.

```java
@FunctionalInterface
public interface Predicate<T> {
    boolean test(T t);
}

public <T> List<T> filter(List<T> list, Predicate<T> p) {
	List<T> results = new ArrayList<>();
	for (T t : list) {
		if (p.test(t)) {
			results.add(t);
		}
	}
	return results;
}

Predicate<String> nonEmptyStringPredicate = (String s) -> !s.isEmpty();
List<String> nonEmpty = filter(listOfStrings, nonEmptyStringPredicate);
```

이런식으로 작성될 수 있다.

물론 이것 또한 람다 식으로 만들 수 있다.

```java
List<String> nonEmpty = filter(List.of("a", "", "b"), (String s) -> !s.isEmpty());
```

이런식으로 말이다.

### Consumer

이는 Generic형식 T를 받아서 void를 반환하는 `accept` 라는 추상 메소드를 정의하고 있다.

따라서, T 형식의 객체를 받아서 어떤 동작을 수행하고자 할 때 Consumer 인터페이스를 사용할 수 있다.

이번에는 Integer 리스트를 인수로 받아서 각 항목에 어떤 동작을 수행하는 `forEach` 메소드를 정의할 때 Consumer를 사용할 수 있다.

```java
@FunctionalInterface
public interface Consumer<T> {
    R accept(T t);
}

public <T> void forEach(List<T> list, Consumer<T> c) {
	for (T t : list) {
		c.accept(t);
	}
}

//사용
forEach(
			Arrays.asList(1, 2, 3, 4, 5),
			(Integer i) -> System.out.println(i); // accept 구현
)
```

이렇게 1,2,3,4,5를 받아서 각각의 내용을 출력하는 메소드를 만들 수 있다.

### Function

이는 Generic 형식 T를 인수로 받아서 Generic 형식 R 객체를 반환하는 추상 메소드 `apply` 를 정의한다.

입력을 출력으로 매핑하는 람다를 정의할 때 Function 인터페이스를 사용할 수 있다.

아래와 같이 String 리스트를 인수로 받아 각 String의 길이를 포함하는 Integer 리스토로 변환하는 `map` 메소드를 정의할 수 있다.

```java
@FunctionalInterface
public interface Function<T, R> {
    R apply(T t);
}

public <T, R> List<R> map(List<T> list, Function<T, R> f) {
	List<R> result = new ArrayList<>();
	for (T t : list) {
		result.add(f.apply(t));
	}
	return result;
}

List<Integer> l = map(
			Arrays.asList("lamdas", "in", "action"),
			(String s) -> s.length() // 이 부분이 Fucntion의 apply 메소드 구현
);
```

즉, String을 인수로 받아서 Integer를 반환하는 Funtion의 메소드를 구현할 수 있다.

### 기본형 특화

지금까지 세 개의 제네릭 함수형 인터페이스를 살펴봤는데, 이외에 특화된 형식의 함수형 인터페이스 또한 존재한다.

자바의 모든 형식은 참조형 (Byte, Integer, Object, List …) 혹은 기본형 (int, double, byte …) 이렇게 이루어져 있는데, 위의 함수형 인터페이슨는 Generic 형식만 사용할 수 있다.

하지만 자바에는 기본형을 참조형으로 변환하는 **박싱** 과 참조형을 기본형으로 변환하는 **언박싱** 을 제공하고 있다.

그리고 이러한 기능을 자동으로 이루어지게 하는 **오토박싱** 을 제공한다.

하지만, 이러한 **오토박싱** 과정에서 **박싱한 값은 Wrapper**이기 때문에 **힙에 저장되고, 이러한 과정에서 메모리를 더 소비**하게 된다.

따라서 자바 8에서는 기본형을 입출력으로 제공하는 즉, 오토박싱을 피할 수 있게 해주는 특별한 버전의 함수형 인터페이스를 제공한다.

예를 들면, **Predicate가 int형을 받기 위한 IntPredicate**를 제공한다.

이러한 형식으로 함수형 인터페이스의 이름 앞에 형식명이(Double, Int, Long…) 붙는다.

또한 Function 인터페이싀 경우 출력 형식 파라미터를 함께 제공한다.

예를 들면 **IntFunction** (출력은 Generic으로) **ToIntFunction** (입력은 Generic으로), **IntToDouble** (입력과 출력 모두 지정)

이렇게 존재한다.