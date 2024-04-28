---
title: 스프링 배치 시작하기
date: '2024-04-22'
tags: ['spring boot', 'JPA', 'ERROR']
draft: false
summary: 스프링 배치 시작하기
---
## 배치 어플리케이션이란?

배치(Batch)는 일괄처리란 뜻을 가지고 있다.

만약 매일 전 날의 데이터를 집계해야 한다면, 큰 데이터를 읽고, 가공하고, 저장해야 할 것이다.

하지만 이를 일반적인 Tomcat + Spring MVC를 사용해서 하게 된다면 해당 서버는 순식간에 CPU, I/O 와 같은 자원을 다 사용해버려 다른 Request를 못받는 위험이 생길 수 있을 것이다.

**이렇게 단발성으로 대용량 데이터를 처리하는 어플리케이션을 배치 어플리케이션이라고 한다.**

그리고 여러가지 경우의 수와 실패의 위험을 처리하는 기능이 필요할지도 모른다.

따라서 비즈니스 로직 외에 부가적으로 신경써야 할 부분이 많다.

배치 어플리케이션은 아래와 같은 조건을 만족해야 한다.

- 대용량 데이터 - 배치 어플리케이션은 대량의 데이터를 가져오거나, 전달하거나, 계산하는 등의 처리를 할 수 있어야 한다..
- 자동화 - 배치 어플리케이션은 심각한 문제 해결을 제외하고는 **사용자 개입 없이 실행**되어야 한다.
- 견고성 - 배치 어플리케이션은 잘못된 데이터를 충돌/중단 없이 처리할 수 있어야 한다.
- 신뢰성 - 배치 어플리케이션은 무엇이 잘못되었는지를 추적할 수 있어야 한다. (로깅, 알림)
- 성능 - 배치 어플리케이션은 **지정한 시간 안에 처리를 완료**하거나 동시에 실행되는 **다른 어플리케이션을 방해하지 않도록 수행 되어야 한다**.

# Spring Batch

위에서 설명한 것과 같이 배치 어플리케이션을 구축하기 위해서는 비즈니스 로직 이외에 부가적으로 신경써야 할 부분이 많은데, Spring 진영에서 배치 어플리케이션을 구축하며 비즈니스 로직에 집중할 수 있도록 여러 기능을 제공해 주는데 이것이 Spring Batch이다.

이는 Spring의 특성을 그대로 가져왔기 때문에 DI, AOP, 서비스 추상화 등 Spring 프레임워크의 3대 요소를 모두 사용할 수 있다.

## `@EnableBatchProcessing`  → 5버전 부터 기본적으로는 사용하지 않음

- 총 4개의 설정 클래스를 실행시키며, 스프링 배치의 모든 초기화 및 실행 구성이 이루어짐.
    - BatchAutoConfiguration
    - SimpleBatchConfiguration
    - BatchConfigurerConfiguration
        - BasicBatchConfigurer
        - JpaBatchConfigurer
        - 사용자 정의 BatchConfigurer 인터페이스를 구현하여 사용할 수 있다.
- 스프링 부트 배치의 자동 설정 클래스가 실행되어 빈으로 등록된 모든 Job을 검색해서 초기화와 동시에 Job을 수행하도록 구성됨

## 배치 시작하기 (버전 4의 코드 → 버전 5 부터 많은 부분 변경)

![Untitled](/static/images/batch/batch1.png)

`@Configuration` : 하나의 배치 Job을 정의하고 빈 설정하는 부분

`JobBuilderFactory` : Job을 생성하는 빌더 팩토리 → Deprecated → JobRepository로 사용

`StepBuilderFactory` : Step을 생성하는 빌더 팩토리 → Deprecated → JobRepository로 사용

`tasklet` : Step 안에서 단일 태스크로 수행되는 로직 구현

즉, Job 구동 → Step 실행 → Tasklet 실행

# 스프링 배치 도메인의 이해

