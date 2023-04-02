---
title: BackEnd 스터디 2주차
date: '2023-04-01'
tags: ['기술', '스터디']
draft: false
summary: 2주차 Spring MVC (Bean 객체와 싱글톤 디자인 패턴)에 대하여
---

# 2주차 Spring MVC (Bean 객체와 싱글톤 디자인 패턴)

## MVC 패턴?

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F7bc27623-fd64-466d-ab42-3be2f3750494%2FUntitled.png?table=block&id=020f214f-0e98-4d1c-9ccf-b46ec322112d&spaceId=ed58f7c6-46bb-48c4-829a-b24be3b7faa2&width=1920&userId=db5d5977-127f-463d-b91b-77eec4b05d2d&cache=v2)

### 이는 소프트웨어 디자인 패턴 중 하나로 아래와 같이 이루어져있다.

### M(Model) V(View) C(Controller)

- **Model** : 애플리케이션의 정보나 데이터, DB 등을 의미한다.
- **View** : 사용자에게 보여지는 화면 즉, UI를 의미하는 것으로 M으로 부터 정보를 얻고 표시할 수 있다.
- **Controller** : 데이터와 비즈니스 로직 사이의 상호 동작을 관리한다.
  즉, 모델과 뷰를 통제한다.

---

### 이 MVC 패턴은 크게 MVC1 과 MVC2 로 나눌 수 있다.

### MVC 1

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Faacd5fa9-3ff8-4133-8ef2-ec4908e48fa1%2FUntitled.png?table=block&id=4bf106f8-f289-4dfc-9a76-f1224a8f73b3&spaceId=ed58f7c6-46bb-48c4-829a-b24be3b7faa2&width=1920&userId=db5d5977-127f-463d-b91b-77eec4b05d2d&cache=v2)

이는 **View와 Controller를 JSP에서 모두 처리**하는 형태를 의미한다.

즉, JSP 하나로 유저의 요청을 받고 응답을 처리하는 것으로 구현은 쉽다.

(사실, 나는 해본 적 없는 구조이다. 😅)

**이 경우 구현은 쉽지만, JSP 하나에서 모두 처리하게 되니 코드의 재사용성이 매우 떨어지게 되며 코드를 읽고 해석하기 어려워 유지 보수에서 큰 단점을 가지고 있다.**

---

### MVC 2

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F22b64725-1b5b-45e5-b263-921a9a977642%2FUntitled.png?table=block&id=87187c66-7299-4816-a392-f8ce87455801&spaceId=ed58f7c6-46bb-48c4-829a-b24be3b7faa2&width=1920&userId=db5d5977-127f-463d-b91b-77eec4b05d2d&cache=v2)

이 MVC 2 패턴의 경우 널리 사용되는 구조이다.

요청을 하나의 컨트롤러(Servlet)이 먼저 받고 처리하는 방식으로 **Controller와 View가 분리**되어 있다.

즉, 유지 보수의 경우에도 M, V, C 중에서 수정 할 부분을 찾아서 수정해주면 되는 것이다.

물론 구조가 이전보다 복잡해진다는 단점이 있을 수 있겠지만, 여러 프레임 워크가 이러한 문제를 해결해주고 있다.

이러한 프레임 워크 → **스프링!**

---

## Spring MVC 패턴

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fe9bea2e8-15fe-4ee9-9e22-4e407da3c70c%2FUntitled.png?table=block&spaceId=ed58f7c6-46bb-48c4-829a-b24be3b7faa2&id=a6d9d578-49ef-471c-9c4d-58d7a83a150e&width=1920&userId=db5d5977-127f-463d-b91b-77eec4b05d2d&cache=v2)

위의 그림이 스프링의 MVC 패턴이 동작하는 방식을 한눈에 표현한 그림이다.

스프링에서는 위에 보이는 **Dispatcher Servlet** 가 핵심적인 역할을 하고 있다.

이는 요청을 받으면 해당 요청을 분석하고 세부 컨트롤러들에게 작업을 나눠주는 것이다.

자세하게 살펴보면, 핸들러 매핑, 핸들러 어댑터, 뷰 리졸버 등등 다양한 내용이 있지만 너무 길어질 듯 하니 스킵… 하겠다.

