---
title: 프록시 내부 호출시 트랜잭션 미적용
date: '2024-03-02'
tags: ['Spring Boot', '기술']
draft: false
summary: 프록시 내부 호출시 트랜잭션 미적용 사례와 해결방법에 대해서 살펴보자
---
단적인 예와 함께 이야기 하고 넘어가도록 하자.

```java
public class Test {
	public void external() {
		internal();
	}
	
	@Transactional
	public void internal() {
		System.out.println("트랜잭션이 선언된 내부 메소드");
	}
}
```

언뜻 보면 internal 메소드에는 트랜잭션이 적용된 것 처럼 보일 수 있다.

하지만 사실은 트랜잭션이 적용되지 않았다.

이전의 게시물을 다시 살펴보면 [이전 게시물](https://www.ywj9811.vercel.app/blog/SpringBoot_Transaction_caution) 이와 같이 이 부분을 다룬적이 있다.

그럼에도 불구하고 왜 또 이 내용을 다루느냐.

내가 딱 이러한 실수를 저질렀기 때문이다.

어째서 적용되지 않는지 다시 짚어가면서 살펴보자.

## 프록시 내부 호출

`@Transactional` 을 사용하게 되면 스프링의 트랜잭션 AOP가 적용된다고 한다.

이 트랜잭션 AOP는 기본적으로 프록시 방식의 AOP를 사용하는데, 이를 통해 `@Transactional` 은 Spring AOP를 통해 프록시 객체를 생성하여 사용된다.

스프링에서 대상 객체를 직접 참조하지 않고, 프록시 객체를 사용하는 이유는 Aspect 클래스에서 제공하는 부가 기능을 사용하기 위해서라고 한다.

[스프링 트랜잭션 동작 원리 (@Transactional, AOP)](https://sasca37.tistory.com/267)

위의 블로그 내용을 참고하면 이해가 될 것이다.

어찌되었든 `@Transactional` 을 통해서 트랜잭션을 적용하려면 항상 프록시를 통해서 대상 객체를 호출해야 한다.

따라서 만약 프록시를 거치지 않고 직접 대상 객체를 호출하게 된다면 AOP가 적용되지 않고, 트랜잭션도 적용되지 않는다.

AOP를 적용하면 스프링은 대상 객체 대신에 프록시를 스프링 빈으로 등록하게 되는데, 이를 통해 스프링은 의존관계 주입시 항상 대상 객체 대신에 프록시 객체를 주입한다.

위와 같은 단계를 거치기 때문에 일반적인 상황에서는 대상 객체를 직접 호출하는 문제가 발생하지 않는다.

## 대상 객체의 내부에서 메소드 호출이 발생한다면?

**하지만 대상 객체의 내부의 트랜잭션이 선언되지 않은 메소드에서 트랜잭션이 선언된 메소드 호출을 하게 된다면** 프록시를 거치지 않고 대상 객체를 직접 호출하는 문제가 발생하게 된다.

즉, 메소드에 `@Transactional` 이 선언되어 있어도 트랜잭션이 적용되지 않는다.

## 해결

따라서 이를 해결하기 위해서는 트랜잭션이 선언된 메소드를 별도의 클래스로 분리 후 해당 클래스 객체를 의존성 주입 받고 이를 호출하게 된다면 프록시를 통해서 호출할 수 있게 되기에 해결할 수 있다.

## 사례

실제로 이러한 문제를 겪었기에 다시 작성하는 게시글이라고 했다.

어떤 상황에서 발생한 문제인지 확인을 해보도록 하자.

```java
@Scheduled(cron = "0 59 23 * * *", zone = "Asia/Seoul")
public void updateAutoCancel() {
    LocalDateTime now = LocalDateTime.now()
            .toLocalDate()
            .atStartOfDay();
    List<Mentoring> waitingMentorings = mentoringGetService.byStatusAndCreatedAt(WAITING, now);
    waitingMentorings.forEach(this::updateCancelWithAuto);
}

@Transactional
public void updateCancelWithAuto(Mentoring mentoring) {
    try {
        paymentManageUseCase.refundPayByUser(mentoring.getUser(), mentoring.getPayment().getOrderId());
        Mentoring cancelMentoring = mentoringGetService.byMentoringIdWithLazy(mentoring.getMentoringId());
        mentoringUpdateService.updateStatus(cancelMentoring, CANCEL);
        Refuse refuse = RefuseMapper.mapToRefuse(mentoring);
        refuseSaveService.save(refuse);
        log.info("mentoringId : {} 자동 취소", mentoring.getMentoringId());
    } catch (Exception ex) {
        log.error("mentoringId : {} 자동 취소 실패", mentoring.getMentoringId());
        log.error(ex.getMessage());
        slackErrorMessage.sendSlackError(mentoring, ex);
    }
}
```

나는 매일 밤 11시 59분에 위의 메소드를 동작시켜 자동으로 취소 시키고 환불을 진행하는 로직을 작성하고 있었다.

반복문 도중 하나가 실패했을 때 모두 롤백이 되는 상황을 방지하기 위해서 `updateAutoCancel` 에는 트랜잭션을 적용하지 않고, `updateCancelWithAuto` 에만 트랜잭션을 적용하고자 하였다.

그리고 테스트를 진행해보니 예상과 다르게 `paymentManageUseCase.refundPayByUser(mentoring.getUser(), mentoring.getPayment().getOrderId());` 여기서 진행되는 업데이트는 정상적으로 발생하지만 `mentoringUpdateService.updateStatus(cancelMentoring, CANCEL);` 가 동작하지 않는 모습을 확인했다.

JPA를 사용하고 있기에 DirtyCheck를 통해 update가 진행될 것이라고 생각했고, 이러한 DirtyCheck는 트랜잭션 단위로 스냅샷과 비교하여 변경이 있을 경우 update 쿼리가 발생한다고 알고있기에 로그를 확인해 보았다.

그 결과 payment에 대한 update쿼리는 보이지만 mentoring에 대한 update쿼리는 발생하지 않는 것을 확인했다.

하지만 이를 마주한 순간에 이해가 되지 않았다. 트랜잭션을 분명 선언했지만 트랜잭션이 적용되지 않는 이유를 알 수 없던 것이다.

이전에 관련된 내용을 정리할때는 트랜잭션에 대한 이해가 부족했고, 실제로 경우에 따라서 구분하여 사용하지 않았기에 제대로 된 정리가 안됐던 것이 화근이었다.

다시 알아보고 이에 대한 원인을 이해한 후 이를 고치게 되었다.

## 사례 해결

```java
@RequiredArgsConstructor
@Service
@Transactional
@Slf4j
public class MentoringRenewalUseCase {
    private final MentoringGetService mentoringGetService;
    private final MentoringUpdateService mentoringUpdateService;
    private final PaymentManageUseCase paymentManageUseCase;
    private final RefuseSaveService refuseSaveService;
    private final SalaryUpdateService salaryUpdateService;
    private final SalaryGetService salaryGetService;
    private final SlackErrorMessage slackErrorMessage;

    public void updateCancelWithAuto(Mentoring mentoring) {
        try {
            paymentManageUseCase.refundPayByUser(mentoring.getUser(), mentoring.getPayment().getOrderId());
            Mentoring cancelMentoring = mentoringGetService.byMentoringIdWithLazy(mentoring.getMentoringId());
            mentoringUpdateService.updateStatus(cancelMentoring, CANCEL);
            Refuse refuse = RefuseMapper.mapToRefuse(mentoring);
            refuseSaveService.save(refuse);
            log.info("mentoringId : {} 자동 취소", mentoring.getMentoringId());
        } catch (Exception ex) {
            log.error("mentoringId : {} 자동 취소 실패", mentoring.getMentoringId());
            log.error(ex.getMessage());
            slackErrorMessage.sendSlackError(mentoring, ex);
        }
    }
		
		...
}
```

이와 같이 분리를 하고, 

```java
@Scheduled(cron = "0 59 23 * * *", zone = "Asia/Seoul")
public void updateAutoCancel() {
    LocalDateTime now = LocalDateTime.now()
            .toLocalDate()
            .atStartOfDay();
    List<Mentoring> waitingMentorings = mentoringGetService.byStatusAndCreatedAt(WAITING, now);
    waitingMentorings.forEach(mentoringRenewalUseCase::updateCancelWithAuto);
	}
}
```

이렇게 수정을 하는 방식으로 해결하였다.

역시 한번 공부한 것으로 내것을 만들기는 어렵다… 더 자세히 공부하고 경험하며 내것으로 만들어야 겠다 😇

물론, 이 밖에 새로운 오류를 만나서 그것에 대해 공부하고 고치는 중이다..! 이 또한 트랜잭션 관련된 것으로 해당 오류는 이어서 정리하도록 하겠다