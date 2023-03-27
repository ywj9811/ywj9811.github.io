---
title: Swagger란?
date: '2023-03-26'
tags: ['spring boot', '기술']
draft: false
summary: 문서화 작업을 자동으로 해줄 수 있는 Swagger란 무엇일까?
---

# Swagger란?

![swagger](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FdwZIah%2FbtqA5QvZblP%2FAYVTuv1PNGkcGEErZRCtWk%2Fimg.png)

## Swagger란 무엇일까?

- **Swagger는 개발자가 REST API 서비스를 설꼐, 빌드, 문서화할 수 있도록 하는 프로젝트이다.**
- **Swagger는 REST API를 문서화 하는 도구이다.**
- **API에 대한 명세(Spec)을 관리하기 위한 프로젝트이다.**
- **API가 수정되더라도 문서가 자동으로 갱신된다.**

---

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fe4f87f0f-93f4-4242-92ef-046e9e590215%2FUntitled.png?table=block&id=bd94c88d-271f-4f25-a548-2928fd2136e1&spaceId=ed58f7c6-46bb-48c4-829a-b24be3b7faa2&width=1920&userId=db5d5977-127f-463d-b91b-77eec4b05d2d&cache=v2)

Swagger에는 위와 같은 어노테이션들이 포함되어 있다.

---

### **📌 dependency 설정**

```yaml
// https://mvnrepository.com/artifact/io.springfox/springfox-boot-starter
implementation group: 'io.springfox', name: 'springfox-boot-starter', version: '3.0.0'
```

### **📌 SwaggerConfig 작성**

```java
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Getter;
import lombok.Setter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.RestController;
import springfox.documentation.builders.ApiInfoBuilder;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.service.ApiInfo;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spring.web.plugins.Docket;
import springfox.documentation.swagger2.annotations.EnableSwagger2;

import java.util.List;

@Configuration
@EnableSwagger2
public class SwaggerConfig {

    @Bean
    public Docket api() {
        return new Docket(DocumentationType.OAS_30)
                .select()
                .apis(RequestHandlerSelectors.withClassAnnotation(RestController.class))
                .paths(PathSelectors.any())
                .build().apiInfo(apiInfo());
    }

    @Getter
    @Setter
    @ApiModel
    static class Page {
        @ApiModelProperty(value = "페이지 번호(0..N)")
        private Integer page;

        @ApiModelProperty(value = "페이지 크기", allowableValues="range[0, 100]")
        private Integer size;

        @ApiModelProperty(value = "정렬(사용법: 컬럼명,ASC|DESC)")
        private List<String> sort;
    }

    public ApiInfo apiInfo() {
        return new ApiInfoBuilder()
                .title("Rest API Documentation")
                .description("Hackathon-Project")
                .version("1.0")
                .build();
    }
}
```

위 코드가 최근에 사용한 Swagger 설정의 전체 코드로 하나하나 살펴보도록 하자.

### part1

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
                .build().apiInfo(apiInfo());
    }

		....

}
```

우선 어노테이션부터 살펴보도록 하자.

- @Configuration은 다른 설정과 마찬가지로 설정 파일을 활성화 하는 것이다.
- **@EnableSwagger2** 는 Swagger2 버전을 활성화 한다는 것이다.

아래의 **`public Docket api()`** 에 대해서 알아보면 Swagger 설정의 핵심이다.

해당 메소드에 작성된 설정을 확인해보자

- **`select()`** : ApiSelectorBuilder를 생성한다.
- **`apis()`** : api 스펙이 작성되어 있는 부분을 지정한다. (현재 **@RestController** 어노테이션을 찾는다)
  - **`apis(RequestHandlerSelectors.basePachage("패키지 지정"))`** 이렇게도 사용 가능하다
- **`paths()`** : path 조건에 해당하는 API를 찾아 문서화한다. (현재 모든 것)
- **`apiInfo()`** : 제목, 설명 등등 문서 정보를 위해 추출한다.

이외에 현재 사용되지는 않았지만

- **`useDefaultResponseMessages()`** : swagger에서 제공해주는 응답코드에 대한 기본 메시지 사용 여부 - true, false 지정 가능
- **`groupName()`** : Docket Bean이 한개일 경우 기본 값은 default로 생략할 수 있다.
  - 이는 여러 Docket Bean을 생성했을 경우 충돌할 수 있으니 명시하는 것이다.

### part2

```java
{

		    ...

				public ApiInfo apiInfo() {
        return new ApiInfoBuilder()
                .title("Rest API Documentation")
                .description("Hackathon-Project")
                .version("1.0")
                .build();
    }
}
```

이 부분은 선택적인 요소로 Swagger API 문서에 대한 설명을 표기하는 메소드이다.

- 제목, 설명 등과 같은 문서 정보를 설정해준다.

---

### 📌사용 (Controller 작성)

```java
import com.example.hackathon.global.dto.ResponseDto;
import com.example.hackathon.domain.user.constant.UserConstants;
import com.example.hackathon.domain.user.dto.UserDto.LoginRequest;
import com.example.hackathon.domain.user.dto.UserDto.LoginResponse;
import com.example.hackathon.domain.user.dto.UserDto.SignupRequest;
import com.example.hackathon.domain.user.service.UserService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@RequiredArgsConstructor
@RestController
@RequestMapping("user")
@Api(tags = "User API")
public class UserController {

