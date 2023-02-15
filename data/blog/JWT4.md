---
title: OAuth2 Login + JWT (4) 자체 JSON 로그인 커스텀
date: '2023-02-14'
tags: ['Spring boot', 'Spring Security', '기술']
draft: false
summary: 자체 JSON 로그인 방식으로 커스텀 진행하고 관련 클래스를 작성하도록 하자
---

## 자체 JSON 로그인 커스텀

### Form 데이터가 아닌 JSON을 통한 로그인을 구현할 것이기 때문에 자체적으로 관련 클래스를 커스텀 하도록 할 것이다.

```json
{
	"username" : "user"
	"psasword" : "1234"
}
```

이런 식으로 **JSON 타입으로 username과 password를 보내 로그인 하는 방식**으로 구현할 것이다.

**Spring Security 에서는 일반 Form Login을 기본으로 제공**하기 때문에 **JSON 형식으로 로그인 하는 방식에 대해서는 커스텀 필터를 구현**해야 한다.

→ **Form Login 에서 사용되는 UsernamePasswordAuthenticationFilter**의 코드를 참고하여 구현할 것이다.

→ **UsernamePasswordAuthenticationFilter** 는 **AbstractAuthenticationProcessingFilter** 상속 받기 때문에 **JSON필터에서도 AbstractAuthenticationProcessingFilter를 상속 받아 구현**할 것이다.

### CustomJsonUsernamePasswordAuthenticationFilter 클래스

```java
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AbstractAuthenticationProcessingFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.util.StreamUtils;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Form Login 시 기본적으로 사용되는
 * UsernamePasswordAuthenticationFilter에서
 * AbstractAuthenticationProcessingFilter를 상속받아 구현하기 때문에,
 * 커스텀 JSON 필터에서도 AbstractAuthenticationProcessingFilter를 상속받아 구현.
 */
public class CustomJsonUsernamePasswordAuthenticationFilter extends AbstractAuthenticationProcessingFilter {
    private static final String DEFAULT_LOGIN_REQUEST_URL = "/login"; //login으로 오는 요청 처리
    private static final String HTTP_METHOD = "POST"; //로그인 HTTP 메소드는 post
    private static final String CONTENT_TYPE = "application/json"; //로그인 시 요청은 JSON
    private static final String USERNAME_KEY = "username";
    private static final String PASSWORD_KEY = "password";
    private static final AntPathRequestMatcher DEFAULT_LOGIN_PATH_REQUEST_MATCHER =
            new AntPathRequestMatcher(DEFAULT_LOGIN_REQUEST_URL, HTTP_METHOD);
    // "/login" + post 로 요청시 매칭된다.

    private final ObjectMapper objectMapper;

    public CustomJsonUsernamePasswordAuthenticationFilter(ObjectMapper objectMapper) {
        super(DEFAULT_LOGIN_PATH_REQUEST_MATCHER); //매칭 처리 설정
        this.objectMapper = objectMapper;
    }

    /**
     * 인증 처리 메소드
     *
     * usernamePasswordAuthenticationFilter와 동일하게 UsernamePasswordAuthenticationToken 사용
     * StringUtils 통해 request에서 messageBody(JSON) 반환
     * ex)
     * {
     *     "username" : "user"
     *     "password" : "2443"
     * }
     * 이렇게 요청이 오면
     * messageBody를 objectMapper.readValue() 을 통해 Map으로 변환
     * Map에서 key로 이메일, 패스워드 추출 후
     * UsernamePasswordAuthenticationToken의 파라마터 principal, credentials에 대입
     *
     * AbstractAuthenticationProcessingFilter(부모)의 getAuthenticationManager()로 AuthenticationManager 객체를 반환 받은 후
     * authenticate()의 파라미터로 UsernamePasswordAuthenticationToken 객체를 넣고 인증 처리
     * (여기서 AuthenticationManager 객체는 ProviderManager -> SecurityConfig에서 설정)
     */

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException, IOException, ServletException {
        if (request.getContentType() == null || !request.getContentType().equals(CONTENT_TYPE)) {
            throw new AuthenticationServiceException("Authentication Content-Type not supported : " + request.getContentType());
        }

        String messageBody = StreamUtils.copyToString(request.getInputStream(), StandardCharsets.UTF_8);

        Map<String, String> usernamePasswordMap = objectMapper.readValue(messageBody, Map.class);
        //JSON 요청을 String으로 변환한 messageBody를 objectMapper.readValue를 통해 Map으로 변환하여 각각 저장

        String username = usernamePasswordMap.get(USERNAME_KEY);
        String password = usernamePasswordMap.get(PASSWORD_KEY);

        UsernamePasswordAuthenticationToken authRequest = new UsernamePasswordAuthenticationToken(username, password);
        //principal과 credentials 전달
        //AuthenticationManager가 인증 시 사용할 인증 대상 객체가

        return this.getAuthenticationManager().authenticate(authRequest);
        //이 AuthenticationManager 객체가 인증 성공/실패 처리를 함
    }@Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException, IOException, ServletException {
        if (request.getContentType() == null || !request.getContentType().equals(CONTENT_TYPE)) {
            throw new AuthenticationServiceException("Authentication Content-Type not supported : " + request.getContentType());
        }

        String messageBody = StreamUtils.copyToString(request.getInputStream(), StandardCharsets.UTF_8);

        Map<String, String> usernamePasswordMap = objectMapper.readValue(messageBody, Map.class);
        //JSON 요청을 String으로 변환한 messageBody를 objectMapper.readValue를 통해 Map으로 변환하여 각각 저장

        String username = usernamePasswordMap.get(USERNAME_KEY);
        String password = usernamePasswordMap.get(PASSWORD_KEY);

        UsernamePasswordAuthenticationToken authRequest = new UsernamePasswordAuthenticationToken(username, password);
        //principal과 credentials 전달
        //AuthenticationManager가 인증 시 사용할 인증 대상 객체가

        return this.getAuthenticationManager().authenticate(authRequest);
        //이 AuthenticationManager 객체가 인증 성공/실패 처리를 함
    }
}
```

