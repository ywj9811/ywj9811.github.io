---
title: SpringBoot 3.1xx 변경점 (SpringSecurity, Swagger, Querydsl)
date: '2023-10-14'
tags: ['spring boot', '기술']
draft: false
summary: SpringBoot 3.1.xx 로 변경되면서 몇가지 설정 방법 및 코드 작성법이 변경되었는데, 이 부분을 살펴보도록 하자.
---
**SpringBoot3.0이 되면서 SpringSecurity, Swagger, Querydsl에 대한 설정이 많이 변경이 되었다.**

**뿐만 아니라 3.1.xx에서 변경된 점이 있으므로 3.1.xx부터 기준으로 정리하도록 하겠다.**

## Spring Security 변경점

우선, SpringBoot 3이 넘어가면서 Spring Security의 버전이 6.1 으로 강제되었다.

따라서 기존의 Spring Security 에서 설정하던 부분에서 일부가 Deprecated되었다.

### 기존

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Override
    protected void configure(HttpSecurity httpSecurity) throws Exception {
        httpSecurity
                .csrf().disable()

                .addFilterBefore(corsFilter, UsernamePasswordAuthenticationFilter.class)

                .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)

                .and()
                .authorizeRequests()
                .antMatchers("/test","/auth","/auth/login","/docs","/test","/health","/auth/check").permitAll()
                .antMatchers("/docs/**").permitAll()
                .antMatchers("/docs/index.html").permitAll()
                .anyRequest().authenticated();

    }
}
```

이전에 SpringBoot 2.xx까지는 위와 같이 설정해도 문제 없이 동작했을 것이다.

하지만 3.xx이상으로 넘어가면서 위와 같이 `WebSecurityConfigurerAdapter` 를 상속받아 오버라이딩하는 방식을 사용할 수 없다.

또한 `and()` 와 같은 **non-lamda DSL methods 모두 Deprecated되었다.**

> **참고** : https://docs.spring.io/spring-security/reference/migration-7/configuration.html
> 

### Spring Security 6.1 이상

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    private static final String[] PASS = {"/resource/**", "/css/**", "/js/**", "/img/**", "/lib/**"};
    @Bean
    public BCryptPasswordEncoder encodePassword() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    protected SecurityFilterChain config(HttpSecurity http) throws Exception {
        http
                .csrf(csrf->csrf.disable())
                .cors(cors->cors.disable())
                .httpBasic(httpBasic->httpBasic.disable())
                .headers((headers) -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable));
        http
                .formLogin(formLogin->formLogin.disable())
                .logout(logout->logout.disable());
        http
                .authorizeHttpRequests(auth->auth
                        .requestMatchers(PASS).permitAll()
                        .anyRequest().permitAll())
                .sessionManagement(sessionManagement->sessionManagement.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        return http.build();
    }
}
```

한눈에 봐도 많은 부분이 달라졌다.

### `WebSecurityConfigurerAdapter` 인터페이스를 상속하지 않는다.

사실 이 부분은 Deprecated된다고 이야기가 많이 나왔기 때문에 이전부터 사용을 지양하라는 말이 많았다.

**변경된 방식 :** `SecurityFilterChain` **Bean을 생성하는 방식으로 바뀌었다.**

`SecurityFilterChain` 인터페이스 함수를 하나 만들어서 그 안에서 기존에 설정했던 코드를 구현한 후 @Bean으로 등록해준다.

그리고 내부에서 Lamda DSL 방식을 사용해야 하므로 `.csrf(CSRF 설정을 위한 함수)` 와 같이 작성해야 한다.

즉, 트랜드에 맞춰 함수형 프로그래밍을 지향하는 방식으로 변경된 듯 하다.

![Untitled](/static/images/chage1.png)

기존의 방식으로 작성하게 되면 컴파일시 에러가 발생하며 위와 빨간 라인에 커서를 올리면 같이 대안을 알려주는 모습을 확인할 수 있다.

따라서 모든 부분은 기존의 방식에서 함수형 프로그래밍 방식으로 변경 후 `return http.build();` 를 통해 마무리하면 된다.

## Querydsl 변경점

원래 Querydsl은 버전이 변경될때마다 설정이 달라진다.

SpringBoot 3.xx부터는 자바17 이상이 강제되기 때문에 이와 동시에 Querydsl 설정 또한 변경되었다.

### 기존

