---
title: Spring AOP
date: '2023-08-20'
tags: ['Spring boot', '기술']
draft: false
summary: Spring AOP에 대해
---
## AOP란?

**Aspect Oriented Programming**의 약자로 관점 지향 프로그램이라고 부른다.

AOP는 높은 응집도와 관련되어 있다.

**→ Spring 의 DI가 어플리케이션 모듈간의 결합도를 낮춘다면 AOP는 응집도를 높이는 것!**

![Alt text](/static/images/aop/aop1.png)

위와 같이 서비스들의 비즈니스 메소드들의 복잡한 코드들 중 핵심 로직은 얼마 없고 대부분은 트랜잭션, 로깅, 인증 등등이 차지할 것인데 그러한 핵심 로직이 아니지만 꼭 필요하고 공통화 할 수 있는 부분을 따로 빼서 관리하는 것이다.

## AOP 적용 방식

AOP 적용 방식은 크게 3가지가 있다고 한다.

- **컴파일 시점**
    - .java 파일을 컴파일러를 통해 .class 로 만드는 시점에 부가 기능 로직을 추가하는 방식
    - 모든 지점에 적용
    - AspectJ가 제공하는 특별한 컴파일러를 사용해야 하기 때문에 특별한 컴파일러가 필요하며 복잡한 점이 단점이 있다.
- **클래스 로딩 시점**
    - .class 파일을 JVM내부의 ClassLoader에 보관하기 전에 조작하여 부가 기능 로직을 추가하는 방식
    - 모든 지점에 적용 가능
    - 특별한 옵션과 ClassLoader조작기를 지정해야 하기 때문에 운영하기 어렵다.
- **런타임 시점 - 스프링이 사용하는 방식**
    - 컴파일이 끝나고 ClassLoader에 이미 다 올라가 자바가 실행된 다음에 동작하는 런타임 방식
    - 실제 대상 코드는 그대로 유지되고 프록시를 통해 부가 기능이 적용
    - 프록시는 메소드 오버라이딩 개념으로 동작하기 때문에 메소드에만 적용 가능하다.
        - 스프링 빈에만 AOP 적용 가능
    - 특별한 컴파일러, 복잡한 옵션, 등등이 필요 없이 스프링만 있으면 AOP를 적용할 수 있다는 장점이 있다.

## AOP 용어

![Alt text](/static/images/aop/aop2.png)

- **조인포인트(Join Point)**
    
    클라이언트가 호출하는 모든 비즈니스 메소드와 조인포인트 중에서 포인트컷 되기 때문에 **포인트 컷의 후보**로 생각할 수 있다.
    
    - **추상적인 개념** 으로 **Advice**가 적용될 수 있는 모든 위치를 한다.
    - ex) 메서드 실행 시점, 생성자 호출 시점, 필드 값 접근 시점 등등..
    - **스프링 AOP는 프록시 방식을 사용하므로 조인 포인트는 항상 메소드 실행 지점**
- **포인트 컷 (Point Cut)**
    
    **특정 조건에 의해 필터링된 조인 포인트**로 수많은 조인 포인트 중에 특정 메소드에만 공통기능을 수행시키기 위해서 사용한다.
    
    - 조인 포인트 중에서 **Advice**가 적용될 위치를 선별하는 기능
    - **스프링 AOP는 프록시 기반이기 때문에 조인 포인트가 메소드 실행 시점 뿐이 없고 포인트컷도 메소드 실행 시점만 가능**
- **타겟 (Target)**
    - Advice의 대상이 되는 객체
    - Point cut으로 결정
- **어드바이스 (Advice)**
    
    공통 기능의 코드, 독립된 클래스의 메소드로 작성하는 부분이다.
    
    - **실질적인 부가 기능 로직을 정의**하는 곳
    - **특정 조인 포인트에서 Aspect에 의해 취해지는 조치**
- **애스팩트 (Aspect)**
    
    **Point Cut + Advice (Advisor)** 로 어떤 Point Cut 메소드에 대해 어떤 Advice 메소드를 수행할 것인지 결정한다.
    
    - **@Aspect**와 같은 의미
- **위빙 (Weaving)**
    
    Point Cut으로 지정한 핵심 관심 메소드가 호출될 때 Advice에 해당하는 공통 메소드가 삽입되는 과정을 의미한다.
    
    이를 통해 비즈니스 메소드를 수정하지 않아도 횡단 관심에 해당하는 기능을 추가하거나 변경이 가능하다.
    
    - **Point Cut으로 결장한 타겟의 Join Point에 Advice를 적용하는 것**

## 동작

### @Aspect

```yaml
implementation 'org.springframework.boot:spring-boot-starter-aop'
```

