---
title: AuthenticationEntryPoint 와 AccessDeniedHandler
date: '2023-06-27'
tags: ['spring boot', 'Spring Security','기술']
draft: false
summary: 인증실패 및 권한부족의 경우 예외 처리
---
## AuthenticationEntryPoint

**AuthenticationEntryPoint**란 **Authorization헤더를 보내지 않거나 혹은 인증에 실패**하여 401 응답코드가 발생하게 되었을 때 처리하는 인터페이스로, 내부의 `commence()` 가 실행되게 된다.

```java
@Component
@RequiredArgsConstructor
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {
    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException, ServletException {
        SecurityException.WrongTokenException e = new SecurityException.WrongTokenException(
                JwtConstants.JwtExcpetionMessage.WRONG_TOKEN.getMessage(),
                JwtConstants.JwtExcpetionCode.WRONG_TOKEN.getCode(),
                HttpStatus.FORBIDDEN);

        response.setStatus(e.getHttpStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        String errorResponseJson = objectMapper.writeValueAsString(new ErrorResponse(e.getErrorCode(), e.getMessage()));
        response.getOutputStream().write(errorResponseJson.getBytes("UTF-8"));
    }
}
```

위의 코드는 **AuthenticationEntryPoint**를 구현한 커스텀 클래스로, 해당 코드를 살펴보면 어떻게 처리할 것인지에 대해서 정의하고 있는데, 커스텀 하여 만든 예외를 생성하고, `response` 에 적절한 정보를 담아서 응답하고 있다.

(WrongTokenException, ErrorResponse는 커스텀하여 정의한 클래스)

## AccessDeniedHandler

그렇다면 **AccessDeniedHandler** 는 무엇일까

**AccessDeniedHandler** 란 인증은 되었지만 권한이 부족한 경우 즉, 엑세스 권한을 체크했을 때 엑세스 할 수 없는 요청을 했을 경우 동작하는 인터페이스로, 내부의 `handler()` 가 실행된다.

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class CustomAccessDeniedHandler implements AccessDeniedHandler {
    private final ObjectMapper objectMapper;

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException) throws IOException, ServletException {
        log.error("권한이 없는 요청입니다.");
        AuthorityException e = new AuthorityException(
                JwtExcpetionMessage.NON_AUTHORITY.getMessage(),
                JwtExcpetionCode.NON_AUTHORITY.getCode(),
                HttpStatus.FORBIDDEN);
        response.setStatus(e.getHttpStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        String errorResponseJson = objectMapper.writeValueAsString(new ErrorResponse(e.getErrorCode(), e.getMessage()));
        response.getOutputStream().write(errorResponseJson.getBytes("UTF-8"));
    }
}
```

위의 코드는 **AccessDeniedHandler** 를 구현한 커스텀 클래스로, 코드를 살펴보면 이전에 살펴본 `commence()` 와 마찬가지로 동작하고 있다.

이렇게 경우에 따라서 실행될 수 있도록 클래스를 만들어주고,

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http
		...
            .exceptionHandling()
            .authenticationEntryPoint(customAuthenticationEntryPoint)
            .accessDeniedHandler(customAccessDeniedHandler)
		...
}
```

이렇게 설정에 추가하면 권한 검사를 진행할 경우 작동하여 처리되게 될 것이다.