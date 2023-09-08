---
title: Filter VS Interceptor
date: '2023-09-08'
tags: ['SPRING-BOOT']
draft: false
summary: Filter와 Interceptor의 차이점과 용도
---

# Filter VS Interceptor

## Filter(필터)

### Filter란?

J2EE 표준 스펙 기능으로 **디스패처 서블릿에 요청이 전달되기 전/후**에 url패턴에 맞는 모든 요청에 대해 부가작업을 처리할 수 있는 기능을 제공한다.

디스패처 서블릿은 스프링의 가장 앞단에 존재하는 FrontController 이므로 필터는 **‘스프링 범위 밖(서블릿 컨테이너)에서 처리가 되는 것’**이다.

![Untitled](/static/images/fi1.png)

### Filter의 메소드

필터를 추가하기 위해서는 `javax.servlet` 의 `Filter`인터페이스를 구현해야 하며 이는 세개의 메소드를 가지고 있다.

```java
public interface Filter {

    public default void init(FilterConfig filterConfig) throws ServletException {}

    public void doFilter(ServletRequest request, ServletResponse response,
            FilterChain chain) throws IOException, ServletException;

    public default void destroy() {}
}
```

- `init()`
    
    필터 객체가 생성되고 준비 작업을 위해 딱 한번 호출된다.
    
    이는 서블릿의 `init()` 과 같은 용도로, 매개변수는 FilterConfig의 인스턴스이다.
    
    이 인스턴스를 통해 필터 초기화 매개변수의 값을 꺼낼 수 있다.
    
- `doFilter()`
    
    필터와 매핑된 URL에 요청이 들어올 때 마다 `doFilter()` 가 호출된다.
    
    이 메소드에 필터가 할 작업을 작성하는데, FilterChain은 다음 필터를 가리키고, `chain.doFilter()` 는 다음 필터를 호출한다.
    
    따라서 `chain.doFilter()` 전/후에 우리가 필요로 하는 처리 과정을 넣어주면 된다.
    
- `destroy()`
    
    필터 객체를 서비스에서 제거하고 사용하는 자원을 반환하기 위한 메소드로, 서블릿 컨테이너는 웹 어플리케이션을 종료하기 전에 필터들에 대해 이를 호출하여 마무리 작업을 한다.
    

```java
public class CharacterEncodingFilter implements Filter {
	FilterConfig config;
    
    @Override
    public void init(FilterConfig filterConfig) throws ServletException{
    	this.config = filterConfig;
    }
    
    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
    	servletRequest.setCharacterEncoding(config.getInitParameter("encoding"));
        filterChain.doFilter(servletRequest, servletResponse);
    }
    
    @Override
    public void destroy(){}
    
}
```

이런 식으로 예제를 작성할 수 있고, `init()` 에서는 `doFilter()` 에서 사용하기 위한 인스턴스 변수 config에 저장하고, 이어서 진행하는 방식으로 할 수 있다.

## Interceptor(인터셉터)

### Interceptor란?

J2EE 표준 스펙인 Filter와 달리 **Spring이 제공하는 기술로, 디스패처 서블릿이 컨트롤러를 호출하기 전과 후에 요청과 응답을 참조하거나 가공할 수 있는 기능을 제공**한다.

즉, 서블릿 컨테이너에서 동작하는 필터와 달리 **인터셉터는 스프링 컨텍스트에서 동작**하는 것이다.

디스패처 서블릿이 동작할 때 핸들러 매핑을 통해 적절한 컨트롤러를 찾도록 요청하는데, 그 결과로 실행 체인(HandlerExecutionChain)을 돌려준다.

그래서 이 체인은 1개 이상의 인터셉터가 등록되어 있다면 순차적으로 인터셉터들을 거쳐 컨트롤러가 실행되도록 하고, 인터셉터가 없다면 바로 컨트롤러를 실행한다.

따라서 인터셉터가 실행되기까지와 그 이후를 순서로 표현하면 아래와 같다.