```java
buildscript {
	dependencies {
		classpath("gradle.plugin.com.ewerk.gradle.plugins:querydsl-plugin:1.0.10")
	}
}

plugins {
	id 'java'
	id 'org.springframework.boot' version '2.7.10'
	id 'io.spring.dependency-management' version '1.0.15.RELEASE'
}

group = 'chilling'
version = '0.0.1-SNAPSHOT'
sourceCompatibility = '11'

apply plugin: "com.ewerk.gradle.plugins.querydsl"

configurations {
	compileOnly {
		extendsFrom annotationProcessor
	}
}

repositories {
	mavenCentral()
}

dependencies {
	...
//Querydsl 추가
	implementation "com.querydsl:querydsl-jpa"
	implementation "com.querydsl:querydsl-apt"
}

tasks.named('test') {
	useJUnitPlatform()
}

//Querydsl 추가, 자동 생성된 Q클래스 gradle clean으로 제거
clean {
	delete file('src/main/generated')
}

def querydslDir = "$buildDir/generated/querydsl"
querydsl {
	library = "com.querydsl:querydsl-apt"
	jpa = true
	querydslSourcesDir = querydslDir
}

sourceSets{
	main.java.srcDir querydslDir
}

compileQuerydsl{
	options.annotationProcessorPath = configurations.querydsl
}

configurations {
	querydsl.extendsFrom compileClasspath
}
```

기존의 2.xx에서는 위와 같은 내용으로 Querydsl을 설정하고 

1. build → clean, other → compileJava
2. other → compileQueryDslJava 
3. 혹은 build → build

이러한 방식으로 진행했을 것이다.

### SpringBoot 3.x 이상

```java
plugins {
	id 'java'
	id 'org.springframework.boot' version '3.1.4'
	id 'io.spring.dependency-management' version '1.1.3'
}

group = 'com'
version = '0.0.1-SNAPSHOT'

java {
	sourceCompatibility = '17'
}

configurations {
	compileOnly {
		extendsFrom annotationProcessor
	}
}

repositories {
	mavenCentral()
}

dependencies {
	...
	// Spring boot 3.x이상에서 QueryDsl 패키지를 정의하는 방법
	implementation 'com.querydsl:querydsl-jpa:5.0.0:jakarta'
	annotationProcessor "com.querydsl:querydsl-apt:5.0.0:jakarta"
	annotationProcessor "jakarta.annotation:jakarta.annotation-api"
	annotationProcessor "jakarta.persistence:jakarta.persistence-api"
}

tasks.named('test') {
	useJUnitPlatform()
}
```

이렇게 `build.gradle` 의존성 주입에서 변경이 되었고

이후의 방식은 동일하다.

1. build → clean, other → compileJava
2. 혹은 other → compileQueryDslJava
3. 혹은 build → build

## Swagger 변경점

### 기존

```java
dependencies {
	...
	implementation 'io.springfox:springfox-boot-starter:3.0.0'
	implementation 'io.springfox:springfox-swagger-ui:3.0.0'
	//swagger 추가
}
```

이렇게 기존에는 springfox를 사용해왔다.

하지만 3.xx이상 부터는 springdoc-openapi-ui 라이브러리를 사용해야 한다.

물론, 3.xx 미만의 버전도 이것을 사용하는 것이 좋다고 한다.

⚠️ **springfox의 업데이트 멈췄다… 꽤 옛날에**

![Untitled](/static/images/chage2.png)

💡**springdoc-openapi는 꾸준히 업데이트 중이다.**

![Untitled](/static/images/chage3.png)

### SpringBoot 3.x 이상

```java
dependencies {
	...
	// https://mvnrepository.com/artifact/org.springdoc/springdoc-openapi-starter-webmvc-ui
	implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.2.0'
	//swagger 추가
}
```

이렇게 springdoc-openapi 라이브러리를 추가한다.

이외에 기존의 SwaggerConfig도 변경해야 한다.

```java
@OpenAPIDefinition(
        info = @Info(title = "PostGraduate App",
                description = "postgraduate app api명세",
                version = "v1"))
@RequiredArgsConstructor
@Configuration
public class SwaggerConfig {

    @Bean
    public GroupedOpenApi chatOpenApi() {
        String[] paths = {"/v1/**"};

        return GroupedOpenApi.builder()
                .group("PostGraduate API v1")
                .pathsToMatch(paths)
                .build();
    }
}
```

SwaggerConfig없이 사용 가능하지만, 커스텀하고 싶다면 위와 같이 설정을 추가해서 사용해야 한다.

이외에는 **@Tag, @Operation** 을 컨트롤러에 함께 사용하여 이름을 지정해줄 수 있다.

**참고 : https://wonsjung.tistory.com/584**