---
title: OAuth2 Login + JWT (3) JWT인증 절차와 필터
date: '2023-02-14'
tags: ['Spring boot', 'Spring Security', '기술']
draft: false
summary: JWT는 어떤 방식으로 인증을 진행하고 필요한 필터를 구현하도록 하자.
---

## JWT 인증 필터 - JwtAuthenticationProcessingFilter

`**OncePerRequestFilter` 를 상속\*\* 받아서 구현하는 필터이다.

> `**OncePerRequestFilter` 에 대한 설명\*\* : 모든 서블릿 컨테이너에서 요청 디스패치당 단일 실행을 보장하는 것을 목표로 하는 필터 기본 클래스입니다.

해당 필터는 원래 클라이언트가 헤더에 토큰을 담아서 권한이 필요한 요청을 보냈을 때 **해당 토큰의 유효성을 검사하여 인증 처리/인증 실패/토큰 재발급 등을 수행할 수 있도록 구현한 필터이다.**

### 💡JWT 인증 로직

JWT를 통한 인증 로직은 크게 AccessToken 만료 이전, AccessToken 만료 이후로 나뉜다.

![jwt2](/static/images/JWT/jwt2.png)

위와 같은 과정을 통해서 인증을 하게 되는 것이다.

- 로그인 이후 요청(Access Token)
  - Access Token 만료 X
    - 데이터 응답
  - Access Token 만료 O
    - 만료 응답
    - Refresh Token과 함께 Access Token 재발급 요청
      - 검증
      - 응답 + Access Token, Refresh Token 업데이트 및 재발급 (RTR 방식)

이러한 과정을 가지게 된다.

### 💡 RTR 방식

![jwt3](/static/images/JWT/jwt3.png)

Refresh Token Rotation 방식의 약자로 Refresh Token을 한번만 사용할 수 있게 하는 방식이다.

Access Token을 재발급 받을 때 Refresh Token 또한 재발급 하여 Refresh Token을 한번만 사용할 수 있도록 하는 것이다.

## JwtAuthenticationProcessingFilter 클래스

전체 코드에 주석으로 설명이 작성되어 있지만 매우 길기 때문에 마찬가지로 나누어서 설명하도록 할 것이다.

