---
title: 알림톡 전송 순서 보장하기
date: '2025-02-22'
tags: ['spring boot', '기술']
draft: false
summary: 알림톡의 전송 순서 보장하기
---
## 개요
이번에 Y-EDU 서비스를 개발하며, 선생님 가입과 학부모 과외 신청 그리고 과외 공지, 선생님 추천 과 같은 부분에서 알림톡이 사용되기 때문에 ‘비즈뿌리오’ 의 알림톡 서비스를 이용 알림톡 개발을 담당하게 되었다.

이때 선생님이 가입을 위한 프로필 구글폼 작성을 완료하면

1. **상담 시작**
2. **사진 & 영상 제출**

이러한 알림톡이 정확히 1번 2번 순서를 유지하며 전송이 되는 것을 기획이 요구한 상황이었다.

알림톡 발송의 경우 핵심 비즈니스 로직과 분리해도 괜찮은 작업이라고 생각을 하였고, 비동기적으로 처리하기 위해 WebClient를 이용하고자 하였고, 1번과 2번의 순서를 보장하기 위해 두개의 알림톡을 병렬로 실행하지 않고, `then()` 을 활용해 순차적인 전송을 보장하고자 하였다.

```java
@RequiredArgsConstructor
@Component
public class BizppurioTeacherMessage {
    private final BizppurioMapper bizppurioMapper;
    private final BizppurioSend bizppurioSend;

    public void counselStartAndPhotoSubmit(Teacher teacher) {
        bizppurioSend.sendMessageWithExceptionHandling(() -> bizppurioMapper.mapToCounselStart(teacher))
                .then(photoSubmit(teacher))
                .subscribe();
    }
    
    private Mono<Void> photoSubmit(Teacher teacher) {
        return bizppurioSend.sendMessageWithExceptionHandling(() -> bizppurioMapper.mapToApplyPhotoSubmit(teacher));
    }
    ...
}

@RequiredArgsConstructor
@Slf4j
@Component
public class BizppurioSend {
		...
		
    protected Mono<Void> sendMessageWithExceptionHandling(Supplier<CommonRequest> messageSupplier) {
        CommonRequest commonRequest = messageSupplier.get();
        String accessToken = bizppurioAuth.getAuth();
        String request;
        try {
            request = objectMapper.writeValueAsString(commonRequest);
        } catch (Exception e) {
            log.error("Json 직렬화 실패");
            return Mono.empty();
        }
        log.info("알림톡 발송 : {} \n{}", commonRequest.to(), commonRequest.content().at());

        return webClient.post()
                .uri(messageUrl)
                .headers(h -> h.setContentType(APPLICATION_JSON))
                .headers(h -> h.setBearerAuth(accessToken))
                .bodyValue(request)
                .retrieve()
                // 200이 아닐 경우 예외 발생
                .onStatus(HttpStatusCode::isError, response ->
                    response.bodyToMono(String.class)
                            .map(errorBody -> new IllegalArgumentException("비즈뿌리오 알림톡 전송 API 요청 실패: " + errorBody))
                )
                .bodyToMono(MessageResponse.class)
                .doOnSubscribe(subscription -> log.info("알림톡 요청 시작"))
                .doOnSuccess(response -> log.info("알림톡 초기 요청 성공"))
                .doOnError(error -> {
                    log.error("알림톡 초기 요청 실패 : {}", error.getMessage());
                    discordWebhookSend.sendAlarmTalkError(commonRequest.to(), commonRequest.content().at().getMessage(), error.getMessage());
                })
                .then();
    }
    ...
}
```

그러한 목적을 가지고 위와 같은 코드를 작성하였고, 실제 알림톡 전송을 통해 검증을 진행하였다.

**하지만 검증을 진행할 때는 순서가 보장되는 것으로 보였으나 QA를 진행하는 과정에서 2번 → 1번 의 순서로 알림톡이 전송되는 현상이 발견되었다.**

![image.png](/static/images/alarm.png)

