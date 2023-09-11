---
title: Modern Java in Action chap3 (2)
date: '2023-08-14'
tags: ['JAVA', '기술서적', Modern_Java_In_Action]
draft: false
summary: Modern Java in Action 3장 람다 표현식 - 2
---
## 형식 검사, 형식 추론, 제약

람다가 어떤 함수형 인터페이스를 구현하는지의 정보는 람다 표현식에 포함되어있지 않다.

그렇다면 어떻게 알 수 있을까.

### 형식 검사

람다가 사용되는 콘텍스트를 통해 람다의 형식을 추론할 수 있다.

어떤 콘텍스트 (람다가 전달될 메소드의 파라미터 혹은 람다가 할당되는 변수)에서 기대되는 람다 표현식의 형식을 **대상 형식** 이라고 한다.

```java
List<Apple> haevyThan150g = 
		filter(inventory, (Apple apple) -> apple.getWeight() > 150);
```

이런 식이 있을 때, 아래와 같은 순서로 확인할 수 있다.

```
1. filter 메소드의 선언을 확인
2. filter 메소드는 두번째 파라미터로 Predicate<Apple> (대상 형식)을 기대한다.
3. Predicate<Apple> 은 test라는 한개의 추상 메소드를 정의한다.
4. test 메소드는 boolean을 반환하는 함수 디스크럽터를 묘사한다.
5. filter 메소드로 전달된 인수는 위와 같은 요구사항을 만족해야 한다.
```

이렇게 유효한 형식임을 알 수 있다.

따라서, 람다 표현식이 예외를 던질 수 있게 하려면 추상 메소드 또한 같은 예외를 던질 수 있도록 throws로 선언해야 한다.

### 참고 : 같은 람다, 다른 함수형 인터페이스

대상 형식이라는 특징 때문에 같은 람다 표현식이더라도 호환되는 추상 메소드를 가진 다른 함수형 인터페이스로 사용될 수 있다.

예를 들면 Callable과 PrivilegedAction 인터페이스는 인수를 받지 않고 Generic의 T를 반환하는 함수를 정의한다.

따라서 이 둘은 같은 람다 표현식을 가질 수 있다.

```
💡 특별한 void 호환 규칙

람다의 바디에 일반 표현식이 있으면 void를 반환하는 함수 디스크립터와 호환된다.
List의 add 메소드는 Consumer 콘텍스트 (T -> void) 가 기대하는 void 대신에 boolean을 반환하지만
이 또한 유효하게 사용될 수 있는 코드이다.
```

### 형식 추론

자바 컴파일러는 람다 표현식이 사용된 **대상 형식**을 이용해 람다 표현식과 관련된 함수형 인터페이스를 추론한다.

즉, 대상 형식을 이용해서 함수 디스크립터를 알 수 있기에 컴파일러는 람다의 시그니처도 추론할 수 있다.

결과적으로 컴파일러는 람다 표현식의 파라미터 형식에 접근할 수 있으므로 람다 문법에서 이를 생략할 수 있는 것이다.

```java
List<Apple> greenApples = 
				filter(inventory, apple -> GREEN.equals(apple.getColor()));
```

이렇게 위와 다르게 Apple이라는 apple의 형식을 지정하지 않았지만 **람다 파라미터 형식을 컴파일러가 추론**하여 생략해도 동작이 된다.

### 참고 : 지역 변수 사용

람다또한 익명 함수가 사용하는 것과 마찬가지로 **자유 변수** (파라미터로 넘겨진 변수가 아닌 외부에서 정의된 변수)를 사용할 수 있다.

이와 같은 동작을 **람다 캡처링**이라고 부른다.

```java
int portNumber = 1337;
Runnalbe r = () -> System.out.println(portNumber);
```

이렇게 portNumber는 외부에서 선언된 변수지만 사용할 수 있다.

하지만 이때 주의할 점이 있는데 사용할 수 있는 지역 변수에는 제약이 있다.

