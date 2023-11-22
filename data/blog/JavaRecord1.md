---
title: Java 레코드(record) - (1) 기본 개념
date: '2023-11-22'
tags: ['JAVA', '기술']
draft: false
summary: Java14에 등장하고 16에서 정식 출시된 record는 무엇일까?
---
### Oracle의 Java14 공식 문서를 확인하면 다음과 같이 나와있다.

```java
final class Rectangle implements Shape {
    final double length;
    final double width;
    
    public Rectangle(double length, double width) {
        this.length = length;
        this.width = width;
    }
    
    double length() { return length; }
    double width() { return width; }
}
```

다음과 같은 특징이 있습니다.

- 모든 회원이 최종 선언됩니다.
- 유일한 메소드는 생성자 
`Rectangle(double length, double width)length()width()`
    
    와 두 개의 접근자로 구성됩니다
    

이 클래스를 레코드로 나타낼 수 있습니다.

```java
record Rectangle(float length, float width) { }
```

이렇게 작성되어 있다.

---

## 그렇다면 Java 14부터 생긴 record는 무엇일까?

기존의 우리는 데이터베이스 결과, 쿼리 결과, 서비스 정보 등의 데이터를 간단히 보관하기 위해 클래스를 작성했었다.

그리고 이 경우 데이터는 불변성의 특징을 가지도록 구현했다.

이를 위해서 다음과 같은 조건을 사용했을 것이다.

1. 각 데이터 조각에 대한 `private`, `final` 필드
2. 각 필드에 대한 `getter`
3. 각 필드에 해당 인수가 있는 생성자
4. 빌더 등등

```java
@Getter
@AllArgsConstructor
@Builder
public class SignUp {
    private final String name;
		private final String address;
}
```

예를 들어 위와 같이 작성했을 것이다.

하지만, 이 경우 두가지 문제가 있다.

1. boilerplate code가 많이 있다.
    
    각 데이터 클래스에 대해 동일하고 지루한 과정을 반복해야 한다.
    
    ex) 생성자를 만들고, getter를 만들고… (물론, 이를 위해 롬복을 사용하지만)
    
2. 우리의 클래스 목적을 모호하게 한다.
    
    클래스가 단순히 이름과 주소라는 두개의 String 필드가 있는 데이터 클래스라는 사실이 모호해진다.
    

이때 더 나은 접근 방식은 클래스가 데이터 클래스임을 명시적으로 선언하는 것이다.

우리는 이를 위해서 반복적인 데이터 클래스를 record로 대체할 수 있다.

> record 는 필드의 유형과 이름만 필요한 불변 데이터 클래스이다.
Equals ,  *hashCode* 및 *toString* 메소드와 *private, final* 필드 및 *public 생성자* 는 Java 컴파일러에 의해 생성됩니다.
> 

이제, 우리는 위의 코드를

```java
public record Person (String name, String address) {}
```

이렇게 나타낼 수 있다.

### public 생성자 제공

이제 각 필드에 대한 인수가 포함된 public 생성자가 자동으로 생성된다.

```java
public Person(String name, String address) {
    this.name = name;
    this.address = address;
}
```

따라서 우리는 클래스와 동일한 방식으로 객체를 인스턴스화 할 수 있다.

```java
Person person = new Person("John Doe", "100 Linda Ln.");
```

### getter 제공

이에 대한 사용법은 다음과 같다.

```java
@Test
public void givenValidNameAndAddress_whenGetNameAndAddress_thenExpectedValuesReturned() {
    String name = "John Doe";
    String address = "100 Linda Ln.";

    Person person = new Person(name, address);

    assertEquals(name, person.name());
    assertEquals(address, person.address());
}
```

즉, `객체.필드()` 이렇게 사용하면 된다.

### equals() 제공

```java
@Test
public void givenSameNameAndAddress_whenEquals_thenPersonsEqual() {
    String name = "John Doe";
    String address = "100 Linda Ln.";

    Person person1 = new Person(name, address);
    Person person2 = new Person(name, address);

    assertTrue(person1.equals(person2));
}
```

이는 true/false를 반환한다.

### 커스텀 생성자 구현

```java
public record Person(String name, String address) {
    public Person {
        Objects.requireNonNull(name);
        Objects.requireNonNull(address);
    }
}
// null 여부 확인할 수 있도록 구현

public record Person(String name, String address) {
    public Person(String name) {
        this(name, "Unknown");
    }
}
// address에는 "Unknown" 넣도록 구현
```

기존의 클래스에서의 방식과 마찬가지로 구현할 수 있다.

다만, 컴팩트 생성자(매개변수를 받는 부분이 사라진 형태)와 같은 매개변수를 받는 생성자를 생성하는 경우 컴파일 에러가 발생하게 된다.

> **컴팩트 생성자 : 매개변수를 받는 부분이 사라진 형태의 생성자로, 내부에서 인스턴스 필드에 접근할 수 없고 validate를 수행하는 용도로 적당하다.**
> 

```java
public record Person(String name, String address) {
    public Person {
        Objects.requireNonNull(name);
        Objects.requireNonNull(address);
    }
    
    public Person(String name, String address) {
        this.name = name;
        this.address = address;
    }
}
```

이와 같이 name, address를 받는 생성자를 만들게 되면 컴팩트 생성자와 동일한 매개변수를 받기 때문에 컴파일에서 에러가 발생하게 된다.

### static 변수 및 메소드

일반 Java의 클래스와 마찬가지로 record에도 static 변수와 메소드를 생성할 수 있다.

```java
public record Person(String name, String address) {
    public static String UNKNOWN_ADDRESS = "Unknown";
}
// static 변수 생성

public record Person(String name, String address) {
    public static Person unnamed(String address) {
        return new Person("Unnamed", address);
    }
}
//static 메소드 생성
```

```java
Person.UNKNOWN_ADDRESS
Person.unnamed("100 Linda Ln.");
```

이런식으로 record 이름으로 static 변수 혹은 메소드를 자유롭게 참조할 수 있다.