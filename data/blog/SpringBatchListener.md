---
title: 스프링 배치 이벤트 리스너
date: '2024-05-03'
tags: ['spring batch']
draft: false
summary: 스프링 배치 이벤트 리스너에 대해서
---

Listener는 배치 흐름 중 Job, Step, Chunk 단계의 실행 전후에 발생하는 이벤트를 받아 용도에 맞게 활용할 수 있도록 제공하는 인터셉터 개념의 클래스로 각 단계별 로그기록을 남기거나 소요된 시간을 계산하거나 실행 상태 정보들을 참조 및 조회할 수 있다.

이벤트를 받기 위해서는 Listener를 등록해야 하며 등록은 API 설정에서 각 단계별로 지정할 수 있다.

### Listener

- Job
    - JobExecutionListener : Job 실행 전후
- Step
    - StepExecutionListener : Step 실행 전후
    - ChunkListener : Chunk 실행 전후 (Tasklet 실행 전후), 오류 시점
    - ItemReadeListener : ItemReader실행 전후, 오류 시점, item이 null일 경우 호출되지 않음
    - ItemProcessListener : ItemProcessor 실행 전후, 오류 시점, item이 null인 경우 호출되지 않음
    - ItemWriterListener : ItemWriter 실행 전후, 오류 시점, item이 null인 경우 호출되지 않음
- SkipListener : 읽기 쓰기 처리 Skip 실행 시점, Item처리가 Skip될 경우 Skip된 Item을 추적함
- RetryListener : Retry 시작, 종료, 에러 시점

## 구현 방식

### 어노테이션 방식

`@BeforeStep` `@AfterStep` 과 같이 어노테이션을 붙이고 사용하는 방식이다.

### 인터페이스 방식

`StepExecutionListener` 와 같은 인터페이스를 직접 구현하여 사용하는 방식이다.

### JobExecutionListener / StepExecutionListener

모두 성공 여부와 상관 없이 호출되며 JobExecution혹은 StepExecution을 통해 성공 여부를 알 수 있다.

```java
public class AnnotationJobListener {
    @BeforeJob
    public void beforeJob(JobExecution jobExecution) {
        System.out.println("job is start");
        System.out.println("jobName : " + jobExecution.getJobInstance().getJobName());
    }

    @AfterJob
    public void afterJob(JobExecution jobExecution) {
        LocalDateTime startTime = jobExecution.getStartTime();
        LocalDateTime endTime = jobExecution.getEndTime();
        long millis = Duration.between(startTime, endTime).toMillis();

        System.out.println("총 소요시간 : " + millis);
    }
}

public class JobListener implements JobExecutionListener {
    @Override
    public void beforeJob(JobExecution jobExecution) {
        System.out.println("job is start");
        System.out.println("jobName : " + jobExecution.getJobInstance().getJobName());
    }

    @Override
    public void afterJob(JobExecution jobExecution) {
        LocalDateTime startTime = jobExecution.getStartTime();
        LocalDateTime endTime = jobExecution.getEndTime();
        long millis = Duration.between(startTime, endTime).toMillis();

        System.out.println("총 소요시간 : " + millis);
    }
}
```

이런식으로 JobExecutionListener를 사용할 수 있으며

```java
public class AnnotationStepListener {
    @BeforeStep
    public void beforeStep(StepExecution stepExecution) {
        String stepName = stepExecution.getStepName();
        System.out.println("stepName : " + stepName);
    }

    @AfterStep
    public ExitStatus afterStep(StepExecution stepExecution) {
        ExitStatus exitStatus = stepExecution.getExitStatus();
        BatchStatus status = stepExecution.getStatus();
        System.out.println("exit : " + exitStatus + " status : " + status);
        return ExitStatus.COMPLETED;
    }
}

public class StepListener implements StepExecutionListener {
    @Override
    public void beforeStep(StepExecution stepExecution) {
        String stepName = stepExecution.getStepName();
        System.out.println("stepName : " + stepName);
    }

    @Override
    public ExitStatus afterStep(StepExecution stepExecution) {
        ExitStatus exitStatus = stepExecution.getExitStatus();
        BatchStatus status = stepExecution.getStatus();
        System.out.println("exit : " + exitStatus + " status : " + status);
        return ExitStatus.COMPLETED;
    }
}
```

이런식으로 StepExecutionListener를 사용할 수 있다.

### ChunkListener / ItemReaderListener / ItemProcessorListener / ItemWriterListenter

![Untitled](/static/images/batch/batch73.png)

![Untitled](/static/images/batch/batch74.png)

이렇게 만들어서 사용할 수 있다.

물론 이 또한 어노테이션을 사용하여 만드는 것 또한 가능하다.

## SkipListener **/** RetryListener

### SkipListener

![Untitled](/static/images/batch/batch75.png)

이 경우 마찬가지로 어노테이션 방식과 인터페이스 구현 방식 모두 가능하다.

### RetryListener

![Untitled](/static/images/batch/batch76.png)
