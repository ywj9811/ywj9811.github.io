---
title: 우아한테크코스의 라이브러리
date: '2022-11-06'
tags: ['우아한테크코스', '프리코스']
draft: false
summary: 'camp.nextstep.edu.missionutils.Console 이 무엇이고 camp.nextstep.edu.missionutils.Randoms는 무엇일까?'
authors: ['default']
---

## camp.nextstep.edu.missionutils.Console 이 무엇일까?

**우아한 테크코스에서 직접 만들어서 사용하는 라이브러인듯 하다.**

- **readLine()**
- **getInstance()**
- **isClosed()**

이렇게 3개의 메소드가 있다.

---

> 사용자가 입력하는 값은 `camp.nextstep.edu.missionutils.Console`의 `readLine()`을 활용한다.

이런 요구사항이 있었으니 `readLine()` 부터 알아보도록 하자

```java
public static String readLine() {
		return getInstance().nextLine();
}
```

```java
private static Scanner getInstance() {
		if (Objects.isNull(scanner) || isClosed()) {
				scanner = new Scanner(System.in);
		}
		return scanner;
}
```

살펴보면, `getInstance().nextLine()` 을 반환하고 있다.

그러면 `getInstance()` 메소드는 무엇일까

찾아보면 **Scanner** 객체를 생성하는 메소드이다!

**그렇게 `scanner.nextLine();` 을 사용하는 것이다.!**

그럼 어떤 메소드가 더 있을까?

`private static boolean isClosed()` 이라는 메소드가 있다.

```java
private static boolean isClosed() {
	try {
		final Field sourceClosedField = Scanner.class.getDeclaredField("sourceClosed");
		sourceClosedField.setAccessible(true);
		return sourceClosedField.getBoolean(scanner);
	} catch (final Exception e) {
		System.out.println("unable to determine if the scanner is closed.");
	}
	return true;
}
```

어렵다.

찾아보도록 하자.

**`getDeclaredField` 는 특정 인스턴스의 멤버변수, 메소드 등에 접근할 수 있다고 한다.**

그리고 Scanner 클래스를 들어가서 살펴보면

`private boolean sourceClosed = false;` 이렇게 적혀있는 모습을 확인할 수 있는데

`Scanner.class.getDeclaredField("sourceClosed");` 여기에 적혀있는 `sourceClosed` 와 같은 부분이다!

즉, `final Field sourceClosedField = Scanner.class.getDeclaredField("sourceClosed");` 를 통해서 `sourceClosedField` 가 `private boolean sourceClosed = false;` 라는 멤버 변수에 접근할 수 있었다.

**`setAccessible` 는 멤버변수의 값에 대한 접근을 허용해주는 역할을 하는 것이다.**

따라서 `sourceClosedField.setAccessible(true);` 이것을 통해서 멤버 변수 값에 대한 접근을 허용하는 것이다.

`return sourceClosedField.getBoolean(scanner);` 이는 Filed 클래스의 getBoolean()을 이용하는 듯 한데 대략적으로 scanner의 객체 존재 여부를 리턴하는 것이다.

```java
final Field sourceClosedField = Scanner.class.getDeclaredField("sourceClosed");
//멤버 변수에 접근할 수 있도록 해준다.
sourceClosedField.setAccessible(true);
//멤버 변수의 값에 접근을 허용해준다.
return sourceClosedField.getBoolean(scanner);
//scanner객체의 여부를 리턴한다.
```

이렇게 해석할 수 있을 듯 하다.

### 정리

- **readLine() → Scanner 객체의 readLine() 동일하게 사용할 수 있도록 해주는 메소드이다.**
- **getInstance() → Scanner 객체를 생성해주는 메소드이다.**
- **isClosed() → Scanner 객체의 여부를 반환하는 메소드이다.**

---

## camp.nextstep.edu.missionutils.Randoms이 무엇일까?