### PART1

```java
public CustomJsonUsernamePasswordAuthenticationFilter(ObjectMapper objectMapper) {
    super(DEFAULT_LOGIN_PATH_REQUEST_MATCHER); // 위에서 설정한 "login" + POST로 온 요청을 처리하기 위해 설정
    this.objectMapper = objectMapper;
}
```

위의 생성자는 **어떤 요청이 들어 왔을 때 이에 맵핑될지 설정**해주는 부분이며, ObjectMapper를 생성자 주입하는 부분이다.

### PART2

```java
@Override
public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException, IOException, ServletException {
    if (request.getContentType() == null || !request.getContentType().equals(CONTENT_TYPE)) {
        throw new AuthenticationServiceException("Authentication Content-Type not supported : " + request.getContentType());
    }

    String messageBody = StreamUtils.copyToString(request.getInputStream(), StandardCharsets.UTF_8);

    Map<String, String> usernamePasswordMap = objectMapper.readValue(messageBody, Map.class);
    //JSON 요청을 String으로 변환한 messageBody를 objectMapper.readValue를 통해 Map으로 변환하여 각각 저장

    String username = usernamePasswordMap.get(USERNAME_KEY);
    String password = usernamePasswordMap.get(PASSWORD_KEY);

    UsernamePasswordAuthenticationToken authRequest = new UsernamePasswordAuthenticationToken(username, password);
    //principal과 credentials 전달
    //AuthenticationManager가 인증 시 사용할 인증 대상 객체가

    return this.getAuthenticationManager().authenticate(authRequest);
    //이 AuthenticationManager 객체가 인증 성공/실패 처리를 함
}
```

이 부분은 **AbstractAuthenticationProcessingFilter의 `attemptAuthentication()` 을 `@Override` 한 부분으로 인증 처리 메소드**이다.

- 시작 부분에서 만약 JSON타입으로 들어온 요청이 아닐 경우 예외를 발생시키게 된다.
- **`objectMapper.readValue(messageBody, Map.class)`** 를 통해서 JSON 요청을 String 으로 변환한 messageBody를 Map으로 변환하여 각각 저장한다.
- **`UsernamePasswordAuthenticationToken authRequest = new UsernamePasswordAuthenticationToken(username, password);`** 을 통해서 인증 처리 객체인 **AuthenticationManager가 인증 시 사용할 인증 대상 객체를 생성**한다.
  파라미터로 넘겨준 **username과 password는 인증 대상 객체의 credentials 가 된다.**
  이 **AuthenticaionManager**가 인증 성공 / 인증 실패 처리를 하게 된다.

⚠️ 이때, 인증 처리 객체 **AuthenticationManager**로 무슨 객체를 사용할지 setter로 설정해야 하는데, 이 과정은 이후의 스프링 시큐리티 설정 클래스인 **SecurtyConfig** 클래스를 다룰 때 설명할 것이다.

⚠️ 인증 처리 객체 **AuthenticationManager**로는 FormLogin과 동일하게 **ProviderManager**를 사용, **ProviderManager**의 구현체로 **DaoAuthenticationProvider** 객체를 사용한다.

**다음에는 JSON 로그인 서비스를 구현하도록 할 것이다.**
