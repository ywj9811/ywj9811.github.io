---
title: Spring Security의 OAuth2를 통한 Naver 로그인 추가
date: '2023-02-05'
tags: ['Spring boot', 'Spring Security', '기술']
draft: false
summary: OAuth2 로그인을 이용하여 네이버 로그인을 추가로 구현해보자
---

## Spring Security의 OAuth2를 이용한 Naver로그인

### Spring의 OAuth2 Client에서 기본으로 제공하는 Provider는 정해져있다.

- **Google**
- **FaceBook**
- **Twitter**
  **등등**

이렇듯 **글로벌 기업들의 경우에만 Provide가 기본으로 제공**되고 있다.

따라서 **Naver, Kakao와 같은 경우 Provider가 제공되지 않는다.**

이럴 경우 어떻게 적용해야 할까

**수동으로 Provider를 등록**해주며 된다.

아래와 같이 **`application.yml(properties)`** 에 등록하도록 하자.

```yaml
	security:
    :oauth2:
      client:
        registration:
					google:
            ...
          facebook:
            ...
					naver:
            client-id: "네이버 제공 id"
            client-secret: "네이버 제공 시크릿 키"
            scope:
              - email
              - name
            client-name: Naver
            authorization-grant-type: authorization_code
            redirect-uri: http://localhost:9292/login/oauth2/code/naver

        #provider 등록해줘야 함 (naver같은 경우 provider가 아니기 때문에 오류가 발생할 것임)
        provider:
          naver:
            authorization-uri: https://nid.naver.com/oauth2.0/authorize
            token-uri: https://nid.naver.com/oauth2.0/token
            user-info-uri: https://openapi.naver.com/v1/nid/me
            user-name-attribute: response
						#회원정보를 json으로 받는데 Response라는 키값으로 네이버가 리턴해주기 때문임
```

Google, FaceBook과 마찬가지로 네이버도 client-id, client-secret, scope 를 등록해야 하는데 네이버와 같이 **기본 Provider가 제공되지 않는 경우** **client-name, authorization-grant-type, redirect-uri** 를 추가로 작성해줘야 한다.

- **client-name : Naver와 같은 이름**
- **authorization-grant-type: 어떤 방식으로 인증 받을 것인가**
- **redirect-uri : 어떤 uri로 리다이렉트 할 것인가.**
  **기본 Provider가 없기 때문에 마음대로 지정해도 괜찮지만 일관성을 위해 Provider형식에 맞춰서 작성**

하지만 **이대로 진행하게 되면 Provider가 없기 때문에 예외가 발생**하게 된다.

따라서 **Provider를 수동으로 등록**해야 한다.

```yaml
		provider:
			포털 이름:
				authorization-uri:
				token-uri:
				user-info-uri:
				user-name-attribute:
```

**Provider 등록하는데 필요한 정보**와 **네이버 OAuth2 정보**를 완성하기 위해서 Naver Developer에 들어가서 어플리케이션 등록을 하도록 하자.

![naver1](/static/images/OAuth2/naver1.png)
![naver2](/static/images/OAuth2/naver2.png)

이렇게 이름과 어떤 API를 사용할 것 인지에 따른 정보를 체크한 후 환경설정을 해야한다.

**서비스URL의 경우 호스트 URL을 작성**해주고 **네이버 로그인 Callback URL에는 이전에 application에서 작성한 redirect-uri를 작성**해 준다.

![naver3](/static/images/OAuth2/naver3.png)

완료하고 나면 위와 같이 **Client Id**와 **Client Secret**이 나오게 된다.

위의 두개는 **OAuth2 정보**에 넣어주고 이제 **Provider생성을 위한 정보를 확인**하도록 하자.

![naver4](/static/images/OAuth2/naver4.png)

문서의 로그인 API를 확인하면 위와 같이 요청 URL이 지정되어 있다.

```yaml
		provider:
			포털 이름:
				authorization-uri: "네이버 로그인 인증 요청"
				token-uri: "접근 토큰의 발급, 갱신, 삭제를 요청"
				user-info-uri: "네이버 회원의 프로필 조회"
				user-name-attribute: "네이버에서 반환하는 값의 이름 (네이버의 경우 response이다.)"
```

위의 문서를 확인하며 순서대로 넣어주면 된다.

위의 과정을 모두 완료하면 **OAuth2를 완성**하고 **Provider를 수동으로 생성하게 된 것**이다.

이제 **`PrincipalOauth2UserService`** 에서 네이버 요청도 처리할 수 있도록 만들어주면 된다.

이때 주의할 점이 위에서 확인한 것과 같이 네이버는 반환을 response라는 이름으로 한다.

```json
attribute = {
	resultcode=00,
	message=success,
	response={
		id=1mA9C-eORywwwa_h2Oghh1I_upmDkvfgVrdfGuE7p7Y,
		email=이메일,
		name=이름
	}
}
```

이렇게 넘어오는 것이다.

이 점을 주의하고 이어서 보도록 하자.

### NaverUserInfo 구현체 작성

```java
public class NaverUserInfo implements OAUth2UserInfo{
    private Map<String, Object> attributes;

    public NaverUserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    @Override
    public String getProviderId() {
        return (String) attributes.get("id");
    }

    @Override
    public String getProvider() {
        return "naver";
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

기존의 `GoogleUserInfo`와 `FaceBookUserInfo` 와 별반 다를 게 없다.

### PrincipalOauth2UserService 수정

이제 구현체를 만들었으니 조건에 따라서 `NaverUserInfo` 를 호출할 수 있도록 해준다.

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
        log.info("PrincipalOauth2UserDetails 진입 : OAuth2 로그인 진행");
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

        if (userRequest.getClientRegistration().getRegistrationId().equals("naver")) {
            log.info("네이버 로그인 요청");
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

이전과 비슷하지만 한 가지 주의할 점이 있다.

`oaUth2UserInfo = new NaverUserInfo((Map<String, Object>) oAuth2User.getAttributes().get("response"));`

바로 **`oAuth2User.getAttributes()` 로 끝내는 것이 아닌 `.get("response")` 를 통해서 뽑아내 파라미터로 넘긴다는 점**이다.

위의 과정을 마치고 나면 기본 제공 Provier가 없는 경우에도 OAuth2 로그인 구현을 완료한 것이다.
