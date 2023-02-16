---
title: Redis를 사용하여 기존의 JWT방식의 로그아웃 구현
date: '2023-02-17'
tags: ['Spring boot', 'Spring Security', '기술']
draft: false
summary: Redis를 사용하여 기존의 JWT를 이용한 로그인에 코드에 로그아웃을 추가해보자.
---

# JWT + Redis

이전에 OAuth2 Login + JWT 를 작성했었는데, 해당 프로젝트에는 로그아웃 기능이 구현이 되어있지 않다.

즉, 로그아웃을 하더라도 AccessToken의 기간이 끝나지 않는다면 다시 접근할 수 있고 RefreshToken을 알고 있다면 언제든지 접근할 수 있는 것이다.

⚠️**물론 RefreshToken의 경우 로그아웃 하면 DB에서 삭제해주고 AccessToken 또한 따로 처리하면 할 수 있을 것이다. 하지만 불필요한 디스크 접근을 막기 위해서 Redis를 사용해볼까 한다.**

## 설정 추가

```java
// redis 추가
	implementation 'org.springframework.boot:spring-boot-starter-data-redis'
```

**build.gradle**에 해당 코드를 추가해서 의존 관계를 추가하여 Redis를 간편하게 이용할 수 있도록 하자.

```yaml
spring:
	redis: localhost
	port: 6379
```

**application.yml**에도 위의 코드를 추가하도록 하자.

**port는 기본이 6379**를 사용하도록 되어 있다.

**⚠️물론 이전에 Redis를 다운받고 사용하도록 하자 (구글에 검색하면 많이 나온다.)**

### 참고로 Redis를 사용하기 때문에 이전의 User 엔티티에서 refreshToken은 삭제한다.

## RedisRepository 작성

```java
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.Optional;

@RequiredArgsConstructor
@Repository
public class RedisRepo {
    private final RedisTemplate<String, String> redisTemplate;

    public void setValues(String key, String data) {
        ValueOperations<String, String> values = redisTemplate.opsForValue();
        values.set(key, data);
    }

    public void setValues(String key, String data, Duration duration) {
        ValueOperations<String, String> values = redisTemplate.opsForValue();
        values.set(key, data, duration);
    }

    public Optional<String> getValues(String key) {
        ValueOperations<String, String> values = redisTemplate.opsForValue();
        return Optional.ofNullable(values.get(key));
    }

    public void deleteValues(String key) {
        redisTemplate.delete(key);
    }
}
```

**`RedisTemplate<String, String>`** 을 자동 주입 받아서 사용하도록 할 것이다.

코드의 경우는 간단하기 때문에 바로 이해가 될 것이다.

### 이제 본격적으로 수정을 해볼 것인데, 다음과 같은 순서로 작성할 것이다.

### 1. RefreshToken 발급 시 Redis에 저장 및 업데이트

### 2. 로그아웃 할 경우 RefreshToken 삭제 및 AccessToken 블랙리스트 등록

### RefreshToken 발급 시 Redis에 저장 및 업데이트

이전에 처음 구현을 할 때는 RereshToken을 데이터 베이스에 각 유저별로 등록을 하면서 사용했었다.

하지만 Redis에 대해 설명할 때 다룬 것과 같이 데이터 베이스는 디스크에 직접 접근해야 하기 때문에 서버에 부하가 걸릴 수 있다.

따라서 데이터 베이스에 저장하는 것이 아닌 Redis에 저장을 하고 사용하려고 한다.

**JwtAuthenticationProcessingFilter**와 **LoginSucessHandler** 그리고 **Oauth2LoginSuccess**에서 수정을 하도록 할 것이다.

1. **LoginSuccessHandler**

```java
@Override
public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
    String username = extractUsername(authentication); //인증 정보에서 username 가져옴
    String accessToken = jwtService.createAccessToken(username); //JwtService에서 AccessToken 발급
    String refreshToken = jwtService.createRepublic void updateRefreshToken(String username, String refreshToken) {
        Optional<User> byUsername = userRepository.findByUsername(username);
        if (byUsername.isEmpty()) {
            new Exception("일치하는 회원이 없습니다.");
        }
        log.info("RefreshToken 업데이트");
//        User user = byUsername.get();
//        user.updateRefreshToken(refreshToken);
//        userRepository.saveAndFlush(user);
        /**
         * Redis 사용
         */
        redisRepo.setValues(username, refreshToken, Duration.ofMillis(refreshTokenExpirationPeriod));
    }freshToken(username); //JwtService에서 RefreshToken 발급

    jwtService.sendAccessAndRefreshToken(response, accessToken, refreshToken);
    //응답 헤더에 accessToken, refreshToken 장착

    Optional<User> byUsername = userRepo.findByUsername(username);
    if (byUsername.isPresent()) {
        /**
         * Redis 사용 수정
         */
        redisRepo.setValues(username, refreshToken, Duration.ofMillis(refreshTokenExpiration));
    }
    log.info("로그인 성공 username : {}", username);
    log.info("로그인 성공 AccessToken : {}", accessToken);
    log.info("토큰 만료 기간 : {}", accessTokenExpiration);
}
```