- **`pickNumberInList(final List<Integer> numbers)`**
- **`pickNumberInRange(final int startInclusive, final int endInclusive)`**
- **`pickUniqueNumbersInRange( final int startInclusive, final int endInclusive, final int count`)**
- **`shuffle(final List<T> list)`**
- **`validateNumbers(final List<Integer> numbers)`**
- **`validateRange(final int startInclusive, final int endInclusive)`**
- **`validateCount(final int startInclusive, final int endInclusive, final int count)`**

다양하게 많이 존재한다.

---

> Random 값 추출은 `camp.nextstep.edu.missionutils.Randoms`의 `pickNumberInRange()`를 활용한다.

마찬가지로 위와 같은 요구 사항이 있었으니 `pickNumberInRange()`를 먼저 알아보도록 하자.

```java
public static int pickNumberInRange(final int startInclusive, final int endInclusive) {
	validateRange(startInclusive, endInclusive);
	return startInclusive + defaultRandom.nextInt(endInclusive - startInclusive + 1);
}
```

이 메소드를 살펴보면 중간에 `validateRange()` 메소드를 호출하고 있다.

그럼 `validateRange()` 메소드는 무엇일까?

```java
private static void validateRange(final int startInclusive, final int endInclusive) {
	if (startInclusive > endInclusive) {
			throw new IllegalArgumentException("startInclusive cannot be greater than endInclusive.");
	}
	if (endInclusive == Integer.MAX_VALUE) {
			throw new IllegalArgumentException("endInclusive cannot be greater than Integer.MAX_VALUE.");
	}
	if (endInclusive - startInclusive >= Integer.MAX_VALUE) {
			throw new IllegalArgumentException("the input range is too large.");
	}
}
```

확인하면 순서대로

- startInclusive가 endInclusive 보다 클 경우
- endInclusive 가 Integer클래스의 최대값과 같을 경우
- endInclusive - startInclusive 가 Integer의 최대값보다 크거나 같을 경우

3가지 경우에 `IllegalArgumentException`을 발생시키고 있다.

**→ 최대값은 Integer 클래스에 들어가면 MAX_VALUE가 정의되어 있다.**

다시 `pickNumberInRange` 로 돌아오면 우선 `validateRange`로 검사를 한 후 **java.util의 Random클래스**의 `nextInt()` 를 사용하게 된다.

→ **defaultRandom**을 확인하면 결국 **java.util.Random**으로 이어진다.

단, 실제로 사용하는 **java.util.concurrent.ThreadLocalRandom** 은 **java.util.Random**를 상속 받은 것으로 우리가 사용하는 기능은 비슷하지만 멀티 쓰레드 환경에서 서로 다른 인스턴스들에 의해 의사 난수를 반환하므로 동시성 문제에 안전하다고 한다.

그리고 리턴값은 `startInclusive + defaultRandom.nextInt(endInclusive - startInclusive + 1);` 이렇게 갖게 되는 것이다.

`**Randoms.pickNumberInRange(1, 9);` 이렇게 사용하면 1 + (0~8) 의 숫자를 얻게 되는 것이다.\*\*

이제 순서대로 메소드를 알아보도록 하자.

`pickNumberInList(final List<Integer> numbers)` 이것은 무슨 메소드일까

```java
public static int pickNumberInList(final List<Integer> numbers) {
    validateNumbers(numbers);
    return numbers.get(pickNumberInRange(0, numbers.size() - 1));
}
```

마찬가지로 우선 검증 과정을 거친다.

하지만 이번에는 validateNumbers라는 메소드이다.

```java
private static void validateNumbers(final List<Integer> numbers) {
	if (numbers.isEmpty()) {
			throw new IllegalArgumentException("numbers cannot be empty.");
	}
}
```

살펴보니 넘어온 리스트가 빈값인지 확인하는 것이다.

그럼 다시 본래의 메소드로 돌아오면

다음으로 **List.get()의 인덱스로** `pickNumberInRange()` 메소드를 호출하고있다.

**즉, 넘어온 리스트의 인덱스중 랜덤으로 아무 값이나 뽑아서 리턴하는 것이다.**

