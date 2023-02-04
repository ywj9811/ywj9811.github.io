---
title: Spring Security란 무엇이며 기본적인 사용법
date: '2023-02-03'
tags: ['Spring boot', 'Spring Security', '기술']
draft: false
summary: Spring Security에 대해서 기본적인 사항들
---

# Spring Security

## Spring Security란 무엇일까?

- Spring Security는 Spring 기반 어플리케이션의 보안을 담당하는 스프링 하위 프레임워크이다.
- Spring Security는 Authentication(인증) 과 Authorization(권한)에 대한 부분을 Filter의 흐름에 따라 처리를 하고 있따.
- 많은 보안 관련 옵션들을 제공해주어 개발자가 보안 로직을 하나씩 작성하지 않아도 되게 해준다.

## Authentication(인증)

- 사이트에 접속하려는 자가 누구인지 확인하는 절차 (사용자가 본인인가?)
- UsernamePassword를 통한 인증을 할 수 있다. (Session 관리, Token 관리)
- SNS 로그인을 통한 인증 위임을 할 수 있다.

## Authorization(권한)

- 사용자가 어떤 일을 할 수 있는지 권한 설정하는 절차이다.
- 특정 페이지/리소스에 접근할 수 있는지 권한을 판단한다.
- Secured, PrePostAuthorize 어노테이션으로 쉽게 권한 체크를 할 수 있다.
- 비즈니스 로직이 복잡한 경우 AOP를 통해 권한 체크를 해야 한다.

### Authentication → Authorization 순서로 진행한다.

> Spring Security에서는 이러한 인증과 인가를 위해 Principal을 아이디로, Credential을 비밀번호로 사용하는 Credential 기반의 인증 방식을 사용한다.

---

## 어떻게 사용할까?

스프링 시큐리티를 사용하게 되면 `“/”`로 접근하게 되면 기본 페이지가 뜨는 것이 아닌, login페이지가 나오게 될 것이다.

이는 실행시 발급되는 인증번호를 통해서 접근할 수 있도록 되어 있는 것인데

- ID : user
- PW : 발급 번호

이를 통해서 접근할 수 있다.

물론 이 경우 Config파일을 통해서 안뜨게 할 수 있다.

### EX) 상황을 만들어 보자.

**`“/user”, “/admin”, “/manager”` 이렇게 시작하는 경로와 그 외의 경로가 있다고 가정했을 때**

**`"/user"` 는 유저 권한이**

**`"/admin"` 은 ADMIN권한이**

**`"/manager"` 는 ADMIN혹은 MANAGER 권한이**

**각각 필요하다고 정하자.**

### 설정

위의 상황에 맞춘 설정을 진행하도록 해야 한다.

```java
@Configuration
@EnableWebSecurity //활성화 시키는 것이다 : Spring Security 필터(설정하는 Config)가 Spring 필터 체인에 등록이 된다.
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.csrf().disable(); //csrf 비활성화
			  http.authorizeRequests()
                .antMatchers("/user/**").authenticated() // /user/**의 경로는 인증이 필요하다! (로그인 필요)
                .antMatchers("/manager/**").access("hasRole('ROLE_ADMIN') or hasRole('ROLE_MANAGER')") //인증 + 특별한 권한 필요
                .antMatchers("/admin/**").access("hasRole('ROLE_ADMIN')")
                .anyRequest().permitAll() //위 3가지가 아닌 나머지 모든 요청은 권한, 인증 필요없다.
                .and()
                .formLogin()
                .loginPage("/loginForm")
                .loginProcessingUrl("/login") //login주소가 호출되면 시큐리티가 낚아채서 진행하게 된다.
                .defaultSuccessUrl("/");
								.formLogin()
                .loginPage("/loginForm")
                .loginProcessingUrl("/login") //login주소가 호출되면 시큐리티가 낚아채서 진행하게 된다.
                .defaultSuccessUrl("/");
                //권한이 없는 경우 로그인 페이지로 이동 할 것인데, .loginPage()를 통해서 어떤 페이지로 이동할지 지정
    }
}
```

여기서 세가지 단계로 나눌 수 있는데

```java
http.csrf().disable();
	//csrf 비활성화
	//이를 통해서 시작시 발급되는 번호 없이도 접근할 수 있도록 설정해준다.
```

그리고

```java
http.authorizeRequests()
		//이를 통해서 권한에 따른 요청 제한을 설정할 수 있는데,
		.antMatchers("/user/**").authenticated()
		//"/user/**"의 경로는 인증이 필요하다! (로그인 필요)
		.antMatchers("/manager/**").access("hasRole('ROLE_ADMIN') or hasRole('ROLE_MANAGER')")
    .antMatchers("/admin/**").access("hasRole('ROLE_ADMIN')")
		//인증 + 특별한 권한 필요
    .anyRequest().permitAll()
		//위 3가지가 아닌 나머지 모든 요청은 권한, 인증 필요없다.
```

이렇게 `.authorizeRequest()` 를 통해 요청마다 권한을 설정할 수 있다.

그리고 Form login을 설정하여 로그인을 제어할 수 있는데 설정은 아래와 같다.

```java
http.formLogin()
    .loginPage("loginForm")
		// 사용자 정의 로그인 페이지 권한이 없다면 여기로 이동할 것
    .defaultSuccessUrl("/")
		// 로그인 성공 후 이동 페이지
    .failureUrl("설정")
		// 로그인 실패 후 이동 페이지
    .usernameParameter("username")
		// 아이디 파라미터명 설정
    .passwordParameter("password")
		// 패스워드 파라미터명 설정
    .loginProcessingUrl("/login")
		// login주소가 호출되면 시큐리티가 낚아채서 진행되게 될 것이다.
    .successHandler(loginSuccessHandler())
		// 로그인 성공 후 핸들러
    .failureHandler(loginFailureHandler())
		// 로그인 실패 후 핸들러
}
```

