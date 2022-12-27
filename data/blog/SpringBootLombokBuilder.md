---
title: 롬복 @Builder 패턴
date: '2022-12-29'
tags: ['spring boot', 'JPA', '기술']
draft: false
summary: 롬복은 @Builder 이라는 것을 제공해주는데 이것은 무엇이며 어떻게 사용하는 것일까?
---

## @Builder 사용법에 대해서 알아보도록 하자.

`**@Builder` 를 사용하게 되면 생성자를 사용할 때 발생하는 단점을 쉽게 해결할 수 있다.\*\*

우리는 보통 객체를 정의하고 해당 객체를 생성할 때 생성자를 통해 생성한다.

하지만 만약 많은 파라미터가 필요하다면 생성자는 굉장히 복잡한 구조를 가지게 될 것이다.

**이때 `@Builder` 를 사용하게 되면 각각의 생성자를 만들지 않아도 Builder를 통해 간단히 구현할 수 있다.**

```java
@Getter
@Entity
@NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userCode;
    private String userId;
    private String userPw;
    private String userName;

    @Builder
    public User(Long userCode, String userId, String userPw, String userName) {
        this.userCode = userCode;
        this.userId = userId;
        this.userName = userName;
        this.userPw = userPw;
    }
}
```

이렇게 생성자 위에 `@Builder` 어노테이션을 넣어주게 되면 빌더패턴을 사용할 수 있다.

**이제 `builder()` 메소드를 통해 값을 넣어주고 마지막에 `.build();` 를 통해서 완성하면 되는 것이다.**

```java
@Getter
@Setter
public class UserDto {
    String userId, userPw, userName;

    public User userDtoToUser() {
        return User.builder()
                .userId(userId)
                .userPw(userPw)
                .userName(userName)
                .build();
    }
}
```

이런 식으로 `dto`를 `Entity`로 변환할 수 있는 것이다.

### 그런데, 만약 값이 필드의 수가 많아지면 너무 가독성이 떨어지지 않을까?

이런 경우 사실 더 간단한 방법이 있다.

**빌더패턴을 사용할 객체에 `@Builder` 어노테이션을 달아주는 것이다.**

**그러면 자동으로 이전에 작성했던 부분이 구현되어 있게 된다.**

```java
@Entity
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Board {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long boardCode;
    private String boardTitle;
    private String boardSubject;
    private String userName;
    private int boardHit;

    public void updateOneBoard(String boardTitle, String boardSubject) {
        this.boardTitle = boardTitle;
        this.boardSubject = boardSubject;
    }
}
```

이런 식으로 사용하면 되는 것이다.

`**@Builder` 를 클래스 위에 넣어줘서 따로 작성하지 않아도 되게 됐다.\*\*

이제 마찬가지로 `dto` 에서 `Entity` 로 변환하는 작업을 수행하면 된다.

```java
@Getter
@Setter
public class BoardDto {
    String boardTitle, boardSubject, userName;
    int boardHit;

    public Board boardDtoToBoard() {
        return Board.builder()
                .boardHit(boardHit)
                .boardSubject(boardSubject)
                .boardTitle(boardTitle)
                .userName(userName)
                .build();
    }
}
```

이런 식으로 진행하면 이전에 작성했던 모습과 같은 모습으로 사용할 수 있다.

## 문제 : `@NoArgsConstructor(access = AccessLevel.PROTECTED)` 를 통해 무분별한 객체 생성을 막아주는데 이 때 `@Builder` 를 사용하면 오류가 발생할 수 있다.

왜냐하면 `@Builder` 사용 시 모든 멤버변수를 받는 생성자가 필요하기 때문이다.

따라서 위의 경우가 아니더라도 일부 변수를 가지는 생성자만 존재하면 오류가 발생하게 된다.

그럼 어떻게 해결해야 할까.

**손수 모든 멤버변수를 받는 생성자를 만들거나 `@AllArgsConstructor` 를 함께 사용하면 된다.**

이제 `@Bulider` 를 활용하도록 해보자.
