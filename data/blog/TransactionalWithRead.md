---
title: 조회만 하는 경우 @Transactional이 필요할까?
date: '2024-04-09'
tags: ['spring boot', 'Transaction']
draft: false
summary: 조회만 하는 경우 @Transactional이 필요할까?
---

## @Transactional 과 @Transactional(readOnly=true)

위의 두개가 존재한다는 사실과 기본적인 차이점은 대부분이 알고 있다.

적당히 다시 한번 살피고 넘어가자

- `@Transactional` 이것은 어노테이션을 통한 선언적 트랜잭션으로 클래스 혹은 메소드에 트랜잭션이 적용된 프록시 객체를 생성해주며, 이를 통해 트랜잭션을 적용시켜 Commit 혹은 Rollback을 수행한다.
- `@Transactional(readOnly=true)` 이것은 속성이 적용되지 않은 트랜잭션과 다르게, JPA 세션 플래시 모드를 **MANUAL**로 설정한다.
    
    <aside>
    ❓ MANUAL 모드란?
    
    트랜잭션 내에서 사용자가 수동으로 flush를 호출하지 않는 이상 flush의 자동 수행을 진행하지 않는 모드이다.
    
    따라서 해당 트랜잭션 내부에서 수정사항이 있더라도 DB에 적용되지 않는다.
    
    </aside>
    

## @Transactional(readOnly=true) 는 왜 사용할까

습관적으로 사용하던 도중, 순간 조회만 하는 경우 그럼 `@Transactional` 자체를 넣지 않으면 되지 않는가? 라는 생각이 들었다.

굳이 readOnly라는 속성을 사용하는 이유가 무엇일까.

### @Transactional을 사용하는 이유는 무엇일까

우선, 근본적으로 `@Transactional` 을 사용하는 이유는 무엇일까.

**스프링 컨테이너는 트랜잭션 범위의 영속성 컨텍스트 전략을 기본으로 사용하고 있다.**

이는 트랜잭션을 시작할 때 영속성 컨텍스트를 시작하고, 트랜잭션이 종료될 때 영속성 컨텍스트가 종료된다는 뜻이다.

그리고, 같은 트랜잭션 안에서는 항상 같은 영속성 컨텍스트에 접근한다.

 따라서 `@Transactional` 없이 지연 로딩을 사용하게 된다면 `LazyInitializationException` 이 발생할 수도 있다.

또한, 더티체킹 등등과 같은 이유로 비즈니스 로직에는 `@Transactional` 을 사용하게 된다.

<aside>
❗ 사실, 따로 설정을 하지 않았다면 지연 로딩에서 `LazyInitializationException` 가 발생할 확률은 적다.

왜냐하면, SpringBoot는 기본적으로 OSIV가 활성화되어 있기 때문이다.

그래서 위에서 발생할 수도 있다고 한 것이다.

</aside>

### OSIV?

OSIV가 무엇인가? Open Session In View 의 약자로, HTTP 요청마다 API 응답이 끝날 때 까지 영속성 컨텍스트와 데이터베이스 컨넥션을 유지하는 것이다.

이를 통해 `@Transactional` 없이 지연로딩을 사용할 수 있게 된다.

하지만, OSIV를 false로 변경하게 되면 위에서 말한 예외가 발생하게 된다.

### @Transactional(readOnly=true)는 왜 사용할까

그럼 OSIV에 대한 설정도 하지 않았고, 조회만 하는 로직이라면 정말 `@Transactional` 이 필요 없지 않을까?

틀린 말은 아니라고 생각한다.

하지만, 아마 동시성 이슈를 생각하지 않아도 되는 단순 조회만 하는 서비스 계층은 많이 없을 것이고 확장성과 유지보수성을 생각하면 `@Transactional(readOnly=true)` 는 넣어주는 것이 좋다고 생각한다.

왜냐하면 트랜잭션 자체를 삭제하는 것과 `@Transactional(readOnly=true)` 모두 영속성 컨텍스트를 플러시 하지 않기 때문에 스냅샷 비교와 같은 무거운 동작은 하지 않아서 성능이 향상될 수 있고, 트랜잭션 자체를 삭제해서 트랜잭션에 대한 과정이 사라지는 것에서 오는 성능 향상은 매우 미비할 것이기 때문이다.

또한 `@Scheduled` 와 같이 내부에서 동작하는 경우 HTTP 요청이 아니기 때문에 OSIV가 동작하지 않아서 지연로딩을 사용하는 경우 위에서 언급한 예외가 발생하게 된다.

따라서 이 또한 `Transactional(readOnly=true)` 를 사용하는 것이 좋은 이유가 되기도 한다.

휴먼 에러를 미리 방지하는 것이 좋지 않을까.

### @Transactional(readOnly=true)의 성능 향상

트랜잭션을 읽기 전용으로 설정하게 되면 해당 메소드가 데이터를 읽기만 한다는 것을 DB에 알려줘 쿼리 및 캐싱을 최적화 할 수 있다고 한다.

또한 위에서 언급한 것과 같이 플러시를 수행하지 않기 때문에 스냅샷 저장과 같은 무거운 동작을 하지 않는 것 또한 이유가 되기도 한다.