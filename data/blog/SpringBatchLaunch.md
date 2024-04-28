---
title: 스프링 배치 실행
date: '2024-04-22'
tags: ['spring boot', 'JPA', 'ERROR']
draft: false
summary: 스프링 배치 실행하기
---
## JobLauncherApplicationRunner

SpringBatch 작업을 시작하는 ApplicationRunner로, BatchConfiguration에서 생성된다.

스프링 부트에서 제공하는 ApplicationRunner의 구현체이며 어플리케이션이 정상적으로 구동되자 마자 실행된다.

그리고 기본적으로 빈으로 등록된 모든 Job을 실행시킨다.

## BatchProperties

SpringBatch의 환경 설정 클래스로 Job 이름, 스키마 초기화 설정 등의 값을 설정할 수 있다.

이에 대해서는 `application.yml` 에서 작업한다.

---

## Job을 실행시키기 위해서 어떻게 되는가

### JobBuilderFactory & JobBuilder

- JobBuilderFactory는 SpringBatch v5 부터 Deprecated 되어서 사용할 수 없다.
- JobBuilder
    - Job을 구성하는 설정 조건에 따라 두개의 하위 빌더 클래스를 생성하고 실제 Job생성을 위임한다.
        
        !![Untitled](/static/images/batch/batch5.png)

        - SimpleJobBuilder → JobBuilder 에서 `start(step)` 을 사용하는 경우 생성됨
            - SimpleJob을 생성하는 Builder클래스
            - Job 실행과 관련된 여러 설정 API 제공
        - FlowJobBuilder → JobBuilder 에서 `start(flow)` 혹은 `flow(step)` 을 사용하는 경우 생성됨
            - FlowJob 을 생성하는 Builder클래스
            - 내부적으로 FlowBuilder를 반환하여 Flow 실행과 관련된 여러 설정 API를 제공
        - 둘 다 최종적으로 Job 객체가 생성된다.

### SimpleJob

Step을 실행시키는 Job 구현체로, SimpleJobBuilder에 의해 생성된다.

여러 단계의 Step으로 구성될 수 있으며, Step을 순차적으로 실행시킨다.

모든 Step의 실행이 성공적으로 완료되어야 Job이 성공적으로 완료되며 맨 마지막에 실행한 Step의 BatchStatus가 Job의 최종 BatchStatus가 된다. (중간에 Step이 실패하면 다음 Step 진행하지 않음)

![Untitled](/static/images/batch/batch6.png)

- `validator(JobParameterValidator)` : Job 실행에 꼭 필요한 파라미터를 검증하는 용도, DefulatJobParameterValidator 구현체를 지원하며 복잡한 제약 조건이 있다면 인터페이스를 직접 구현할 수 있다.
    - DefaultParameterValidator
        - requiredKey와 optionalKeys 라는 String배열의 파라미터를 받아 생성할 수 있으며, requiredKeys에는 필수로 가져야 하는 Key를 넣어주고 optionalKeys에는 옵션으로 가져가는 Key를 넣어줄 수 있다.
        - optional = false, required = false 일 경우 `JobParametersInvalidException` 이 발생
        - optional = true, required = false 일 경우 `JobParametersInvalidException` 이 발생
        - optional = false, required = true 일 경우 예외 발생하지 않음
        
        ```java
        @Bean
        public Job customJob() {
             DefaultJobParametersValidator defaultValidator = new DefaultJobParametersValidator(
                    new String[]{"date", "name"}, new String[]{"option"}
            );
            return new JobBuilder("customJob", jobRepository)
                    .start(firstStep())
                    .next(secondStep())
                    .validator(defaultValidator)
                    .build();
        }
        ```
        
        - 혹은 커스텀 하여 만들 수 있다.
        
        ```java
        public class CustomJobParameterValidator extends DefaultJobParametersValidator {
            @Override
            public void validate(@Nullable JobParameters parameters) throws JobParametersInvalidException {
                if (parameters.getParameter("name") == null) {
                    throw new IllegalArgumentException("ERROR");
                }
            }
        }
        
        @Bean
        public Job customJob() {
            return new JobBuilder("customJob", jobRepository)
                    .start(firstStep())
                    .next(secondStep())
                    .validator(new CustomJobParameterValidator())
                    .build();
        }
        ```
        