위의 AOP 의존성을 추가하게 되면 `@Aspect` 를 보고 **Advisor**(**Point Cut + Advice )**로 변환하여 저장하는 작업을 수행한다.

![Alt text](/static/images/aop/aop3.png)

그렇다면 이는 어떻게 기존 로직에서 동작하게 될 것인가.

![Alt text](/static/images/aop/aop4.png)

1. 스프링 빈 대상이 되는 객체를 생성한다.(@Bean, 콤포넌트 스캔 대상)
2. 생성된 객체를 빈 저장소에 등록하기 직전에 빈 후처리기에 전달한다.
3. 모든 Advisor 빈을 조회한다.
4. **@Aspect Advisor 빌더 내부에 저장된 모든 Advisor를 조회한다.**
5. 3과 4에서 조회한 Advisor에 포함되어 있는 포인트컷을 통해 클래스와 메서드 정보를 매칭하면서 프록시를 적용할 대상인지 아닌지 판단합니다.
6. 여러 Advisor의 하나라도 포인트컷의 **조건을 만족한다면 프록시를 생성하고 프록시를 빈 저장소로 반환**합니다.
7. 만약 프록시 생성 대상이 **아니라면 들어온 빈 그대로 빈 저장소로 반환**합니다.
8. 빈 저장소는 객체를 받아서 빈으로 등록합니다.

하지만, 이때 `@Aspect` 는 Advisor를 쉽게 만들 수 있도록 해주는 것이지 컴포넌트 스캔의 대상이 되는 것은 아니기 때문에 반드시 스프링 빈으로 등록해야 한다.

### Adivce

Advice는 실질적으로 프록시에서 수행되는 로직을 정의하는 곳으로 스프링에서는 이에 관련된 5가지 어노테이션을 제공한다.

이 어노테이션은 메소드에 붙이는 것이며, 어노테이션의 종류에 따라 Point Cut에 지정된 메소드에 Advice가 실행되는 시점을 지정할 수 있다.

또한 속성 값으로 Point Cut을 지정할 수 있다.

---

### 추가 : JoinPoint 인터페이스

Advice 메소드를 의미있게 구현하기 위해서는 클라이언트가 호출한 비즈니스 메소드의 정보가 필요한데, 예를 들면 예외가 터졌을 때 예외가 발생한 메소드의 이름이 무엇인지, 혹은 어떤 메소드를 호출하였는지 등등을 알아야 할 것이다.

이럴때 JoinPoint 인터페이스가 제공하는 유용한 API가 있다.

- `Signature getSignature()`
    
    클라이언트가 호출한 메소드의 시그니처(리턴타입, 이름, 매개변수) 정보가 저장된 Signature 객체 리턴
    
    - 클래스, 메소드 등등을 얻을 수 있다.
- `Object getTarget()`
    
    클라이언트가 호출한 비즈니스 메소드를 포함한 비즈니스 객체 리턴
    
- `Object getArgs()`
    
    클라이언트가 메소드를 호출할 때 넘겨준 인자 목록을 Object 배열로 리턴
    

---

다시 돌아와서 **Advice의 어노테이션을** 살펴보면 다음과 같다.

- `@Around`
    - **뒤에 나올 4가지 애노테이션을 모두 포함하는 애노테이션**
    - 메서드 호출 전후 작업 명시 가능
    - 조인 포인트 실행 여부 선택 가능
    - **반환값 자체를 조작 가능**
    - **예외 자체를 조작 가능**
    - 조인 포인트를 여러번 실행 가능(재시도)
    
    `@Around` 만 예외적으로 `JoinPoint`가 아닌, `ProceedingJoinPoint`를 사용하는데, 여기는 `proceed()` 메소드가 추가된다.
    
    **이는 비즈니스 메소드로 진행하도록 하는 메소드로 이를 실행하기 이전에는 비즈니스 이전 처리할 코드를 수행하면 되는 것이다.**
    
    **그리고** `proceed()` **를 수행하게 되면 이는 비즈니스 메소드 호출 이후로 처리하면 된다.**
    
    **그리고** `proceed()` **가 반환하는 Object에는 비즈니스 메소드가 실행한 후의 결과를 가지고 있다.**
    
    `@Around` 이외의 나머지 어노테이션은 Target메소드를 호출하는 proceed를 명시하지 않아도 알아서 호출된다.
    
    ```java
    @Slf4j
    @Aspect
    public class AspectV6Advice {
    
        @Around("execution(* com.example.mvc.order..*(..))")
        public Object doTransaction(ProceedingJoinPoint joinPoint) throws Throwable {
            try {
                // @Before 수행
                log.info("[트랜잭션 시작] {}", joinPoint.getSignature());
                // @Before 종료
    
                // Target 메서드 호출
                Object result = joinPoint.proceed();
                // Target 메서드 종료
    
                // @AfterReturning 수행
                log.info("[트랜잭션 커밋] {}", joinPoint.getSignature());
                // @AfterReturning 종료
    
                // 값 반환
                return result;
            } catch (Exception e) {
                // @AfterThrowing 수행
                log.info("[트랜잭션 롤백] {}", joinPoint.getSignature());
                throw e;
                // @AfterThrowing 종료
            } finally {
                //@ After 수행
                log.info("[리소스 릴리즈] {}", joinPoint.getSignature());
                //@ After 종료
            }
        }
    }
    ```
    
