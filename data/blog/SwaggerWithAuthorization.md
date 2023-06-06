---
title: Swagger에 Authorization 헤더 추가하기
date: '2023-06-02'
tags: ['SPRING-BOOT', '기술']
draft: false
summary: 기존의 Swagger에 Authorization 헤더 추가하자
---

## Swagger에 Authorization 헤더 추가하기

❗**Swagger 추가하는 방법의 경우 https://www.ywj9811.vercel.app/blog/Swagger 이를 참고하도록 하자.**

### 단순히 Swagger를 추가하게 되면, 헤더에 특정 토큰 값을 넣거나 하는 기능이 되지 않아 Security에서 권한 처리가 필요할 때 작동하지 않을 수 있다.

![Untitled](/static/images/SwaggerButton/noAuth.png)

**이런식의 화면을**

![Untitled](/static/images/SwaggerButton/authorizationButton.png)

이렇게 오른쪽에 **`Authorize` 버튼을 추가**하여 헤더에 값을 추가할 수 있게 해보고자 한다.

```java
@Configuration
@EnableSwagger2
public class SwaggerConfig {

    @Bean
    public Docket api() {
        return new Docket(DocumentationType.OAS_30)
                .select()
                .apis(RequestHandlerSelectors.withClassAnnotation(RestController.class))
                .paths(PathSelectors.any())
                .build()
                .apiInfo(apiInfo()); //Swagger UI에 노출할 정보
    }

    private ApiInfo apiInfo() {
        return new ApiInfoBuilder()
                .title("제목")
                .description("설명")
                .version("1.0")
                .build();
    }
}
```

이게 기존에 사용하던 `SwaggerConfig` 설정이었다.

그렇다면 어떤 부분을 추가하면 Authrization과 같은 기능을 추가할 수 있는지 확인해보자

```java
@Configuration
@EnableSwagger2
public class SwaggerConfig {

    @Bean
    public Docket api() {
        return new Docket(DocumentationType.OAS_30)
                .securityContexts(Arrays.asList(securityContext()))
                .securitySchemes(Arrays.asList(apiKey()))
                .select()
                .apis(RequestHandlerSelectors.withClassAnnotation(RestController.class))
                .paths(PathSelectors.any())
                .build()
                .apiInfo(apiInfo()); //Swagger UI에 노출할 정보
    }

    private SecurityContext securityContext() {
        return SecurityContext.builder()
                .securityReferences(defaultAuth())
                .build();
    }

    private List<SecurityReference> defaultAuth() {
        AuthorizationScope authorizationScope = new AuthorizationScope("global", "accessEverything");
        AuthorizationScope[] authorizationScopes = new AuthorizationScope[1];
        authorizationScopes[0] = authorizationScope;
        return Arrays.asList(new SecurityReference("Authorization", authorizationScopes));
    }

    private ApiKey apiKey() {
        return new ApiKey("Authorization", "Authorization", "header");
    }

    private ApiInfo apiInfo() {
        return new ApiInfoBuilder()
                .title("제목")
                .description("설명")
                .version("1.0")
                .build();
    }
}
```

위의 달라진 코드를 살펴보면

```java
private SecurityContext securityContext() {
    return SecurityContext.builder()
            .securityReferences(defaultAuth())
            .build();
}

private List<SecurityReference> defaultAuth() {
    AuthorizationScope authorizationScope = new AuthorizationScope("global", "accessEverything");
    AuthorizationScope[] authorizationScopes = new AuthorizationScope[1];
    authorizationScopes[0] = authorizationScope;
    return Arrays.asList(new SecurityReference("Authorization", authorizationScopes));
}

private ApiKey apiKey() {
    return new ApiKey("Authorization", "Authorization", "header");
}
```

이러한 부분이 추가되고 설정에 넣어주는 모습을 볼 수 있다.

`ApiKey`를 통해서 설정한 헤더와 이름으로 해당하는 값이 들어가게 되며, `SecurityContext`에서 `defaultAuth()` 를 통해 원하는 범위에 해당 인증을 허용하게 된다.

위와 같이 설정을 수정하고 기존의 Swagger 에 접속하게 되면

![Untitled](/static/images/SwaggerButton/authorizationButton.png)

이렇게 **`Authorize` 버튼**이 생기게 되며

![Untitled](/static/images/SwaggerButton/buttonInner.png)

이렇게 **Authorization 이라는 Header에 Value를 추가할 수 있는 창**이 나오게 되며, 이제 토큰과 같은 값을 넣어서 사용하면 권한 인증이 처리되게 된다.