이렇게 설정을 마치고 나면

각각의 호출되는 url에 따라서 권한이 없다면 로그인 url로 이동하게 될 것이다.

### 로그인 진행을 위한 준비

```java
@Entity
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    private String username;
    private String password;
    private String email;
    private String role; //ROLE_USER, ROLE_ADMIN
    @CreationTimestamp
    private Timestamp createDate;
}
```

이런 구조를 가지는 **User도메인**이 있다.

**이 때 어떻게 로그인 과정을 거치게 될까**

Spring Security는 /login 요청이 오면 위에서 설정했기 때문에 낚아채서 로그인 과정을 진행 시키게 된다.

이때 로그인 진행이 완료되면 **session**을 만들어주게 되는데 이 session이 **Security 자체의 session이다. (Security ContextHolder)**

이 **Security ContextHolder** 에는 **Authentication** 타입의 객체가 들어가게 되는데 이 **Authentication 객체 내부에 이제 우리가 원하는 User의 정보를 넣어주게 된다.**

하지만 **Authentication 객체 내부에 넣어주기 위해서는 UserDetails타입**으로 넣어주어야 한다.

→ 이것들은 자체적으로 이미 만들어져 있는 오브젝트이다.

이제 이를 만족시키기 위해서 작업을 진행하도록 하자.

### UserDetails 구현 객체

```java
public class PrincipalDetails implements UserDetails {
    private User user;

    public PrincipalDetails(User user) {
        this.user = user;
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

우리는 **UserDetails 타입**이 필요하기 때문에 **UserDetails를 implement** 하여 준비를 진행해야 한다.

```java
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
```

이 **`getAuthorities()`** 메소드는 해당 유저의 권한을 반환하는 메소드로 `Collection<GrantedAuthority>` 타입으로 반환하고 있기 때문에 내부에서 `@Override` 하여 작성해서 반환해주면 된다.

그리고 이외의 메소드는 상황에 따라서 작성해서 완성해주면 된다.

이렇게 우리가 필요한 `UserDetails` 를 구현한 `PrincipalDetails` 를 완성했는데 **이제 이것을 어떻게 사용할 것인가.**

로그인을 하면 이제 `UserDetailsService` 를 찾아가 `loadUserByUsername` 함수를 실행하게 될 것이다.

따라서 `userDetailsService` 를 구현하는 클래스를 하나 더 작성해주도록 하자.

### BCryptPasswordEncoder 빈 객체 등록

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {
	@Bean
	public BCryptPasswordEncoder encodePwd() {
			return new BCryptPasswordEncoder();
	}
	...
}
```

추가로 이렇게 반환되는 **`BcryptPasswordEncoder()` 를 빈으로 등록**한다.

이를 통해서 로그인이 이뤄지게 된다.

→ 회원가입시 비밀번호가 암호화되어 들어가게 되니 이를 통해서 인증

### UserDetailsService 구현 객체

```java
@Service
@RequiredArgsConstructor
public class PrincipalDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<User> byUsername = userRepository.findByUsername(username);
        if (byUsername.isEmpty())
            return null;
        User user = byUsername.get();
        return new PrincipalDetails(user); // -> PrincipalDetails = userDetails 타입임
    }
}
```

위의 코드를 살펴보면 `UserDetailsService` 를 구현하고 있다.

그리고 `@Override` 를 통해 `loadUserByUsername()` 메소드를 완성하여 `PrincipalDetails`타입으로 반환하고 있는데 이렇게 반환된 `User`정보를 담은 `PrincipalDetails`가 **이제 Security내부 session의 Authentication에 들어가게 되는 것**이다.

그리고 이를 통해서 로그인이 완료되게 된다.

> **추가로 이를 통해서 로그인 하게 되면 이전의 페이지로 자동 Redirect 되게 된다.**
>
> **만약 로그인 폼을 요청해서 접근한 것이라면 지정한 디폴트 페이지로 이동 된다.**

### 추가로 각각의 메소드에 권한을 제한할 수 있는데 아래의 추가 설정이 필요하다.

```java
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(securedEnable = true, prePostEnabled = true)
public class SecurityConfig extend WebSecurityConfigurerAdapter {
    ...
}
```

여기서 사용된 **`@EnableGlobalMethodSecurity(securedEnable = true, prePostEnabled = true)`** 를 넣어줘서 **`@Secured`** 와 **`@preAuthorize`** 를 사용할 수 있게 해준다.
**`@Secured`** 는 하나의 권한을 설정할 수 있고 **`@PreAuthorize`** 는 `hasRole(권한명)` 를 통해서 여러개의 권한을 설정할 수 있게 해준다.

```java
    @GetMapping("/info")
    @Secured("ROLE_ADMIN")
    //이 접근에는 ROLE_ADMIN권한이 필요함을 선언함 -> Config에서 @EnableGlobalMethodSecurity(securedEnabled = true)  이것을 통해서 켜놓았기 때문임
    @ResponseBody
    public String info() {
        return "개인정보";
    }

    @PreAuthorize("hasRole('ROLE_MANAGER') or hasRole('ROLE_ADMIN')")
    //@Secured과 다르게 여러종류의 권한을 걸기 위해서는 @PreAuthorize를 사용할 수 있는데
    // 이는 hasRole을 사용하며 Config에서 @EnableGlobalMethodSecurity(securedEnabled = true, prePostEnable = true) 설정을 해주어서 가능하게 된다.
    @GetMapping("/data")
    @ResponseBody
    public String data() {
        return "데이타";
    }
    ...
```

이렇게 기본적인 Spring Security 사용법을 익히면 기본적으로는 사용할 수 있다.