- `@Before`
    - 조인 포인트 **실행 이전**에 실행(실제 target 메서드 수행 전에 실행)
    - 입력값 자체는 조작 불가능
    - 입력값의 내부에 setter같은 수정자가 있다면 내부값은 수정 가능
    
    ```java
    @Before("execution(* com.example.mvc.order..*(..))")
    public void doBefore(JoinPoint joinPoint) {
        log.info("[before] {}", joinPoint.getSignature());
    }
    ```
    
- `@AfterReturning`
    - 조인 포인트가 **정상 완료 후** 실행(실제 target 메서드 수행 완료 후 실행)
    - 반환값 자체는 조작 불가능
    - 반환값 내부에 setter같은 수정자가 있따면 내부값은 수정 가능
    
    이 경우 속성값으로 returning이 추가되는데, 이는 Target메소드가 반환하는 변수명을 적어주고, Advice 메소드의 인자로 변수명을 일치시켜준다면 해당 값을 가져와서 사용할 수 있다.
    
    ```java
    @AfterReturning(value = "execution(* com.example.mvc.order..*(..))", returning = "result")
    public void doReturn(JoinPoint joinPoint, Object result) {
        log.info("[return] {} return={}", joinPoint.getSignature(), result);
    }
    ```
    
- `@AfterThrowing`
    - 메서드가 **예외를 던지는 경우** 실행(실제 target 메서드가 예외를 던지는 경우 실행)
    - 예외 조작 불가능
    
    이 경우 속성값으로 throwing이 추가되며 Advice 메소드 인자에 변수명을 일치시키면서 받아 사용할 수 있다.
    
    ```java
    @AfterThrowing(value = "execution(* com.example.mvc.order..*(..))", throwing = "ex")
    public void doThrowing(JoinPoint joinPoint, Exception ex) {
        log.info("[ex] {} message={}", joinPoint.getSignature(), ex.getMessage());
    }
    ```
    
- `@After`
    - 조인 포인트의 정상, 예외 동작과 무관하계 실행(실제 target 메서드가 정상적 수행을 하든 예외를 던지든 **수행 이후에 무조건 실행**)

![Alt text](/static/images/aop/aop5.png)

```
Around -> Before -> AfterThrowing -> AfterReturning -> After -> Around
```

이러한 순서로 어노테이션이 동작한다고 한다.

### Advice 순서 지정

어노테이션의 동작 순서는 정의되어 있더라도, 같은 어노테이션에 대해서는 동작 순서가 지정되어 있지 않다보니 수동으로 지정해줄 수 있다.

`@Order` 어노테이션 지정을 `@Aspect` 지정 단위로 하게 되면 정해줄 수 있다고 한다.

즉, Advice 단위가 아닌 `@Aspect` 클래스 단위로만 지정이 가능한 것이다.

따라서 만약 하나의 `@Aspect` 안에 여러개의 Advice가 존재한다면 별도의 클래스로 분리해야 순서를 보장할 수 있다.

```java
@Slf4j
public class AspectV5Order {

    @Aspect
    @Order(1)
    public static class TxAspect {
        @Around("hello.aop.order.aop.Pointcuts.orderAndService()")
        public Object doTx(ProceedingJoinPoint joinPoint) throws Throwable {
            // 생략
        }
    }

    @Aspect
    @Order(2)
    public static class LogAspect {
        @Around("hello.aop.order.aop.Pointcuts.allOrder()")
        public Object doLog(ProceedingJoinPoint joinPoint) throws Throwable {
            // 생략
        }
    }    
}
```

### 포인트 컷 분리

```java
@Around("execution(* com.example.loggingkata.domain..controller..*(..))")
    public Object serviceLog(ProceedingJoinPoint joinPoint) throws Throwable {
        log.info("serviceLog: {}", joinPoint.getSignature().getName());
        return getObject(joinPoint);
    }
```

이렇게 내부에 PointCut을 명시해서 사용할 수 있지만 이를 분리하여 사용할 수 있다.

