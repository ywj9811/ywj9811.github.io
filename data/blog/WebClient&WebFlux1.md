---
title: WebClient와 Spring Webflux (1)
date: '2023-08-12'
tags: ['Spring boot', '기술']
draft: false
summary: WebClient란 무엇인가
---

## WebClient란?

**WebClient**란 웹으로 API를 호출하기 위해 사용되는 Http Client 모듈 중 하나로, **RestTemplate**를 대체하는, HTTP 클라이언트이다.

이는 기존의 동기 API를 제공할 뿐만 아니라, 논블로킹 및 비동기 접근 방식을 지원해서 효율적인 통신을 가능하게 한다.

이러한 **WebClient**는 기존의 RestTemplate과 다르게, **Single-Thread 와 Non-Blocking 방식**이다.

이 **Non-Blocking** 방식은 네트워크 병목 현상을 줄이고, 성능을 향상시킬 수 있다.

![Untitled](/static/images/webClient.png)

1. 각 요청은 Event Loop 내에 Job으로 등록
2. Event Loop 는 각 Job을 제공자에게 요청한 후, 결과를 기다리지 않고 다른 Job을 처리한다.
3. Event Loop 는 제공자로부터 Callback으로 응답이 오면, 그 결과를 요청자에게 제공한다.

이러한 방식으로 동작하는 것이다.

이와 같이 WebClient는 이벤트에 대한 반응형으로 설계가 되어있기 때문에, 반응성, 탄력성, 가용성, 비동기성을 보장하는 Spring React 프레임워크를 사용한다.

또한, React Web 프레임워크인 Spring Webflux에서 Http Client로 사용된다.

## WebClient 사용 방법

우선, WebClient 종속성 추가를 해야한다.

```java
// WebClient
implementation 'org.springframework.boot:spring-boot-starter-webflux'
```

### WebClient 객체 생성

