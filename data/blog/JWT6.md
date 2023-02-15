---
title: OAuth2 Login + JWT (6) OAuth2 Login 추가
date: '2023-02-14'
tags: ['Spring boot', 'Spring Security', '기술']
draft: false
summary: 자체 로그인 서비스에 대한 구현을 완료 했으니 OAuth2 Login을 추가하도록 하자.
---

## OAuth2 Login 추가

OAuth2 Login에 대해서는 이전 글에서 다룬 적이 있기 때문에 [(과거 글)](https://www.ywj9811.vercel.app/blog/SpringSecurityOauth2WithFaceBook) 이 부분(해당 글 위 아래 글)을 참고하시길 바란다.

## OAuth2 관련 클래스 작성

Google, FaceBook, Naver 로그인에 대한 각각의 정보 처리 및 OAuth2User 상속에 대한 부분은 이전 게시글에서 다룬 적이 있기 때문에 핵심적인 부분만 다루도록 하겠다.

### DefaultOAuth2UserService 상속 받은 PrincipalOauth2UserService 클래스

```java
import com.example.oauth2WithJwt.config.auth.PrincipalDetails;
import com.example.oauth2WithJwt.config.oauth2.provider.FaceBookUserInfo;
import com.example.oauth2WithJwt.config.oauth2.provider.GoogleUserInfo;
import com.example.oauth2WithJwt.config.oauth2.provider.NaverUserInfo;
import com.example.oauth2WithJwt.config.oauth2.provider.OAUth2UserInfo;
import com.example.oauth2WithJwt.domain.User;
import com.example.oauth2WithJwt.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PrincipalOauth2UserService extends DefaultOAuth2UserService {
    private final BCryptPasswordEncoder bCryptPasswordEncoder;
    private final UserService userService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        log.info("PrincipalOauth2UserService() 실행 - Oauth 로그인 요청 진입");
        log.info("registartionId, OAuth2 = {}", userRequest.getClientRegistration());
        //어떤 registrationId를 통한 로그인인가

        log.info("TokenValue = {}", userRequest.getAccessToken());
        // 구글 로그인 버튼 클릭시 -> 구글 로그인 창 -> 로그인 완료 -> code 반환 (OAuth-Client 라이브러리) -> AccessToken 요청
        // : userRequest 정보를 얻음
        // userRequest 정보 -> 회원 프로필 받아야함 (loadUser함수) -> 회원 프로필 받음

        OAuth2User oAuth2User = super.loadUser(userRequest);
        log.info("getAttribue = {}", oAuth2User);
        // getAttribute에서 정보를 얻을 수 있음 -> 이를 통해서 자동 회원가입 등등의 과정을 가져갈 수 있다
        // oAuth2User 는 OAuth 서비스에서 가져온 유저의 정보를 담고 있다.

        OAUth2UserInfo oaUth2UserInfo = null;
        oaUth2UserInfo = getOauth2UserInfo(userRequest, oAuth2User, oaUth2UserInfo);

        PrincipalDetails principalDetails = getPrincipalDetails(oAuth2User, oaUth2UserInfo);
        log.info("principalDetails = {}", principalDetails.getAttributes());
        return principalDetails;
    }
@Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        log.info("PrincipalOauth2UserService() 실행 - Oauth 로그인 요청 진입");
        log.info("registartionId, OAuth2 = {}", userRequest.getClientRegistration());
        //어떤 registrationId를 통한 로그인인가

        log.info("TokenValue = {}", userRequest.getAccessToken());
        // 구글 로그인 버튼 클릭시 -> 구글 로그인 창 -> 로그인 완료 -> code 반환 (OAuth-Client 라이브러리) -> AccessToken 요청
        // : userRequest 정보를 얻음
        // userRequest 정보 -> 회원 프로필 받아야함 (loadUser함수) -> 회원 프로필 받음

        OAuth2User oAuth2User = super.loadUser(userRequest);
        log.info("getAttribue = {}", oAuth2User);
        // getAttribute에서 정보를 얻을 수 있음 -> 이를 통해서 자동 회원가입 등등의 과정을 가져갈 수 있다
        // oAuth2User 는 OAuth 서비스에서 가져온 유저의 정보를 담고 있다.

        OAUth2UserInfo oaUth2UserInfo = null;
        oaUth2UserInfo = getOauth2UserInfo(userRequest, oAuth2User, oaUth2UserInfo);

        PrincipalDetails principalDetails = getPrincipalDetails(oAuth2User, oaUth2UserInfo);
        log.info("principalDetails = {}", principalDetails.getAttributes());
        return principalDetails;
    }

    private OAUth2UserInfo getOauth2UserInfo(OAuth2UserRequest userRequest, OAuth2User oAuth2User, OAUth2UserInfo oaUth2UserInfo) {
        if (userRequest.getClientRegistration().getRegistrationId().equals("google")) {
            log.info("google 요청");
            oaUth2UserInfo = new GoogleUserInfo(oAuth2User.getAttributes());
        }

        if (userRequest.getClientRegistration().getRegistrationId().equals("facebook")) {
            log.info("facebook 요청");
            oaUth2UserInfo = new FaceBookUserInfo(oAuth2User.getAttributes());
        }

        if (userRequest.getClientRegistration().getRegistrationId().equals("naver")) {
            log.info("naver 요청");
            oaUth2UserInfo = new NaverUserInfo((Map<String, Object>) oAuth2User.getAttributes().get("response"));
        }

        return oaUth2UserInfo;
    }
    private PrincipalDetails getPrincipalDetails(OAuth2User oAuth2User, OAUth2UserInfo oaUth2UserInfo) {
        String provider = oaUth2UserInfo.getProvider();
        // google of facebook
        String providerId = oaUth2UserInfo.getProviderId();
        // 넘어오는 ProviderId
        String email = oaUth2UserInfo.getEmail();
        // email값
        String username = provider + "_" + providerId;
        // google_1032140005 이런식으로 생성됨
        String password = bCryptPasswordEncoder.encode("getInThere");
        // 아무 값이 넣어줌(필요없어서)

        User user = userService.findByUsername(username);

        if (user == null) {
            log.info("회원가입 처리");
            user = User.builder()
                    .username(username)
                    .password(password)
                    .provider(provider)
                    .providerId(providerId)
                    .email(email)
                    .build();

            userService.save(user);
            return new PrincipalDetails(user, oAuth2User.getAttributes());
        }

        log.info("이미 존재하는 OAuth 아이디");
        return new PrincipalDetails(user, oAuth2User.getAttributes());
    }
}
```

### PART1

```java
@Override
public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
    log.info("PrincipalOauth2UserService() 실행 - Oauth 로그인 요청 진입");
    log.info("registartionId, OAuth2 = {}", userRequest.getClientRegistration());
    //어떤 registrationId를 통한 로그인인가

    log.info("TokenValue = {}", userRequest.getAccessToken());
    // 구글 로그인 버튼 클릭시 -> 구글 로그인 창 -> 로그인 완료 -> code 반환 (OAuth-Client 라이브러리) -> AccessToken 요청
    // : userRequest 정보를 얻음
    // userRequest 정보 -> 회원 프로필 받아야함 (loadUser함수) -> 회원 프로필 받음

    OAuth2User oAuth2User = super.loadUser(userRequest);
    log.info("getAttribue = {}", oAuth2User);
    // getAttribute에서 정보를 얻을 수 있음 -> 이를 통해서 자동 회원가입 등등의 과정을 가져갈 수 있다
    // oAuth2User 는 OAuth 서비스에서 가져온 유저의 정보를 담고 있다.

    OAUth2UserInfo oaUth2UserInfo = null;
    oaUth2UserInfo = getOauth2UserInfo(userRequest, oAuth2User, oaUth2UserInfo);

    PrincipalDetails principalDetails = getPrincipalDetails(oAuth2User, oaUth2UserInfo);
    log.info("principalDetails = {}", principalDetails.getAttributes());
    return principalDetails;
}
```

파라미터로 넘겨 받은 userRequest를 통해 `super.loadUser(userRequest);` 에서 회원의 정보를 담고 있는 객체를 얻어온다.

### PART2

```java
private OAUth2UserInfo getOauth2UserInfo(OAuth2UserRequest userRequest, OAuth2User oAuth2User, OAUth2UserInfo oaUth2UserInfo) {
    if (userRequest.getClientRegistration().getRegistrationId().equals("google")) {
        log.info("google 요청");
        oaUth2UserInfo = new GoogleUserInfo(oAuth2User.getAttributes());
    }

    if (userRequest.getClientRegistration().getRegistrationId().equals("facebook")) {
        log.info("facebook 요청");
        oaUth2UserInfo = new FaceBookUserInfo(oAuth2User.getAttributes());
    }

    if (userRequest.getClientRegistration().getRegistrationId().equals("naver")) {
        log.info("naver 요청");
        oaUth2UserInfo = new NaverUserInfo((Map<String, Object>) oAuth2User.getAttributes().get("response"));
    }

    return oaUth2UserInfo;
}
```

파라미터로 넘겨 받은 **userRequest와 oAuthUser를 통해** 각 소셜에 따라서 **OauthUserInfo** 를 넘겨 받게 된다.

### PART3

```java
private PrincipalDetails getPrincipalDetails(OAuth2User oAuth2User, OAUth2UserInfo oaUth2UserInfo) {
    String provider = oaUth2UserInfo.getProvider();
    // google or facebook or naver
    String providerId = oaUth2UserInfo.getProviderId();
    // 넘어오는 ProviderId
    String email = oaUth2UserInfo.getEmail();
    // email값
    String username = provider + "_" + providerId;
    // google_1032140005 이런식으로 생성됨
    String password = bCryptPasswordEncoder.encode("getInThere");
    // 아무 값이 넣어줌(필요없어서)

    User user = userService.findByUsername(username);

    if (user == null) {
        log.info("회원가입 처리");
        user = User.builder()
                .username(username)
                .password(password)
                .provider(provider)
                .providerId(providerId)
                .email(email)
                .build();

        userService.save(user);
        return new PrincipalDetails(user, oAuth2User.getAttributes());
    }

    log.info("이미 존재하는 OAuth 아이디");
    return new PrincipalDetails(user, oAuth2User.getAttributes());
}
```

이 부분은 넘겨 받은 파라미터를 통해 최초 로그인의 경우 회원가입 처리를 하고 **PrincipalDetails 객체를 반환**하게 되며, 아닌 경우 바로 **PrincipalDetails 객체를 반환**하게 된다.

## OAuth2 Login 성공/실패 시 핸들러

이전에는 기본 Login시 작동하는 핸들러를 작성했으니 이번에는 OAuth2 Login 시 작동하는 핸들러를 작성할 것이다.

### OAuth2LoginSuccessHandler 클래스

```java
import com.example.oauth2WithJwt.config.auth.PrincipalDetails;
import com.example.oauth2WithJwt.config.jwt.service.JwtService;
import com.example.oauth2WithJwt.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * OAuth2 로그인 성공시 로직 작성
 */
@RequiredArgsConstructor
@Component
@Slf4j
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {
    private final JwtService jwtService;
    private final UserRepo userRepo;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        log.info("OAuth2 로그인 성공");
        try {
            loginSuccess(response, (PrincipalDetails) authentication.getPrincipal());
        } catch (Exception e) {
            throw e;
        }
    }

    private void loginSuccess(HttpServletResponse response, PrincipalDetails principalDetails) throws IOException {
        String accessToken = jwtService.createAccessToken(principalDetails.getUsername());
        String refreshToken = jwtService.createRefreshToken();

        jwtService.updateRefreshToken(principalDetails.getUsername(), refreshToken);
        jwtService.sendAccessAndRefreshToken(response, accessToken, refreshToken);
    }
    /**
     * 현재 : 무조건 토큰 생성함
     * but
     * JWT 인증 필터처럼 RefreshToken 유/무에 따라 다르게 처리하자
     */
}
```

이미 인증 과정을 모두 통과한 상태이기 때문에 Token을 발급하여 헤더에 실어서 보내준다.

### OAuth2LoginFailureHandler 클래스

```java
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Slf4j
@Component
public class OAuth2LoginFailureHandler implements AuthenticationFailureHandler {
    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        response.getWriter().write("소셜 로그인 실패! 서버 로그 확인 바람.");
        log.info("소셜 로그인에 실패. 에러 메시지 : {}", exception.getMessage());
    }
}
```

인증에 실패한 상태이기 때문에 에러 코드를 보내며 실패라는 메시지를 보내준다.

**지금까지 필요한 클래스 및 필터를 모두 작성했으니 다음에는 이를 설정할 수 있는 SecurityConfig에 대해서 살펴보도록 할 것이다.**
