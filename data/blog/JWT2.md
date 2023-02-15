---
title: OAuth2 Login + JWT (2) 구현 준비
date: '2023-02-14'
tags: ['Spring boot', 'Spring Security', '기술']
draft: false
summary: OAuth2 Login + JWT 에 대한 기본 준비를 하도록 하자.
---

### 이전에 확인한 JWT에 대한 정보를 토대로 OAuth2 Login과 JWT를 융합하여 로그인을 만들어 보도록 하자.

이전에 OAuth2 에서 사용했던 User를 기반으로 구현할 것이다.

### User 클래스

```java
@Entity
@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userIdx;

    private String username;

    private String password;

    private String email;

    private String role;

    private String provider;

    private String providerId;

    @CreationTimestamp
    private Timestamp createDate;

    private String refreshToken;

    public void userRoleSet() {
        this.role = "ROLE_USER";
    }

    public void updateRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
}
```

기본적인 정보 + **OAuth2 를 사용할 것이기 때문에**

provider라는 어떤 SocialLogin을 하였는지를 저장하는 컬럼과

ProviderId라는 해당 소셜에서 제공되는 정보를 저장할 컬럼을 추가로 가지도록 하자.

그리고 JWT를 통한 로그인에서 refreshToken을 발급 받고 저장할 것이기 때문에 이 또한 추가로 지니도록 하자.

### UserDto 클래스

```java
@AllArgsConstructor
@Data
public class UserDto {
    String username;
    String password;
    String email;

    public User dtoToDomain() {
        return User.builder()
                .username(username)
                .email(email)
                .password(password)
                .build();
    }
}
```

### UserRepository 클래스

```java
@Repository
public interface UserRepo extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    Optional<User> findByRefreshToken(String refreshToken);
    Optional<User> findByEmail(String email);
}
```

### UserService 클래스

```java
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepo userRepo;

    public User findByUsername(String username) {
        Optional<User> user = userRepo.findByUsername(username);
        if (user.isEmpty())
            return null;
        return user.get();
    }

    public User save(User user) {
        user.userRoleSet();
        User save = userRepo.save(user);
        return save;
    }

}
```

### UserController 클래스

```java
@Controller
@Slf4j
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;

    @GetMapping("/user")
    @ResponseBody
    public String loginFin(@AuthenticationPrincipal PrincipalDetails principalDetails) {
        log.info("principalDetails = {}", principalDetails);
        return "user";
    }

    @GetMapping("/manager")
    @ResponseBody
    public String manager(@AuthenticationPrincipal PrincipalDetails principalDetails) {
        log.info("principalDetails = {}", principalDetails);
        return "manager";
    }

    @GetMapping("/admin")
    @ResponseBody
    public String admin(@AuthenticationPrincipal PrincipalDetails principalDetails) {
        log.info("principalDetails = {}", principalDetails);
        return "admin";
    }

    @PostMapping("/join")
    public String join(UserDto userDto) {
        userDto.setPassword(bCryptPasswordEncoder.encode(userDto.getPassword()));
        userService.save(userDto.dtoToDomain());
        return "loginForm.html";
    }

    @GetMapping("/joinForm")
    public String getJoinForm() {
        return "joinForm.html";
    }

    @GetMapping("/loginForm")
    public String getLoginForm() {
        return "loginForm.html";
    }

    @GetMapping("/SnsLogin")
    public String getSnsLoginForm() {
        return "SnsLogin.html";
    }
}
```

이렇게 기본적인 User 관련 클래스를 가지고 진행하도록 할 것이다.

### JWT 관련 클래스 및 설정 작성

### build.gradle 추가

```java
// https://mvnrepository.com/artifact/com.auth0/java-jwt
implementation group: 'com.auth0', name: 'java-jwt', version: '3.19.1'
// jwt 편하게 생성시켜주는 라이브러리 mvnRepository 에서 받아옴
```

