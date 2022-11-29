---
title: 스프링 부트 MVC 와 API에 대해서
date: '2022-8-28'
tags: ['spring boot', '인프런', '김영한', '스프링 입문']
draft: false
summary: model / view / controller 를 사용하는 것을 의미한다.
---

## MVC와 템플릿 엔진

**model/view/controller를 사용하여 하는 것을 의미한다.**

```java
@GetMapping("hello-mvc")
    public String helloMvc(@RequestParam("name") String name, Model model){
        /*@RequestParam!*/
        model.addAttribute("name", name);
        return "hello-template";
    }
```

```html
<html xmlns:th="http://www.thymeleaf.org">
  <body>
    <p th:text="'hello ' + ${name}">hello! empty</p>
  </body>
</html>
```

서버가 실행되고 있을 때 `localhost:8181/hello-mvc?name=spring` 을 입력하게 되면 해당 값을 내장 톰켓 서버에서 받아서 컨테이너로 접근 → 해당 맵핑이 존재하면 찾아감 → spring이라는 파라미터 값을 name에 넣어주고 return하여 `viewResolver` 에서 변환을 하여 웹브라우저로 반환한다.

---

## API에 대해서

API로 반환하기 위해서는 @ResponseBody라는 어노테이션이 필요하다.

```java
		@GetMapping("hello-api")
    @ResponseBody
    public Hello helloApi(@RequestParam("name") String name){
        Hello hello = new Hello();
        hello.setName(name);
        return hello;
    }
    /*아래에서 만든 Hello클래스의 객체를 생성하고 set을 통해 값을 넣고 그 값을 return하면
    http의 body부분에 그 값이 들어가서 나가게 된다.*/
    /*json방식으로 넘어감.*/

    static class Hello{
        private String name;

        public void setName(String name) {
            this.name = name;
        }

        public String getName() {
            return name;
        }
    }
```

이렇게 작동을 하게 되는데, `@ResponseBody`가 있다면 이제 http에서 존재하는 header와 body에서 body에 return값을 넣어주게 되는 것이다.

이것을 `http://localhost:8181/hello-api?name=spring` 을 이용하여 실행하게 되면 json타입으로 값이 들어가게 된다.

`{"name":"spring!"}` 이렇게 출력되게 된다.

풀이하자면,
요청이 들어오면, 스프링 컨테이너(컨트롤러)에서 맵핑을 찾게 되는데, 이때 `@ResponseBody`가 존재한다면, `HttpMessageConverter -> JsonConverter 혹은 StringConverter(이외에 몇가지)` 가 동작하는데 만약 단순 문자라면 `StringConvert`이지만, 만약 객체라면 `JsonConverter`가 동작하여 `Json형식`으로 변환시켜 웹 브라우저로 반환하게 된다.
