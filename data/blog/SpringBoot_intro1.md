---
title: 스프링 부트 설정과 시작
date: '2022-8-27'
tags: ['spring boot', '인프런', '김영한']
draft: false
summary: https://start.spring.io/ 에서 스프링 부트를 프로젝트를 생성하고 시작할 수 있다.
---

## SPRING BOOT 시작

[https://start.spring.io/](https://start.spring.io/) 에서 스프링 부트를 시작한다.

요즘에는 Maven보다 Gradle을 많이 사용한다고 하여 Gradle Project를 고르고 Java, 버전, 이름 선택하여 생성을 한다.

그 전에 필요한 라이브러리를 미리 받아서 사용할 수 있다.

## 생성 이후

build.gradle파일을 들어가면 버전 설정, 라이브러리 정보 등등이 작성되어 있는것을 확인할 수 있다.

```java
dependencies {
	implementation 'org.springframework.boot:spring-boot-starter-thymeleaf'
	implementation 'org.springframework.boot:spring-boot-starter-web'
	testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```

이런식으로 시작할때 넣어둔 라이브러리가 함께 들어가있는 모습을 확인할 수 있다.

```java
repositories {
	mavenCentral()
}
```

이것은 위의 라이브러리를 어디서 다운받는지 지정하는 것이다.

---

src→main→java, resources가 있는데, java에는 자바코드, 그 외에는 resources에 들어가게 된다.

---

## Intellij에서 내부서버 포트를 변경시킬 상황에서...

→src/main/resources/application.properties파일에서

```java
server.port=포트번호
```

이렇게 작성해서 사용한다.

혹은 상단의 Run → Edit Configurations의 Environment variables에서 server.port=~~로 설정하면 된다.

Gradle내부의 Dependencies를 살펴보면 각 라이브러리들의 의존관계를 살펴볼 수 있다.

---

## Gradle은 의존관계가 있는 라이브러리를 함께 다운로드 한다.

### 스프링 부트 라이브러리

- **spring-boot-starter-web**

  →spring-boot-starter-tomcat: 톰캣 (웹서버)

  →spring-webmvc: 스프링 웹 MVC

- **spring-boot-starter-thymeleaf: 타임리프 템플릿 엔진(View)**
- **spring-boot-starter(공통): 스프링 부트 + 스프링 코어 + 로깅**

  → spring-boot

  → spring-core

  → spring-boot-starter-logging

  → logback, slf4j

### 테스트 라이브러리

- **spring-boot-starter-test**

  →junit: 테스트 프레임워크

  →mockito: 목 라이브러리

  →assertj: 테스트 코드를 좀 더 편하게 작성하게 도와주는 라이브러리

  →spring-test: 스프링 통합 테스트 지원

---

### 이외에 페이지를 통해 실행을 하기 위해서는?

```java
package hello.hellospring.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HelloController {
    @GetMapping("hello")
    public String hello(Model model){
        model.addAttribute("data","hello!!");
        return "hello";
    }
```

**hello**라는 매핑을 받으면 아래의 model을 통해서 data에 hello를 바인딩한다.

→ **_여기서 GetMapping은 “get”, “post”에서 그 “get”을 의미한다._**

그리고 그 값을 hello로 리턴시키며 보내줌

```HTML
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <title>Hello</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
</head>
<body>
<p th:text="'안녕하세요. ' + ${data}" >안녕하세요. 손님</p>
<!-- th란 thymeleaf에서의 th이다. -->
</body>
</html>
```

받은 내용을 해당 페이지에서 뿌려주게 된다.

**이 부분은 이제 template 엔진으로 /src/main/resources/templates에 생성하게 된다.**