```java
import com.example.oauth2WithJwt.config.auth.PrincipalDetails;
import com.example.oauth2WithJwt.config.jwt.service.JwtService;
import com.example.oauth2WithJwt.domain.User;
import com.example.oauth2WithJwt.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.mapping.GrantedAuthoritiesMapper;
import org.springframework.security.core.authority.mapping.NullAuthoritiesMapper;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;

/**
 * JWT 인증 필터
 * 특정 url 이외의 요청이 오면 처리하도록 하는 필터
 *
 * 기본적으로 사용자는 요청시 헤더에 AccessToken만 요청
 * AccessToken 만료시 RefreshToken 요청 헤더에 Access + Refresh로 요청
 * 1. RefreshToken이 없고, AccessToken이 유효한 경우 -> 인증 성공 처리, RefreshToken을 재발급하지는 않는다.
 * 2. RefreshToken이 없고, AccessToken이 없거나 유효하지 않은 경우 -> 인증 실패 처리, 403 ERROR
 * 3. RefreshToken이 있는 경우 -> DB의 RefreshToken과 비교하여 일치하면 AccessToken 재발급, RefreshToken 재발급(RTR 방식)
 *                              인증 성공 처리는 하지 않고 실패 처리
 */
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationProcessingFilter extends OncePerRequestFilter {

    private static final String NOT_CHECK_URL = "/login/**";

    private final JwtService jwtService;
    private final UserRepo userRepo;

    private GrantedAuthoritiesMapper authoritiesMapper = new NullAuthoritiesMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        if (request.getRequestURI().equals(NOT_CHECK_URL)) {
            filterChain.doFilter(request, response);
            return; //처리X 요청의 경우 다음 필터로 넘기고 return을 통해 현재 필터 진행 정지
        }

        // 사용자 요청 헤더에서 RefreshToken 추출
        // -> RefreshToken이 없거나 유효하지 않다면(DB에 저장된 RefreshToken과 다르다면) null을 반환
        // 사용자의 요청 헤더에 RefreshToken이 있는 경우는, AccessToken이 만료되어 요청한 경우밖에 없다.
        // 따라서, 재요청이 아닌경우 혹은 틀린 경우는 모두 null
        String refreshToken = jwtService.extractRefreshToken(request)
                .filter(jwtService::isTokenValid)
                .orElse(null);
        // 리프레시 토큰이 요청 헤더에 존재했다면, 사용자가 AccessToken이 만료되어서
        // RefreshToken까지 보낸 것이므로 리프레시 토큰이 DB의 리프레시 토큰과 일치하는지 판단 후,
        // 일치한다면 AccessToken을 재발급해준다.
        if (refreshToken != null) {
            log.info("RefreshToken업데이트 및 AccessToken 재발급");
            checkRefreshTokenAndReIssueAccessToken(response, refreshToken);
            return;
        }

        // RefreshToken이 없거나 유효하지 않다면, AccessToken을 검사하고 인증을 처리하는 로직 수행
        // AccessToken이 없거나 유효하지 않다면, 인증 객체가 담기지 않은 상태로 다음 필터로 넘어가기 때문에 403 에러 발생
        // AccessToken이 유효하다면, 인증 객체가 담긴 상태로 다음 필터로 넘어가기 때문에 인증 성공
        if (refreshToken == null) {
            checkAccessTokenAndAuthentication(request, response, filterChain);
        }
    }

    /**
     *  [리프레시 토큰으로 유저 정보 찾기 & 액세스 토큰/리프레시 토큰 재발급 메소드]
     *  파라미터로 들어온 헤더에서 추출한 리프레시 토큰으로 DB에서 유저를 찾고, 해당 유저가 있다면
     *  JwtService.createAccessToken()으로 AccessToken 생성,
     *  reIssueRefreshToken()로 리프레시 토큰 재발급 & DB에 리프레시 토큰 업데이트 메소드 호출
     *  그 후 JwtService.sendAccessTokenAndRefreshToken()으로 응답 헤더에 보내기
     */
    public void checkRefreshTokenAndReIssueAccessToken(HttpServletResponse response, String refreshToken) throws IOException {
        Optional<User> byRefreshToken = userRepo.findByRefreshToken(refreshToken);
        if (byRefreshToken.isPresent()) {
            User user = byRefreshToken.get();
            String reIssuedRefreshToken = reIssueRefreshToken(user);
            jwtService.sendAccessAndRefreshToken(response, jwtService.createAccessToken(user.getUsername()), reIssuedRefreshToken);
        }
    }

    /**
     * [리프레시 토큰 재발급 & DB에 리프레시 토큰 업데이트 메소드]
     * jwtService.createRefreshToken()으로 리프레시 토큰 재발급 후
     * DB에 재발급한 리프레시 토큰 업데이트 후 Flush
     */
    private String reIssueRefreshToken(User user) {
        String reIssuedRefreshToken = jwtService.createRefreshToken();
        user.updateRefreshToken(reIssuedRefreshToken);
        userRepo.saveAndFlush(user);
        return reIssuedRefreshToken;
    }

    /**
     * [액세스 토큰 체크 & 인증 처리 메소드]
     * request에서 extractAccessToken()으로 액세스 토큰 추출 후, isTokenValid()로 유효한 토큰인지 검증
     * 유효한 토큰이면, 액세스 토큰에서 extractUsername을 통해 username을 추출한 후 findByUseranme()로 해당 아이디를 사용하는 유저 객체 반환
     * 그 유저 객체를 saveAuthentication()으로 인증 처리하여
     * 인증 허가 처리된 객체를 SecurityContextHolder에 담기
     * 그 후 다음 인증 필터로 진행
     */
    public void checkAccessTokenAndAuthentication(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        log.info("checkAccessTokenAndAuthentication() 호출");
        Optional<String> accessToken = jwtService.extractAccessToken(request)
                .filter(jwtService::isTokenValid);
        if (accessToken.isPresent()) {
            Optional<String> username = jwtService.extractUsername(accessToken.get());
            if (username.isPresent()) {
                Optional<User> user = userRepo.findByUsername(username.get());
                if (user.isPresent()) {
                    saveAuthentication(user.get());
                }
            }
        }
        filterChain.doFilter(request, response);
    }

    /**
     * [인증 허가 메소드]
     * 파라미터의 유저 : 우리가 만든 회원 객체 / 빌더의 유저 : PrincipalDetails의 User 객체
     *
     * new UsernamePasswordAuthenticationToken()로 인증 객체인 Authentication 객체 생성
     * UsernamePasswordAuthenticationToken의 파라미터
     * 1. 위에서 만든 UserDetailsUser 객체 (유저 정보)
     * 2. credential(보통 비밀번호로, 인증 시에는 보통 null로 제거)
     * 3. Collection < ? extends GrantedAuthority>로,
     * PrincipalDetails의 User 객체 안에 Set<GrantedAuthority> authorities이 있어서 getter로 호출한 후에,
     * new NullAuthoritiesMapper()로 GrantedAuthoritiesMapper 객체를 생성하고 mapAuthorities()에 담기
     *
     * SecurityContextHolder.getContext()로 SecurityContext를 꺼낸 후,
     * setAuthentication()을 이용하여 위에서 만든 Authentication 객체에 대한 인증 허가 처리
    */
    public void saveAuthentication(User user) {
        PrincipalDetails principalDetails = new PrincipalDetails(user);

        Authentication authentication =
                new UsernamePasswordAuthenticationToken(principalDetails, null,
                        authoritiesMapper.mapAuthorities(principalDetails.getAuthorities()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
```

