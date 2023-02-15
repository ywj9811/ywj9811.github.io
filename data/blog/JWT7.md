---
title: OAuth2 Login + JWT (7) SecurityConfig 설정
date: '2023-02-14'
tags: ['Spring boot', 'Spring Security', '기술']
draft: false
summary: 지금까지 작성한 서비스 및 필터를 설정하기 위한 SecurityConfig를 작성할 것이다.
---

## SecurityConfig 설정

지금까지 일반 Login 필터와 OAuth2 Login 필터 등등 작성 했으니 **이를 통해 Spring Security의 여러 설정을 담당하는 SecurityConfig 를 작성**하도록 하자.

### SecurityConfig 클래스

```java
//import 너무 많아서 생략

@EnableWebSecurity
@Configuration
@EnableGlobalMethodSecurity(securedEnabled = true, prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    private final UserRepo userRepo;
    private final PrincipalDetailsService principalDetailsService;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;
    private final PrincipalOauth2UserService principalOauth2UserService;
    private final CorsConfig corsConfig;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper;
    private final OAuth2LoginFailureHandler oAuth2LoginFailureHandler;
    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
    /**
     * AuthenticationManager 설정 후 등록
     * PasswordEncoder를 사용하는 AuthenticationProvider 지정 (PasswordEncoder는 위에서 등록한 PasswordEncoder 사용)
     * FormLogin(기존 스프링 시큐리티 로그인)과 동일하게 DaoAuthenticationProvider 사용
     * UserDetailsService는 커스텀 PrincipalDetailsService 등록
     * 또한, FormLogin과 동일하게 AuthenticationManager로는 구현체인 ProviderManager 사용(return ProviderManager)
     */
    @Bean
    public AuthenticationManager authenticationManager() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setPasswordEncoder(bCryptPasswordEncoder);
        provider.setUserDetailsService(principalDetailsService);
        return new ProviderManager(provider);
    }

    /**
     * 로그인 성공 시 호출되는 LoginSuccessJWTProviderHandler 빈 등록
     */
    @Bean
    public LoginSuccessHandler loginSuccessHandler() {
        return new LoginSuccessHandler(jwtService, userRepo);
    }

    /**
     * 로그인 실패 시 호출되는 LoginFailureHandler 빈 등록
     */
    @Bean
    public LoginFailureHandler loginFailureHandler() {
        return new LoginFailureHandler();
    }

    /**
     * CustomJsonUsernamePasswordAuthenticationFilter 빈 등록
     * 커스텀 필터를 사용하기 위해 만든 커스텀 필터를 Bean으로 등록
     * setAuthenticationManager(authenticationManager())로 위에서 등록한 AuthenticationManager(ProviderManager) 설정
     * 로그인 성공 시 호출할 handler, 실패 시 호출할 handler로 위에서 등록한 handler 설정
     */

    @Bean
    public CustomJsonUsernamePasswordAuthenticationFilter customJsonUsernamePasswordAuthenticationFilter() {
        CustomJsonUsernamePasswordAuthenticationFilter customJsonUsernamePasswordAuthenticationFilter
                = new CustomJsonUsernamePasswordAuthenticationFilter(objectMapper);
        customJsonUsernamePasswordAuthenticationFilter.setAuthenticationManager(authenticationManager());
        customJsonUsernamePasswordAuthenticationFilter.setAuthenticationSuccessHandler(loginSuccessHandler());
        customJsonUsernamePasswordAuthenticationFilter.setAuthenticationFailureHandler(loginFailureHandler());
        return customJsonUsernamePasswordAuthenticationFilter;
    }

    @Bean
    public JwtAuthenticationProcessingFilter jwtAuthenticationProcessingFilter() {
        JwtAuthenticationProcessingFilter jwtAuthenticationFilter = new JwtAuthenticationProcessingFilter(jwtService, userRepo);
        return jwtAuthenticationFilter;
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
                .csrf().disable()
                .formLogin().disable() //FormLogin 사용 안함 (자체 로그인 방식 사용(json)
                .httpBasic().disable();// httpBasic 사용 안함 (JWT 방식을 사용할 것이기 때문에 사용 안함)

        http
                //세션 사용 안하도록 설정
                .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)

                //url별 권한 설정
                .and()
                .authorizeRequests()
                .antMatchers("/user/**").authenticated()
                .antMatchers("/manager/**").access("hasRole('ROLE_MANAGER') or hasRole('ROLE_ADMIN')")
                .antMatchers("/admin/**").access("hasRole('ROLE_ADMIN')")
                .anyRequest().permitAll()

                //소셜 로그인 설정
                .and()
                .oauth2Login()
                .successHandler(oAuth2LoginSuccessHandler)
                .failureHandler(oAuth2LoginFailureHandler)
                //여기서 oauth2/authorization/페이지 경로 처리
                //즉, 컨트롤러 매핑이 없어도 자동으로 처리됨
                .userInfoEndpoint().userService(principalOauth2UserService); //customUserService 설정

        http
                .addFilter(corsConfig.corsFilter())
                .addFilterAfter(customJsonUsernamePasswordAuthenticationFilter(), LogoutFilter.class)
                .addFilterBefore(jwtAuthenticationProcessingFilter(), CustomJsonUsernamePasswordAuthenticationFilter.class);
    }
}
```

