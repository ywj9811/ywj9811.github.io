---
title: Spring Security의 OAuth2를 통한 FaceBook 로그인 추가
date: '2023-02-05'
tags: ['Spring boot', 'Spring Security', '기술']
draft: false
summary: OAuth2 로그인을 이용하여 페이스북 로그인을 추가로 구현해보자
---

## Spring Security OAuth2를 통한 FaceBook 로그인 구현

기본적인 구조는 Google 로그인을 구현할 때와 일치한다.

### Config 설정

```java
@Configuration
@EnableWebSecurity //활성화 시키는 것이다 : Spring Security 필터(설정하는 Config)가 Spring 필터 체인에 등록이 된다.
@EnableGlobalMethodSecurity(securedEnabled = true, prePostEnabled = true) //@Secured어노테이션 활성화(각각에서 권한을 설정할 수 있다)
@RequiredArgsConstructor
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    private final PrincipalOauth2UserService principalOauth2UserService;

    //해당 메소드의 리턴되는 메소드를 IoC로 등록(@Bean이 있으니까)
    @Bean
    public BCryptPasswordEncoder encodePwd() {
        return new BCryptPasswordEncoder();
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
								...
								...
								.and()
                .oauth2Login()//oath2Login을 통해 로그인을 할 수 있도록 해줌 이부분은 google혹은 facebook 등등에서 설정 (oauth2/authorization/어떤로그인) 이 경로로 설정 -> 고정 경로임
                .loginPage("/loginForm")
                .userInfoEndpoint()
                .userService(principalOauth2UserService);
    }
}
```

Google로그인 구현시 작성한 Config를 그대로 가져가면 된다.

즉, FaceBook로그인의 경우에도 **OAuth2 로그인이기 때문에 `principalOauth2UserSevice` 를 통해서 후 처리**가 진행되게 된다.

이제, FaceBook 로그인을 위해 FaceBook Api Console에 들어가서 설정을 해주자.

FaceBookApiConsole에 들어가서 아래와 같이 설정을 해줘야 한다.

우선 로그인을 한 후 새 앱 만들기를 하면 아래와 같은 화면이 나오게 된다.

![FaceBook1](/static/images/OAuth2/facebook1.png)

원하는 유형을 선택하고 다음으로 넘어가도록 하자(본인은 없음을 했다)

넘어가서 앱의 이름을 설정하고 나면 이제 어떤 기능을 사용할 것인지 선택하는 창이 나온다.

![FaceBook2](/static/images/OAuth2/facebook2.png)

우리는 FaceBook 로그인을 사용할 것이기 때문에 FaceBook 로그인의 설정을 클릭해준다.

![FaceBook3](/static/images/OAuth2/facebook3.png)

원하는 플랫폼을 선택해준다. (본인은 웹을 선택했다.)

![FaceBook4](/static/images/OAuth2/facebook4.png)

여기서는 이제 `http://localhost:8080` 과 같은 호스트 URL을 작성해준다.

그리고 계속을 누르며 필요에 따라서 확인하도록 한다.

위 과정을 마치고 나면 이제 왼쪽의 설정 → 기본 설정에 들어가서

![FaceBook5](/static/images/OAuth2/facebook5.png)

**앱ID 와 앱 시크릿 코드를 확인**하도록 하자.

여기까지 FaceBookAPI Console에서 설정하는 부분이며 이제 이를 토대로 코드를 작성하도록 하자.

### application.yml(properties)

```yaml
security:
  :oauth2:
    client:
  oauth2:
    client:
      registration:
        google:
          client-id: 'Google제공 ID'
          client-secret: 'Google제공 시크릿 코드'
          scope:
            - email
            - profile

        facebook:
          client-id: 'FaceBook제공 ID'
          client-secret: 'FaceBook제공 시크릿 코드'
          scope:
            - email
            - public_profile
        # 문서에서 확인하면 어떤 이름으로 값을 제공하는지 확인할 수 있음
```

Google과 마찬가지로 FaceBook도 작성하도록 하자.

이 때 scope에 들어갈 데이터는 문서를 확인해서 어떤 이름으로 제공하는지 확인하고 작성하도록 하자.

아래의 코드는 기존에 Google로그인시 사용하던 **`PrincipalOauth2UserService`** 이다.

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

FaceBook 로그인 또한 **`OAuth2`** 로그인이기 때문에 위의 코드로 접근이 되어 작동하게 될 것이다.

이대로 작동시키고 확인해보도록 하자.

### 결과를 확인해보면 providerId가 Null이 나오는 모습을 확인할 수 있다.

무엇이 문제일까

바로 **Google의 경우 providerId를 “sub”로 주지만 FaceBook의 경우 providerId를 “id”로 주기 때문**이다.

그렇다면 어떻게 해결해야 할 것인가.

이 문제를 해결하기 위해서 **인터페이스를** 하나 만들도록 하겠다.

### OAuth2UserInfo 인터페이스

```java
public interface OAUth2UserInfo {
    String getProviderId();
    String getProvider();
    String getEmail();
    String getName();
}
```

위와 같이 제공 받는 정보를 뽑아낼 수 있는 메소드를 가지고 있는 인터페이스를 만든 이후 Google, FaceBook과 같이 각각의 **`OAuth2`** 로그인 마다 구현체를 생성하면 된다.