### PART1

```java
@Override
protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
    if (request.getRequestURI().equals(NO_CHECK_URL)) {
        filterChain.doFilter(request, response); // "/login" 요청이 들어오면, 다음 필터 호출
        return; // return으로 이후 현재 필터 진행 막기 (안해주면 아래로 내려가서 계속 필터 진행시킴)
    }

    // 사용자 요청 헤더에서 RefreshToken 추출
    // -> RefreshToken이 없거나 유효하지 않다면(DB에 저장된 RefreshToken과 다르다면) null을 반환
    // 사용자의 요청 헤더에 RefreshToken이 있는 경우는, AccessToken이 만료되어 요청한 경우밖에 없다.
    // 따라서, 위의 경우를 제외하면 추출한 refreshToken은 모두 null
    String refreshToken = jwtService.extractRefreshToken(request)
            .filter(jwtService::isTokenValid)
            .orElse(null);

    // 리프레시 토큰이 요청 헤더에 존재했다면, 사용자가 AccessToken이 만료되어서
    // RefreshToken까지 보낸 것이므로 리프레시 토큰이 DB의 리프레시 토큰과 일치하는지 판단 후,
    // 일치한다면 AccessToken을 재발급해준다.
    if (refreshToken != null) {
        checkRefreshTokenAndReIssueAccessToken(response, refreshToken);
        return; // RefreshToken을 보낸 경우에는 AccessToken을 재발급 하고 인증 처리는 하지 않게 하기위해 바로 return으로 필터 진행 막기
    }

    // RefreshToken이 없거나 유효하지 않다면, AccessToken을 검사하고 인증을 처리하는 로직 수행
    // AccessToken이 없거나 유효하지 않다면, 인증 객체가 담기지 않은 상태로 다음 필터로 넘어가기 때문에 403 에러 발생
    // AccessToken이 유효하다면, 인증 객체가 담긴 상태로 다음 필터로 넘어가기 때문에 인증 성공
    if (refreshToken == null) {
        checkAccessTokenAndAuthentication(request, response, filterChain);
    }
}
```

해당 메소드에서는 **인증 처리를 할 것 인가에 대해서 그리고 인증 처리/인증 실패/토큰 재발급 에 대해서 처리한다.**

위에서 설명한 것과 같이

기본 요청시 **Access Token만 가지고 요청**을 하기 때문에 Refresh Token이 함께 오지 않은 경우 일반 인증 처리 로직을 거치고,

**Refresh Token이 왔다면 Access Token이 만료되어 재발급을 요청한 것**이기 때문에 그에 대한 인증과 재발급을 처리하고 있다.

### PART2