**LoginSuccessHandler**의 `onAuthenticationSuccess()` 에서 로그인 진행 시 Redis에 refreshToken을 저장하도록 할 것이다.

**`redisRepo.setValues(username, refreshToken, Duration.ofMillis(refreshTokenExpiration));`** 에서 **username을 Key로 refreshToken을 Value로** 하여 저장하고 있는데, **refreshToken의 만료 시간을 넣어줘서 해당 기간이 지나면 자동으로 삭제되도록** 설정을 한다.

1. **OAuth2LoginSuccessHandler**

```java
private void loginSuccess(HttpServletResponse response, PrincipalDetails principalDetails) throws IOException {
    String accessToken = jwtService.createAccessToken(principalDetails.getUsername());
    String refreshToken = jwtService.createRefreshToken(principalDetails.getUsername());

    jwtService.updateRefreshToken(principalDetails.getUsername(), refreshToken);
    jwtService.sendAccessAndRefreshToken(response, accessToken, refreshToken);
}
```

```java
@Service
@RequiredArgsConstructor
@Getter
@Slf4j
public class JwtService {
		...

		public void updateRefreshToken(String username, String refreshToken) {
        Optional<User> byUsername = userRepository.findByUsername(username);
        if (byUsername.isEmpty()) {
            new Exception("일치하는 회원이 없습니다.");
        }
        log.info("RefreshToken 업데이트");
        /**
         * Redis 사용
         */
        redisRepo.setValues(username, refreshToken, Duration.ofMillis(refreshTokenExpirationPeriod));
    }

		...
}
```

이렇게 **이전과 마찬가지로 redisRepo에 저장**하고 있다.

1. **JwtAuthenticationProcessingFilter**

```java
public void checkRefreshTokenAndReIssueAccessToken(HttpServletRequest request, HttpServletResponse response, String refreshToken) throws IOException, AccessTokenValidationException {
    log.info("refreshToken 검사");
    Optional<String> username = jwtService.extractUsername(refreshToken);
    if (username.isPresent()) {
        Optional<User> byUsername = userRepo.findByUsername(username.get());
        if (byUsername.isPresent()) {
            if (!redisRepo.getValues(byUsername.get().getUsername()).isEmpty()) {
                log.info("refreshToken 업데이트 및 AccessToken 재발급 ");
                String reIssuedRefreshToken = reIssueRefreshToken(byUsername.get());
                jwtService.sendAccessAndRefreshToken(response, jwtService.createAccessToken(username.get()), reIssuedRefreshToken);

                //AccessToken 재발급 요청시 어떤 경로로 요청했는지 함께 보내줌 (헤더에 담아서)
                String requestURI = request.getRequestURI();
                log.info("requestURI : {}", requestURI);
                response.setHeader("requestUrl", requestURI);

                return;
            }
        }
    }
    log.error("refreshToken값이 잘못되었습니다. 요청 확인 바람");
    throw new AccessTokenValidationException("RefreshToken 값 불일치");
}

private String reIssueRefreshToken(User user) {
    String reIssuedRefreshToken = jwtService.createRefreshToken(user.getUsername());
    /**
     * Redis 사용 수정
     */
    redisRepo.setValues(user.getUsername(), reIssuedRefreshToken, Duration.ofMillis(refreshTokenExpiration));
    return reIssuedRefreshToken;

```

이렇게 **AuthenticationProcessingFilter에서 AccessToken 재발급이 왔을 때** **RefreshToken이 현재 Redis에 존재하는지 확인 후 AccessToken을 재발급 해줌**과 **동시에 Redis에 RefreshToken을 다시 저장**하고 있다.

💡**이 때 Key 값은 해당 username으로 등록하고 있다.**

### 로그아웃 할 경우 RefreshToken 삭제 및 AccessToken 블랙리스트 등록

RefreshToken 발급할 때 Redis에 저장을 하였으니, **로그아웃을 할 때면 Redis에서 해당 RefreshToken을 삭제**해줘야 한다.

그리고 로그아웃을 하면 기존의 AccessToken으로 접근할 수 없어야 하니 **AccessToken은 블랙리스트로 등록**을 해줘야 한다.

즉, **로그아웃할 때 위의 과정에 대한 로직을 추가**해줘야 하며 **권한이 필요한 페이지로 이동할 때 AccessToken이 블랙리스트로 등록되어있는지 확인**할 수 있도록 수정을 해줘야 한다.