- **final로 선언된 변수**
- **final과 같이 변경되지 않는 변수**

## 메소드 참조

자바 8 코드의 새로운 기능인 메소드 참조에 대해 알아보자.

메소드 참조를 이용하면 기존의 메소드 정의를 재활용해서 람다처럼 전달할 수 있다.

```java
inventory.sort((Apple a1, Apple a2) -> a1.getWeight().compareTo(a2.getWeight()));
```

이러한 기존의 코드를 다음과 같이 바꿀 수 있다.

```java
	inventory.sort(comparing(Apple::getWeight));
```

이제 이것이 무엇인지 알아보도록 할 것이다.

### 요약

메소드 참조는 특정 메소드만 호출하는 람다의 축약형이라고 볼 수 있다.

**이는 메소드 앞에 구분자 (`::`) 를 붙이는 방식으로 메소드 참조를 활용할 수 있다.**

`Apple::getWeight` 를 사용하게 되면 실제로 Apple 클래스에 정의된 `getWeight()` 의 메소드 참조를 하는 것이다.

이는 결과적으로 `(Apple a) -> a.getWeight()` 를 축약한 것이다.

### 메소드 참조를 만드는 방법

1. **정적 메소드 참조**
    
    예를 들어 Integer의 parseInt 메소드는 `Integer::parseInt` 로 표현할 수 있다.
    
2. **다양한 형식의 인스턴스 메소드 참조**
    
    예를 들어 String의 length 메소드는 `String::length` 로 표현할 수 있다.
    
3. **기존 객체의 인스턴스 메소드 참조**
    
    예를 들어 Transaction 객체를 할당 받은 expensiveTransaction 지역 변수가 있고 Transaction 객체에는 getValue 메소드가 있다면, `expensiveTransaction::getValue` 라고 표현할 수 있다.
    

그렇다면 어떻게 활용할 수 있는지 살펴보자.

```java
private boolean isValidateName(String string) {
	return Character.isUpperCase(string.charAt(0));
}

// 이것을 Predicate<String>을 필요로 하는 적당한 위치에 다음과 같이 사용할 수 있다.

filter(words, this::isValidateName);
```

```java
(~) -> ClassName.method(~)

// 이러한 람다식을

ClassName::method

//이렇게 표현할 수 있다.
```

### 생성자 참조

`ClassName::new` 처럼 클래스명과 new 키워드를 이용하면 기존 생성자의 참조를 만들 수 있다.

이것은 정적 메소드의 참조를 만드는 방법과 비슷하다.

예를 들어 인수가 없는 생성자, 즉 `Supplier () → new Apple` 와 같은 시그니처를 갖는 생성자가 있을 때

```java
Supplier<Apple> c1 = Apple::new;
Apple a1 = c1.get();

// 이는 아래와 같은 의미이다.
Supplier<Apple> c1 = () -> new Apple();
```

이렇게 Supplier의 `get()` 을 통해 새로운 Apple 객체를 만들 수 있다.

이번에는 만약 Integer 인수를 갖는 생성자가 있다면 이는 Function 인터페이스의 시그니처와 같기 때문에 이를 사용하여 구현할 수 있다.

```java
Function<Ingteger, Apple> c2 = Apple::new;
Apple a2 = c2.apply(110);
// Function의 apply 메소에 무게를 인수로 넣어서 새로운 Apple객체를 만들 수 있다.

// 이는 아래와 같은 의미이다.
Function<Integer, Apple> c2 = (weight) -> new Apple(weight);
```

이러한 방식을 아래와 같이 이용할 수 있다.

```java
public List<Apple> map(List<Integer> list, Function<Integer, Apple> f) {
	List<Apple> apples = new ArraysList<>();
	for (Integer i : list) {
		result.add(f.apply(i));
	}
	return result;
}

List<Integer> weights = Arrays.asList(7, 3, 4, 10);
List<Apple> apples = map(weights, Apple::new);
```