## Job

- 배치 계층 구조에서 가장 상위에 있는 개념으로 하나의 배치작업 자체를 의미
    - Ex) ‘API 서버의 접속 로그 데이터를 통계 서버로 옮기는 배치’ 이것이 Job이 될 수 있다.
- Job Configuration을 통해 생성되는 객체 단위로 배치 작업을 어떻게 구성하고 실행할 것인지 전체적으로 설정하고 명세화 하는 객체
- 배치 Job을 구성하기 위한 최상위 인터페이스이며 스프링 배치가 기본 구현체를 제공한다.
- 여러 Step을 포함하는 컨테이너로 반드시 한개 이상의 Step으로 구성되어야 한다.

### SimpleJob

- 순차적으로 Step을 실행시키는 Job
- 모든 Job에서 유용하게 사용할 수 있는 표준 기능을 갖고 있음

### FlowJob

- 특정한 조건과 흐름에 따라 Step을 구성하여 실행시키는 Job
- Flow 객체를 실행시켜서 작업을 진행

### JobInstance

- Job이 실행될 때 생성되는 Job의 논리적인 실행 단위 객체로 고유하게 식별 가능한 작업 실행을 의미
- Job의 설정과 구성은 동일하나, 실행되는 시점에 처리하는 내용은 다르기 때문에 Job의 실행을 구분해야 함
    - 하루에 한번씩 Job이 실행되면 매일 실행되는 각각의 Job을 JobInstance로 표현
- JobInsatance 생성 및 실행
    - 처음 시작하는 Job + JobParameter인 경우 새로운 JobInstance 생성
    - 이전과 동일한 Job + JobParameter인 경우 이미 존재하는 JobInstance를 리턴
        - 내부적으로 JobName + JobKey (JobParameter의 해시값)을 가지고 JobInstance를 얻는다.
    - Job과 1:M 관계
    
![Untitled](/static/images/batch/batch2.png)    

### JobParameter

- Job을 실행할 때 함께 포함되어 사용되는 파라미터를 가진 도메인 객체
- 하나의 Job에 존재할 수 있는 여러 JobInstance를 구분하기 위한 용도
- JobParameters와 JobInstance는 1:1 관계
- 생성 및 바인딩
    - 어플리케이션 실행 시 주입
        - `Java -jar LogBatch.jar requestDate=20210101`
    - 코드로 생성
        - `JobParameterBuilder` 혹은 `DefaultJobParametersConverter` 를 통해
        
        ```java
        @Component
        @RequiredArgsConstructor
        public class JobRunner implements ApplicationRunner {
            private final JobLauncher jobLauncher;
            private final Job helloJob;
        
            @Override
            public void run(ApplicationArguments args) throws Exception {
                JobParameters jobParameters = new JobParametersBuilder().addString("name", "user1")
                        .toJobParameters();
        
                jobLauncher.run(helloJob, jobParameters);
            }
        }
        
        ```
        
        `application.yml` 에  `job.enable : false` 를 추가하여 자동 실행을 멈추고, 원하는 특정 파라미터를 넣어주는 방식으로 실행시킬 수 있다.
        
    - SpEL 이용 (Spring이 제공하는 Language)
        - `@Value("#{jobParameter[requestDate]}")` , `@JobScope` , `@StepScope` 선언 필수

### JobExecution

- JobInstance에 대한 한번의 시도를 의미하는 객체로 Job 실행 중에 발생한 정보들을 저장하는 객체
    - 시작시간, 종료시간, 상태, 종료 상태의 속성을 가짐
    - 만약, JobExecution의 실행 상태가 COMPLETED인 경우 JobInstance 실행이 완료된 것으로 간주하여 재실행이 불가능하다.
    - 하지만, FAILED인 경우 JobInstance가 완료되지 않은 것으로 간주하여 다시 실행시키며, JobExecution을 하나 더 생성한다.
    
    ![Untitled](/static/images/batch/batch3.png)
    