- **@EnableWebSecurity** → Spring Security 기능 사용 가능 하도록

### PART1

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http
            .csrf().disable()
            .formLogin().disable() //FormLogin 사용 안함 (자체 로그인 방식 사용(json)
            .httpBasic().disable();// httpBasic 사용 안함 (JWT 방식을 사용할 것이기 때문에 사용 안함)

    http
            //세션 사용 안하도록 설정
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)

            //url별 권한 설정
            .and()
            .authorizeRequests()
            .antMatchers("/user/**").authenticated()
            .antMatchers("/manager/**").access("hasRole('ROLE_MANAGER') or hasRole('ROLE_ADMIN')")
            .antMatchers("/admin/**").access("hasRole('ROLE_ADMIN')")
            .anyRequest().permitAll()

            //소셜 로그인 설정
            .and()
            .oauth2Login()
            .successHandler(oAuth2LoginSuccessHandler)
            .failureHandler(oAuth2LoginFailureHandler)
            //여기서 oauth2/authorization/페이지 경로 처리
            //즉, 컨트롤러 매핑이 없어도 자동으로 처리됨
            .userInfoEndpoint().userService(principalOauth2UserService); //customUserService 설정

    http
            .addFilter(corsConfig.corsFilter())
            .addFilterAfter(customJsonUsernamePasswordAuthenticationFilter(), LogoutFilter.class)
            .addFilterBefore(jwtAuthenticationProcessingFilter(), CustomJsonUsernamePasswordAuthenticationFilter.class);
						.userInfoEndpoint().userService(principalOauth2UserService); //customUserService 설정

}
```

- 우리는 JSON 타입으로 로그인 방식을 사용할 것이기 때문에 **`formLogin().disable()`** 처리를 한다.
- JWT 방식을 사용할 것이기 때문에 **`.httpBasic().disable()`** 을 해준다.
- 그리고 세션을 사용하지 않을 것이기 때문에 **`.sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)`** 로 설정해준다.
- **`.authorizeRequests()`** 에서 이제 각 요청에 대한 권한 설정을 해준다.
- **`.oauth2Login()`** 에서는 이제 소셜 로그인에 대한 설정을 해주도록 하자.

### 필터 추가 부분

```java
http
        .addFilter(corsConfig.corsFilter())
        .addFilterAfter(customJsonUsernamePasswordAuthenticationFilter(), LogoutFilter.class)
        .addFilterBefore(jwtAuthenticationProcessingFilter(), CustomJsonUsernamePasswordAuthenticationFilter.class);
				.userInfoEndpoint().userService(principalOauth2UserService); //customUserService 설정