- `WebClient.create()`
- `WebClient.create(String baseUrl)`
- `WebClient.builder()`
    
    아래는 `builder()` 와 함께 사용할 수 있는 옵션이다. (공식 문서)
    
    > `uriBuilderFactory`: `UriBuilderFactory`기본 URL로 사용하도록 맞춤화되었습니다.
    > 
    > 
    > `defaultUriVariables`: URI 템플릿을 확장할 때 사용할 기본값입니다.
    > 
    > `defaultHeader`: 모든 요청에 대한 헤더입니다.
    > 
    > `defaultCookie`: 모든 요청에 대한 쿠키.
    > 
    > `defaultRequest`: `Consumer`모든 요청을 사용자 지정합니다.
    > 
    > `filter`: 모든 요청에 대한 클라이언트 필터.
    > 
    > `exchangeStrategies`: HTTP 메시지 판독기/작성기 사용자 정의.
    > 
    > `clientConnector`: HTTP 클라이언트 라이브러리 설정.
    > 
    > `observationRegistry`[: Observability 지원을](https://docs.spring.io/spring-framework/reference/integration/observability.html#http-client.webclient) 활성화하기 위해 사용할 레지스트리 .
    > 
    > `observationConvention`: 기록된 관찰에 대한 [메타데이터를 추출하기 위한 선택적 사용자 지정 규칙입니다](https://docs.spring.io/spring-framework/reference/integration/observability.html#config) .
    > 

이렇게 3가지를 사용할 수 있는데, `create()` 가 default 설정이라면, `builder()` 를 통해 커스텀하게 설정을 할 수 있다.

```java
@Bean
public WebClient webClient() {
    return WebClient.builder()
            .clientConnector(new ReactorClientHttpConnector(getHttpClient())) // 응답 시간 제한
            .exchangeStrategies(getExchangeStrategies())
            .filter(getRequestProcessor())
            .filter(getResponseProcessor())
            .defaultHeader(HttpHeaders.USER_AGENT, "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36")
            .build();
}

private static ExchangeFilterFunction getResponseProcessor() {
    return ExchangeFilterFunction.ofResponseProcessor(
            clientResponse -> {
                clientResponse.headers().asHttpHeaders().forEach((name, values) -> values.forEach(value -> log.debug("{} : {}", name, value)));
                return Mono.just(clientResponse);
            }
    );
}

private static ExchangeFilterFunction getRequestProcessor() {
    return ExchangeFilterFunction.ofRequestProcessor(
            clientRequest -> {
                log.debug("Request: {} {}", clientRequest.method(), clientRequest.url());
                clientRequest.headers().forEach((name, values) -> values.forEach(value -> log.debug("{} : {}", name, value)));
                return Mono.just(clientRequest);
            }
    );
}

private static HttpClient getHttpClient() {
    /**
     * Request 또는 Response 데이터에 대해 조작을 하거나 추가 작업을 하기 위해서는 WebClient.builder().filter() 메소드를 이용해야함
     *
     * ExchangeFilterFunction.ofRequestProcessor() 와
     * ExchangeFilterFunction.ofResponseProcessor() 를 통해
     * clientRequest 와 clientResponse 를 변경하거나 출력할 수 있습니다.
     */
    return HttpClient.create()
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 3000) //연결 시간 제한
            .doOnConnected(connection -> connection
                    .addHandlerLast(new ReadTimeoutHandler(3))
                    .addHandlerLast(new WriteTimeoutHandler(3))) //읽기, 쓰기 제한 시간
            .responseTimeout(Duration.ofSeconds(2));
}

private static ExchangeStrategies getExchangeStrategies() {
    /**
     * size가 기본 256KB 따라서 더 늘리기 위해서는 다음과 같이 지정을 해줘야 함
     */
    ExchangeStrategies exchangeStrategies = ExchangeStrategies.builder()
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(1024 * 1024 * 50))
            .build();
    /**
     * Debug 레벨 일 때 form Data 와 Trace 레벨 일 때 header 정보는 민감한 정보를 포함하고 있기 때문에,
     * 기본 WebClient 설정에서는 위 정보를 로그에서 확인할 수 가 없음
     * 개발 진행 시 Request/Response 정보를 상세히 확인하기 위해서는
     * ExchageStrateges 와 logging level 설정을 통해 로그 확인이 가능하도록 해 주는 것이 좋다.
     */
    /**
     * ExchangeStrategies 를 통해 setEnableLoggingRequestDetails(boolen enable) 을 true 로 설정해 주고
     * application.yaml 에 개발용 로깅 레벨은 DEBUG 로 설정하자.
     *
     * logging:
     *   level:
     *     org.springframework.web.reactive.function.client.ExchangeFunctions: DEBUG
     */
    exchangeStrategies
            .messageWriters().stream()
            .filter(LoggingCodecSupport.class::isInstance)
            .forEach(writer -> ((LoggingCodecSupport)writer).setEnableLoggingRequestDetails(true));
    return exchangeStrategies;
}
```

위와 같이 설정을 하여 사용할 수 있는데 하나씩 확인해 보도록 하자.

- **메모리 사이즈 설정 및 로그 설정**
    
    ```java
    private static ExchangeStrategies getExchangeStrategies() {
        ExchangeStrategies exchangeStrategies = ExchangeStrategies.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(1024 * 1024 * 50))
                .build();
        exchangeStrategies
                .messageWriters().stream()
                .filter(LoggingCodecSupport.class::isInstance)
                .forEach(writer -> ((LoggingCodecSupport)writer).setEnableLoggingRequestDetails(true));
        return exchangeStrategies;
    }
    ```
    
    이 부분은
    
    - `exchangeStrategies`: HTTP 메시지 판독기/작성기 사용자 정의.
    이 부분을 정의하는 것으로, codec에는 메모리의 데이터 버퍼링의 제한이 256KB로 제한이 되어있기에
    
    ```java
    .codecs(configurer -> 
    		configurer.defaultCodecs().maxInMemorySize(1024 * 1024 * 50))
    ```
    
    이렇게 원하는 사이즈로 설정할 수 있다.
    
    그 아래에 설정하는 부분은 개발 진행 시 Request/Response 정보를 상세히 확인하기 위해 설정한 부분이다.
    
- **Reactor Netty 설정**
    
    ```java
    HttpClient httpClient = HttpClient.create().secure(sslSpec -> ...);
    
    WebClient webClient = WebClient.builder()
    		.clientConnector(new ReactorClientHttpConnector(httpClient))
    		.build();
    // 공식문서 예시
    ```
    
    그리고 아래는 실제로 작성된 코드로 한번 살펴보도록 하자.
    
    ```java
    ...
    	.clientConnector(new ReactorClientHttpConnector(getHttpClient()))
    ...
    
    private static HttpClient getHttpClient() {   
        return HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 3000) //연결 시간 제한
                .doOnConnected(connection -> connection
                        .addHandlerLast(new ReadTimeoutHandler(3))
                        .addHandlerLast(new WriteTimeoutHandler(3))) //읽기, 쓰기 제한 시간
                .responseTimeout(Duration.ofSeconds(2));
    }
    ```
    
    - `.option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 3000)` 는 연결 시간 제한을 구성하는 것이다.
    
    ```java
    .doOnConnected(connection -> connection
                        .addHandlerLast(new ReadTimeoutHandler(3))
                        .addHandlerLast(new WriteTimeoutHandler(3)))
    ```
    
    - 이 방식은 읽기와 쓰기에 대한 제한 시간을 구성하는 것이다.
    - `.responseTimeout(Duration.ofSeconds(2))` 는 응답 시간 제한을 구성하는 것이다.
    - 만약 특정 요청에 대한 응답 제한 시간을 구성하려면
        
        ```java
        WebClient.create().get()
        		.uri("https://example.org/path")
        		.httpRequest(httpRequest -> {
        			HttpClientRequest reactorRequest = httpRequest.getNativeRequest();
        			reactorRequest.responseTimeout(Duration.ofSeconds(2));
        		})
        		.retrieve()
        		.bodyToMono(String.class);
        ```
        
        이와 같이 구성할 수 있다.
        
- **모든 요청에 대한 클라이언트 필터 설정**
    
    ```java
    ...
    		.filter(getRequestProcessor())
    		.filter(getResponseProcessor())
    ...
    
    private static ExchangeFilterFunction getResponseProcessor() {
        return ExchangeFilterFunction.ofResponseProcessor(
                clientResponse -> {
                    clientResponse.headers().asHttpHeaders().forEach((name, values) -> values.forEach(value -> log.debug("{} : {}", name, value)));
                    return Mono.just(clientResponse);
                }
        );
    }
    
    private static ExchangeFilterFunction getRequestProcessor() {
        return ExchangeFilterFunction.ofRequestProcessor(
                clientRequest -> {
                    log.debug("Request: {} {}", clientRequest.method(), clientRequest.url());
                    clientRequest.headers().forEach((name, values) -> values.forEach(value -> log.debug("{} : {}", name, value)));
                    return Mono.just(clientRequest);
                }
        );
    }
    ```
    
    - `getResponseProcessor()` 이 메소드 반환할 때 인자로 주어진 `clientResponse`를 처리하는 함수를 전달받는데, 아래와 같은 단계로 수행한다.
        1. 클라이언트 응답의 헤더를 가져와서 각 헤더 이름과 해당 값을 로깅하는데, `forEach` 메소드를 사용하여 헤더의 각 이름과 값을 반복하면서 로그를 출력한다.
        2. `return Mono.just(clientResponse)` : 클라이언트 응답을 다시 Mono 형태로 반환한다.
        
        > **Mono란, Reactive Streams의 Publisher 인터페이스를 구현하는 구현체이며, 0..1 개의 데이터를 처리한다.**
        > 
    - `getRequestProcessor()` 이 메소드는 위와 같은 내용으로 응답 대신 요청을 다룬다.

### retrieve() 사용하기

`retrieve()` 는 응답을 추출하는 방법을 선언하는데 사용할 수 있다.

```java
WebClient client = WebClient.create("https://example.org");

Mono<ResponseEntity<Person>> result = client.get()
		.uri("/persons/{id}", id).accept(MediaType.APPLICATION_JSON)
		.retrieve()
		.toEntity(Person.class);
```

이렇게 가져오거나 혹은

```java
WebClient client = WebClient.create("https://example.org");

Mono<Person> result = client.get()
		.uri("/persons/{id}", id).accept(MediaType.APPLICATION_JSON)
		.retrieve()
		.bodyToMono(Person.class);
```

이렇게 본문만 가져올 수 있다.

그리고 4xx, 5xx 응답은 `WebClientResponseException` 특정 HTTp 상태코드에 대한 하위 클래스를 포함하기에, 오류 응답 처리를 사용자 정의하려면 `onStatus()` 를 통해 아래와 같이 정의할 수 있다.

```java
Mono<Person> result = client.get()
		.uri("/persons/{id}", id).accept(MediaType.APPLICATION_JSON)
		.retrieve()
		.onStatus(HttpStatus::is4xxClientError, response -> ...)
		.onStatus(HttpStatus::is5xxServerError, response -> ...)
		.bodyToMono(Person.class);
```

여기까지 공식 문서에서 확인할 수 있는 내용이며, 실제로 어떻게 사용할 수 있는지 확인하자.

```java
@Service
@Slf4j
@RequiredArgsConstructor
public class KakaoService implements Oauth2Service {
    private final WebClient webClient;
    private final KakaoValid kakaoValid;
    private final OauthToUser oauthToUser;

    @Override
    public Mono<User> getUserData(String accessToken) {
        kakaoValid.valid(accessToken);
        return webClient.get()
                .uri("https://kapi.kakao.com/v2/user/me")
                .headers(httpHeaders -> httpHeaders.setBearerAuth(accessToken))
                .retrieve()
                .onStatus((HttpStatus) -> HttpStatus.ACCEPTED.is4xxClientError(), response -> Mono.error(new ClassCastException()))
                //적절한 예외 처리
                .onStatus((HttpStatus) -> HttpStatus.ACCEPTED.is5xxServerError(), response -> Mono.error(new ClassCastException()))
                //적절한 예외 처리
                .bodyToMono(KakaoResponse.class)
								.flatMap(oauthToUser::fromKakao);
    }
}
```

이렇게 작성할 수 있는데, 위에서 설명한것과 같이 내용을 살펴보면 다음과 같다.

- `.uri("https://kapi.kakao.com/v2/user/me")` 요청할 url설정
- `.headers(httpHeaders -> httpHeaders.setBearerAuth(accessToken))` 헤더 설정
- `onStatus(...)` 4xx와 5xx에 대한 예외 처리
- `bodyToMono(...)` 응답의 본문을 …에 해당하는 부분에 맵핑하는 것이다.
- `.flatMap(oauthToUser::fromKakao)` 결과를 `Mono<User>`로 변환하기 위해 존재하는 부분이다.

**물론 `.block()` 을 사용하여 `User` 객체로 받을 수 있다.**

**하지만 `.block()` 을 사용하게 되면 non-blocking 이라는 특징을 잃어버리게 되는 것이다.**

따라서 사용할 경우 조심스럽게 선택해야 한다.

물론 위와 같은 경우가 아닌, 요청을 여러개 보내고 결과를 받아서 처리하는 경우에 **non-blocking의 강점**이 더욱 드러날 것이다.

이렇게 **WebClient**는 기존의 동기 방식의 통신과 다르게 비동기 통신 방식을 사용할 수 있게 해주는 **Spring Webflux**의 **Http Client** 모듈이다.

다음에는, **Spring Webflux**와 **Mono**, **Flux** 에 대해서 살펴볼 것이다.

> 참고
> 
> https://thalals.tistory.com/377
> 
> https://docs.spring.io/spring-framework/reference/web/webflux-webclient/client-builder.html