## Step

- Batch Job을 구성하는 독립적인 하나의 단계로 실제 배치 처리를 정의하고, 컨트롤하는 데 필요한 모든 정보를 가지고 있는 도메인 객체
- 단순한 단일 태스크 뿐 아니라 입력과 처리, 출력과 관련된 복잡한 비즈니스 로직을 포함하는 모든 설정을 가짐
- 배치 작업을 어떻게 구성하고, 실행할 것인지 Job의 세부 작업을 Task기반으로 설정하고 명세한 객체

### TaskletStep

- 가장 기본이 되는 클래스로 Tasklet 타입의 구현체들을 제어

### PartitionStep

- 멀티 스레드 방식으로 Step을 여러개로 분리하여 실행

### JobStep

- Step 내에서 Job을 실행하도록 한다.
    
    Job → Step → Job → Step … 이렇게 파이프라인 구성 가능
    

### FlowStep

- Step 내에서 Flow를 실행하도록 한다.

### StepExecution

- JobExecution과 마찬가지로, Step의 한번의 시도를 의미하며 상태와 같은 정보를 저장한다.
- 시도될 때 생성되는 것으로 이전 단계의 Step이 실패하여 다음 Step이 진행되지 않는다면  다음 Step에 대한 StepExecution은 생성되지 않는다.
- JobExecution과 관계
    - 하나의 StepExecution이라도 실패하게 되면 JobExecution은 실패하게 된다.
    - 각 Step별로 저장되기 때문에 실패한 Job이더라도, 성공한 Step은 수행되지 않고 스킵하여 새롭게 생성하지 않으며 실패한 Step에 대해서만 새로 생성하게 된다.
    - 1:M 의 관계이다.

### StepContribution

- 청크 프로세스의 변경 사항을 버퍼링 한 후 StepExecution 상태를 업데이트하는 도메인 객체
- 청크 커밋 직전에 StepExecution의 apply 메소드를 호출하여 상태를 업데이트 한다. (몇번의 Read,Write,Process 및 실패 횟수)
- ExitStatus의 기본 종료 코드 외 사용자 정의 코드를 생성하여 적용할 수 있다.

## 공통

### ExecutionContext

- 프레임워크에서 유지 및 관리하는 키/값으로 구성된 컬렉션으로 StepExecution 혹은 JobExecution 객체의 상태를 저장하는 공유 객체
- DB에 직렬화 한 값으로 저장 (4버전 : JSON, 5버전 : Base64를 이용)
- 공유 범위
    - Step 범위 - 각 Step의 StepExecution에 저장되며 Step간 공유 안됨
    - Job 범위 - 각 Job의 JobExecution에 저장되며, Job간 공유는 안되지만, Step간 공유가 가능하다.
- Job 재시작에서 이미 처리한 데이터는 건너뛰고, 이후로 수행하도록 할때 상태 정보를 활용한다.

## Tasklet (도메인은 아님)

Step에서 수행하는 작업 내용을 의미한다.

```java
@Configuration
public class SpringBatchConfiguration {
    @Bean
    public Job helloJob(JobRepository jobRepository, Step helloStep1, Step helloStep2) {
        return new JobBuilder("helloJob", jobRepository)
                .start(helloStep1)
                .next(helloStep2)
                .build();
    }

    @Bean
    public Step helloStep1(JobRepository jobRepository, PlatformTransactionManager transactionManager) {
        return new StepBuilder("helloStep1", jobRepository)
                .tasklet(new Tasklet() {
                    @Override
                    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
                        System.out.println("=======================");
                        System.out.println("Hello SpringBatch!! - 1");
                        System.out.println("=======================");

                        return RepeatStatus.FINISHED;
                        /**
                         * RepeatStatus.CONTINUABLE; 는 계속해서 작업을 반복하게 되며, FINISHED는 반복을 종료시킨다.
                         */
                    }
                }, transactionManager).build();
    }

    @Bean
    public Step helloStep2(JobRepository jobRepository, PlatformTransactionManager transactionManager) {
        return new StepBuilder("helloStep2", jobRepository)
                .tasklet(new Tasklet() {
                    @Override
                    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
                        System.out.println("=======================");
                        System.out.println("Hello SpringBatch!! - 2");
                        System.out.println("=======================");

                        return RepeatStatus.FINISHED;
                    }
                }, transactionManager).build();
    }
}
```