이렇게 `Apple::new` 로 생성자를 전달하여 사용할 수 있다.

이렇게 인스턴스화하지 않고도 생성자에 접근할 수 있는 기능은 여러 상황에서 응용할 수 있다.

## 람다, 메소드 참조 활용하기

제일 첫 장에서 다룬 사과 리스트를 다양한 정렬 기법으로 정렬하는 문제를 더 세련되고 간결하게 해결하는 방법을 살펴보도록 하자.

### 1단계 : 코드 전달

`sort` 메소드를 사용하여 정렬하는데, 이때 정렬 전략을 어떻게 전달할 수 있을까

`void sort(Comparator<? super E> c)` 이러한 시그니처를 가진다.

이는 Comparator 객체를 인수로 받아 두 사과를 비교하는 것이다.

```java
public class AppleComparator implements Comparator<Apple> {
	public int compare(Apple a1, Apple a2) {
		return a1.getWeight().compareTo(a2.getWeight());
	}
}

inventory.sort(new AppleComparator());
// 구현하여 전달
```

### 2단계 : 익명 클래스 사용

직접 구현하여 한번만 사용하는 것 보다는 익명 클래스를 사용하는 것이 더 효율적일 것이다.

```java
inventory.sort(new Comparaotr<Apple>() {
	public int compare(Apple a1, Apple a2) {
		return a1.getWeight().compareTo(a2.getWeight());
	}
});
```

이렇게 익명 클래스를 사용하여 구현체를 전달하는 방법도 있을 것이다.

여기까지는 람다와 메소드 참조를 사용하지 않고 코드를 작성하는 방법이었다.

### 3단계 : 람다 표현식 사용

이제 함수형 인터페이스를 기대하는 곳에는 람다 표현식을 사용할 수 있다는 것을 알기에 람다 표현실을 사용해보자.

```java
inventory.sort((Apple a1, Apple a2) -> 
				a1.getWeight().compareTo(a2.getWeight()));
```

이렇게 람다 표현식을 사용할 수 있다.

컴파일러는 람다 표현식이 사용된 콘텍스트를 활용하여 람다 파라미터의 형식을 추론할 수 있기 때문에 아래와 같이 더 간추릴 수 있다.

```java
inventory.sort((a1, a2) -> 
				a1.getWeight().compareTo(a2.getWeight()));
```

근데 사실 Comparator는 Comparable 키를 추출하여 Comparator 객체로 만드는 Function 함수를 인수로 받는 정적 메소드 `comparing` 을 포함하고 있다.

따라서 아래와 같이 더 간략하게 표현할 수 있다.

```java
Comparator<Apple> c = Comparator.comparing((Apple a) -> a.getWeight()));
// 이것을 이용하여 아래와 같이 표현 가능하다.

inventory.sort(Comparator.comparing(apple -> apple.getWeight()));
```

### 4단계 : 메소드 참조 사용

메소드 참조를 사용하면 람다 표현식의 인수를 더 깔끔하게 전달할 수 있다.

```java
inventory.sort(comparing(Apple::getWeight));
```

이렇게 굉장히 짧은 코드로 끝낼 수 있다.

**before**

```java
public class AppleComparator implements Comparator<Apple> {
	public int compare(Apple a1, Apple a2) {
		return a1.getWeight().compareTo(a2.getWeight());
	}
}

inventory.sort(new AppleComparator());
// 구현하여 전달
```

**after**

```java
inventory.sort(comparing(Apple::getWeight));
```

## 람다 표현식 조합

람다 표현식을 조합하여 복잡한 람다 표현식을 만들 수 있다.

예를 들어 두 Predicate를 조합하여 두 Predicate의 or 연산을 수행하는 커다른 Predicate를 만들수도 있다.

또한 함수의 결과가 다른 함수의 입력이 되도록 두 함수를 조합 또한 가능하다.

