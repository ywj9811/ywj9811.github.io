---
title: Spring Security의 OAuth2를 통한 Google 로그인
date: '2023-02-04'
tags: ['Spring boot', 'Spring Security', '기술']
draft: false
summary: OAuth2 로그인을 이용하여 구글 로그인을 구현해보자
---

# Spring Security의 OAuth2를 이용해 Google 로그인을 구현해보자

우선 Google API Console에 들어가서 프로젝트 하나를 등록해줘야 한다.

![Google1](/static/images/OAuth2/google1.png)

등록한 이후 위와 같이 **OAuth 동의 화면**에서 **외부 → 앱 이름, 이메일을 등록**해주면 된다.

이후에 사용자 인정 정보에서 +사용자 인증 정보 만들기 클릭 후 아래의 부분을 클릭하여 작성한다.

![Google2](/static/images/OAuth2/google2.png)

들어오게 되면 아래와 같은 부분이 생기게 되는데

![Google3](/static/images/OAuth2/google3.png)

- 주의해야할 점은 **승인된 리다이렉션 URI**에는 고정된 값이 있다.
  **`http://localhost:8080/login/oauth2/code/google`** 와 같이 적어야 하는데
  **`/login/oauth2/code/페이지명(Google, FaceBook등등)`** 은 고정되어 사용되며 **앞 부분인 `http://localhost:8080`** 만 상황에 따라서 수정하는 것이다.

위 과정을 완료하게 되면 OAuth 클라이언트가 생성되며 **클라이언트ID와 클라이언트 보안 비밀번호**가 발급되는데 이는 유출되지 않도록 관리하도록 하자.

### User도메인 수정

### User도메인 수정

```java
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    private String username;
    private String password;
    private String email;
    private String role; //ROLE_USER, ROLE_ADMIN

    private String provider;
    //google, facebook등등
    private String providerId;
    //해당에서 사용하는 id

    @CreationTimestamp
    private Timestamp createDate;
}
```

어떤 OAuth를 통해서 로그인 하는지와 해당 id를 저장하기 위한 컬럼을 추가한다.

### Gradle 추가

위 과정을 마치면 이제 Spring Boot에서 사용할 준비를 해야한다.

```java
dependencies {
	...
	//oauth2
	implementation 'org.springframework.boot:spring-boot-starter-oauth2-client'
	testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```

위와 같이 **oauth2-client**를 Gradle에 추가하도록 하자.

### application.properties(yml) 추가

```yaml
...
security:
    :oauth2:
      client:
    oauth2:
      client:
        registration:
          google:
            client-id: "발급받은 클라이언트 ID"
            client-secret: "발급받은 보안 비밀번호"
            scope:
              - "원하는 데이터"
              - "원하는 데이터"
							- "원하는 데이터"
```

이렇게 이전에 발급 받은 정보와 원하는 데이터를 통해 사용할 준비를 한다.

### DefaultOAuth2UserService상속 클래스 생성

```java
@Service
@Slf4j
public class PrincipalOauth2UserService extends DefaultOAuth2UserService {

    //이 메소드가 구글 로그인시 후처리 함수 -> 구글로 부터 받은 userRequest 데이터에 대한 후처리되는 함수
    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        log.info("userRequest.getClientRegistration = {}", userRequest.getClientRegistration());
        // registrationId를 통해 어떤 OAuth로 로그인 하였는지 확인 가능

        log.info("userRequest.getAccessToken.getTokenValue = {}", userRequest.getAccessToken().getTokenValue());
         // 구글 로그인 버튼 클릭시 -> 구글 로그인 창 -> 로그인 완료 -> code 반환 (OAuth-Client 라이브러리) -> AccessToken 요청
         // : userRequest 정보를 얻음
         // userRequest 정보 -> 회원 프로필 받아야함 (loadUser함수) -> 회원 프로필 받음

        log.info("loadUser(userRequest).getAttributes = {}", super.loadUser(userRequest).getAttributes());
        // getAttribute에서 정보를 얻을 수 있음 -> 이를 통해서 자동 회원가입 등등의 과정을 가져갈 수 있다

        OAuth2User oAuth2User = super.loadUser(userRequest);
        return super.loadUser(userRequest);
    }
}
```

구글 로그인시 **`DefaultOAuth2UserService`** 에서 후처리를 하게 되는데 따라서 이를 상속받아 원하는 코드를 추가하여 사용하면 된다.

후처리시 **`DefaultOAuth2UserService`** 의 **`loadUser(userRequest)`** 메소드를 통해서 진행되게 되는데 `.getAttribute` 를 통해 회원 정보를 받을 수 있다.

이외에도 다양한 정보를 받을 수 있으니 다양하게 활용할 수 있다.

### Config 추가

