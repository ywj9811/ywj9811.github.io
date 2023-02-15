---
title: OAuth2 Login + JWT (5) 자체 JSON 로그인 서비스 구현
date: '2023-02-14'
tags: ['Spring boot', 'Spring Security', '기술']
draft: false
summary: 이전에 JSON 로그인을 위해 커스텀 및 관련 클래스를 작성했으니 해당 서비스 구현을 위한 클래스를 작성하도록 하자.
---

## 커스텀 로그인 서비스 구현

**UserDetailsService 인터페이스를 구현**하여 작성할 것이며 **`loadUserByUsername()` 메소드를 `@Override` 하여 구현할 것이다.**

### 💡UserDetailsService 인터페이스란 무엇일까..?

**UserDetailsService**는 **DaoAuthenticationProvider** 와 협력하는 인터페이스다.

이 **DaoAuthenticationProvider**는 인증 처리 객체로 사용될 객체이다.

이 때 **UserDetailsService**를 이해하기 위해서는 **Spring Security의 기본 로그인 인증 흐름을 이해해야 한다.**

### 💡Spring Security 기본 로그인 인증 흐름

![jwt4](/static/images/JWT/jwt4.png)

1. 커스텀 필터에서 인증 대상 객체를 **UsernamePasswordAuthenticaionToken** 으로 설정했었다.

   이 객체는 클라이언트 Request의 username, password를 가지고 있다.

   이 객체를(**UsernamePasswordAuthenticaionToken)** **AuthenticationManager(ProviderManager)에게 전달**한다.

2. **ProviderManger가 전달 받은 UsernamePasswordAuthenticationToken 을 ProviderManger의 구현체인 DaoAuthenticationProvider로 전달**한다.
3. **DaoAuthenticationProvider** 는 **UserDetailsService의 `loadserByUsername(String username)`을 호출하여 UserDetails 객체를 반환** 받는다.

   이때, **loadUserByUsername의 파라미터인 username은 DaoAuthenticationProvider가 UsernamePasswordAuthenticationToken에서 username을 꺼내어 설정**해준다.

   따라서, **UserDetialsService의 `loadUserByUsername(String username)`에서 클라이언트 Request의 username을 통해 DB에서 유저를 찾아 있다면, 사용자 Entity를 반환하고(JPA 사용 시),**

   **그 Entity를 내부적으로 UserDetails 객체로 만들어서 반환**받는다.

4. 반환 받은 **UserDetails 객체의 password를 꺼내어, 내부의 PasswordEncoder 에서 password가 일치하는지 검증**을 한다.
5. 비밀번호가 일치한다면, **인증 대상 객체**인 **UserPasswordAuthenticationToken에 UserDetails 객체와 Authorities를 담아서 반환**한다.

   이후에 **ProviderManager에서 반환된 UserDetails 객체와 Authorities가 담긴 UsernamePasswordAuthenticationToken으로 인증 객체를 생성하여 인증 성공 처리**를 한다.

**⚠️ 참고로 이 Spring Security 인증 흐름은 Form Login 기준이지만, JSON 자체 Login 방식도 같은 흐름으로 진행된다.**

### UserDetailsService를 커스텀 하여 구현한 PrincipalDetailsService

```java
import com.example.oauth2WithJwt.domain.User;
import com.example.oauth2WithJwt.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class PrincipalDetailsService implements UserDetailsService {
    private final UserService userService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userService.findByUsername(username);
        if (user == null)
            throw new UsernameNotFoundException("해당 아이디가 존재하지 않습니다.");

        return new PrincipalDetails(user);
    }
}
```

위의 메소드를 살펴보면 내부적으로 **DaoAuthenticationProvider가 설정해준 username을 통해**서 해당 유저를 찾아온다.

그리고 **UserDetails를 커스텀 한 PrincipalDetails로 반환한다.**

### UserDetails를 커스텀 하여 구현한 PrincipalDetails

