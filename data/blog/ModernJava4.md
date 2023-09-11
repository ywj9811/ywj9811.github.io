---
title: Modern Java in Action chap4
date: '2023-09-11'
tags: ['JAVA', '기술서적', Modern_Java_In_Action]
draft: false
summary: Modern Java in Action 4장 스트림 소개
---
# 스트림 소개

## 스트림이란 무엇인가

스트림(Stream)은 자바8 API에 새로 추가된 기능으로, 스트림을 이용하면 선언형으로 컬렉션 데이터를 처리할 수 있다.

또한 스트림을 이용하면 멀티스레드 코드를 구현하지 않아도 데이터를 투명하게 병렬로 처리할 수 있다.

**그렇다면 스트림은 정확히 무엇일까?**

**스트림이란 ‘데이터 처리 연산을 지원하도록 소스에서 추출된 연속된 요소’ 로 정리할 수 있다.**

- **연속된 요소**
    
    컬렉션과 마찬가지로 스트림은 특정 요소 형식으로 이루어진 연속된 값 집합의 인터페이스를 제공한다.
    
    하지만, **스트림은 filter, sorted, map 처럼 표현 계산식이 주를 이룬다.**
    
    즉, 데이터가 주제인 컬렉션과 다르게 **스트림의 주제는 계산이다.**
    
- **소스**
    
    **스트림은 컬렉션, 배열, I/O 자원 등의 데이터 제공 소스로부터 데이터를 소비한다.**
    
    정렬된 컬렉션으로 스트림을 생성하면 정렬이 그대로 유지되는 것이다.
    
- **데이터 처리 연산**
    
    스트림은 함수형 프로그래밍 언어에서 일반적으로 지원하는 연산, 그리고 데이터베이스와 비슷한 연산을 지원한다.
    
    예를 들어 filter, map, reduce, find, match, sort 등으로 데이터를 조작할 수 있고 스트림 연산은 순차적으로 혹은 병렬로 실행할 수 있다.
    
- **파이프라이닝**
    
    대부분의 스트림 연산은 스트림 연산끼리 연결해서 커다른 파이프 라인을 구성할 수 있도록 스트림 자신을 반환하며 이를 통해 Jaziness, Short circuit과 같은 최적화도 얻을 수 있다.
    
    이는 데이터 소스에 적용하는 데이터베이스 질의와 비슷하다.
    
- **내부 반복**
    
    반복자를 이용해서 명시적으로 반복하는 컬렉션과 달리 스트림은 내부 반복을 지원한다.
    

### 예시

```java
List<Dish> lowCaloricDishes = new ArrayList<>();
for(Dish dish : menu) {
	if(dish.getCalories() < 400) {
		lowCaloricDishes.add(dish);
	}
}

Collections.sort(lowCaloricDishes, new Comparator<Dish>() { //익명 클래스로 요리 정렬
	public int compare(Dish dish1, Dish dish2) {
		return Integer.compare(dish1.getCalories(), dish2.getCalories());
	}
});

List<String> lowCaloricDishesName = new ArrayList<>();
for(Dish dish : lowCaloricDishes) {
	lowCaloricDishesName.add(dish.getName());
}
```

위의 코드는 자바7 을 기준으로 하는 기존의 코드이다.

여기서는 lowCaloricDishes라는 ‘가비지 변수’를 사용하였는데, 이는 컨테이너 역할만 하는 중간 변수인 것이다.

자바 8에서는 이러한 세부 구현을 라이브러리 내에서 모두 처리한다.

```java
import static java.util.Comparator.comparing;
import static java.util.Stream.Collectors.toList;

List<String> lowCaloricDishesName = 
						menu.stream()
								.filter(d -> d.getCalories() < 400)
								.sorted(comparing(Dish::getCalories))
								.map(Dish::getName)
								.collect(toList());
```

이렇게 400칼로리 이하의 요리 선택하여 칼로리로 요리 정렬을 모두 한번에 진행할 수 있다.

이때 `stream()` 을 `parallelStream()` 으로 바꾸게 되면 이 코드를 멀티코어 아키텍처에서 병렬로 실행할 수 있다.

```java

List<String> lowCaloricDishesName = 
						menu.parallelStream()
								.filter(d -> d.getCalories() < 400)
								.sorted(comparing(Dish::getCalories))
								.map(Dish::getName)
								.collect(toList());
```

`parallelStream()` 호출을 통해 어떤 일이 일어나고, 얼마나 많은 스레드가 사용될지는 이후의 7장에서 자세히 살펴보도록 하고, 우선 이러한 스트림이 소프트웨어 공학적으로 어떤 이득을 주는지 확인하자.

1. 선언형으로 코드를 구현할 수 있다.
    
    즉, 루프와 if 조건문 등의 제어 블록을 사용하여 어떻게 동작을 구현할지 지정할 필요 없이 ‘저칼로리 요리만 선택하라’ 같은 동작의 수행을 지정할 수 있는 것이다.
    
2. filter, sorted, map, collect 같은 여러 빌딩 블록 연산을 연결해서 복잡한 데이터 처리 파이프라인을 만들 수 있다.
    
    위의 경우 menu → filter → sorted → map → collect 순으로 결과를 연결한 것이다.
    