위와 같이 사용할 수 있다.

혹은

```java
@Component
public class CustomTaklet implements Tasklet {
    @Override
    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {

        System.out.println("CustomTasklet");

        return RepeatStatus.FINISHED;
    }
}

@Configuration
public class JobConfiguration {
    @Bean
    public Job customJob(JobRepository jobRepository, Step customStep) {
        return new JobBuilder("customJob", jobRepository)
                .start(customStep)
                .build();
    }

    @Bean
    public Step customStep(JobRepository jobRepository, PlatformTransactionManager transactionManager, CustomTaklet taskLet) {
        return new StepBuilder("customStep", jobRepository)
                .tasklet(taskLet, transactionManager)
                .build();
    }
}
```

이와 같이 Tasklet 구현체를 만들어 가져다 사용할 수 있기도 하다.

# 스프링 배치 메타 데이터

스프링 배치의 실행 및 관리를 위한 목적으로 여러 도메인들(Job, Step, JobParameters..)의 정보를 저장, 업데이트, 조회할 수 있는 스키마가 제공된다.

과거, 현재 실행에 대한 세세한 정보, 실행에 대한 성공과 실패 여부 등을 관리하여 배치 운용에 있어 리스크 발생시 빠른 대처가 가능하다.

DB와 연동할 경우 필수적으로 메타 테이블이 생성되어야 한다.

### DB 스키마 제공

`/org/springframework/batch/core/schema-*sql` 에 DB 유형별로 제공이 된다.

### 스키마 생성 설정

- 수동 생성 : 쿼리 복사 후 직접 실행
- 자동 생성 : `spring.batch.jdbc.initialize-schema` 설정을 통해 할 수 있다.
    - ALWAYS : 스크립트 항상 실행 (RDBMS가 설정되어 있을 경우 내장 DB보다 우선적으로 실행)
    - EMBEDDED : 내장 DB일때만 실행되며 스키마가 자동 생성됨 (기본값)
    - NEVER : 스크립트 생성 안되며, 내장 DB일 경우 스크립트가 생성되지 않기 때문에 오류 발생
    운영에서 수동으로 스크립트 생성 후 설정하는 것을 권장

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/batch
    username: root
    password:
    driver-class-name: com.mysql.cj.jdbc.Driver
  batch:
    jdbc:
      initialize-schema: always # never(운영시) 혹은 embedded 사용 가능
    job:
      enabled: false/true # false 는 배치 자동실행 X 기본은 true