```java
import com.example.oauth2WithJwt.domain.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;

@Getter
public class PrincipalDetails implements UserDetails, OAuth2User {
    private User user;
    private Map<String, Object> attributes;

    public PrincipalDetails(User user) {
        this.user = user;
    }

    public User getUser() {
        return user;
    }

    public PrincipalDetails(User user, Map<String, Object> attributes) {
        this.user = user;
        this.attributes = attributes;
    }

    @Override
    public <A> A getAttribute(String name) {
        return OAuth2User.super.getAttribute(name);
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public String getName() {
        return null;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        //해당 유저의 권한을 리턴하는 것이다.
        Collection<GrantedAuthority> collect = new ArrayList<>();
        collect.add(new GrantedAuthority() {
            @Override
            public String getAuthority() {
                return user.getRole();
            }
        });
        return collect;
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getUsername();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

}
```

이전 글에서 **OAuth2 Login과 일반 Login을 동시에 처리하기 위해**서 **UserDetails와 OAuth2User를 동시에 상속받아 구현**한 클래스이다.

## JSON 로그인 성공 시 핸들러

JSON 로그인 필터를 정상적으로 통과하여 인증 처리가 되었을 때, 즉 로그인 성공이 되었을 때 로그인 성공 핸들러가 동작하게 되는데, 이를 구현할 것이다.

**SimpleUrlAuthenticationSuccessHandler** 상속 받아 구현

### LoginSuccessHandler 클래스

```java
import com.example.oauth2WithJwt.config.auth.PrincipalDetails;
import com.example.oauth2WithJwt.config.jwt.service.JwtService;
import com.example.oauth2WithJwt.domain.User;
import com.example.oauth2WithJwt.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;

@Slf4j
@RequiredArgsConstructor
public class LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private final JwtService jwtService;
    private final UserRepo userRepo;

    @Value("${jwt.access.expiration}")
    private String accessTokenExpiration;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        String username = extractUsername(authentication); //인증 정보에서 username 가져옴
        String accessToken = jwtService.createAccessToken(username); //JwtService에서 AccessToken 발급
        String refreshToken = jwtService.createRefreshToken(); //JwtService에서 RefreshToken 발급

        jwtService.sendAccessAndRefreshToken(response, accessToken, refreshToken);
        //응답 헤더에 accessToken, refreshToken 장착

        Optional<User> byUsername = userRepo.findByUsername(username);
        if (byUsername.isPresent()) {
            User user = byUsername.get();
            user.updateRefreshToken(refreshToken);
            userRepo.saveAndFlush(user);
        }
        log.info("로그인 성공 username : {}", username);
        log.info("로그인 성공 AccessToken : {}", accessToken);
        log.info("토큰 만료 기간 : {}", accessTokenExpiration);
    }

    private String extractUsername(Authentication authentication) {
        PrincipalDetails userDetails = (PrincipalDetails) authentication.getPrincipal();
        return userDetails.getUsername();
    }
}
```

**SimpleUrlAuthenticationSuccessHandler를 상속** 받아서 구현하기 때문에 **부모 클래스의 성공 시 처리 메소드 `onAuthenticationSuccess()`** 를 **`@Override`** 하여 작성한다.

JSON 로그인 필터를 정상적으로 통과해서 인증이 되었기 때문에 **AccessToken과 RefreshToken을 생성해서 Response에 담아서 보내줄 것**이다.

## JSON 로그인 실패 시 핸들러

이 경우는 위의 커스텀 JSON 로그인 필터를 통과하여 인증 실패가 되었을 때, 즉 로그인 실패가 되었을 때 작동하게 될 실패 핸들러이다.

이는 **SimpleUrlAuthenticationFailureHandler 를 상속받아 구현할 것**이다.

### LoginFailureHandler 클래스

```java
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Slf4j
public class LoginFailureHandler extends SimpleUrlAuthenticationFailureHandler {
    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("text/plain;charset=UTF-8");
        response.getWriter().write("로그인 실패! 이메일이나 비밀번호를 확인해주세요.");
        log.info("로그인에 실패했습니다. 메시지 : {}", exception.getMessage());
    }
}
```

이 부분은 단순하게 Response Body에 로그인 실패 메시지를 띄우고 에러 메시지를 반환하도록 한 것이다.

**자체 로그인에 대한 서비스 구현을 완료 했으니 다음에는 OAuth2 Login을 추가하도록 할 것이다.**