- `preventRestart()` : Job의 재시작 여부를 결정
    - 해당 메소드가 없는 경우 Job의 재시작은 true로 설정되어 있음
    - 해당 메소드를 추가하게 되면 Job의 재시작이 false로 설정되어 재시작을 할 수 없게 되며 `JobRestartException` 이 발생하게 된다.
- `incrementer()` : JobParameters 에서 필요한 값을 증가시킨다.
    - 기존의 JobParameter 변경 없이 Job을 여러번 시작하고자 할 때 사용할 수 있다.
    - RunIdIncrementer 구현체를 지원하며 필요한 경우 JobParametersIncrementer 인터페이스를 직접 구현하여 사용할 수 있다.
        
        ```java
        @Bean
        public Job customJob() {
            return new JobBuilder("customJob", jobRepository)
                    .start(firstStep())
                    .next(secondStep())
                    .incrementer(new RunIdIncrementer())
                    .build();
        }
        ```
        
        ```java
        public class CustomJobParameterIncrementer implements JobParametersIncrementer {
            private static final SimpleDateFormat format = new SimpleDateFormat("yyyyMMdd-hhMMss");
        
            @Override
            public JobParameters getNext(JobParameters parameters) {
                String id = format.format(new Date());
        
                return new JobParametersBuilder()
                        .addString("run.id", id)
                        .toJobParameters();
            }
        }
        
        @Bean
        public Job customJob() {
            return new JobBuilder("customJob", jobRepository)
                    .start(firstStep())
                    .next(secondStep())
                    .incrementer(new CustomJobParameterIncrementer())
                    .build();
        }
        ```
        

### 전체적인 SimpleJob 흐름도

![Untitled](/static/images/batch/batch7.png)

## Step을 수행하기 위해서는 어떻게 되는가

### StepBuilderFactory & StepBuild

- StepBuilderFactory 는 StepBuilder를 생성하는 팩토리 이지만, v5 이후 deprecated되었다.
- StepBuilder
    - Step을 구성하는 설정 조건에 따라 다섯개의 하위 빌더 클래스를 생성하고 Step 생성을 위임한다.
        - TaskletStepBuilder 
        → `tasklet(Tasklet tasklet, PlatformTransactionManager transactionManager)` 을 사용하는 경우
            - TaskletStep을 생성하는 기본 클래스
        - SimpleStepBuilder 
        → `chunk(int chunkSize, PlatformTransactionManager transactionManager)` 혹은
        `chunk(CompletionPolicy completionPolicy, PlatformTransactionManager transactionManager)` 를 사용하는 경우
            - TaskletStep을 생성하며 내부적으로 청크기반의 작업을 처리하는 ChunkOrientedTasklet 클래스를 생성
        - PartitionStepBuilder
        → `partitioner(String stepName, Partitioner partitioner)` 혹은
        `partitioner(Step step)` 를 사용하는 경우
            - PartitionStep을 생성하며 멀티스레드 방식으로 Job을 실행
        - JobStepBuilder
        → `job(Job job)` 를 사용하는 경우
            - JobStep을 생성하며 Step안에서 Job을 실행
        - FlowStepBuilder
        → `flow(Flow flow)` 를 사용하는 경우
            - FlowStep을 생성하며 Step안에서 Flow를 실행

### TaskletStep

스프링 배치에서 제공하는 Step의 구현체로 Tasklet을 실행시키는 도메인 객체이다.

RepeatTemplate를 사용하여 Tasklet의 구문을 트랜잭션 경계 내에서 반복해서 실행한다.

Task기반과 Chunk기반으로 나누어 Tasklet을 실행한다.