### 스트림 API의 특징

- 선언형 : 더 간결하고 가독성이 좋아진다.
- 조립할 수 있음 : 유연성이 좋아진다.
- 병렬화 : 성능이 좋아진다.

## 스트림 시작하기

스트림 작업에서 가장 간단한 작업은 컬렉션 스트림이 있다.

자바 8의 컬렉션에는 스트림을 반환하는 `stream()` 이 추가되었다.

```java
import static java.util.stream.Collectors.toList;

List<String> threeHighCaloricDishNames =
			menu.stream()
					.filter(dish -> dish.getCalories() > 300) // 필터링 하여 고기 얻음
					.map(Dish::getName) // 이름을 얻음
					.limit(3) // 선착순 3개만
					.collect(toList()); // 리스트로 만든다.
```

위의 예시는 위에서 스트림이란 무엇인지 설명한 것에 대한 거의 모든 것을 가지고 있는데 설명하자면 다음과 같다.

1. 연속된 요소
    
    menu라는 데이터 소스는 연속된 요소를 스트림에 제공한다.
    
2. 데이터 처리 연산
    
    스트림에 filter, map, limit, collect 로 이어지는 일련의 데이터 처리 연산을 적용한다.
    
3. 파이프라이닝
    
    collect를 제외한 모든 연산은 서로 파이프라인을 형성할 수 있도록 스트림을 반환한다.
    

그렇다면 각각의 데이터 처리 연산은 무엇일까

- filter : 람다를 인수로 받아 스트림에서 특정 요소를 제외시킨다.
- map : 람다를 이용하여 한 요소를 다른 요소로 변환하거나 정보를 추출한다.
    
    (Dish::getName) 혹은 (d - > d.getName())
    
- limit : 정해진 개수 이상의 요소가 스트림에 저장되지 못하게 스트림 크기를 축소 truncate한다.
- collect : 스트림을 다른 형식으로 변환한다.

위와 같이 스트림을 이용하게 되면 기존의 람다만 사용하는 것보다 더 선언형으로 데이터를 처리할 수 있다.

## 스트림과 컬렉션

자바 8이전에 존재하던 기존의 컬렉션과 자바 8부터 나온 스트림 모두 연속된 요소 형식의 값을 저장하는 자료구조의 인터페이스를 제공하는데, 여기서 ‘연속된’ 이라는 표현은 순서와 상관없이 아무 값에나 접속하는 것이 아닌 순차적으로 값에 접근하는 것을 의미한다.

그렇다면 스트림과 컬렉션에는 어떤 차이가 있을까?

### 차이점

예를 들어 DVD와 인터넷 스트리밍을 생각할 수 있다.

DVD의 경우 전체 자료구조가 저장되어 있으므로 이러한 DVD는 컬렉션인 것이다.

인터넷 스트리밍은 비디오를 재생할 때 사용자가 시청하는 부분의 몇 프레임을 미리 내려받고, 다른 대부분의 값을 처리하지 않은 상태에서 미리 내려받은 프레임을 재생할 수 있다.

이러한 인터넷 스트리밍은 스트림인 것이다.

**즉, 데이터를 언제 계산하느냐가 컬렉션과 스트림의 가장 큰 차이점이다.**

컬렉션은 현재 자료구조가 포함하는 모든 값을 메모리에 저장하는 자료구조이다.

→ 컬렉션의 모든 요소는컬렉션에 추가하기 전에 계산되어야 한다.

스트림은 이론적으로 요청할 때만 요소를 계산하는 고정된 자료구조이다.

→ 스트림은 생성자와 소비자 관계를 형성한다. 또한 스트림은 게으르게 만들어지는 컬렉션과 같은데 즉, 사용자가 데이터를 요청할 때만 값을 계산하는 것이다.

### 스트림은 딱 한 번만 탐색할 수 있다.

스트림은 반복자와 마찬가지로 한 번만 탐색할 수 있는데 즉, 탐색된 스트림의 요소는 소비되는 것이다.

한 번 탐색한 요소를 다시 탐색하려면 초기 데이터 소스에서 새로운 스트림을 만들어야 하는 것이다.

(그러기 위해서는 데이터 소스는 컬렉션과 같이 반복 사용할 수 있는 형태여야 한다.)

```java
List<String> title = Arrays.sort("Java8", "In", "Action");

Stream<String> stream = titile.stream();
stream.forEach(System.out::println);
// stream은 이제 소비되어 없어졌다
stream.forEach(System.out::println); 
// IllegalStateException발생 : 이미 stream은 소비되었음
```

### 외부 반복과 내부 반복

사용자가 직접 for-each와 같은 방식을 통해 반복한다면 이는 **외부 반복**이다.

→ 컬렉션 인터페이스를 사용하기 위해서는 외부 반복을 사용한다.

스트림 라이브러리는 반복을 알아서 처리하고 결과 스트림값을 어딘가에 저장해주는 **내부 반복**을 사용한다.

```java
List<String> names = new ArrayList<>();
for(Dish dish : menu) {
	names.add(menu.getName());
}
```