### GoogleUserInfo 구현체

```java
public class GoogleUserInfo implements OAUth2UserInfo{
    private Map<String, Object> attributes;

    public GoogleUserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    @Override
    public String getProviderId() {
        return (String) attributes.get("sub");
    }

    @Override
    public String getProvider() {
        return "google";
    }

    @Override
    public String getEmail() {
        return (String) attributes.get("email");
    }

    @Override
    public String getName() {
        return (String) attributes.get("name");
    }
}
```

생성자를 통해 전달받은 정보를 받고 해당 정보에서 원하는 값을 뽑아낼 수 있도록 구현한다.

### FaceBookUserInfo 구현체

```java
public class FaceBookUserInfo implements OAUth2UserInfo{
    private Map<String, Object> attributes;

    public FaceBookUserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    @Override
    public String getProviderId() {
        return (String) attributes.get("id");
    }

    @Override
    public String getProvider() {
        return "facebook";
    }

    @Override
    public String getEmail() {
        return (String) attributes.get("email");
    }

    @Override
    public String getName() {
        return (String) attributes.get("name");
    }
}
```

위의 Google과 마찬가지로 원하는 정보를 각 로그인마다 뽑아낼 수 있도록 만들어 준다.

### PrincipalDetailsUserService 수정

```java
@Service
@Slf4j
@RequiredArgsConstructor
@Lazy
public class PrincipalOauth2UserService extends DefaultOAuth2UserService {
    private BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder();
    private final UserRepository userRepository;

    // 함수가 종료될 때 @AuthenticationPrincipal 어노테이션이 만들어 진다.
    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        log.info("userRequest.getClientRegistration = {}", userRequest.getClientRegistration());

        log.info("userRequest.getAccessToken.getTokenValue = {}", userRequest.getAccessToken().getTokenValue());

        OAuth2User oAuth2User = super.loadUser(userRequest);
        log.info("loadUser(userRequest).getAttributes = {}", oAuth2User.getAttributes());

        OAUth2UserInfo oaUth2UserInfo = null;
        oaUth2UserInfo = getOaUth2UserInfo(userRequest, oAuth2User, oaUth2UserInfo);

        return getPrincipalDetails(oAuth2User, oaUth2UserInfo);
        //이 반환값이 Authentication안에 들어가게 됨 -> OAuth2User 로그인시 여기로 접근하여 Authentication에 들어가게 됨
    }

    private OAUth2UserInfo getOaUth2UserInfo(OAuth2UserRequest userRequest, OAuth2User oAuth2User, OAUth2UserInfo oaUth2UserInfo) {
        if (userRequest.getClientRegistration().getRegistrationId().equals("google")) {
            log.info("구글 로그인 요청");
            oaUth2UserInfo = new GoogleUserInfo(oAuth2User.getAttributes());
        }

        if (userRequest.getClientRegistration().getRegistrationId().equals("facebook")) {
            log.info("페이스북 로그인 요청");
            oaUth2UserInfo = new FaceBookUserInfo(oAuth2User.getAttributes());
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
        String role = "ROLE_USER";

        Optional<User> userById = userRepository.findByUsername(username);

        if (userById.isEmpty()) {
            log.info("최초의 OAuth2 로그인");
            User user = User.builder()
                    .username(username)
                    .password(password)
                    .role(role)
                    .provider(provider)
                    .providerId(providerId)
                    .email(email)
                    .build();

            userRepository.save(user);
            return new PrincipalDetails(user, oAuth2User.getAttributes());
        }

        log.info("이미 존재하는 OAuth 아이디");
        return new PrincipalDetails(userById.get(), oAuth2User.getAttributes());
    }
}
```

위의 코드로 수정하면 아래의 부분에서

```java
@Service
@Slf4j
@RequiredArgsConstructor
@Lazy
public class PrincipalOauth2UserService extends DefaultOAuth2UserService {

	  ...

		private OAUth2UserInfo getOaUth2UserInfo(OAuth2UserRequest userRequest, OAuth2User oAuth2User, OAUth2UserInfo oaUth2UserInfo) {
        if (userRequest.getClientRegistration().getRegistrationId().equals("google")) {
            log.info("구글 로그인 요청");
            oaUth2UserInfo = new GoogleUserInfo(oAuth2User.getAttributes());
        }

        if (userRequest.getClientRegistration().getRegistrationId().equals("facebook")) {
            log.info("페이스북 로그인 요청");
            oaUth2UserInfo = new FaceBookUserInfo(oAuth2User.getAttributes());
        }
        return oaUth2UserInfo;
    }

		...
}
```

위의 조건문에서 이전에 작성한 구현체를 통해 Google 로그인과 FaceBook 로그인을 구분하여 처리할 수 있게 된다.

### 참고

    스프링의 OAuth2 Client에서 제공하는 Provider는 기본적으로 제공해주는 것은 정해져있다.

    - Google
    - FaceBook
    - Twitter

        등등


    **하지만, KAKAO, NAVER와 같은 경우 제공되지 않는다.**

    → 이는 우리가 직접 등록을 해줘야 한다.
