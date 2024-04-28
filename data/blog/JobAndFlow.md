---
title: Job and Flow
date: '2024-04-23'
tags: ['spring batch']
draft: false
summary: 스프링 배치 Job and Flow
---
## FlowJob

Step을 순차적으로만 구성하는 것이 아닌, 특정한 상태에 따라 흐름을 전환하도록 구성할 수 있으며 FlowJobBuilder에 의해 생성된다.

- Step이 실패하더라도 Job은 실패하지 않아야 하는 경우
- Step이 성공하였을 때 다음에 실행해야 할 Step을 구분해서 실행해야 하는 경우
- 특정 Step은 전혀 실행되지 않게 구성해야 하는 경우

→ SimpleJob 에서는 불가능하다.

Flow와 Job의 흐름은 구성하는데만 관여하고 실제 비즈니스 로직은 Step에서 이루어진다.

내부에적으로 SimpleFlow 객체를 포함하고 있으며 Job 실행시 호출된다.

![Untitled](/static/images/batch/batch13.png)

위와 같은 흐름의 차이가 존재한다.

![Untitled](/static/images/batch/batch14.png)

- Flow : 흐름을 정의하는 역할
    - `start()` , `from()` , `next()`
- Transition : 조건에 따라 흐름을 전환시키는 역할
    - `on()` , `to()` , `stop()/fail()/end()/stopAndRestart()`

따라서 전체적인 흐름은 아래와 같이 진행된다.

![Untitled](/static/images/batch/batch15.png)

단순한 예로 아래와 같이 작성할 수 있다.

```java
@Configuration
@RequiredArgsConstructor
public class JobConfig {
    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;

    @Bean
    public Job batchJob() {
        return new JobBuilder("customJob", jobRepository)
                .incrementer(new RunIdIncrementer())
                .start(step1())
                .on("COMPLETED").to(step2())
                .from(step1())
                .on("FAILED").to(step3())
                .end()
                .build();
    }

    @Bean
    public Step step1() {
        return new StepBuilder("step1", jobRepository)
                .tasklet(new Tasklet() {
                    @Override
                    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
                        System.out.println("step1 !");
//                        throw new RuntimeException();
                        return RepeatStatus.FINISHED;
                    }
                }, transactionManager)
                .build();
    }

    @Bean
    public Step step2() {
        return new StepBuilder("step2", jobRepository)
                .tasklet(new Tasklet() {
                    @Override
                    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
                        System.out.println("step2 !");
                        return RepeatStatus.FINISHED;
                    }
                }, transactionManager)
                .build();
    }

    @Bean
    public Step step3() {
        return new StepBuilder("step3", jobRepository)
                .tasklet(new Tasklet() {
                    @Override
                    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
                        System.out.println("step3 !");
                        return RepeatStatus.FINISHED;
                    }
                }, transactionManager)
                .build();
    }
}
```

만약, `step1()` 에서 성공을 하게 되면 `step2()` 를 실행하게 되며, 예외가 발생하게 되면 `step3()` 를 실행하게 되는 것이다.

---

## Flow

Step만을 활용하여 Job을 구성하는 것이 아닌, Flow를 활용하여 Job을 구성할 수 있는데, 다음과 같다.

![Untitled](/static/images/batch/batch16.png)

이를 통해 Step을 Flow별로 분리하여 구성할 수 있다.

### 배치 상태 유형

- BatchStatus
    
    JobExecution과 StepExecution의 속성으로 Job과 Step의 종료 후 최종 결과가 무엇인지 정의한다.
    
    `COMPLETED, STARTING, STARTED, STOPPING, STOPPED, FAILD, ABANDONED, UNKNOWN`
    
    이때 `ABANDON` 은 처리 완료했지만, 성공하지 못한 단계와 재시작시 건너 뛰어야 하는 단계이다.
    
    - SimpleJob 에서
        - 마지막 Step의 BatchStatus 값을 Job의 최종 결과로 반영
    - FlowJob 에서
        - Flow나 Step의 ExitStatus 값을 FlowExecutionStatus로 저장한다.
        - 마지막 FlowExecutionStatus 값이 Job의 최종 결과로 반영
- ExitStatus
    
    JobExecution과 StepExecution의 속성으로 Job과 Step의 실행 후 어떤 상태로 종료되었는지 정의한다.
    
    기본적으로는 ExitStatus와 BatchStatus와 동일하게 설정되지만, 수동으로 변경하는 경우 다를 수 있다.
    
    `UNKNOWN, EXECUTING, COMPLETED, NOOP, FAILED, STOPPED`
    
- FlowExecutionStatus
    
    FlowExecution 의 속성으로 Flow의 실행 후 최종 결과 상태가 무엇인지 정의한다.
    
    Flow 내 Step이 실행되고 나서 ExitStatus 값을 저장한다.
    
    FLowJob의 배치 결과 상태에 관여하게 된다.
    
    `COMPLETED, STOPPED, FAILED, UNKNOWN` 
    

### Transition

Flow 내 Step의 조건부 전환을 정의하며, Job의 API 설정에서 `on()` 을 호출하면 TransitionBuilder 가 봔환되어 Transition Flow 를 구성할 수 있다.

Step의 ExitStatus가 어떤 Pattern과도 일치하지 않으면 스프링 배치에서 예외를 발생시키고, Job은 실패하게 된다.

Transition은 구체적인 것부터 순서대로 적용된다.

