---
title: AOP를 이용한 로그처리
date: '2023-08-20'
tags: ['Spring boot', '기술', 'MongoDB']
draft: false
summary: AOP와 MongoDB를 통한 로그처리
---
## AOP

이전에 정리한 AOP를 활용하여 로그를 처리할 수 있다.

AOP는 핵심 로직과 부가 기능을 분리하여 어플리케이션 전체에 걸쳐 사용되는 부가 기능을 모듈화하여 재사용할 수 있도록 지원하는 것이라고 하였는데, **이를 사용하면 공통적인 로그처리를 분리하여 사용할 수 있다.**

## 로그 처리 방법

우선 어떤 방식을 통해 로그 처리를 진행할 것인지 살펴보면, service와 controller에서 진행되는 메소드에 대해 **INFO, WARN, ERROR 단계**로 처리하려고 한다.

AOP를 적용하여 각 Point Cut에 대하여 로그를 얻은 다음 해당 로그를 **MongoDB**에 저장할 것이다.

### 사전 작업

```java
@RequiredArgsConstructor
@Getter
@AllArgsConstructor
public class TraceStatus {
    private String threadId;
    private Long startTime;
    private String methodName;
}
```

로그에서 사용하기 위한 클래스를 하나 만들어 두도록 하자.

### 로그 처리 작성

```java
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import java.util.UUID;

@Component
@Slf4j
public class LogTrace {
    private static final String TRACE_ID = "TraceId";

    public TraceStatus start(String method) {
        String id = createTraceId();
        MDC.put(TRACE_ID, id);
        // MDC란 ThreadLocal을 이용해 각 스레드에서만 유지되는 정보입니다.
        long startTime = System.currentTimeMillis();
        log.info("[{}]{} === start" + id, method );
        return new TraceStatus(id, startTime, method);
    }

    public Integer end(TraceStatus traceStatus) { // 걸린 시간 로그 처리 및 오래걸리면 경고
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - traceStatus.getStartTime();
        if (executionTime > 1000) {
            log.warn("[{}]{} === execute time {}ms", traceStatus.getThreadId(),traceStatus.getMethodName(), executionTime);
        } else {
            log.info("[{}]{} === execute time {}ms", traceStatus.getThreadId(),traceStatus.getMethodName(), executionTime);
        }
        removeMdcContext();
        return (int)executionTime;
    }

    // 일단은 댕충 ClassCastException으로 처리 실제 사용할 경우 알맞게 처리
    public void apiException(ClassCastException e, TraceStatus traceStatus) {
        log.error("[{}]{} === API EXCEPTION [{}] {}", traceStatus.getThreadId(), traceStatus.getMethodName(), 500, e.getMessage());
        removeMdcContext();
    }

    public void exception(Exception e, TraceStatus traceStatus) {
        log.error("[{}]{} === Exception [{}] {}", traceStatus.getThreadId(), traceStatus.getMethodName(), 500, e.getMessage());
        removeMdcContext();
    }

    private String createTraceId() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    private void removeMdcContext() {
        MDC.remove(TRACE_ID);
    }
}
```

이렇게 어떤 메소드가 작동하는데 걸린 시간, 예외 등등에 대한 간단한 로그를 작성하기 위한 클래스를 생성해두자.

### PointCut 설정

Advice가 적용될 위치를 선별하기 위해서 PointCut을 설정해줘야 한다.

```java
import org.aspectj.lang.annotation.Pointcut;

public class PointCuts {
    // 언제 실행될 것인지 지정
    @Pointcut("execution(* com.example.loggingkata.domain..controller..*(..))")
    public void allController() {}
    @Pointcut("execution(* com.example.loggingkata.domain..service..*(..))")
    public void allService() {}
}
```

이렇게 모든 접근자에 대하여 com.example.loggingkata.domain 패키지 하위의 모든 패키지의 controller패키지에 대해 하위의 모든 패키지 속 클래스들을 지정하고 해당 클래스의 모든 메소드를 지정한 것이다.

### Aspect 및 Advice 작성

실질적으로 프록시에서 수행하게 되는 로직을 정의해야 한다.

```java
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

이렇게 위에서 정의한 **PointCut**을 불러다가 `@Around` 내부에서 지정할 수 있다.

이제 **Advice**를 정의하는 **Aspect**의 전체 코드를 살펴보도록 하자.

```java
import com.example.loggingkata.global.logging.dto.LogRequest;
import com.example.loggingkata.global.logging.service.LogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Slf4j
@Component
@RequiredArgsConstructor
public class LogAspect {
    private final LogTrace logTrace;
    private final LogService logService;

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