- **Task vs Chunk 기반이란**
    
    ![Untitled](/static/images/batch/batch8.png)

    - Chunk 기반
        - 하나의 큰 덩어리를 n개씩 나누어 실행한다는 의미로 대용량 처리를 효과적으로 수행
        - ItemReader, ItemProcessor, ItemWriter 를 사용하며 청크 기반 전용 Tasklet인 ChunkOrientedTasklet 구현체가 제공된다.
    - Task 기반
        - ItemReader와 ItemWriter와 같은 청크 기반의 작업 보다 단일 작업 기반으로 처리되는 것이 더 효율적인 경우
        - 주로 Tasklet 구현체를 만들어 사용
        - 대용량 처리를 하는 경우는 Chunk기반에 비해 구현이 복잡

![Untitled](/static/images/batch/batch9.png)

- `tasklet(Tasklet)` : Tasklet 타입의 클래스를 설정한다.
    - Tasklet은 Step 내에서 구성되고 실행되는 도메인 객체로 주로 단일 태스크 수행을 위한 것이다.
    - TaskletStep 에 의해 반복적으로 수행되며 반환값(RepeatStatus)에 따라 계속 수행 혹은 종료한다.
        - RepeatStatus.FINISHED - Tasklet 종료, RepeatStatus를 null로 반환하면 마찬가지로 해석된다.
        - RepeatStatus.CONTINUABLE : Tasklet 반복
        - 따라서 FINISHED혹은 예외가 발생할 때 까지 TaskletStep에 의해 while문 안에서 무한반복 된다.
    - 익명 클래스 혹은 구현 클래스를 만들어 사용한다.
    - 이 메소드를 실행하게 되면 TaskletStepBuilder가 반환되며 관련 API를 설정할 수 있다.
    - Step에 오직 하나의 Tasklet 설정이 가능하며 두개 이상 설정했을 때 마지막에 설정한 객체가 실행된다.
- `startLimit()` : Step의 실행 횟수를 조정
    - Step마다 설정 가능하다.
    - 설정 값을 초과해서 실행하게 되면 `StartLimitExceedException` 이 발생한다.
    - 기본은 최대값으로 설정되어 있다.
    
    ```java
    @Bean
    public Job customJob() {
        return new JobBuilder("customJob", jobRepository)
                .start(firstStep())
                .next(secondStep())
                .build();
    }
    
    @Bean
    public Step firstStep() {
        return new StepBuilder("step1", jobRepository)
                .tasklet(new Tasklet() {
                    @Override
                    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
                        System.out.println("firstStep");
                        return RepeatStatus.FINISHED;
                    }
                }, transactionManager)
                .build();
    }
    
    @Bean
    public Step secondStep() {
        return new StepBuilder("step2", jobRepository)
                .tasklet(new Tasklet() {
                    @Override
                    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
                        System.out.println("secondStep");
                        throw new RuntimeException();
                    }
                }, transactionManager)
                .startLimit(2)
                .build();
    }
    ```
    
    이 경우, 3번의 시도부터 `startLimit` 설정을 넘게 되어 `RuntimeException` 이 아닌 `StartLimitExceedException` 가 발생하게 된다.
    
- `allowStartIfComplete()` : 재시작 Job에서 Step의 이전 성공 여부와 상관 없이 항상 step을 실행
    - 기본적으로 Step은 이전에 Complete 상태인 경우 재시작에서 수행되지 않는다.
    - 실행 마다 유효성을 검증하는 Step 혹은 사전 작업의 Step은 위의 설정을 통해 항상 실행을 하게 할 수 있다.
    
    ```java
    @Bean
    public Job customJob() {
        return new JobBuilder("customJob", jobRepository)
                .start(firstStep())
                .next(secondStep())
                .build();
    }
    
    @Bean
    public Step firstStep() {
        return new StepBuilder("step1", jobRepository)
                .tasklet(new Tasklet() {
                    @Override
                    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
                        System.out.println("firstStep");
                        return RepeatStatus.FINISHED;
                    }
                }, transactionManager)
                .allowStartIfComplete(true)
                .build();
    }
    
    @Bean
    public Step secondStep() {
        return new StepBuilder("step2", jobRepository)
                .tasklet(new Tasklet() {
                    @Override
                    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
                        System.out.println("secondStep");
                        throw new RuntimeException();
                    }
                }, transactionManager)
                .build();
    }
    ```
    
    기본으로 Complete 상태인 Step을 스킵하여 firstStep은 한번 이후 수행되지 않지만 이렇게 설정하는 경우 firstStep 또한 계속해서 수행하게 된다.
    