**JWT를 사용할 것이기 때문에** 위의 오픈 소스 라이브러리를 통해서 편의성을 가져도록 할 것이다.

### application.yml 추가

```yaml
# JWT
jwt:
  secretKey: base64로 인코딩된 암호 키 (512비트 이상이 되도록 작성 : 영숫자 조합으로 작성)

  access:
    expiration: 3600000 #한시간
    header: Authorization

  refresh:
    expiration: 1209600000 #2주일
    header: Authorization-refresh
```

- **jwt.secretKey** : 서버가 가지고 있는 개인 키
- **jwt.access(refresh).expiration** : 토큰의 만료시간 설정
- **jwt.access(refresh).header** : 토큰이 담길 헤더의 이름(key) 설정

### JwtService (JWT 로직 관련 클래스)

로직이 매우 길기 때문에 전체 코드 이후에 **나눠서 설명**하도록 할 것이다.

```java
@Service
@RequiredArgsConstructor
@Getter
@Slf4j
public class JwtService {
    @Value("${jwt.secretKey}")
    private String secretKey;

    @Value("${jwt.access.expiration}")
    private Long accessTokenExpirationPeriod;

    @Value("${jwt.refresh.expiration}")
    private Long refreshTokenExpirationPeriod;

    @Value("${jwt.access.header}")
    private String accessHeader;

    @Value("${jwt.refresh.header}")
    private String refreshHeader;

    /**
     * JWT의 Subject와 Claim으로 username 사용 -> 클레임의 name을 "username"으로 설정
     * JWT의 헤더에 들어오는 값 : 'Authorization(Key) = Bearer {토큰} (Value)' 형식
     * 토큰은 자동으로 Bearer + 값 이렇게 생긴다.
     */
    private static final String ACCESS_TOKEN_SUBJECT = "AccessToken";
    private static final String REFRESH_TOKEN_SUBJECT = "RefreshToken";
    private static final String USERNAME_CLAIM = "username";
    private static final String BEARER = "Bearer ";

    private final UserRepo userRepository;

    /**
     * AccessToken 생성 메소드
     */
    public String createAccessToken(String username) {
        Date now = new Date();
        return JWT.create() // JWT 토큰을 생성하는 빌더 반환
                .withSubject(ACCESS_TOKEN_SUBJECT) // JWT의 Subject 지정 -> AccessToken이므로 AccessToken
                .withExpiresAt(new Date(now.getTime() + accessTokenExpirationPeriod)) // 토큰 만료 시간 설정
                .withIssuedAt(new Date(now.getTime()))
                //클레임으로는 저희는 username 하나만 사용합니다.
                //추가적으로 식별자나, 이름 등의 정보를 더 추가하셔도 됩니다.
                //추가하실 경우 .withClaim(클래임 이름, 클래임 값) 으로 설정해주시면 됩니다
                .withClaim(USERNAME_CLAIM, username)
                .sign(Algorithm.HMAC512(secretKey)); // HMAC512 알고리즘 사용, application.yml에서 지정한 secret 키로 암호화
    }

    /**
     * RefreshToken 생성
     * RefreshToken은 Claim에 username도 넣지 않으므로 withClaim() X
     */
    public String createRefreshToken() {
        Date now = new Date();
        return JWT.create()
                .withSubject(REFRESH_TOKEN_SUBJECT)
                .withExpiresAt(new Date(now.getTime() + refreshTokenExpirationPeriod))
                .withIssuedAt(new Date(now.getTime()))
                .sign(Algorithm.HMAC512(secretKey));
    }

    /**
     * AccessToken 헤더에 실어서 보내기
     */
    public void sendAccessToken(HttpServletResponse response, String accessToken) {
        response.setStatus(HttpServletResponse.SC_OK);

        response.setHeader(accessHeader, accessToken);
        log.info("재발급된 Access Token : {}", accessToken);
    }

    /**
     * AccessToken + RefreshToken 헤더에 실어서 보내기
     */
    public void sendAccessAndRefreshToken(HttpServletResponse response, String accessToken, String refreshToken) throws IOException {
        response.setStatus(HttpServletResponse.SC_OK);

        setAccessTokenHeader(response, "Bearer " + accessToken);
        setRefreshTokenHeader(response, "Bearer " + refreshToken);
        response.sendRedirect("/"); //"/"로 리다이렉트
        log.info("Access Token, Refresh Token 헤더 설정 완료");
    }

    /**
     * 헤더에서 RefreshToken 추출
     * 토큰 형식 : Bearer XXX에서 Bearer를 제외하고 순수 토큰만 가져오기 위해서
     * 헤더를 가져온 후 "Bearer"를 삭제(""로 replace)
     */
    public Optional<String> extractRefreshToken(HttpServletRequest request) {
        return Optional.ofNullable(request.getHeader(refreshHeader))
                .filter(refreshToken -> refreshToken.startsWith(BEARER))
                .map(refreshToken -> refreshToken.replace(BEARER, ""));
    }

    /**
     * 헤더에서 AccessToken 추출
     * 토큰 형식 : Bearer XXX에서 Bearer를 제외하고 순수 토큰만 가져오기 위해서
     * 헤더를 가져온 후 "Bearer"를 삭제(""로 replace)
     */
    public Optional<String> extractAccessToken(HttpServletRequest request) {
        return Optional.ofNullable(request.getHeader(accessHeader))
                .filter(refreshToken -> refreshToken.startsWith(BEARER))
                .map(refreshToken -> refreshToken.replace(BEARER, ""));
    }

    /**
     * AccessToken에서 username 추출
     * 추출 전에 JWT.require()로 검증기 생성
     * verify로 AceessToken 검증 후
     * 유효하다면 getClaim()으로 username 추출
     * 유효하지 않다면 빈 Optional 객체 반환
     */
    public Optional<String> extractUsername(String accessToken) {
        try {
            // 토큰 유효성 검사하는 데에 사용할 알고리즘이 있는 JWT verifier builder 반환
            return Optional.ofNullable(JWT.require(Algorithm.HMAC512(secretKey))
                    .build() // 반환된 빌더로 JWT verifier 생성
                    .verify(accessToken) // accessToken을 검증하고 유효하지 않다면 예외 발생
                    .getClaim(USERNAME_CLAIM) // claim(username) 가져오기
                    .asString());
        } catch (Exception e) {
            log.error("액세스 토큰이 유효하지 않습니다.");
            return Optional.empty();
        }
    }

    /**
     * AccessToken 헤더 설정
     */
    public void setAccessTokenHeader(HttpServletResponse response, String accessToken) {
        response.setHeader(accessHeader, accessToken);
    }

    /**
     * RefreshToken 헤더 설정
     */
    public void setRefreshTokenHeader(HttpServletResponse response, String refreshToken) {
        response.setHeader(refreshHeader, refreshToken);
    } //위 두개는 위에서 사용중인 메속드임

    /**
     * RefreshToken DB 저장(업데이트)
     */
    public void updateRefreshToken(String username, String refreshToken) {
        Optional<User> byUsername = userRepository.findByUsername(username);
        if (byUsername.isEmpty()) {
            new Exception("일치하는 회원이 없습니다.");
        }
        log.info("RefreshToken 업데이트");
        User user = byUsername.get();
        user.updateRefreshToken(refreshToken);
        userRepository.saveAndFlush(user);
    }

    public boolean isTokenValid(String token) {
        try {
            JWT.require(Algorithm.HMAC512(secretKey)).build().verify(token);
            return true;
        } catch (TokenExpiredException e) {
            log.error("토큰 기한이 만료되었습니다 {}", e.getMessage());
            throw new JwtException("토큰 기한이 만료되었습니다");
        } catch (IllegalArgumentException e) {
            log.error("JWT 토큰이 잘못되었습니다. {}", e.getMessage());
            throw new JwtException("JWT 토큰이 잘못되었습니다.");
        } catch (Exception e) {
            log.error("유효하지 않은 토큰입니다. {}", e.getMessage());
            throw new JwtException("JWT 예외 발생");
        }
    }
}
```