1. **로그아웃 로직 추가**

**UserController**

```java
@PostMapping("/out")
@ResponseBody
public String logout(HttpServletRequest request, Long userIdx) {
    log.info("accessToken = {}", request.getHeader("Authorization"));
    boolean logout = jwtService.logout(request, userIdx);
    if (logout)
        return "로그아웃";
    return "오류 발생";
}
```

우선 간단하게 컨트롤러에서는 로그아웃 성공 여부를 확인할 수 있게 반환을 해주도록 하고 작성을 하도록 하자.

**JwtService**

```java
public boolean logout(HttpServletRequest request, Long userIdx) {
    Optional<String> optionalAccessToken = extractToken(request);
    if (optionalAccessToken.isEmpty())
        throw new JwtException("JWT 예외 발생");

    String accessToken = optionalAccessToken.get();
    try {
        JWT.require(Algorithm.HMAC512(secretKey)).build().verify(accessToken);
        Long expiration = getExpiration(accessToken);
				log.info("AccessToken 블랙리스트 등록 {}", accessToken);
        redisRepo.setValues(accessToken, "logout", Duration.ofMillis(expiration));
    } catch (TokenExpiredException e) {
        log.info("토큰 기한이 만료되었습니다 {}", e.getMessage());
    } catch (IllegalArgumentException e) {
        log.error("JWT 토큰이 잘못되었습니다. {}", e.getMessage());
        throw new JwtException("JWT 토큰이 잘못되었습니다.");
    } catch (Exception e) {
        log.error("유효하지 않은 토큰입니다. {}", e.getMessage());
        e.printStackTrace();
        throw new JwtException("JWT 예외 발생");
    }

    log.info("userIdx = {}", userIdx);
    User user = userRepository.findById(userIdx).get();

    Optional<String> refreshToken = redisRepo.getValues(username);
    if (!refreshToken.isEmpty()) {
        redisRepo.deleteValues(username);
    }

    return true;
}

public Optional<String> extractToken(HttpServletRequest request) {
    return Optional.ofNullable(request.getHeader(accessHeader))
            .filter(refreshToken -> refreshToken.startsWith(BEARER))
            .map(refreshToken -> refreshToken.replace(BEARER, ""));
}

//accessToken 남은 시간 계산
public Long getExpiration(String accessToken) {
    Date expiration = JWT.decode(accessToken).getExpiresAt();

    Long now = new Date().getTime();

    return (expiration.getTime() - now);
}
```

위의 코드를 살펴보면 AccessToken을 전달 받으면 **해당 토큰의 남은 유효기간 만큼 블랙리스트로 저장** 한다.

**💡블랙리스트 등록 → “AccessToken”을 Key 값으로 “logout”이라는 Value를 저장한 것이다.**

그리고 **username을 통해서 Redis에서 RefreshToken을 삭제**해준다.

이렇게 로그아웃 처리를 할 수 있다.

1. **권한이 필요한 페이지로 이동할 때 AccessToken이 블랙리스트로 등록되어있는지 확인**

로그아웃을 할 경우 AccessToken은 블랙리스트로 그리고 RefreshToken은 삭제했으니 이제 해당 토큰으로 접근하는 경우 막아야 한다.

```java
public void checkAccessTokenAndAuthentication(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException, AccessTokenValidationException {
    log.info("checkAccessTokenAndAuthentication() 호출");
    Optional<String> accessToken = jwtService.extractAccessToken(request)
            .filter(jwtService::isTokenValid);
    if (accessToken.isPresent()) {
        log.info("----------------------------------------------------");
        log.info("AccessToken.value = {}", redisRepo.getValues(accessToken.get()));
        log.info("----------------------------------------------------");
        if (!redisRepo.getValues(accessToken.get()).isPresent()) {
            Optional<String> username = jwtService.extractUsername(accessToken.get());
            if (username.isPresent()) {
                Optional<User> user = userRepo.findByUsername(username.get());
                if (user.isPresent()) {
                    saveAuthentication(user.get());
                    filterChain.doFilter(request, response);
                    return;
                }
            }
            log.error("username이 없음");
        }
        log.error("블랙리스트 등록 accessToken 접근");
    }
    log.error("AccessToken 비정상");
    throw new AccessTokenValidationException("AccessToken 비정상");
}
```

이렇게 만약 **Redis에 해당 토큰을 Key값으로 저장되어 있다면 해당 토큰은 블랙리스트로 저장되어 있는 것이기 때문에 통과할 수 없도록 막는 것**이다.

현재는 임시로 예외를 발생 시키도록 막아 두었다.

**이렇게 Redis를 추가하여 기존의 JWT + Spring Security 에서 로그아웃 기능을 더 효율적으로 추가할 수 있다.**