**(궁금하면 참고 : [https://www.notion.so/MVC-1-3377cf22b2f045febdabdf1075a6f2a3](https://www.notion.so/3377cf22b2f045febdabdf1075a6f2a3))**

---

## Bean 객체란?

흔히 스프링을 사용하다 보면 Bean 객체를 등록한다 와 같이 Bean이라는 단어를 많이 들어봤을 것이다.

이 Bean은 무엇일까?

> **Bean객체란 스프링 IoC 컨테이너가 관리하는 자바 객체를 의미한다.**

```
ℹ️ Info

IoC는 무엇이지?

Ioc란 제어의 역전이란 것으로, 객체의 생성 및 제어권을 사용자가 아닌
스프링이 가져가는 것이다.

즉, IoC가 적용된 경우 해당 객체의 제어권은 스프링이 가지고 있는 것이다.
```

### Bean 객체 등록하기

그렇다면 어떻게 Bean 객체로 등록할 수 있을까

이미 알고 있는 사실일 것 같지만, **@Component 어노테이션**을 달아주면 빈으로 등록되게 된다.

-

빈 설정 파일에 직접 등록하기 또한 가능하다.

이 또한 이미 알고 있을 듯 하지만, **@Configuration 을 통해 설정 클래스**를 지정해준 이후, 해당 클래스에서 **@Bean 어노테이션**을 통해 수동으로 빈을 등록할 수 있다.

```java
@Configuration
public class myConfig {

		@Bean
		public myBean() {
				~~~
		}
}
```

이렇게 등록해줄 수 있다.

---

## 싱글톤 디자인 패턴

지금까지 MVC와 Spring MVC 그리고 Bean 객체에 대해 알아보았다.

근데, 공부하다 보면 싱글톤이라는 단어 또한 많이 들어보지 않았던가, **싱글톤 디자인**이란 무엇일까

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F0d6db907-a501-4005-8d81-0ab31c9156b8%2FUntitled.png?table=block&id=a4cc1774-902d-444a-b367-df00e4b8a2c6&spaceId=ed58f7c6-46bb-48c4-829a-b24be3b7faa2&width=1920&userId=db5d5977-127f-463d-b91b-77eec4b05d2d&cache=v2)

### 싱글톤 패턴이란?

정의는 쉽다.

> **객체의 인스턴스가 오직 1개만 생성되는 패턴!**

이렇게 단순한 정의를 가지고 있다.

그렇다면 이러한 패턴을 왜 사용하는 것일까?

### 싱글톤 패턴을 사용하는 이유

싱글톤 패턴을 사용하게 되면 어떤 부분이 좋을까

단순하게 생각하면 객체를 하나만 생성하기 때문에 **메모리에 좋을 것**이다.

그리고 계속 생성하지 않을 것이니 **속도도 빠를 것**이다.

또 어떤 이점이 있을까

**데이터 공유가 쉽다**는 장점이 있다. 싱글톤 인스턴스는 전역으로 사용되는 인스턴스이기 때문에 다른 클래스의 인스턴스들이 접근하여 사용하기 용이하다.

하지만, 여러 클래스의 인스턴스에서 싱글톤 인스턴스의 데이터에 접근하다가 **동시에 접근하게 되면 동시성 문제가 발생할 수 있기 때문에 이 부분은 주의하여 설계**하는 것이 좋다.

### 주의점

싱글톤 패턴을 통해 다양한 효율을 얻을 수 있다는 이점이 있지만, 분명한 단점이 존재한다.

우선, 구현 코드 자체가 많이 필요하다는 점이 있다.

그리고 테스트 하기도 어렵다.

왜냐하면 싱글톤 인스턴스의 경우 자원을 공유하기 때문에 테스트가 격리된 환경에서 수행되려면 매번 인스턴스의 상태를 초기화 시켜줘야 한다.

이 외에도 다양한 문제점을 가지고 있기도 하다.

즉, 이러한 문제점이 많기 때문에 좋지만 설계도 주의해야 하고, 어려움이 많기도 하다.

하지만, **스프링이 이러한 어려움을 많이 해결해줄 수 있다.**

## 스프링은 Bean 객체를 싱글톤으로 관리한다

즉, 위에서 설명한 주의점을 신경쓰며 주의 깊게 오랜 시간 설계하는 것이 아닌, **스프링을 사용하게 되면 Bean 객체를 등록하면 싱글톤 패턴으로 사용할 수 있게 되는 것이다.**

---