요청이 들어오면 필터를 거쳐 디스패처 서블릿 그리고 인터셉터로, 그 이후에 컨트롤러로 가게 되는 것이다.

그리고 응답할때도 마찬가지로 컨트롤러에서 인터셉터, 그리고 디스패처 서블릿과 필터를 통해 가는 것이다.

![Untitled](/static/images/fi2.png)

### Interceptor의 메소드

인터셉터를 추가하기 위해서는 `org.springframework.web.servlet` 의 `HandlerInterceptor` 인터페이스를 구현해야 하며 이는 세개의 메소드를 가지고 있다.

```java
public interface HandlerInterceptor {

    default boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
        throws Exception {
        
        return true;
    }

    default void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler,
        @Nullable ModelAndView modelAndView) throws Exception {
    }

    default void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler,
        @Nullable Exception ex) throws Exception {
    }
}
```

- `preHandle()`
    
    이는 컨트롤러가 호출되기 전에 실행되는 것으로 컨트롤러 이전에 처리하는 전처리 작업 혹은 요청 정보를 가공하거나 추가하는 경우에 사용한다.
    
    세번째 파라미터인 handler는 핸들러 매핑이 찾아준 컨트롤러 빈에 매핑되는 HandlerMethod라는 새로운 타입의 객체로, @RequestMapping이 붙은 메소드의 정보를 추상화한 객체다.
    
    그리고 **반환 타입이 boolean인데, 이는 성공적으로 마무리되면 true를 반환하며 다음 인터셉터 혹은 컨트롤러로 진행되지만, 실패하여 false를 반환한다면 다음 인터셉터 혹은 컨트롤러로 진행되지 않게된다.**
    
- `postHandle()`
    
    이는 컨트롤러 호출 이후에 실행되는 것으로 후처리 작업이 있을 때 사용할 수 있다.
    
    **이 메소드는 컨트롤러가 반환하는 ModelAndView 타입의 정보가 제공되는데, Json형태로 응답하는 RestAPI 기반의 컨트롤러에서는 사용되지 않는다.**
    
- `afterCompletion()`
    
    이는 모든 뷰에서 최종 결과를 생성하는 일을 포함해 모든 작업이 완료된 이후에 실행되는 것으로 요청 처리 중에 사용한 리소스를 반환할 때 사용하기에 적합하다.
    
    또한, 컨트롤러 하위에서 작업을 진행하다가 Exception이 발생해도 이 부분은 반드시 호출된다.
    
    **물론 이또한 뷰 렌더링 관련 작업 이후에 하는 것으로 Json형태로 응답하는 RestAPI 기반의 컨트롤러에서는 잘 사용되지 않는다.**
    

그렇다면 예제는 아래와 같이 작성할 수 있을 것이다.

```java
public class CustomInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 요청 처리 전에 실행할 코드를 작성합니다.
        // 예를 들어, 요청 인증, 로깅, 요청 시간 측정 등의 작업을 수행할 수 있습니다.
        return true; // true를 반환하면 요청을 계속 진행하고, false를 반환하면 요청을 중단합니다.
    }

    // postHandle() 및 afterCompletion() 메서드는 비워 둡니다.
}
```