```

## DB 스키마

![Untitled](/static/images/batch/batch4.png)

위에서 설명한 Job, Step에 대한 정보를 가지는 DB 스키마이다.

## JobRepository

자동으로 빈으로 생성되는 클래스이며, CRUD관련 작업을 수행할 수 있으며, 이를 통해 필요한 정보를 가져와서 사용하는 것이 가능하다.

Spring Batch 5버전 부터 Builder대신 JobRepository를 사용해야 한다.

### 커스터마이징

기존의 JobRepository는, BasicBatchConfigurer를 상속받는 설정 파일을 만들어, 아래의 값들로 바꿔 커스터마이징 할 수 있다.

- JDBC 방식으로 - JobRepositoryFactoryBean
    - 내부적으로 AOP 방식을 통해 트랜잭션 처리
    - 트랜잭션 격리는 기본으로 SERIALIZEBLE 로 최고 수준이며, 다른 레벨로 지정할 수 있음
    - 메타테이블의 Table Prefix를 변경할 수 있으며, 기본 값은 BATCH_ 임
- InMemory 방식으로 - MapJobRepositoryFactoryBean
    - 성능 등의 이유로 도메인 오브젝트를 굳이 데이터베이스에 저장하고 싶지 않을 때
    - 보통 Test나 프로토타입의 빠른 개발을 필요로 할 때 사용

## JobLauncher

배치 Job을 실행시키는 역할을 하는 클래스

- Job과 JobParameters를 인자로 받으며 요청된 배치 작업을 수행한 후 최종 client에게 JobExecution을 반환
- 스프링 부트 배치가 구동이 되면, JobLauncher 빈이 자동 생성된다.
- Job 실행
    - `JobLauncher.run(Job, JobParameters)`
    - 스프링 부트 배치에서는 `JobLauncherApplicationRunner` 가 자동으로 실행
    - 동기적 실행
        - taskExecutor를 `SyncTaskExecutor` 로 설정하는 경우 (기본값)
        - JobExecution을 획득하고 배치 처리를 최종 완료한 이후 Client에게 JobExecutioin을 반환
        - **스케줄러에 의한 배치 처리에 적합 (배치 처리 시간이 길어도 상관 없는 경우)**
    - 비동기적 실행
        - taskExecutor를 `SimpleAsyncTaskExecutor` 로 설장하는 경우
        - JobExecution을 획득한 후 Client에게 바로 JobExecution을 반환하고, 배치 처리를 완료
        - **HTTP 요청에 의한 배치 처리에 적합 (배치 처리 시간이 길 경우 응답을 빠르게 처리)**

```java
@RestController
@RequiredArgsConstructor
public class TestController {
    private final Job customJob;
    private final JobLauncher jobLauncher;

    @PostMapping("/batch")
    public String test(@RequestBody Member member) throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException {
        JobParameters jobParameters = new JobParametersBuilder()
                .addString("id", member.getId())
                .addDate("date", new Date())
                .toJobParameters();

        jobLauncher.run(customJob, jobParameters);

        return "jobFin";
    }
}

@Configuration
@RequiredArgsConstructor
public class JobConfiguration {
    private final CustomTaklet1 taklet1;
    private final CustomTaklet2 taklet2;
    private final CustomTaklet3 taklet3;
    private final CustomTaklet4 taklet4;
    @Bean
    public Job customJob(JobRepository jobRepository, Step customStep, Step customStep2, Step customStep3, Step customStep4) {
        return new JobBuilder("customJob", jobRepository)
                .start(customStep)
                .next(customStep2)
                .next(customStep3)
                .next(customStep4)
                .build();
    }

    @Bean
    public Step customStep(JobRepository jobRepository, PlatformTransactionManager transactionManager) {
        return new StepBuilder("customStep", jobRepository)
                .tasklet(taklet1, transactionManager)
                .build();
    }

    @Bean
    public Step customStep2(JobRepository jobRepository, PlatformTransactionManager transactionManager) {
        return new StepBuilder("customStep2", jobRepository)
                .tasklet(taklet2, transactionManager)
                .build();
    }

    @Bean
    public Step customStep3(JobRepository jobRepository, PlatformTransactionManager transactionManager) {
        return new StepBuilder("customStep3", jobRepository)
                .tasklet(taklet3, transactionManager)
                .build();
    }

    @Bean
    public Step customStep4(JobRepository jobRepository, PlatformTransactionManager transactionManager) {
        return new StepBuilder("customStep4", jobRepository)
                .tasklet(taklet4, transactionManager)
                .build();
    }
}
```

```yaml
spring:    
    job:
      enabled: false
```

이렇게 설정을 하게 되면, HTTP 요청에 맞춰 배치 작업을 수행하게 된다.

이때는, 기본인 방식을 사용했기 때문에 동기 방식으로 진행이 된다.