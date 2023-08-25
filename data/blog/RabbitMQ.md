---
title: RabbitMQ
date: '2023-08-26'
tags: ['Spring boot', 'MessageQueue', 'RabbitMQ', '기술']
draft: false
summary: RabbitMQ란 무엇인가
---
## RabbitMQ란?

AMQP를 구현한 오픈소스 메시지 브로커 시스템이다.

이는 Producer에서 consumer로 메시지를 전달할 때 중간에서 브로커 역할을 하는 것이다.

## AMQP란?

이는 클라이언트가 메시지 미들웨어 브로커와 통신할 수 있게 해주는 메시징 프로토콜이다.

```
													Broker
Producers -> [Exchange - Binding -> Queue] -> Consumers
```

메시지를 발행하는 **Producer** 에서 **Broker** 의 **Exchange** 로 메시지를 전달하면, **Binding이라는 규칙에** 의해 연결된 **Queue** **로 메시지를 복사**한다.

메시지를 받아가는 **Consumer** 에서는 **Broker의 Queue를 통해 메시지를 받아가서** 처리한다.

## 주요 개념

![Untitled](/static/images/mq/mq.png)

- **Producer** : 요청을 보내는 주체, 보내고자 하는 메시지를 Exchange에 publish한다.
- **Consumer** : Producer로부터 메시지를 받아 처리하는 주체
- **Exchange** : Producer로부터 전달받은 메시지를 어떤 queue로 보낼지 결정하는 장소로 4가지 타입이 있다.
- **Queue** : Consumer가 메시지를 Consume하기 전까지 보관하는 장소
- **Binding** : Exchange와 Queue를 연결하는 관계로 보통 사용자가 특정 Exchange가 특정 Queue를 Binding하도록 정의한다. (Fanout타입은 제외)

## Exchange 속성

![Untitled](/static/images/mq/mq1.png)

**Exchange**에는 위와 같은 속성이 있는데, 살펴보면 다음과 같다.

- **Name** : Exchange이름
- **Type** : 메시지 전달 방식
    - Direct : 라우팅 키가 정확하게 일치하는 큐에 메시지를 전달
        
        ![Untitled](/static/images/mq/direct.png)
        
    - Fanout : 바인딩된 모든 큐에 동일한 메시지를 전달
        
        ![Untitled](/static/images/mq/fanout.png)
        
    - Topic : 라우팅 키 패턴의 일치여부에 따라 메시지를 라우팅
        
        ![라우팅 키가 정확히 일치하지 않아 바인딩 X](/static/images/mq/topic1.png)
        
        라우팅 키가 정확히 일치하지 않아 바인딩 X
        
        ![animal.rabbit은 animal.* 혹은 # 에 속하기 때문에 모두 전달](/static/images/mq/topic2.png)
        
        animal.rabbit은 animal.* 혹은 # 에 속하기 때문에 모두 전달
        
        - • * : *를 사용하여 test.router.*라는 패턴을 생성하면 test.router.1, test.router.2와 같이 한 단어의 패턴이 일치하는 라우팅 키를 가진 큐에 메시지를 전달한다.
    - Headers : 큐 속성값의 headers 테이블을 이용해 라우팅 처리
        
        ![Untitled](/static/images/mq/header.png)
        
        - 헤더에 속해있는 key : value에 따라 일치하는 큐에 메시지 전달
- **Durability** : 브로커가 재시작 될 때 메시지가 남아있는지 여부
    - Durable : 남아있음
    - Transient : 브로커가 재시작되면 사라짐
- **Audo-delete** : 마지막 Queue 연결이 해제되면 삭제

## Queue 속성

![Untitled](/static/images/mq/mq4.png)

**Queue**는 위와 같은 속성이 있는데, 살펴보면 다음과 같다.

- **Name** : Queue 이름
- **Duabilitiy** : 브로커가 재시작될 때 메시지가 남아있는지 여부
- **Argument** : 메시지 TTL, Max Lenght 와 같은 추가 기능 명시