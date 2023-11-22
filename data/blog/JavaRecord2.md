---
title: Java 레코드(record) - (2) 활용
date: '2023-11-22'
tags: ['JAVA', '기술']
draft: false
summary: record를 어디에 활용하면 좋을까
---
## 어디에 활용할 수 있을까?

record를 처음 본 순간 느꼈는데, 이는 딱 DTO에 활용하면 아주 괜찮을 것 같다는 생각이 들었다.

이 생각을 가지고 찾아보니 이미 수많은 사람들이 DTO 클래스를 record로 변경한 사례가 많이 보였다.

### DTO에 record가 적합한 이유

단순하게 데이터를 한쪽에서 다른 곳으로 전달하기 위해서만 사용되는 데이터 전송 객체(DTO)를 생각해보자면…

단순히 데이터만 담아두는 객체인데, 우리는 이를 구현하기 위해서 여러가지의 똑같은 구조의 코드를 반복해서 작성하고 있다.

물론, 롬복을 사용하고 있지만..?

<aside>
🤔 **Lombok**과 **record**의 차이는 이따가 살펴보도록 하자.

</aside>

```java
@Getter
@ToString
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class PostDto {
    private Long id;
    private String title;
    private String content;
}
```

이런식으로 작성하던 코드가?

```java
public record PostRecordDto(Long id, String title, String content) { }
```

이렇게, 즉

```java
@Getter
@ToString
@EqualsAndHashCode
@AllArgsConstructor
```

이런 롬복 어노테이션을 굳이 사용하지 않아도 된다는 것이다.

따라서 기존의 DTO클래스를 record로 변경하면 유용하게 사용할 수 있을 듯 하다.

> **Kotlin**의 **data class**와 **Java**의 **record**가 거의 유사하다고 한다!
> 

---

### 장점

1. 코드 다이어트
    
    다양한 어노테이션의 기능이 기본으로 탑재되어 있어서 코드 다이어트가 가능하다!
    
2. 불변 객체
    
    데이터가 오가는 중에 수정될 일이 절대로 없다.
    
    모두 기본이 `private final` 이다.
    

### 단점

물론, 모든 것이 그렇듯 장점만 존재할 수 없다.

1. 적은 필드에서만 유용
    
    아무래도 record 는 불변 객체이므로 생성자를 통해서만 값을 지정할 수 있다.
    
    ```java
    public record SignUpDto(String username, String password, String phone,
                            String email, String sex, String name,
                            String role, String memberStatus) {}
    ```
    
    이런식으로 좀 파라미터를 많이 가져서 뚱뚱한 객체가 나타난다.
    
    따라서 이를 인스턴스화 시키기 위해서는
    
    ```java
    SignUpDto dto = new SignUpDto("abc123", "1234", "01012341234",
            "email@email.com", "male", "Tanziro",
            "member", "active");
    ```
    
    이런 과정을 거쳐야 하는데, 이때 순서가 하나로 바뀐다면 잘못된 객체가 생성되어 저장될 수 있다는 문제가 있다…
    
2. 불변 객체
    
    사실 이건 단점이라고 하기는 애매하다.
    
    데이터가 가공되어야 한다면, class로 변환하여 `@Setter` 를 추가하는게 좋겠지만, 기본적으로 `@Setter` 사용을 될 수 있다면 하지 않기 때문에 크게 문제되지 않을 것 같다.
    
3. 상속 불가
    
    모든 필드가 `final` 이며 불변 객체로 상속이 불가능하다는 문제가 있다.
    
    물론, DTO를 상속할 일은 없지 않을까 싶다.
    

---

하지만, 2번과 3번의 경우는 크게 고려하지 않아도 될만한 단점으로 보이기 때문에 1번을 고려하며 기존의 클래스와 record 사이의 결정을 고민하면 되지 않을까 한다.

## Lombok 과 record

번외로, **Lombok**과 **record**를 비교해보도록 하자.

사실 새로 나타난 record의 기능도 Lombok을 통해 사용해왔다.

Lombok은 일부 널리 알려진 패턴을 Java의 바이트 코드로 자동 생성해주는 Java 라이브러리로 이 또한 record와 마찬가지로 boilerplate code를 줄이는데 유용하게 사용될 수 있다.

따라서, record와 Lombok중에 어느 상황에서 무엇이 적절한지 판단하고 사용해야 한다.

몇가지 비교할만한 사항이 있지만, DTO에서 고려할 사항을 위에서 다루었기 때문에 추가적인 사항은 아래의 링크를 읽어보길 바란다.

[Java 14 Record vs. Lombok | Baeldung](https://www.baeldung.com/java-record-vs-lombok)