- **PART1**

```java
@Value("${jwt.secretKey}")
private String secretKey;

@Value("${jwt.access.expiration}")
private Long accessTokenExpirationPeriod;

@Value("${jwt.refresh.expiration}")
private Long refreshTokenExpirationPeriod;

@Value("${jwt.access.header}")
private String accessHeader;

@Value("${jwt.refresh.header}")
private String refreshHeader;
```

→ `@Value` 를 사용하여 각 필드들에 `application.yml` 의 프로퍼티를 주입하도록 했다.

- **PART2**

```java
public String createAccessToken(String username) {
    Date now = new Date();
    return JWT.create() // JWT 토큰을 생성하는 빌더 반환
            .withSubject(ACCESS_TOKEN_SUBJECT) // JWT의 Subject 지정 -> AccessToken이므로 AccessToken
            .withExpiresAt(new Date(now.getTime() + accessTokenExpirationPeriod)) // 토큰 만료 시간 설정
            .withIssuedAt(new Date(now.getTime()))
            //클레임으로는 저희는 username 하나만 사용합니다.
            //추가적으로 식별자나, 이름 등의 정보를 더 추가하셔도 됩니다.
            //추가하실 경우 .withClaim(클래임 이름, 클래임 값) 으로 설정해주시면 됩니다
            .withClaim(USERNAME_CLAIM, username)
            .sign(Algorithm.HMAC512(secretKey)); // HMAC512 알고리즘 사용, application.yml에서 지정한 secret 키로 암호화
}

/**
 * RefreshToken 생성
 * RefreshToken은 Claim에 username도 넣지 않으므로 withClaim() X
 */
public String createRefreshToken() {
    Date now = new Date();
    return JWT.create()
            .withSubject(REFRESH_TOKEN_SUBJECT)
            .withExpiresAt(new Date(now.getTime() + refreshTokenExpirationPeriod))
            .withIssuedAt(new Date(now.getTime()))
            .sign(Algorithm.HMAC512(secretKey));
}
```