이에 대해 원인을 고민하였고, 원인을 추론하게 되었다.

우선, 알림톡 전송을 위해 진행되는 절차는 다음과 같다.

1. Y-EDU → 비즈뿌리오 알림톡 전송 요청
2. 비즈뿌리오 → Y-EDU 요청 수락 or 거절
3. 비즈뿌리오 → 카카오 알림톡 전송 요청
4. 카카오 → 비즈뿌리오 알림톡 결과
5. 비즈뿌리오 → Y-EDU 알림톡 결과 (PUSH 알림)

이러한 절차로 진행되는 것으로 이해하고 있는데, 위의 절차는 1~2번의 절차만 알 수 있는 것이었다.

**즉, 우리의 서비스가 비즈뿌리오에 1번과 2번을 순차적으로 요청을 보내더라도 비즈뿌리오에서 카카오로 알림톡을 병렬로 요청하게 된다면 1번과 2번의 순서가 뒤바뀔 수 있는 가능성이 존재하는 것이다.**

이러한 문제점을 파악하고, 이 문제점을 해결하기 위한 방식을 고민하게 되었는데 순서를 보장하는 것 그리고 이전 알림톡이 전송되지 않았다면 다음 알림톡도 전송되지 않게 하는 방식을 구현하기 위해서는

**5번 절차가 수행된 이후 다음 알림톡 전송을 요청해야 하는 것으로 변경할 필요가 있었다.**

![image.png](/static/images/apibody.png)

비즈뿌리오는 5번 과정에서 위와 같은 정보를 우리에게 전달해주고 있었고, 이 응답에서 어떤 템플릿을 전송했고, 다음에 무엇을 전송해야하는지 파악해야 했다.

하지만 위의 응답에서는 템플릿키 와 같은 템플릿을 특정할 수 있는 정보가 전달되지 않고 있었기 때문에 다른 방식을 고민할 필요가 있었고, 이를 위해 알림톡을 전송할 때 우리측에서 지정하는 `REFKEY` 를 활용할 계획을 세웠다.

이를 위해 다음과 같은 절차를 세우고 진행하고자 하였다.

1. 1번 알림톡 전송을 요청하며 `REFKEY` 를 키로 템플릿명을 값으로 Redis에 저장한다.
2. 비즈뿌리오에서 PUSH 알림으로 전송되는 알림톡 결과를 수신하면 전송 성공 여부 판단 후 성공시 Redis에서 `REFKEY` 를 기반으로 값을 가져온다.
3. Redis에서 가져온 값과 템플릿명을 비교하여 이후 전송될 알림톡이 존재하는 템플릿이면 다음 알림톡 요청을 진행한다.

여기서 Redis를 활용할 계획을 세운 이유는, 기존에 비즈뿌리오의 토큰을 저장하기 위해서 그리고 관리자 페이지의 토큰을 저장하기 위해 이미 Redis를 사용하고 있었고, Redis는 TTL을 지원하기 때문에 짧은 시간저장과 빠른 처리를 보장할 수 있을 것이라고 생각했기 때문이다.

이를 위해 다음과 같이 코드를 수정하게 되었다.

