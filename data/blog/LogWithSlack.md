---
title: 예외 발생시 Slack에 Log 남기기
date: '2023-05-13'
tags: ['SPRING-BOOT', '기술']
draft: false
summary: 예외가 발생하면 Log를 Slack에 날려보자
---

프로젝트를 진행하며 아직 로그에 대해서 처리를 하지 않고 있었는데, 프론트에서 확인해달라는 말이 올 때 마다 직접 서버에서 로그를 확인하며 처리했다.

하지만, 언제까지 이렇게 처리할 수는 없으니 방법을 몇가지 생각해 보았다.

**로그를 S3에 저장할까, DB에 저장을 할까… 그러다가 기존에 사용하던 슬랙에 예외가 발생하면 로그를 찍게 만들면 좋지 않을까 싶어 시도하게 되었다.**

→ 물론 필요하게 된다면 S3 와 같은 방식도 추가할 생각이다.

그러면 어떻게 진행해야 할까, 하나씩 알아보도록 하자.

## 필요한 라이브러리 다운로드

**mavenrepository** 사이트 들어가서 다운 받으면 되는데, Slack API Client라고 검색하면 된다.

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F3b0c3271-3883-4418-a830-d6feaaf9b7d7%2FUntitled.png?table=block&id=5dc91eb9-6346-42ec-8b6e-2e32e29d5160&spaceId=ed58f7c6-46bb-48c4-829a-b24be3b7faa2&width=1920&userId=db5d5977-127f-463d-b91b-77eec4b05d2d&cache=v2)

여기서 버전 맞춰서 다운 받으면 된다. 나는 제일 많이 사용하기도 하고 가장 최신 버전인 1.29.2 버전을 받았다.

그대로 `**build.gradle**` 에 추가 하고 이 부분은 단순한 복붙이니 넘어가도록 하자.

## Slack에서 WebHook 설정

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fb6dbe82b-c0b8-4212-9e16-c0c48c78feae%2FUntitled.png?table=block&id=cbac2bed-399a-42bc-a91b-4504d40db645&spaceId=ed58f7c6-46bb-48c4-829a-b24be3b7faa2&width=1920&userId=db5d5977-127f-463d-b91b-77eec4b05d2d&cache=v2)

이렇게 슬랙에서 WebHook 검색해서 Incomming Webhook을 원하는 채널에 추가하도록 하자.

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fed7674c0-66a6-43b2-9ac7-425de71cf87a%2FUntitled.png?table=block&id=d0cfe868-84d8-45d5-b2fc-3318c0cf1047&spaceId=ed58f7c6-46bb-48c4-829a-b24be3b7faa2&width=1920&userId=db5d5977-127f-463d-b91b-77eec4b05d2d&cache=v2)

그러면 이러한 화면을 확인할 수 있는데 (현재 이미 추가한 화면이라 약간 다를 수 있다.)

**중요한건 이 웹후크 URL** 이다.

이 URL을 나중에 `application.yml` 에 넣어서 사용할 예정이니 잘 가지고 가자.

슬랙에서 예시 코드를 제공해 주고 있으니, POST 방식으로 해당 코드를 사용해서 연결이 잘 되고 있는지 한번 확인해봐도 좋을 것이다.

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F9fcdc31d-5ed4-4b24-8ed9-5be61c5da3e0%2FUntitled.png?table=block&id=c9baf6a3-5525-4b16-8bac-93e0dabb6caa&spaceId=ed58f7c6-46bb-48c4-829a-b24be3b7faa2&width=1920&userId=db5d5977-127f-463d-b91b-77eec4b05d2d&cache=v2)

테스트 해보면 이렇게 날아온다.

여기까지 확인하면 이제 연동했을 때 아마 문제 없이 진행할 수 있을 것이다.

## 설정 추가

이제 아까 복사한 웹훅 URL을 `application.yml` 에 추가하도록 하자.

```yaml
slack:
	webhook:
		url: ${웹훅URL}
```

이제 실제로 코드를 작성할 때는 `application.yml`에 작성한 이 값을 `@Value` 를 통해서 가져올 것이다.

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F346aca2a-fd1d-49c4-ae27-b115424f88e0%2FUntitled.png?table=block&id=0491c0f2-7780-4c76-a295-47685ef378ce&spaceId=ed58f7c6-46bb-48c4-829a-b24be3b7faa2&width=1920&userId=db5d5977-127f-463d-b91b-77eec4b05d2d&cache=v2)