**→ `createAccessToken` : AccessToken 생성 메소드**

**`JWT.create()` 를 통해서 JWT 토큰을 생성**

이때 **`.withSubject()` 로 JWT Subject를 지정함 (Authorization 과 같은 이름이 들어갈 것이다.)**

**`.withExpiresAt()` 과 `withIssuedAt()` 으로 만료 시간과 발행 시간을 설정**한다.

→ 여기까지 **Payload**에 들어가는 제공 **claim**이다.

이외에 **`.withClaim()` 을 통해서 사용자 지정 claim**을 작성할 수 있다.

**`.sign()` 에는 서버의 개인 키를 암호화 알고리즘으로 암호화 하여 넣어주면 JWT 토큰이 암호화 되어 생성**되게 된다.

**→ `createRefreshToken` : RefreshToken 생성 메소드**

위와 마찬가지로 생성하는 것으로 불필요한 부분은 제외했다.

### PART3

```java
/**
 * AccessToken 헤더에 실어서 보내기
 */
public void sendAccessToken(HttpServletResponse response, String accessToken) {
    response.setStatus(HttpServletResponse.SC_OK);

    response.setHeader(accessHeader, accessToken);
    log.info("재발급된 Access Token : {}", accessToken);
}

/**
 * AccessToken + RefreshToken 헤더에 실어서 보내기
 */
public void sendAccessAndRefreshToken(HttpServletResponse response, String accessToken, String refreshToken){
    response.setStatus(HttpServletResponse.SC_OK);

    response.setHeader(accessHeader, accessToken);
    response.setHeader(refreshHeader, refreshToken);
		response.sendRedirect("/"); //"/"로 리다이렉트
    log.info("Access Token, Refresh Token 헤더 설정 완료");
}
```