    private final UserService userService;

    @ApiOperation(value = "회원가입", notes = "회원가입을 합니다.")
    @PostMapping("/signup")
    public ResponseEntity<ResponseDto> singupUser(@Valid @RequestBody SignupRequest signupRequest) {
        this.userService.signup(signupRequest);
        return ResponseEntity.ok(ResponseDto.create(UserConstants.EBoardResponseMessage.SIGNUP_SUCCESS.getMessage()));
    }

    @PostMapping("/login")
    public ResponseEntity<ResponseDto<LoginResponse>> loginUser(@RequestBody LoginRequest loginRequest) {
        LoginResponse loginResponse = this.userService.login(loginRequest);
        return ResponseEntity.ok(ResponseDto.create(UserConstants.EBoardResponseMessage.LOGIN_SUCCESS.getMessage(),loginResponse));
    }
}
```

위의 컨트롤러를 이제 Swagger로 살펴볼 수 있게 된 것인데, 하나씩 살펴보도록 하자.

- **`@Api(tags = “User API”)`** : Swagger 리소스 명시
- **`@ApiOperation(value = "회원가입", notes = "회원가입 합니다.")`** : API에 대한 간략한 설명

이렇게 두가지 스펙을 사용하게 작성한 컨트롤러이다.

**이외에 몇가지 어노테이션을 더 살펴보도록 하자.**

- **`@ApiResponse(code = 200, message = "ok")`** operation의 가능한 response 명시
  - 해당 메소드에 어노테이션으로 달아주는 것이다.
- **`@ApiParam(value = "번호", required = "true", example = "1")`** 파라미터 정보 명시
  - 파라미터 받는 부분에 추가로 작성하는 부분이다.

---

## UI

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fce6aef8c-83e3-4956-8e63-e10d2f4a4567%2FUntitled.png?table=block&id=64625fc8-4eb2-4023-8b33-b2df5d3599ac&spaceId=ed58f7c6-46bb-48c4-829a-b24be3b7faa2&width=1920&userId=db5d5977-127f-463d-b91b-77eec4b05d2d&cache=v2)

이런식으로 내가 설정한 클래스들이 가지고 있는 Api에 대해 기본 UI가 만들어져 있는 모습을 확인할 수 있다.

그리고 더욱 자세히 보기 위해 해당 API를 누르게 되면 아래와 같이 확인할 수 있다.

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F8dded2ce-6e59-4a46-947c-6ee9efe44fc9%2FUntitled.png?table=block&id=a6b8a701-f9f6-479f-be8b-5cf303c412c9&spaceId=ed58f7c6-46bb-48c4-829a-b24be3b7faa2&width=1920&userId=db5d5977-127f-463d-b91b-77eec4b05d2d&cache=v2)

이렇게 문서화 작업을 자동적으로 수행해주는 Swagger를 사용하면 기능 변화에 맞춰서 문서를 매번 변경해주는 번거로움을 줄여줄 수 있다.
