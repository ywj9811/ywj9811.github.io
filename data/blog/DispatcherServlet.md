---
title: Dispatcher-Servlet
date: '2023-09-07'
tags: ['SPRING-BOOT']
draft: false
summary: Dispatcher-Servlet이란 무엇이고, 어떤 일을 하는가
---

## Dispatcher-Servlet(디스패처 서블릿)이란?

디스패처 서블릿의 Dispatch는 ‘보내다’라는 뜻을 가지고 있는데, 이러한 단어를 포함하는 디스패처 서블릿은 HTTP 프로토콜로 들어오는 모든 요청을 가장 먼저 받아 **적합한 컨트롤러에 위임해주는 프론트 컨트롤러(Front Controller)**라고 정의할 수 있다.

### Front Controller란

이 Front Controller란 주로 서블릿 컨테이너의 제일 앞에서 서버로 들어오는 클라이언트의 모든 요청을 받아서 처리해주는 컨트롤러로, MVC 구조에서 함께 사용되는 디자인 패턴이다.

이를 설명하자면, 다음과 같은데 

![Untitled](/static/images/dps/dps1.png)

프론트 컨트롤러 패턴을 사용하지 않으면 위와 같이 각 클라이언트들은 Controller A, B, C에 각각 호출을 하고 공통 코드들은 별도로 처리되지 않고 각각의 Controller에 포함되어 있다.

![Untitled](/static/images/dps/dps1.png)

하지만 프론트 컨트롤러 패턴을 도입하면 위와 같이 공통 코드에 대해서는 프론트 컨트롤러에서 처리하고, 서로 다른 코드들만 각각의 Controller에서 처리할 수 있도록 각 요청에 맞는 컨트롤러를 찾아서 호출한다.

장점은 아래와 같다.

- 공통 코드 처리 가능
- Front Controller 이외의 다른 Controller에서는 Servlet을 사용하지 않아도 됨

**이는 다시 말해서 프론트 컨트롤러의 역할을 하는 디스패처 서블릿의 장점이기도 하다.**

### 정적 자원(Static Resources)의 처리

HTML, CSS, JavaScript 혹은 이미지 같은 정적 파일에 대한 요청마저 가로채게 되면 정적 자원을 불러올 수 없을 것이다.

이를 해결하기 위해 두가지 방법이 있다.

1. 정적 자원 요청과 어플리케이션 요청의 분리
    - /apps의 URL로 접근하면 Dispatcher Servlet이 담당한다.
    - /resources의 URL로 접근하면 Dispatcher Servlet이 담당하지 않는다.
    
    하지만 이경우 코드가 지저분해지며, 모든 요청에 대해서 저렇게 URL을 붙여주어야 하기 때문에 좋지 않다.
    
2. 어플리케이션 요청을 탐색하고 없으면 정적 자원 요청으로 처리
    
    Dispatcher Servlet이 우선 요청을 처리할 컨트롤러를 먼저 찾고, 요청에 대한 컨트롤러를 찾을 수 없다면 2차적으로 설정된 자원 경로를 탐색하여 자원을 탐색할 것이다.
    
    이는 효율적인 리소스 관리와 추후에 확장을 용이하게 해준다는 장점이 있다.
    

## Dispatcher-Servlet의 동작 과정

이 디스패처 서블릿은 적합한 컨트롤러와 메소드를 찾아 요청을 위임해야 한다.

![Untitled](/static/images/dps/dps3.png)

처리 과정은 위와 같은데,

1. 클라이언트의 요청을 디스패처 서블릿이 받음
    
    ![Untitled](/static/images/dps/dps4.png)
    
    서블릿 컨텍스트(Web Context)에서 필터들을 지나 스프링 컨텍스트(Spring Context)에서 디스패처 서블릿이 가장 먼저 요청을 받게 된다.
    
    단, 실제로는 Interceptor가 Controller로 요청을 위임하지는 않기 때문에 그림은 처리 순서를 도식화한 것으로 이해하자.
    
2. 요청 정보를 통해 요청을 위임할 컨트롤러를 찾음
    
    디스패처 서블릿은 요청을 처리할 핸들러(컨트롤러)를 찾고 해당 객체의 메소드를 호출하는데, 따라서 가장 먼저 어느 컨트롤러가 요청을 처리할 수 있는지 식별해야 한다.
    
    이것을 하는 것이 **HandlerMapping**이다.
    
    물론 최근에는 @Controller와 같은 어노테이션을 통해 처리하는데, 이때 사용되는 것은 **RequestMappingHandlerMapping**이다.
    
    이는 @Controller로 작성된 모든 컨트롤러를 찾고 파싱하여 HashMap으로 `<요청 정보, 처리할 대상>` 관리한다. 
    
    여기서 처리할 대상은 **HandlerMethod** 객체로 컨트롤러, 메소드 등을 갖고 있는데, 이는 스프링이 리플렉션을 이용해 요청을 위임하기 때문이다..
    
    그래서 요청이 오면 (Http Method, URI) 등을 사용해 요청 정보를 만들고, HashMap에서 요청을 처리할 대상(HandlerMethod)를 찾은 후에 **HandlerExecutionChain**으로 감싸서 반환한다. 
    
    **HandlerExecutionChain**으로 감싸는 이유는 컨트롤러로 요청을 넘겨주기 전에 처리해야 하는 인터셉터 등을 포함하기 위해서이다.
    
3. 요청을 컨트롤러로 위임할 핸들러 어댑터를 찾아서 전달함
    
    이제 컨트롤러로 요청을 위임해야 하는데, 디스패처 서블릿은 컨트롤러로 요청을 직접 위임하는 것이 아니고 **HandlerAdapter**를 통해 위임한다.
    
    그렇게 하는 이유는 컨트롤러의 구현 방식이 다양하기 때문이다. (최근에는 @Controller, 과거에는 Controller인터페이스 구현 등등)
    
    따라서 **HandlerAdapter**라는 어댑터 인터페이스를 통해 `어댑터 패턴` 을 적용하여 컨트롤러의 구현 방식에 상관 없이 요청을 위임할 수 있도록 한다.
    
4. 핸들러 어댑터가 컨트롤러로 요청을 위임함
    
    **HandlerAdapter**가 컨트롤러로 요청을 위임한 전/후에 공통적인 전/후처리 과정이 필요하다.
    
    대표적으로 인터셉터들을 포함해 요청시에 @RequestParam, @RequestBody 등을 처리하기 위한 ArgumentResolver들과 응답 시에 ResponseEntity의 Body를 Json으로 직렬화하는 등의 처리를 하는 ReturnValueHandler 등이 핸들러 어댑터에서 처리된다.
    
5. 비즈니스 로직을 처리함
6. 컨트롤러 반환값을 처리함
7. 핸들러 어댑터가 반환값을 처리함
    
    **HandlerAdapter**는 컨트롤러로부터 받은 응답을 응답 처리기인 ReturnValueHandler가 **후처리한 후에 디스패처 서블릿으로** 돌려준다.
    
8. 서버의 응답을 클라이언트로 반환함

한마디로 정리하자면

**‘디스패처 서블릿을 통해 요청을 처리할 컨트롤러를 찾아서 위임하고, 그 결과를 받아온다.’** 이다.

> 출처:
> 
> 
> https://mangkyu.tistory.com/18
> 
> https://yeonyeon.tistory.com/103
>