```

우리가 커스텀한 필터를 추가해줘야 한다.

**`customJsonUsernamePasswordAuthenticationFilter()`** 는 이제 **LogoutFilter 이후에 로그인 필터가 동작하기 때문에 `addFilterAfter()` 를 통해 로그인 필터가 동작하는 시점에 동작하도록** 한다.

그리고 **JwtAuthenticationProcessingFilter()가 CustomJsonUsernamePasswordAuthenticationFilter 이전에 작동할 것**이기 때문에 설정을 추가해준다.

→ **JwtAuthenticationProcessingFilter**에서 토큰 검사를 하고 만약 검사할 필요가 없는 경로의 경우(”/login/**”) **customJsonUserPasswordAuthenticationFilter()로 바로 넘어가게 된다.\*\*

**`.userInfoEndpoint().userService(principalOauth2UserService)`** 의 경우 OAuth2 로그인의 로직을 담당한는 Service를 설정할 수 있다.

### 참고 : CorsFilter (서버 응답 자바스크립트에서 처리 및 요청과 응답을 허용하기 위함)

```java
@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowCredentials(true);
        //이 부분은 내 서버가 응답할 때 json을 자바스크립트에서 처리할 수 있게 할지를 설정하는 것임 -> 자바스크립트 요청을 받으려면 true

        config.addAllowedOrigin("*");
        //모든 ip에 응답을 허용
        config.addAllowedHeader("*");
        //모든 header에 응답을 허용
        config.addAllowedMethod("*");
        //모든 Post, get, Put과 같은 요청을 허용
        source.registerCorsConfiguration("/api/**", config);
        return new CorsFilter(source);
    }
}
```

### PART2

### 이외의 @Bean 등록 부분

```java
@Configuration
public class WebConfig {
    @Bean
    public BCryptPasswordEncoder bCryptPasswordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

Provider에서 설정할 passwordEncoder를 등록한다.

```java
@Bean
public AuthenticationManager authenticationManager() {
    DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
    provider.setPasswordEncoder(bCryptPasswordEncoder);
    provider.setUserDetailsService(principalDetailsService);
    return new ProviderManager(provider);
}

/**
 * 로그인 성공 시 호출되는 LoginSuccessJWTProviderHandler 빈 등록
 */
@Bean
public LoginSuccessHandler loginSuccessHandler() {
    return new LoginSuccessHandler(jwtService, userRepo);
}

/**
 * 로그인 실패 시 호출되는 LoginFailureHandler 빈 등록
 */
@Bean
public LoginFailureHandler loginFailureHandler() {
    return new LoginFailureHandler();
}

/**
 * CustomJsonUsernamePasswordAuthenticationFilter 빈 등록
 * 커스텀 필터를 사용하기 위해 만든 커스텀 필터를 Bean으로 등록
 * setAuthenticationManager(authenticationManager())로 위에서 등록한 AuthenticationManager(ProviderManager) 설정
 * 로그인 성공 시 호출할 handler, 실패 시 호출할 handler로 위에서 등록한 handler 설정
 */

@Bean
public CustomJsonUsernamePasswordAuthenticationFilter customJsonUsernamePasswordAuthenticationFilter() {
    CustomJsonUsernamePasswordAuthenticationFilter customJsonUsernamePasswordAuthenticationFilter
            = new CustomJsonUsernamePasswordAuthenticationFilter(objectMapper);
    customJsonUsernamePasswordAuthenticationFilter.setAuthenticationManager(authenticationManager());
    customJsonUsernamePasswordAuthenticationFilter.setAuthenticationSuccessHandler(loginSuccessHandler());
    customJsonUsernamePasswordAuthenticationFilter.setAuthenticationFailureHandler(loginFailureHandler());
    return customJsonUsernamePasswordAuthenticationFilter;
}

@Bean
public JwtAuthenticationProcessingFilter jwtAuthenticationProcessingFilter() {
    JwtAuthenticationProcessingFilter jwtAuthenticationFilter = new JwtAuthenticationProcessingFilter(jwtService, userRepo);
    return jwtAuthenticationFilter;
}
```

- **AuthenticationManager** 등록
  **AuthentcationManger**를 설정하기 위해서 해당 클래스를 빈으로 등록해준다.
  동시에 기존 FormLogin 방식에서 사용하는 **Provider인 DaoAuthenticationProvider를 사용하기 때문에 해당 객체를 생성하고 해당 객체에 PrincipalDetailsService를 사용하도록 설정하고 넣어주며 반환**한다.
  **(ProviderManager는 AuthenticationManager의 구현체)**
- **LoginSuccessHandler와 LoginFailureHandler** 빈 등록
  이전에 생성한 핸들러를 반환한다.
- **CustomJsonUsernamePasswordAuthenticationFilter** 빈 등록
  일반 로그인 인증 처리를 담당하는 필터로 빈에 등록한다.
  **AbstractAuthenticationProcessingFilter** 를 상속 받는 **CustomJsonUsernamePasswordAuthenticationFilter를 빈으로 등록하는 과정**으로 이전에 등록한 **AuthenticationManager를 넣어주고, 핸들러 또한 넣어준 후 반환**한다.
- **JwtAuthenticationProcessingFilter** 등록
  JWT 인증 처리를 담당하는 JWT 인증 필터를 빈으로 등록