- `on(String pattern)`
    - Step의 ExitStatus와 매칭하는 패턴 스키마로 BatchStutus와 매칭하는 것이 아니다.
    - pattern와 ExitStatus가 매칭되면 다음으로 실행할 Step을 지정할 수 있다.
    - “?” 과 “*” 을 사용할 수 있다.
        - “*” 를 사용하게 되면 0개 이상의 문자와 매칭되며 “F*” 는 “FAIL” 과 매칭되고, “*”만 사용하게 되면 모든 상태와 일치하게 된다.
        - “?” 를 사용하게 되면 정확히 1개의 문자와 매칭되며 “FAI?” 는 “FAIL”과 매칭되지만, “FAILED”와 되지 않는다.
- `to()`
    
    다음으로 실행할 단계를 지정한다.
    
- `from()`
    
    이전 단계에서 정의한 Transition을 새롭게 추가 정의한다.
    

**Job을 중단하거나 종료하는 Transition API 또한 존재한다.**

Flow 가 실행되면 FlowExecutionStatus에 상태값이 저장되고 최종적으로 Job의 BatchStatus와 ExitStatus에 반영이 된다.

하지만 Step의 값에는 아무런 영향을 주지 않는다.

- `stop()`
    
    FlowExecutionStatus가 STOPPED로 종료가 되며, Job에도 마찬가지로 적용이 된다.
    
- `fail()`
    
    FlowExecutionStatus가 FAILED로 종료가 되며, Job에도 마찬가지로 적용이 된다.
    
- `end()`
    
    FlowExecutionStatus가 COMPLETED로 종료가 되며, Job에도 마찬가지로 적용이 된다.
    
    이때, Step이 FAILED가 나와도 Job은 COMPLETED가 되는 것이다.
    
- `stopAndRestart()`
    
    `stop()` 과 기본 흐름이 동일하며 특정 Step에서 작업을 중단하도록 설정하면 이전 Step만 COMPLETED가 되고, 이후의 Step은 실행되지 않고 STOPPED인 상태로 Job이 종료된다.
    
    이때 다시 Job을 다시 실행하면 이전에 COMPLETED로 저장된 Step은 건너뛰고 중단 이후 Step부터 시작한다.
    

위의 내용을 활용하여 이렇게 구성할 수 있다.

![Untitled](/static/images/batch/batch17.png)

```java
...
.start(step1()
	.on("A")
	.to(step2())
	.on("*")
	.stop()
//위에 이미 step1()에 대한 Transition을 정의하였기 때문에, 재정의 하는 경우 from() 사용
//위의 Transition과 현재의 Transition을 잘 구분할 필요가 있다.
.from(step1()) 
	.on("*")
	.to(step3())
	.next(step4())
	.on("B")
	.end()
.end()
.build()
```

위의 그림을 표현하면 위의 코드와 같다.

**사용자 정의 ExitStatus 사용**

ExistStatus에 존재하지 않는 existCode를 정의하여 새롭게 설정할 수 있는데, StepExecutionListener의 `afterStep()` 에 사용자 정의 코드를 생성하여 새로운 ExistStatus를 반환하면 된다.

그렇다면 Step 의 완료 시점에 현재 exitCode를 사용자 정의 코드로 변경할 수 있다.

```java
public class PassCheckingListener implements StepExecutionListener {
    public ExitStatus afterStep(StepExecution stepExecution) {
        String exitCode = stepExecution.getExitStatus().getExitCode();
        if (!exitCode.equals(ExitStatus.FAILED.getExitCode()))
            return new ExitStatus("DO PASS");
        return null;
    }
}

...

return new StepBuilder("step6", jobRepository)
                .tasklet(((contribution, chunkContext) -> RepeatStatus.FINISHED), transactionManager)
                .listener(new PassCheckingListener())
                .build();
```

이런식으로 사용하게 되면, FAILED가 아닌 경우 DO PASS가 나오게 되는 것이다.

![Untitled](/static/images/batch/batch18.png)

### JobExecutionDecider

ExitStatus를 조작하거나 StepExecutionListener를 등록할 필요 없이 Transition 처리를 위한 전용 클래스

Step과 Transition 역할을 명확하게 분리해서 설정할 수 있다.

특징은 Step의 ExitStatus가 아닌, JobExecutioinDecider의 FlowExecutionStatus 상태값을 새롭게 설정해서 반영한다는 것이다.

```java
public class OddDecider implements JobExecutionDecider {
    private int count = 0;
    @Override
    public FlowExecutionStatus decide(JobExecution jobExecution, StepExecution stepExecution) {
        count++;
        if (count % 2 == 0)
            return new FlowExecutionStatus("EVEN");
        return new FlowExecutionStatus("ODD");
    }
}

...
    @Bean
    public Job batchJob() {
        return new JobBuilder("customJob", jobRepository)
                .incrementer(new RunIdIncrementer())
                .start(step1())
                .next(decider())
                .on("ODD").to(oddStep())
                .from(decider())
                .on("EVEN").to(evenStep())
                .end().build();
    }

    @Bean
    public JobExecutionDecider decider() {
        return new OddDecider();
    }
...
```

이렇게 사용하게 되면, `oddStep()` 이 실행되게 된다.

### FlowStep

Step 내에 Flow를 할당하여 실행시키는 도메인 객체이며, flowStep의 BatchStatus와 ExitStatus는 Flow의 최종 상태값에 따라서 결정된다.

![Untitled](/static/images/batch/batch19.png)

```java
...    
    @Bean
    public Job batchJob() {
        return new JobBuilder("customJob", jobRepository)
                .incrementer(new RunIdIncrementer())
                .start(flowStep())
                .build();
    }

    @Bean
    public Step flowStep() {
        return new StepBuilder("flowStep", jobRepository)
                .flow(flowA())
                .build();
    }
...
```

이와 같이 기존과 크게 다르지 않기에 어렵지 않게 작성할 수 있다.