위의 메소드들은 이름 그대로 **AccessToken 혹은 AccessToken + RefreshToken을 헤더에 담아서 반환**하는 메소드들이다.

### PART4

```java
/**
 * 헤더에서 RefreshToken 추출
 * 토큰 형식 : Bearer XXX에서 Bearer를 제외하고 순수 토큰만 가져오기 위해서
 * 헤더를 가져온 후 "Bearer"를 삭제(""로 replace)
 */
public Optional<String> extractRefreshToken(HttpServletRequest request) {
    return Optional.ofNullable(request.getHeader(refreshHeader))
            .filter(refreshToken -> refreshToken.startsWith(BEARER))
            .map(refreshToken -> refreshToken.replace(BEARER, ""));
}

/**
 * 헤더에서 AccessToken 추출
 * 토큰 형식 : Bearer XXX에서 Bearer를 제외하고 순수 토큰만 가져오기 위해서
 * 헤더를 가져온 후 "Bearer"를 삭제(""로 replace)
 */
public Optional<String> extractAccessToken(HttpServletRequest request) {
    return Optional.ofNullable(request.getHeader(accessHeader))
        .filter(refreshToken -> refreshToken.startsWith(BEARER))
            .map(refreshToken -> refreshToken.replace(BEARER, ""));
}

/**
 * AccessToken에서 username 추출
 * 추출 전에 JWT.require()로 검증기 생성
 * verify로 AceessToken 검증 후
 * 유효하다면 getClaim()으로 username 추출
 * 유효하지 않다면 빈 Optional 객체 반환
 */
public Optional<String> extractUsername(String accessToken) {
    try {
        // 토큰 유효성 검사하는 데에 사용할 알고리즘이 있는 JWT verifier builder 반환
        return Optional.ofNullable(JWT.require(Algorithm.HMAC512(secretKey))
                .build() // 반환된 빌더로 JWT verifier 생성
                .verify(accessToken) // accessToken을 검증하고 유효하지 않다면 예외 발생
                .getClaim(USERNAME_CLAIM) // claim(username) 가져오기
                .asString());
    } catch (Exception e) {
        log.error("액세스 토큰이 유효하지 않습니다.");
        return Optional.empty();
    }
}
```

위의 메소드들은

헤더에서 **토큰을 분리해서 가져오거나**

토큰에서 **username을 얻어내는 메소드**이다.

### PART5

```java
/**
 * RefreshToken DB 저장(업데이트)
 */
public void updateRefreshToken(String email, String refreshToken) {
		Optional<User> byUsername = userRepository.findByUsername(username);
        if (byUsername.isEmpty()) {
            new Exception("일치하는 회원이 없습니다.");
        }
    log.info("RefreshToken 업데이트");
    User user = byUsername.get();
    user.updateRefreshToken(refreshToken);
    userRepository.saveAndFlush(user);
}

public boolean isTokenValid(String token) {
    try {
        JWT.require(Algorithm.HMAC512(secretKey)).build().verify(token);
        return true;
    } catch (TokenExpiredException e) {
        log.error("토큰 기한이 만료되었습니다 {}", e.getMessage());
        throw new JwtException("토큰 기한이 만료되었습니다");
    } catch (IllegalArgumentException e) {
        log.error("JWT 토큰이 잘못되었습니다. {}", e.getMessage());
        throw new JwtException("JWT 토큰이 잘못되었습니다.");
    } catch (Exception e) {
        log.error("유효하지 않은 토큰입니다. {}", e.getMessage());
        throw new JwtException("JWT 예외 발생");
    }
}
```

**→ `updateRefreshToken()` : DB의 RefreshToken을 업데이트 하는 메소드**

**→ `isTokenValid(String token)` : 토큰의 유효성 검사**

**다음에는 JWT의 인증 로직과 그에 대한 인증 필터를 알아보도록 할 것이다.**