함수형 인터페이스는 어떤 메소드를 제공하기에 이런 일이 가능한 것일까, 그리고 함수형 인터페이스는 메소드를 한개만 가져야 하는데 어떻게 가능한 것인가.

이 부분은 **디폴트 메소드가** 해결해 주는 것이다. (9장에서 설명)

### Comparator 조합

Comparator의 정적 메소드 `comparing` 을 이용하여 비교에 사용할 키를 추출하는 Function 기반의 Comparator를 변환할 수 있다.

```java
Comparator<Apple> c = Comparator.comparing(Apple::getWeight);
```

**역정렬**

 Comparator 인터페이스 자체에서 비교자의 순서를 바꾸는 `reverse` 라는 디폴트 메소드를 제공한다.

```java
inventory.sort(comparing(Apple::getWeight).reversed());
```

**Comparator 연결**

정렬을 하는데 무게가 같은 경우 이를 어떻게 처리할지, 이를 위해서 두번째 Comparator를 만들 수 있다.

예를 들어 무게가 같다면 국가별로 정렬하는 방법이 있다.

`thenComparing` 메소드를 사용하여 두번째 비교자를 만들 수 있다.

```java
inventory.sort(comparing(Apple::getWeight).reversed()
							.thenComparing(Apple::getCountry));
```

### Predicate 조합

Predicate 인터페이스는 복잡한 Predicate를 만들 수 있도록 `negate`, `and`, `or` 세가지 메소드를 제공한다.

**반전시키기**

`negate` 는 특정 Predicate를 반전시킬 때 사용할 수 있다.

```java
Predicate<Apple> notRedApple = redApple.negate();
```

이렇게 기존의 redApple이라는 Predicate객체의 결과를 반전시킨 객체를 만들 수 있다.

**둘 다 만족**

그리고 `and`를 이용하면 두가지를 모두 만족하는 선택을 하는 객체를 만들 수 있다.

```java
Predicate<Apple> redAndHeavyApple = 
		redApple.and(apple -> apple.getWeight() > 150));
```

**둘 중 하나 만족**

마지막으로 `or` 를 사용하면 둘 중 하나인 경우를 위한 객체를 만들 수 있다.

```java
Predicate<Apple> redAndHeavyAppleOrGreen =
		redApple.and(apple -> apple.getWeight() > 150)
						.or(apple -> GREEN.equals(a.getColor()));
```

### Function 조합

마지막으로 Function 인터페이스에서 제공하는 람다 표현식 또한 조합할 수 있다.

Function 인터페이스는 Function 인터페이스를 반환하는 `andThen`, `compose` 두가지 디폴트 메소드를 제공한다.

**결과를 입력으로 받기**

`andThen` 메소드는 주어진 함수를 먼저 적용한 결과를 다른 함수의 입력으로 전달하는 함수를 반환한다.

```java
Function<Integer, Integer> f = x -> x + 1;
Function<Integer, Integer> g = x - > x * 2;
Function<Integer, Integer> h = f.andThen(g);
// 수학적으로 표현하면 g(f(x)) 이다.

int result = h.apply(1);
// (1 + 1) * 2
```

이렇게 f의 결과 값을 g에 넣어 얻은 결과를 사용하는 h를 만들 수 있다.

**결과를 입력으로 전달**

`compose` 메소드는 인수로 주어진 함수를 먼저 실행한 다음에 그 결과를 외부 함수의 인수로 제공한다.

즉, f.andThen(g)에서 andThen 대신 compose를 사용하면 g(f(x))가 아닌 f(g(x))라는 수식이 된다.

```java
Function<Integer, Integer> f = x -> x + 1;
Function<Integer, Integer> g = x - > x * 2;
Function<Integer, Integer> h = f.compose(g);
// 수학적으로 표현하면 f(g(x)) 이다.

int result = h.apply(1);
// (1 * 2) + 1
```

이렇게 여러 유틸리티 메소드를 조합하면 다양한 변환 파이프라인을 반들 수 있다.