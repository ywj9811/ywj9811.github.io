---
title: 로그 서버 이슈와 운영 서버
date: '2024-01-13'
tags: ['Spring boot', '기술', 'ERROR']
draft: false
summary: 로그 서버의 이슈 발생과 운영 서버의 연쇄 작용 발생
---
## 로그 서버의 이슈가 운영 서버에 영향을 끼치는 이슈?

사실 운영 서버는 아니고 개발 서버에서 발생한 이슈이다. 😜

우선 나는 개발 서버의 API 응답 속도와 예외 발생과 같은 정보를 로그 서버에 전송하여 로그 서버에서는 MongoDB에 저장하고 있었다.

이 과정 속에서 개발 서버는 로그 서버의 RabbitMQ에 정보를 발행하고 로그 서버는 해당 채널을 구독하여 정보를 받아서 MongoDB에 저장하는 방식으로 동작을 한다.

![Untitled](/static/images/issue1.png)

이런식으로 동작한다.

### 문제 발생

**하지만 이때 로그 서버에 추가 작업을 하다가 서버가 터져버리는 일이 발생했다.**

![Untitled](/static/images/issue2.png)

이때 나는 로그 서버에 있는 RabbitMQ를 통해 메시지를 전송하고 있었는데, 로그 서버가 터져서 연결이 불가능한 상황이 생겼다.

하지만 개발 서버에 이를 대비한 조치가 되어있지 않았고, 개발 서버는 클라이언트의 요청을 처리하지 못하고 RabbitMQ와 연결을 무한으로 시도하는 일이 발생했다.

이로 인해서 들어오는 모든 요청들이 응답은 되지 않고 모두 연결을 시도하는 단계에서 진행하지 못해서 모든 쓰레드가 점유당하고 개발 서버도 연쇄적으로 정상 작동을 하지 못하는 문제가 발생했다.

### 해결책

우선, RabbitMQ와 연결하는 부분에 Timeout을 설정하여 특정 시간동안 연결이 실패하게 되면 더이상 연결을 시도하지 않고 예외를 발생시키고 넘어가도록 하였다.

그렇게 발생한 예외는 로그를 전송하는 부분에서 잡아서 Slack에 로그 서버와 연결이 실패되고 있다는 알림을 전송하여 빠르게 대처할 수 있도록 수정하였다.

```java
@Bean
public ConnectionFactory connectionFactory() {
    CachingConnectionFactory connectionFactory = new CachingConnectionFactory();
    connectionFactory.setHost(rabbitmqHost);
    connectionFactory.setPort(rabbitmqPort);
		// Timeout 설정
    connectionFactory.setConnectionTimeout(300);
    connectionFactory.setUsername(rabbitmqUsername);
    connectionFactory.setPassword(rabbitmqPassword);
    return connectionFactory;
}

public void save(LogRequest logRequest) throws IOException {
    try {
        log.info("log save");
        messageProducer.sendMessage(logRequest);
    } catch (Exception ex) {
        log.error("로그 서버 연결 실패");
        slackMessage.sendSlackLog(ex);
    }
}
```

이런식으로 수정하였다.

![Untitled](/static/images/issue3.png)

![Untitled](/static/images/issue4.png)

**그 결과 위와 같은 방식으로 진행되게 되며, 만약 연결이 실패하는 상황이 발생하면 Slack에 로그 서버와 연결이 실패되고 있다는 알림을 보내게 되고 기존의 서버는 더이상 연결을 시도하지 않고 정상적으로 동작하게 된다.**

### 개선할 부분

하지만 이러한 대처에는 불안정한 부분이 존재한다.

물론 기존의 로그 서버가 다운되는 상황에 클라이언트와 통신하는 본 서버가 연쇄적으로 다운되는 문제는 해결되었지만 로그 서버의 문제를 해결하기 전까지 발생하는 로그에 대해서 유실이 발생하게 된다.

이를 해결하기 위해서 그 시점에 발생하는 로그는 개발 서버 혹은 운영 서버에 따로 저장을 해서 이후에 처리하는 등 방식이 필요할 것 같다.