    private Object getObject(ProceedingJoinPoint joinPoint) throws Throwable {
        TraceStatus traceStatus = null;
        try {
            traceStatus = logTrace.start(joinPoint.getSignature().getDeclaringType() + " : " + joinPoint.getSignature().getName());
            Object result = joinPoint.proceed();
            Integer executionTime = logTrace.end(traceStatus);
            logService.save(new LogRequest(traceStatus.getThreadId(), executionTime, traceStatus.getMethodName(), null));
            return result;
        } catch (ClassCastException e) {
            if (traceStatus != null) {
                logTrace.apiException(e, traceStatus);
                logService.save(new LogRequest(traceStatus.getThreadId(), 0, traceStatus.getMethodName(), e.getMessage()));
            }
            throw e;
        }catch (Exception e) {
            if (traceStatus != null) {
                logTrace.exception(e, traceStatus);
                logService.save(new LogRequest(traceStatus.getThreadId(), 0, traceStatus.getMethodName(), e.getMessage()));
            }
            throw e;
        }
    }
}
```

간략하게 작성한 코드로, `ProceedingJoinPoint joinPoint` 를 매개변수로 받아서 내부에서 위에서 작성한 로그 처리 클래스를 호출하여 로그를 처리하고 해당 결과를 **MongoDB**로 저장하기 위해 전달하는 부분이다.

## MongoDB 저장

### log Documnet 생성

우선 Log를 저장하기 위한 Document를 하나 만들어야 한다.

```java
@Document(collection = "log")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Log {
    @Id
    private String id;
    private String logId;
    private Integer executeTime;
    private String methodName;
    private String exceptionMessage;
    private LogType logType;
    @Indexed(expireAfterSeconds = 60)
    private LocalDateTime logDate = LocalDateTime.now();

    @Builder
    public Log(String logId, Integer executeTime, String methodName, String exceptionMessage) {
        this.logId = logId;
        this.executeTime = executeTime;
        this.methodName = methodName;
        checkExceptionMessage(exceptionMessage);
    }

    private void checkExceptionMessage(String exceptionMessage){
        if(StringUtils.hasText(exceptionMessage)){
            this.logType = LogType.ERROR;
            this.exceptionMessage=exceptionMessage;
        }else{
            this.logType = LogType.INFO;
            this.exceptionMessage="";
        }
    }
}
```

위와 같이 만들어 두는데, 로그를 계속해서 저장하게 되면 너무 많은 용량이 쌓이기 때문에 시간을 `@Indexed(expireAfterSeconds = 60)` 이를 통해 일정 기간을 지정할 수 있다.

### LogRepository 생성

```java
@Repository
public interface LogRepository extends MongoRepository<Log, String> {
    List<Optional<Log>> findAllByLogType(String logType);
}
```

이렇게 Spring Data MongoDB를 통해 Repository를 생성해둔다.

### LogService 생성

```java
@Service
@Slf4j
@RequiredArgsConstructor
public class LogService {
    private final LogRepository logRepository;

    public void save(LogRequest logRequest) {
        log.info("log save");
        logRepository.save(logRequest.toEntity());
    }

    public List<String> getInfo() {
        List<Optional<Log>> allByLogType = logRepository.findAllByLogType(INFO.name());
        List<String> response = new ArrayList<>();
        for (Optional<Log> logInfo : allByLogType) {
            response.add(
                    LogResponse.from(logInfo.orElseThrow())
                    .toString()
            );
        }
        return response;
    }

    public List<String> getWarn() {
        List<Optional<Log>> allByLogType = logRepository.findAllByLogType(WARN.name());
        List<String> response = new ArrayList<>();
        for (Optional<Log> logInfo : allByLogType) {
            response.add(
                    LogResponse.from(logInfo.orElseThrow())
                            .toString()
            );
        }
        return response;
    }

    public List<String> getError() {
        List<Optional<Log>> allByLogType = logRepository.findAllByLogType(ERROR.name());
        List<String> response = new ArrayList<>();
        for (Optional<Log> logInfo : allByLogType) {
            response.add(
                    LogResponse.from(logInfo.orElseThrow())
                            .toString()
            );
        }
        return response;
    }
}
```

이렇게 Log를 저장하거나 원하는 조건의 Log를 조회할 수 있도록 Service를 구현한다.

### 로그 저장

다시 위에서 작성했던 **LogAspect** 클래스를 살펴보면 로그를 저장하는 부분이 있다.

```java
private Object getObject(ProceedingJoinPoint joinPoint) throws Throwable {
	TraceStatus traceStatus = null;
	try {
		traceStatus = logTrace.start(joinPoint.getSignature().getDeclaringType() + " : " + joinPoint.getSignature().getName());
		Object result = joinPoint.proceed();
		Integer executionTime = logTrace.end(traceStatus);
		logService.save(new LogRequest(traceStatus.getThreadId(), executionTime, traceStatus.getMethodName(), null));
		return result;
	} 
	catch (ClassCastException e) {
		if (traceStatus != null) {
			logTrace.apiException(e, traceStatus);
			logService.save(new LogRequest(traceStatus.getThreadId(), 0, traceStatus.getMethodName(), e.getMessage()));
		}
		throw e;
		}
	catch (Exception e) {
		if (traceStatus != null) {
			logTrace.exception(e, traceStatus);
			logService.save(new LogRequest(traceStatus.getThreadId(), 0, traceStatus.getMethodName(), e.getMessage()));
		}
		throw e;
	}
}
```

여기서 `logService.save()` 를 통해 얻어진 로그를 MongoDB에 저장하는 것을 확인할 수 있다.

이제 내부에서 Controller와 Service 로직이 동작하게 되면 AOP를 통해 로그가 MongoDB에 저장되게 될 것이다.

![Untitled](/static/images/aop/mongo1.png)

이제, INFO를 키워드로 검색하면 위와 같이 결과를 확인할 수 있다.