이렇게 `HandlerInterceptor` 인터페이스를 구현하는 커스텀 인테셉터를 만들고

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Bean
    public CustomInterceptor customInterceptor() {
        return new CustomInterceptor();
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // "/specific-controller/**" 패턴에만 인터셉터를 적용
        registry.addInterceptor(customInterceptor())
                .addPathPatterns("/specific-controller/**");
    }
}
```

이렇게 설정을 추가하면 특정 요청에 해당하는 경우에만 해당 인터셉터를 동작하게 할 수 있다.

`.addPathPatterns("/specific-controller/**");` 가 없다면 무조건 동작하게 하는 것 또한 가능하다.

## Filter와 Interceptor 차이 및 용도

| 대상 | Filter | Interceptor |
| --- | --- | --- |
| 관리되는 컨테이너 | 서블릿 컨테이너 | 스프링 컨테이너 |
| 스프링의 예외처리 여부 | X | O |
| Request/Response 객체 조작 여부 | O | X |
| 용도 | - 공통된 보안 및 인증/인가 관련 작업
- 모든 요청에 대한 로깅 또는 검사
- 이미지/데이터 압축 및 문자열 인코딩
- Spring과 분리되어야 하는 기능 | - 세부적인 보안 및 인증/인가 공통 작업
- API 호출에 대한 로깅 또는 감사
- Controller로 넘겨주는 정보(데이터) 가공 |

### 관리되는 컨테이너

필터의 경우 서블릿 컨테이너에서, Interceptor의 경우 스프링 컨테이너에서 관리가 된다.

즉, 관리되는 영역이 다른 것인데 이로 인해 발생하는 차이의 대표적인 것은 스프링에 의한 예외처리가 되지 않는다는 것이다.

### Request/Response 객체 조작 여부

필터는 조작할 수 있지만 인터셉터는 조작할 수 없다.

조작한다는 것의 의미는 내부 상태를 변경하는 것이 아니라 다른 객체로 바꾼다는 의미이다.

필터는 `doFilter()` 를 통해서 다음 필터를 호출할 때 Request/Response 객체를 넘겨주기 때문에 원하는 객체를 넣어줄 수 있다.

```java
public MyFilter implements Filter {

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) {
        // 개발자가 다른 request와 response를 넣어줄 수 있음
        chain.doFilter(new MockHttpServletRequest(), new MockHttpServletResponse());       
    }
    
}
```

하지만 인터셉터의 경우 처리 과정이 필터와 다른데, 디스패처 서블릿이 여러 인터셉터목록을 가지고 있고, for문으로 순차적으로 실행시킨다.

그리고 true를 반환하면 다음 인터셉터가 실행되거나 컨트롤러로 넘어가는 것이다.

따라서 개발자가 직접 다른 Request/Response 객체를 넘겨줄 수 없다.

```java
public class MyInterceptor implements HandlerInterceptor {

    default boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // Request/Response를 교체할 수 없고 boolean 값만 반환할 수 있다.
        return true;
    }

}
```

### Filter의 용도

- 공통된 보안 및 인증/인가 관련 작업
- 모든 요청에 대한 로깅 또는 감사
- 이미지/데이터 압축 및 문자열 인코딩
- Spring과 분리되어야 하는 기능

**필터는 스프링 컨테이너에서 관리되는 부분이 아니기 때문에 스프링과 무관하게 전역으로 처리해야 하는 작업들을 처리할 수 있다.**

예를 들어 보안 공통 작업이 있을 수 있다. XSS방어 와 같은 보안 작업을 하여 올바른 요청이 아닐 경우 미리 차단할 수 있다.

또한, 이미지나 데이터 압축 혹은 문자열 인코딩과 같이 웹 어플리케이션에 전반적으로 사용되는 기능을 구현하기 적당하다.

### Interceptor의 용도

- 세부적인 보안 및 인증/인가 공통 작업
- API 호출에 대한 로깅 또는 검사
- Controller로 넘겨주는 정보의 가공

**인터셉터에서는 클라이언트의 요청과 관련되어 전역적으로 처리해야 하는 작업들을 처리할 수 있다.**

대표적으로 세부적으로 적용해야 하는 인증 혹은 인가와 같이 클라이언트 요청과 관련된 작업이 있을 수 있다.

또한 인터셉터의 경우 HttpServletRequest혹은 HttpServletResponse 와 같은 객체를 제공받으므로 다른 객체로 바꿀 수 없다. 하지만 인터셉터에서 해당 객체가 내부적으로 가지는 값을 조작하여 컨트롤러로 넘겨주기 위한 정보를 가공하기에 용이하다.

> 참고
>
> 
> https://velog.io/@bey1548/Servlet-Filter
> 
> https://mangkyu.tistory.com/173
>