### 전체적인 TaskletStep 흐름도

![Untitled](/static/images/batch/batch10.png)

### JobStep

Job에 속하는 Step 중 외부의 Job을 포함하는 Step이다.

외부의 Job이 실패하면 당연하게도 해당 Step이 실패하고 최종인 기본 Job도 실패하게 된다.

모든 메타데이터는 기본 Job과 외부 Job을 별도로 각각 저장하게 된다.

커다란 시스템을 작은 모듈로 쪼개고 Job의 흐름을 관리하고자 할 때 사용할 수 있다.

![Untitled](/static/images/batch/batch11.png)

- `job()` : 외부 Job을 정의하여 넣어주면 된다.
- `launcher()`
- `parameterExtractor()` : 부모 Job의 파라미터의 값을 그대로 사용하는 것이 아닌, 변경해서 사용할 수 있다.
    
    만약, `name : user` `date : new Date()` 이렇게 파라미터가 넘어갈 때 
    
    ```java
    		@Bean
    		public Job customJob() {
    		    return new JobBuilder("customJob", jobRepository)
    		            .start(firstStep())
    		            .next(secondStep(null))
    		            .build();
    		}
    		
    		@Bean
    		public Step firstStep() {
            return new StepBuilder("step1", jobRepository)
                    .tasklet(new Tasklet() {
                        @Override
                        public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
                            System.out.println("firstStep");
                            return RepeatStatus.FINISHED;
                        }
                    }, transactionManager)
                    .build();
        }
    
        @Bean
        public Step secondStep(JobLauncher jobLauncher) {
            return new StepBuilder("step2", jobRepository)
                    .job(childJob())
                    .launcher(jobLauncher)
                    .parametersExtractor(jobParametersExtractor())
                    .listener(new StepExecutionListener() {
                        @Override
                        public void beforeStep(StepExecution stepExecution) {
                            stepExecution.getExecutionContext().putString("name", "plus");
                        }
    
                        @Override
                        public ExitStatus afterStep(StepExecution stepExecution) {
                            return null;
                        }
                    })
                    .build();
        }
    
        @Bean
        public Step childStep() {
            return new StepBuilder("step4", jobRepository)
                    .tasklet(new Tasklet() {
                        @Override
                        public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
                            System.out.println("fourthStep");
                            return RepeatStatus.FINISHED;
                        }
                    }, transactionManager).build();
        }
    
        @Bean
        public Step lastStep() {
            return new StepBuilder("step5", jobRepository)
                    .tasklet(new Tasklet() {
                        @Override
                        public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
                            System.out.println("fifthStep");
                            return RepeatStatus.FINISHED;
                        }
                    }, transactionManager).build();
        }
    
        @Bean
        public Job childJob() {
            return new JobBuilder("childJob", jobRepository)
                    .start(childStep())
                    .next(lastStep())
                    .build();
        }
    
        private DefaultJobParametersExtractor jobParametersExtractor() {
            DefaultJobParametersExtractor extractor = new DefaultJobParametersExtractor();
            extractor.setKeys(new String[]{"name"});
            return extractor;
        }
    }
    
    ```
    
    `customJob` 을 실행하게 된다면 다음과 같이 생긴다.
    
    ![Untitled](/static/images/batch/batch12.png)