```java
@Aspect
public class PointCuts {

    // 언제 실행될 것인지 지정
    @Pointcut("execution(* com.example.loggingkata.domain..controller..*(..))")
    public void allController() {}
    @Pointcut("execution(* com.example.loggingkata.domain..service..*(..))")
    public void allService() {}
}
```

```java
@Aspect
@Slf4j
@Component
@RequiredArgsConstructor
public class LogAspect {
		...

    @Around("com.example.loggingkata.global.logging.aop.PointCuts.allService()")
    public Object serviceLog(ProceedingJoinPoint joinPoint) throws Throwable {
        log.info("serviceLog: {}", joinPoint.getSignature().getName());
        return getObject(joinPoint);
    }

    @Around("com.example.loggingkata.global.logging.aop.PointCuts.allController()")
    public Object controllerLog(ProceedingJoinPoint joinPoint) throws Throwable {
        log.info("controllerLog: {}", joinPoint.getSignature().getName());
        return getObject(joinPoint);
    }
```

이렇게 말이다.

그리고 여러개의 Pointcut을 사용하기 위해서

```java
@Around("allService() && allController()")
...
@Around("allService() || allController()")
...
```

이렇게 &&와 ||를 활용하여 작성하는것 또한 가능하다.

## 포인트 컷 지정

여러가지 방법이 있지만 `execution`과 `@annotaion` 을 주로 사용한다.

그중에서 

- **execution**
    
    ```java
    "execution(접근제어자? 반환타입 선언타입?메서드이름(파리미터) 예외?)"
    ```
    
    이렇게 지정할 수 있는데 ? 부분은 모두 생략할 수 있다.
    
    - 리턴타입 지정
        
        
        | 표현식 | 설명 |
        | --- | --- |
        | * | 모든 리턴타입 허용 |
        | void | 리턴타입이 void인 메소드만 |
        | !void | 리턴타입이 void가 아닌 메소드만 |
    - 패키지 지정
        
        
        | 표현식 | 설명 |
        | --- | --- |
        | com.custom.domain | 정확하게 com.custom.domain만 |
        | com.custom.domain.. | com.custom.domain 패키지로 로 시작하는 모든 패키지 |
    - 클래스 지정
        
        
        | 표현식 | 설명 |
        | --- | --- |
        | CustomClass | 정확하게 CustomClass 클래스만 |
        | *Class | 이름이 Class로 끝나는 모든 클래스 |
        | BaseObj+ | 클래스 이름 뒤에 ‘+’가 붙으면 해당 클래스로부터 파생된 모든 자식 클래스 선택
        인터페이스 이름 뒤에 ‘+’가 붙으면 해당 인터페이스를 구현한 모든 클래스 선택 |
    - 메소드 지정
        
        
        | 표현식 | 설명 |
        | --- | --- |
        | *(..) | 모든 메소드 선택 |
        | update*(..) | 메소드 명이 update로 시작하는 모든 메소드 |
    - 매개변수 지정
        
        
        | 표현식 | 설명 |
        | --- | --- |
        | (..) | 모든 매개변수 |
        | (*) | 반드시 1개의 매개변수를 가지는 메소드 |
        | (com.custom.domain.user.entity.User) | 매개변수로 User를 가지는 메소드만 선택
        무조건 풀패키지명이 들어가야 함 |
        | (!com.custom.domain.user.entity.User) | 매개변수로 User를 가지지 않는 메소드만 선택 |
        | (Integer,..) | 한개 이상의 매개변수를 가지되, 첫 매개변수의 타입은 Integer인 경우 |
        | (Integer, *) | 반드시 두개의 매개변수를 가지되, 첫 매개변수의 타입은 Integer인 경우 |
    
    위의 표에 내용을 조합하여 사용할 수 있다.
    
    **실제 사용 예시**
    
    ```java
    "execution(* com.example.loggingkata.domain..controller..*(..))"
    ```
    
    모든 반환형에 `com.example.loggingkata.domain` 패키지로 시작하는 모든 패키지에서 `controller` 패키지 하위의 모든 패키지와 클래스를 선택해서 매개변수 상관없이 모든 메소드를 선택하는 것이다.
    
- **@annotation**
    
    종종 사용되는 방식으로 이는 해당하는 어노테이션을 가지고 있는 경우를 지정하는 것이다.
    
    ```java
    @annotation(org.springframework.transaction.annotation.Transactional)
    ```
    
    위를 확인하면 실행 메소드 중에 `@Transactional` 어노테이션을 가지고 있는 조인 포인트를 말하는 것이다.
    

> 참고
> 
> 
> [https://velog.io/@backtony/Spring-AOP-총정리](https://velog.io/@backtony/Spring-AOP-%EC%B4%9D%EC%A0%95%EB%A6%AC)
> 
> https://sjh836.tistory.com/157
> 
> https://velog.io/@bimilless/JoinPoint
>