**`pickNumberInList` 이름이 바로 의미와 같다.**

이번에는 `pickUniqueNumbersInRange` 에 대해서 알아보도록 하자.

파라미터로 많은 값을 받는다.

```java
public static List<Integer> pickUniqueNumbersInRange(
	final int startInclusive,
	final int endInclusive,
	final int count
	) {
			validateRange(startInclusive, endInclusive);
			validateCount(startInclusive, endInclusive, count);
			final List<Integer> numbers = new ArrayList<>();
			for (int i = startInclusive; i <= endInclusive; i++) {
			numbers.add(i);
			}
	return shuffle(numbers).subList(0, count);
}
```

이 메소드에서 호출하고 있는 `validateCount(final int startInclusive, final int endInclusive, final int count)` 에 대해서 살펴보면

```java
private static void validateCount(final int startInclusive, final int endInclusive, final int count) {
	if (count < 0) {
		throw new IllegalArgumentException("count cannot be less than zero.");
	}
	if (endInclusive - startInclusive + 1 < count) {
			throw new IllegalArgumentException("count cannot be greater than the input range.");
	}
}
```

넘어온 count가 0보다 작다면 예외를 발생 시키고, endInclusive - startInclusive가 count보다 작으면 예외를 발생시키고 있다.

다시 원래의 메소드로 돌아오면, 해당 메소드는 validateRange와 validateCount 두가지의 검증 과정을 거치고 통과가 된다면 numbers라는 Integer 타입의 리스트를 만들어

```java
for (int i = startInclusive; i <= endInclusive; i++) {
	numbers.add(i);
}
```

위 과정을 통해 리스트에 값을 추가하게 된다.

이후 `shuffle(final List<T> list)`이라는 메소드를 호출 하는데 이 메소드 또한 살펴보면

```java
public static <T> List<T> shuffle(final List<T> list) {
	final List<T> result = new ArrayList<>(list);
	Collections.shuffle(result);
	return result;
}
```

파라미터로 넘어온 List를 `Collections.shuffle` 을 통해 값들을 랜덤한 순서로 섞어서 리턴하게 된다.

**그럼 본래의 메소드를 다시 살펴보면 그렇게 랜덤으로 섞여서 돌아온 리스트에서 `subList(0, count);` 를 통해 잘라서 일부분을 리턴하게 되는 것이다. (0번 ~ count-1번 까지)**

### 정리

- **`pickNumberInList(final List<Integer> numbers)`**
  → **넘어온 리스트의 인덱스중 랜덤으로 아무 값이나 뽑아서 리턴하는 것이다.**
- **`pickNumberInRange(final int startInclusive, final int endInclusive)`**
  **→ 넘긴 범위에 해당하는 숫자를 랜덤으로 받는 것이다.**
- pickUniqueNumbersInRange(
  final int startInclusive,
  final int endInclusive,
  final int count
  )
      → **startInclusive부터 endInclusive까지 순서대로 리스트에 추가하고 해당 리스트를 랜덤으로 섞은 후 0번 ~ count-1번 인덱스 까지 잘라낸 리스트로 반환한다.**
- **`shuffle(final List<T> list)`**
  **→ 넘어온 리스트를 `Collections.shuffle`을 통해 섞어준다.**
- **`validateNumbers(final List<Integer> numbers)`**
  **→ 넘어온 리스트가 비어있는지 검증한다. (비어있다면 예외 발생)**
- **`validateRange(final int startInclusive, final int endInclusive)`**
  **→ startInclusive가 endInclusive 보다 클 경우**
  **endInclusive 가 Integer클래스의 최대값과 같을 경우**
  **endInclusive - startInclusive 가 Integer의 최대값보다 크거나 같을 경우**
  **위 3가지 경우에 해당하면 예외를 발생시키는 것이다.**
- **`validateCount(final int startInclusive, final int endInclusive, final int count)`**
  **→ 넘어온 count가 0보다 작다면 예외를 발생 시키고, endInclusive - startInclusive가 count보다 작으면 예외를 발생시키고 있다.**
