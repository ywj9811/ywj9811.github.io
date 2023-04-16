---
title: Spring 전역의 예외 처리
date: '2023-04-16'
tags: ['SPRING-BOOT', '기술']
draft: false
summary: Spring 컨트롤러 전역의 예외를 처리하려면 어떻게 해야할까
---

## Spring 전역의 예외 처리

## 전역에서 예외 처리하기

`try/catch` `@ExceptionHandler` 를 통해 컨트롤러 내에서 예외를 처리할 수 있다.

**그럼에도 왜 전역에서 처리하려고 하는 것일까**

이 경우 컨트롤러가 늘어나게 되면 예외 처리에 대한 중복 코드도 늘어나고 많은 양의 코드를 다루게 될 것이다.

즉, 유지 보수가 어려워지게 될 것이다!

**이런 문제를 전역에서 예외 처리를 한다면 해결할 수 있다.**

**`@ControllerAdvice` 혹은 `@RestControllerAdvice` 를 사용하는데 이 어노테이션은 AOP의 방식**으로 Application 전역에서 발생하는 모든 컨트롤러의 예외를 한 곳에서 관리할 수 있게 해준다.

## 어떻게 사용할까

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(LineException.class)
    public ResponseEntity<ErrorResponse> handleLineException(final LineException error) {
        // ...
    }

    // ...
}
```

이는 컨트롤러에서 발생하는 모든 예외를 **`@RestControllerAdvice`** 가 잡고, **`@ExceptionHandler`** 가 개별적으로 예외를 잡아 처리하는 방식이다.

### 잠깐, 왜 `@RestControllerAdvice`, `@ControllerAdvice`를 나눠서 사용할까

사실 둘 다 **`@Controller`, `@RestController` 모두 잡을 수 있다.**

그렇다면 무엇이 다를까

후자는 @ResponseBody가 추가되었다고 보면 된다.

즉, 자바 객체를 Json/Xml 형태로 변환하여 HTTP ResponseBody에 담아줄 수 있다.

### `@RestController` 의 예외만 처리하고 싶다면?

이 경우는 **`@RestControllerAdvice(annotation = RestController.class)`** 이렇게 세팅하면 해당하는 예외만 처리할 수 있다. 이외의 어노테이션도 마찬가지다!

## GlobalExceptionHandler 를 만들어보자

그럼 이제 왜 사용하는지, 어떤 식으로 동작하는지 알았으니, 어떻게 만드는지 알아보자.

```java
public class ApplicationException extends RuntimeException {

    private final String errorCode;
    private final HttpStatus httpStatus;

    public ApplicationException(String errorCode, HttpStatus httpStatus, String message) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}
```

우선 이렇게 `RuntimeException`을 처리하는 `ApplicationException`이라는 클래스를 하나 만들었다.

→ ❓여기서 **super(message)를 한 이유는? RuntimeException에 이미 message를 포함**하는 생성자가 있다.

```java
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final String LOG_FORMAT = "Class : {}, Code : {}, Message : {}";

    @ExceptionHandler(ApplicationException.class)
    public ResponseEntity<ApiErrorResponse> applicationException(ApplicationException e) {
        String errorCode = e.getErrorCode();
        log.warn(
                LOG_FORMAT,
                e.getClass().getSimpleName(),
                errorCode,
                e.getMessage()
        );
        return ResponseEntity
                .status(e.getHttpStatus())
                .body(new ApiErrorResponse(errorCode, e.getMessage()));
    }
}
```

이렇게 만들게 되면, 해당하는 **RestController**에서 예외가 발생하면 **GlobalExceptionHandler**가 모두 잡고, 여기서 `@ExceptionHandler`가 해당하는 예외를 잡아서 처리하는 것이다.

만약 해당하는 예외가 발생하게 되면, 설정해둔 포멧에 맞게 만들어져 Json타입으로 반환되게 되는 것이다.

**이를 통해서 컨트롤러에서 예외가 던져지면 위의 경우 RuntimeException은 잡아서 모두 처리하게 된다.**

> 참고 : https://w97ww.tistory.com/74 , https://tecoble.techcourse.co.kr/