이는 Slack SDK for Java 홈페이지 [https://slack.dev/java-slack-sdk/guides/web-api-basics](https://slack.dev/java-slack-sdk/guides/web-api-basics) 여기서 제공해주는 예제 코드인데, 보면 Slack 객체를 생성해서 `.send()` 를 사용하는 모습을 볼 수 있다.

물론 webhookUrl의 경우 우리는 `@Value` 를 사용할 것이다. 스프링 부트가 제공해주니까ㅎ

대충 이렇게 알아 보았으니, 실제로 코드를 작성한 부분을 살펴보도록 하자.

## 구현

나는 `@RestControllerAdvice` 를 통해 전역에서 예외처리를 하고 있다.

따라서 여기서 로그를 슬랙에 보내주는 작업을 할 예정이다.

```java
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    private final Slack slackClient = Slack.getInstance();
    private static final String LOG_FORMAT = "Class : {}, Code : {}, Message : {}";

    @Value("${slack.webhook.url}")
    private String webHookUrl;

		...
		...

}
```

이렇게 Slack 객체를 주입 받고, webHookUrl 또한 받아준다.

그러면 이제 실제로 슬랙에 전송하기 위한 코드를 작성해야 하는데, 위에서 본 예제 코드처럼 작성하게 되면 너무 안이쁘다…

가독성 또한 떨어진다.

왜냐하면 단순하게 text로만 전송이 되니까 말이다.

[https://api.slack.com/reference/messaging/attachments#example](https://api.slack.com/reference/messaging/attachments#example) 이 Slack에서 제시하는 예제를 참고하면 더 자세하게 볼 수 있을 것이다.

이전에 보여준 예제 코드와는 많이 다르게 훨신 다양하게 꾸밀 수 있도록 제공해주고 있다.

작성하기에 앞서 크게 몇가지 개념을 알아두고 작성하도록 하자.

- **Attachment**
- **Field**

이렇게 두가지의 기능을 Slack에서 제공하고 있는데 매우 유용하다. 그렇다면 이것은 무엇일까?

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fae652eb2-ea8e-4a44-af55-363b961d1c2c%2FUntitled.png?table=block&id=7178c5e9-7edf-4351-89d1-7752ff5f747e&spaceId=ed58f7c6-46bb-48c4-829a-b24be3b7faa2&width=1920&userId=db5d5977-127f-463d-b91b-77eec4b05d2d&cache=v2)

(테스트 겸 로컬에서 한번 발생시켜 보았다)

여기서 빨간 라인에 포함된 부분이 **Attachment**이고
RequestIP, Method, RequestURL, ErrorCode, 등등과 같은 부분이 **Field**이다.

이제 전체 코드를 확인해 보도록 하자.

```java
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    private final Slack slackClient = Slack.getInstance();
    private static final String LOG_FORMAT = "Class : {}, Code : {}, Message : {}";

    @Value("${slack.webhook.url}")
    private String webHookUrl;

		...
		...

		private void sendSlackAlertErrorLog(Exception e, String errorCode, String stackTrace, HttpServletRequest request) {
        try {
            slackClient.send(webHookUrl, Payload.builder()
                    .text("서버 에러 발생!! 백엔드팀 확인 요망")
                    .attachments(
                            List.of(generateSlackAttachment(e, errorCode, stackTrace, request))
                    )
                    .build());
        } catch (IOException slackError) {
            log.error("Slack 통신 에러 발생");
        }
    }

    //attach 생성 -> Field를 리스트로 담자
    private Attachment generateSlackAttachment(Exception e, String errorCode, String stackTrace, HttpServletRequest request) throws IOException {
        String requestTime = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:SS").format(LocalDateTime.now());
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null)
            ip = request.getRemoteAddr();
        return Attachment.builder()
                .color("ff0000")
                .title(requestTime + "에 발생한 에러 로그")
                .fields(List.of(
                        generateSlackField("Request IP", ip),
                        generateSlackField("Method", request.getMethod()),
                        generateSlackField("Request URL", String.valueOf(request.getRequestURL())),
                        generateSlackField("Error Code", errorCode),
                        generateSlackField("Error Message", e.getMessage()),
                        generateSlackField("StackTrace", stackTrace)
                ))
                .build();
    }

    // Field 생성 메서드
    private Field generateSlackField(String title, String value) {
        return Field.builder()
                .title(title)
                .value(value)
                .valueShortEnough(false)
                .build();
    }

    private String getStackTraceAsString(Exception e) {
        StringWriter sw = new StringWriter();
        e.printStackTrace(new PrintWriter(sw));
        return sw.toString();
    }

}
```

이렇게 확인해보면, `Attachment.builder()` 에 `generateSlackField()` 를 통해 **Field**를 만들어서 하나씩 추가해주고 있다.

이렇게 원하는 필드를 넣어서 총 합인 **Attachment**를 만들어서 사용하면 된다.

```java
slackClient.send(webHookUrl, Payload.builder()
                    .text("서버 에러 발생!! 백엔드팀 확인 요망")
                    .attachments(
                            List.of(generateSlackAttachment(e, errorCode, stackTrace, request))
                    )
                    .build());
```

그러면 이 부분을 통해서 해당 **Attachment**를 가져와서 슬랙으로 전송하게 되는 것이다.

그러면 이제 `sendSlackAlertErrorLog()` 라는 슬랙에 로그를 전송할 수 있는 메소드가 생겼고, **예외를 처리하는 부분에서 로그를 남길 필요가 있는 부분에 추가하면 해당 예외의 경우 로그가 날아가게 될 것**이다.

> 참고 : https://kth990303.tistory.com/438