```java
@Configuration
@EnableWebSecurity //활성화 시키는 것이다 : Spring Security 필터(설정하는 Config)가 Spring 필터 체인에 등록이 된다.
@EnableGlobalMethodSecurity(securedEnabled = true, prePostEnabled = true) //@Secured어노테이션 활성화(각각에서 권한을 설정할 수 있다)
@RequiredArgsConstructor
public class SecurityConfig extends WebSecurityConfigurerAdapter {
		private final PrincipalOauth2UserService principalOauth2UserService;
		...

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.csrf().disable(); //csrf 비활성화
        http.authorizeRequests()
                ...
								.and()
                .oauth2Login()
								//oath2Login을 통해 로그인을 할 수 있도록 해줌
								//이부분은 google혹은 facebook 등등에서 설정 (oauth2/authorization/어떤로그인) 이 경로로 설정 -> 고정 경로임
                .loginPage("/loginForm")
                .userInfoEndpoint()
                .userService(principalOauth2UserService);
								//구글 로그인이 완료된 뒤의 후처리가 필요함 -> 이 service에서 후처리 (loadUser라는 메소드)
                /**1. 코드받기(인증)
                 * 2. 엑세스토큰(권한)
                 * 3. 사용자 프로필정보 가져옴
                 * 4. 그 정보를 토대로 회원가입 자동으로 진행시키기도 함
                 *   이때 그 정보가 부족하다면 추가적으로 정보를 받아서 회원가입 시키기도 함
                 *
                 * Tip : 구글 로그인이 완료되면 엑세스 토큰 + 사용자 프로필 정보 동시에 받아옴
                 */
    }
}
```

`.oauth2Login()` 이는 이전에 말한 고정 경로 `oauth2/authorization/페이지` 로 들어오는 경우 잡아서 처리하게 된다.

> 컨트롤러에서 따로 매핑을 받지 않아도 된다.

그리고 `.userService(DefaultOAuth2UserService를 상속받아 만든 서비스)` 를 적어주면 우리가 작성한 코드에 맞춰 후처리 기능이 작동하게 된다.

### 제공 받은 정보 확인하기

```java
@Controller //View 리턴
@RequiredArgsConstructor
@Slf4j
public class IndexController {
    private final UserService userService;

    @ResponseBody
    @GetMapping("/test/login")
    public String loginTest(Authentication authentication, @AuthenticationPrincipal PrincipalDetails userDetails) {
        //이렇게 Authentication으로 받아서 UserDetails로 다운 캐스팅 혹은 @AuthenticationPrincipal이라는 어노테인션을 사용하여 UserDetails타입으로 받아 사용할 수 있다.
        //UserDetails를 PrincipalDetails가 상속받기 때문에 PrincipalDetails도 가능함 -> 내가 원하는 용도로 만들었으니 사용

        log.info("/test/login --------------------------");
        PrincipalDetails principalDetails = (PrincipalDetails) authentication.getPrincipal();
        log.info("authentication : {}", principalDetails.getUser());

        log.info("userDetails.getUsername : {}", userDetails.getUser());
        return "세션 정보 확인하기";
    }

    @ResponseBody
    @GetMapping("/test/oauth/login")
    public String loginOAuthTest(Authentication authentication, @AuthenticationPrincipal OAuth2User oauth) {
        //OAuth2를 사용하게 되면 PrincipalDetails를 사용하는 것이 아닌 Oauth2User타입으로 받아서 사용해야 함
        //이를 통해서 제공받은 정보를 확인할 수 있음

        //시큐리티 세션에 들어갈 수 있는 Authentication객체에는 UserDetails혹은 OAuth2User타입만 들어갈 수 있다.
        //일반 로그인 -> UserDetails
        //OAuth2 로그인 -> OAuth2User

        //그럼 어떻게 할까 -> UserDetails와 OAuth2User를 implement하는 객체를 하나 만들어서 사용

        log.info("/test/login --------------------------");
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        log.info("authentication : {}", oAuth2User.getAttributes());

        log.info("authentication : {}", oauth.getAttributes());

        return "OAuth 세션 정보 확인하기";
    }
		...
}
```

다시 한번 확인할 내용이 있다.

Spring Security에서 로그인을 하게 되면 Spring Security의 세션에 저장된다고 했었다.

그리고 이 세션에는 **`Authentication타입`** 의 객체만 들어갈 수 있다고 했다.

그리고 이 **`Authentication타입`에는 `UserDetails`와 `OAuth2User`타입이 들어가게 되는데**

- **`UserDetails` : 일반 로그인**
- **`OAuth2User` : OAuth2 로그인**

이렇게 나뉘어진다.

따라서 **`Authentication authentication`** 와 **`@AuthenticationPrincipal PrincipalDetails userDetails`** 와 같이 파라미터를 받으면 이를 통해서 정보를 받을 수 있는 것이다.

하지만 `Authentication` 는 다운 캐스팅을 해야하고 `@Authentication` 어노테이션을 통해서 받으면 바로 사용할 수 있다.

하지만 위의 코드와 같이 `UserDetails`와 `OAuth2User`를 구분해서 받게 되면 api가 복잡해진다.

**어떻게 해결할 수 있을까?**

**`UserDetails`와 `OAuth2User`** 를 **동시에 implement** 하여 작성하면 된다.

해당 과정을 순서대로 살펴보도록 하자.

### PrincipalDetails 수정