```java
@RequiredArgsConstructor
@Component
public class BizppurioTeacherMessage {
    private final BizppurioMapper bizppurioMapper;
    private final BizppurioSend bizppurioSend;
    private static final String COUNSEL = "COUNSEL";

    public void counselStartAndPhotoSubmit(Teacher teacher) {
        bizppurioSend.sendMessageWithExceptionHandling(() -> {
                    CommonRequest request = bizppurioMapper.mapToCounselStart(teacher);
                    redisRepository.setValues(request.refkey(), COUNSEL, Duration.ofMinutes(1));
                    return request;
                })
                .subscribe();
    }
    
    private Mono<Void> photoSubmit(Teacher teacher) {
        return bizppurioSend.sendMessageWithExceptionHandling(() -> bizppurioMapper.mapToApplyPhotoSubmit(teacher));
    }
    ...
}

@RequiredArgsConstructor
@Slf4j
@Component
public class BizppurioSend {
		...
		
    protected Mono<Void> sendMessageWithExceptionHandling(Supplier<CommonRequest> messageSupplier) {
        CommonRequest commonRequest = messageSupplier.get();
        String accessToken = bizppurioAuth.getAuth();
        String request;
        try {
            request = objectMapper.writeValueAsString(commonRequest);
        } catch (Exception e) {
            log.error("Json 직렬화 실패");
            return Mono.empty();
        }
        log.info("알림톡 발송 : {} \n{}", commonRequest.to(), commonRequest.content().at());

        return webClient.post()
                .uri(messageUrl)
                .headers(h -> h.setContentType(APPLICATION_JSON))
                .headers(h -> h.setBearerAuth(accessToken))
                .bodyValue(request)
                .retrieve()
                // 200이 아닐 경우 예외 발생
                .onStatus(HttpStatusCode::isError, response ->
                    response.bodyToMono(String.class)
                            .map(errorBody -> new IllegalArgumentException("비즈뿌리오 알림톡 전송 API 요청 실패: " + errorBody))
                )
                .bodyToMono(MessageResponse.class)
                .doOnSubscribe(subscription -> log.info("알림톡 요청 시작"))
                .doOnSuccess(response -> log.info("알림톡 초기 요청 성공"))
                .doOnError(error -> {
                    log.error("알림톡 초기 요청 실패 : {}", error.getMessage());
                    discordWebhookSend.sendAlarmTalkError(commonRequest.to(), commonRequest.content().at().getMessage(), error.getMessage());
                })
                .then();
    }
    
    public void checkByWebHook(MessageStatusRequest request) {
        if (request.RESULT().equals(SUCCESS)) {
            log.info("{} 에 대한 알림톡 전송 완료", request.PHONE());
            return;
        }
        log.error("{} 에 대한 알림톡 전송 실패, MessageKey : {} ResultCode : {}",  request.PHONE(), request.CMSGID(), request.RESULT());
        discordWebhookSend.sendAlarmTalkError(request.PHONE(), request.CMSGID(), request.RESULT());
    }
}
```

```java
@RestController
@RequiredArgsConstructor
@RequestMapping("/bizppurio")
public class BizppurioController {
    private final BizppurioSend bizppurioSend;
    private final BizppurioCheckStep bizppurioCheckStep;

    @PostMapping("/result/webhook")
    public void resultWebHook(@RequestBody MessageStatusRequest request) {
        bizppurioSend.checkByWebHook(request);
        bizppurioCheckStep.checkNextStep(request);
    }
}

@Component
@RequiredArgsConstructor
public class BizppurioCheckStep {
    private final RedisRepository redisRepository;
    private final BizppurioTeacherMessage teacherMessage;

    private static final String COUNSEL = "COUNSEL";

    public void checkNextStep(MessageStatusRequest request) {
        getCacheValue(request.REFKEY()).ifPresent(stepValue -> processNextStep(stepValue, request));
    }

    private Optional<String> getCacheValue(String refKey) {
        return redisRepository.getValues(refKey);
    }

    private void processNextStep(String stepValue, MessageStatusRequest request) {
        if (COUNSEL.equals(stepValue)) {
            teacherMessage.photoSubmit(request.PHONE());
            redisRepository.deleteValues(request.REFKEY());
        }
    }
}
```

위와 같이 코드를 수정하는 것을 통해 알림톡의 순서를 보장하며 이전 알림톡이 전송되지 않으면 이후 알림톡도 전송되지 않는다는 목적을 달성할 수 있었다.

![image.png](/static/images/alarm1.png)

마찬가지로, 이러한 방식을 활용하게 된다면 만약 오류가 발생했을 때 `REFKEY` 를 활용해 어떤 알림톡 템플릿에서 오류가 발생했는지 명확히 파악하여 CS담당에게 알림을 전송할 수 있도록 기존의 시스템을 보완할 수 있을 것으로 보인다.