```java
/**
 * [액세스 토큰 체크 & 인증 처리 메소드]
 * request에서 extractAccessToken()으로 액세스 토큰 추출 후, isTokenValid()로 유효한 토큰인지 검증
 * 유효한 토큰이면, 액세스 토큰에서 extractUsername을 통해 username을 추출한 후 findByUseranme()로 해당 아이디를 사용하는 유저 객체 반환
 * 그 유저 객체를 saveAuthentication()으로 인증 처리하여
 * 인증 허가 처리된 객체를 SecurityContextHolder에 담기
 * 그 후 다음 인증 필터로 진행
 */
public void checkAccessTokenAndAuthentication(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
    log.info("checkAccessTokenAndAuthentication() 호출");
    Optional<String> accessToken = jwtService.extractAccessToken(request)
            .filter(jwtService::isTokenValid);
    if (accessToken.isPresent()) {
        Optional<String> username = jwtService.extractUsername(accessToken.get());
        if (username.isPresent()) {
            Optional<User> user = userRepo.findByUsername(username.get());
            if (user.isPresent()) {
                saveAuthentication(user.get());
            }
       }
    }
    filterChain.doFilter(request, response);
}

/**
 * [인증 허가 메소드]
 * 파라미터의 유저 : 우리가 만든 회원 객체 / 빌더의 유저 : PrincipalDetails의 User 객체
 *
 * new UsernamePasswordAuthenticationToken()로 인증 객체인 Authentication 객체 생성
 * UsernamePasswordAuthenticationToken의 파라미터
 * 1. 위에서 만든 UserDetailsUser 객체 (유저 정보)
 * 2. credential(보통 비밀번호로, 인증 시에는 보통 null로 제거)
 * 3. Collection < ? extends GrantedAuthority>로,
 * PrincipalDetails의 User 객체 안에 Set<GrantedAuthority> authorities이 있어서 getter로 호출한 후에,
 * new NullAuthoritiesMapper()로 GrantedAuthoritiesMapper 객체를 생성하고 mapAuthorities()에 담기
 *
 * SecurityContextHolder.getContext()로 SecurityContext를 꺼낸 후,
 * setAuthentication()을 이용하여 위에서 만든 Authentication 객체에 대한 인증 허가 처리
 */
public void saveAuthentication(User user) {
    PrincipalDetails principalDetails = new PrincipalDetails(user);

    Authentication authentication =
            new UsernamePasswordAuthenticationToken(principalDetails, null,
                    authoritiesMapper.mapAuthorities(principalDetails.getAuthorities()));

    SecurityContextHolder.getContext().setAuthentication(authentication);
}
```

**전달 받은 Access Token 을 검증하고 인증 처리**하는 메소드와

인증 성공시 전달 받은 User 객체를 담아서 인증 완료 시키는 메소드이다.

### PART3

```java
/**
 *  [리프레시 토큰으로 유저 정보 찾기 & 액세스 토큰/리프레시 토큰 재발급 메소드]
 *  파라미터로 들어온 헤더에서 추출한 리프레시 토큰으로 DB에서 유저를 찾고, 해당 유저가 있다면
 *  JwtService.createAccessToken()으로 AccessToken 생성,
 *  reIssueRefreshToken()로 리프레시 토큰 재발급 & DB에 리프레시 토큰 업데이트 메소드 호출
 *  그 후 JwtService.sendAccessTokenAndRefreshToken()으로 응답 헤더에 보내기
 */
public void checkRefreshTokenAndReIssueAccessToken(HttpServletResponse response, String refreshToken) throws IOException {
    Optional<User> byRefreshToken = userRepo.findByRefreshToken(refreshToken);
    if (byRefreshToken.isPresent()) {
        User user = byRefreshToken.get();
        String reIssuedRefreshToken = reIssueRefreshToken(user);
        jwtService.sendAccessAndRefreshToken(response, jwtService.createAccessToken(user.getUsername()), reIssuedRefreshToken);
    }
}

/**
 * [리프레시 토큰 재발급 & DB에 리프레시 토큰 업데이트 메소드]
 * jwtService.createRefreshToken()으로 리프레시 토큰 재발급 후
 * DB에 재발급한 리프레시 토큰 업데이트 후 Flush
 */
private String reIssueRefreshToken(User user) {
    String reIssuedRefreshToken = jwtService.createRefreshToken();
    user.updateRefreshToken(reIssuedRefreshToken);
    userRepo.saveAndFlush(user);
    return reIssuedRefreshToken;
}
```

만약 **Refresh Token을 전달 받았을 경우 호출되는 메소드로**

**Refresh Token을 검증하고**

**Refresh Token을 업데이트 하며 재발급 한 AccessToken과 함께 반환한다.**

**다음에는 JSON 방식으로 로그인하도록 자체 로그인 커스텀과 그에 따른 관련 클래스를 작성하도록 할 것이다.**