위와 같이 컬렉션을 만들 때는 외부 반복을 이용하고 있다.

```java
List<String> names = menu.stream()
												.map(Dish::getName())
												// map메소드를 getName메소드로 파라미터화해서 요리명 추출
												.collect(toList());
												//파이프라인을 실행한다 -> 반복자 필요 없다.
```

위와 같이 스트림은 내부 반복을 사용하기 때문에 직접 반복문을 사용하는 부분이 없다.

스트림의 내부 반복의 장점은 단순하다는 것 뿐만이 아니다.

**스트림 라이브러리의 내부 반복은 데이터 표현과 하드웨어를 활용한 병렬성 구현을 자동으로 선택한다는 것이다.**

외부 반복에서는 병렬성을 스스로 관리해야 하는데, 그렇게 되면 synchronized로 시작하여 복잡하고 머리아픈 내용이 기다리고 있을 것이다.

### 스트림 연산

java.util.stream.Stream 인터페이스는 많은 연산을 정의하고 있는데, 스트림 인터페이스의 연산을 크게 두가지로 구분할 수 있다.

```java
List<String> names = menu.stream()
												.filter(dish -> dish.getCallories() > 300)
												.map(Dish::getName())
												.limit(3)
												.collect(toList());
```

위 예제에서 연산을 두 그룹으로 구분할 수 있다.

- filter, map, limit 은 서로 연결되어 파이프라인을 형성한다.
- collect 로 파이프라인을 실행한 다음에 닫는다.

이렇게 연결할 수 있는 스트림 연산을 **중간 연산**이라고 하며, 스트림을 닫는 연산을 **최종 연산**이라고 한다.

### 중간 연산

filter, sorted와 같은 중간 연산은 **스트림을 반환**한다.

중간 연산의 중요한 특징은 단말 연산 혹은 최종 연산이 없다면 아무 연산도 수행하지 않는다는 것이다.

즉, lazy하다는 것이다.

→ 중간 연산을 합친 다음에 합쳐진 중간 연산을 최종 연산으로 한 번에 처리하기 때문이다.

스트림 파이프라인에서 어떤 일이 일어나는지 쉽게 확인하기 위해 람다가 현재 처리 중인 요리를 출력해보자

```java
List<String> names = 
		menu.stream()
		.filter(dish -> {
						System.out.println("filtering:" + dish.getName());
						return dish.getCalories() > 300;
		})
		.map(dish -> {
				System.out.println("mapping:" + dish.getName());
		})
		.limit(3)
		.collect(toList());
System.out.println(names);
```

위와 같은 코드를 실행하게 되면 결과는 아래와 같이 나올 것이다.

```java
filtering:pork
mapping:pork
filtering:beef
mapping:beef
filtering:chicken
mapping:chicken
[pork, beef, chicken]
```

스트림의 lazy한 특성 덕분에 몇 가지 최적화 효과를 얻을 수 있었다.

1. 300 칼로리가 넘는 요리는 여러 개지만 오직 3개만 선택되었다.
    
    이는 limit 연산 그리고 short circuit 이라는 기법 덕분이다.
    
2. fileter와 map은 서로 다른 연산이지만 한 과정으로 병합되었다.
    
    이는 loop fusion이라고 한다.
    

### 최종 연산

최종 연산은 스트림 파이프라인에서 결과를 도출하는 것이다.

이를 통해 보통 List, Integer, void 등등 스트림 이외의 다양한 결과가 반환된다.

그동안 `collect(toList())` 를 통해 List를 반환하는 것을 보았으니, 이번에는 `forEach` 를 통해 void가 반환되는 것을 확인해보자.

```java
menu.stream().forEach(System.out::println);
```

이는 menu에서 만든 스트림의 모든 요리를 출력한다.

### 스트림 이용하기

스트림 이용 과정은 다음과 같이 세가지로 요약할 수 있다.

1. 질의를 수행할 데이터 소스 (컬렉션 등등)
2. 스트림 파이프라인을 구성할 중간 연산 연결
3. 스트림 파이프라인을 실행하고 결과를 만들 최종 연산

스트림 파이프라인의 개념은 빌더 패턴(Builder pattern)과 비슷하다.

| 연산 | 형식 | 반환 형식 | 연산의 인수 | 함수 디스크립터 |
| --- | --- | --- | --- | --- |
| filter | 중간 연산 | Stream<T> | Predicate<T> | T → boolean |
| map | 중간 연산 | Stream<R> | Function<T, R> | T → R |
| limit | 중간 연산 | Stream<T> |  |  |
| sorted | 중간 연산 | Stream<T> | Comparator<T> | (T, T) → int |
| distinct | 중간 연산 | Stream<T> |  |  |

| 연산 | 형식 | 반환 형식 | 목적 |
| --- | --- | --- | --- |
| forEach | 최종 연산 | void | 스트림의 각 요소를 소비하며 람다를 적용 |
| count | 최종 연산 | long (generic) | 스트림의 요소 개수 반환 |
| collect | 최종 연산 |  | 스트림을 reduce하여 리스트, 맵, 정수 형식의 컬렉션을 만든다. |