`UserDetails` 뿐만 아니라, `OAuth2UserDetails` 를 추가로 구현하도록 한다.

```java
@Getter
public class PrincipalDetails implements UserDetails, OAuth2User {
    private User user;
    private Map<String, Object> attributes;

    //일반 로그인시 사용
    public PrincipalDetails(User user) {
        this.user = user;
        //PrincipalDetailsService에서 User만 넣어서 반환함
    }

    //OAuth 로그인시 사용
    public PrincipalDetails(User user, Map<String, Object> attributes) {
        this.user = user;
        this.attributes = attributes;
        //PrincipalOauth2UserService에서 PrincipalDetails에 2가지 정보를 넣어서 생성하여 반환함
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
        /**
         * 예를 들어서 휴먼 계정의 경우 false를 반환하는 것이다.
         */
        return true;
    }
}
```

**`OAuth2UserDetails`** 를 구현하여 OAuth2 로그인시 사용할 수 있기 위해 **`Map<String, Object>`** 를 추가로 포함하는 생성자를 만들어 준다.

이제 **`PrincipalDetails`** 에서 **`OAuth2UserDetails`** 에서 반환하는 OAuth2User의 정보를 받을 수 있게 되었기 때문에 **`OAuth2UserDetails`** 또한 맞춰서 수정해준다.

### OAuth2UserDetails 수정

```java
@Service
@Slf4j
@RequiredArgsConstructor
@Lazy
public class PrincipalOauth2UserService extends DefaultOAuth2UserService {
    private BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder();
    private final UserRepository userRepository;

    //이 메소드가 구글 로그인시 후처리 함수 -> 구글로 부터 받은 userRequest 데이터에 대한 후처리되는 함
    // 함수가 종료될 때 @AuthenticationPrincipal 어노테이션이 만들어 진다.
    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        log.info("userRequest.getClientRegistration = {}", userRequest.getClientRegistration());
		    //registrationId를 통해 어떤 OAuth로 로그인 하였는지 확인 가능

        log.info("userRequest.getAccessToken.getTokenValue = {}", userRequest.getAccessToken().getTokenValue());
        /**
         * 구글 로그인 버튼 클릭시 -> 구글 로그인 창 -> 로그인 완료 -> code 반환 (OAuth-Client 라이브러리) -> AccessToken 요청
         * : userRequest 정보를 얻음
         * userRequest 정보 -> 회원 프로필 받아야함 (loadUser함수) -> 회원 프로필 받음
         */

        OAuth2User oAuth2User = super.loadUser(userRequest);
        log.info("loadUser(userRequest).getAttributes = {}", super.loadUser(userRequest).getAttributes());
        //getAttribute에서 정보를 얻을 수 있음 -> 이를 통해서 자동 회원가입 등등의 과정을 가져갈 수 있다.

        String provider = userRequest.getClientRegistration().getClientId();
        // google
        String providerId = oAuth2User.getAttribute("sub");
        // sub값
        String email = oAuth2User.getAttribute("email");
        // email값
        String username = provider + "_" + providerId;
        // google_1032140005 이런식으로 생성됨
        String password = bCryptPasswordEncoder.encode("getInThere");
        // 아무 값이 넣어줌(필요없어서)
        String role = "ROLE_USER";

        Optional<User> userById = userRepository.findByUsername(username);

        if (userById.isEmpty()) {
            log.info("최초의 구글 로그인");
            User user = User.builder()
                    .username(username)
                    .password(password)
                    .role(role)
                    .provider(provider)
                    .providerId(providerId)
                    .build();

            userRepository.save(user);
            return new PrincipalDetails(user, oAuth2User.getAttributes());
        }

        log.info("이미 존재하는 구글 아이디");
        return new PrincipalDetails(userById.get(), oAuth2User.getAttributes());
        //이 반환값이 Authentication안에 들어가게 됨 -> OAuth2User 로그인시 여기로 접근하여 Authentication에 들어가게 됨
    }
}
```

이렇게 **`return new PrincipalDetails(user, oAuth2User.getAttributes())`** 를 통해 같은 **`PrincipalDetails`** 타입으로 반환할 수 있다.

### Controller작성

```java
@Controller //View 리턴
@RequiredArgsConstructor
@Slf4j
public class IndexController {
    private final UserService userService;

		...

		//OAuth2와 일반 로그인 모두 PrincipalDetails로 받을 수 있도록 기능 추가
    @GetMapping("/user")
    @ResponseBody
    public String user(@AuthenticationPrincipal PrincipalDetails principalDetails) {
        log.info("PrincipalDetails : {}", principalDetails.getUser());
        return "OAuth2, User 통일";
    }

		...
}
```

이렇게 **OAuth2 로그인과 일반 로그인이 모두 동일하게 `PrincipalDetails` 타입으로 반환**하기 때문에 한번에 처리할 수 있게 되는 것이다.

여기까지 OAuth2를 통한 Google 로그인을 알아 보았으니 다음에는 **Google과 FaceBook을 함께 사용하는 경우**에 대해서 알아보도록 하자.
