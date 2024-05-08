---
title: 스프링 배치 테스트와 운영
date: '2024-05-05'
tags: ['spring batch']
draft: false
summary: 스프링 배치 테스트와 운영
---

## Spring Batch Test - 테스트

### `@SpringBatchTest` 어노테이션

자동으로 ApplicationContext에 테스트에 필요한 여러 유틸 Bean을 등록해주는 어노테이션이다.

- JobLauncherTestUtils
    - `setJob()` 을 통해 Job을 자동 주입 받을 수 있으나 한가지만 받을 수 있다.
    - `launchJob()`, `launchStep()` 과 같이 스프링 배치 테스트에 필요한 유틸성 메소드 지원
- JobRepositoryTestUtils
    - JobRepository를 사용하여 JobExecution을 생성 및 삭제하는 기능 메소드 지원
- StepScopeTestExecutitionListener
    - `@StepScope` 컨텍스트를 생성해주며 해당 컨텍스트를 통해 JobParameter등을 단위 테스트에서 DI받을 수 있다.
- JobScopeTestExecutionListener
    - `@JobScope` 컨텍스트를 생성해주며 해당 컨텍스트를 통해 JobParameter등을 단위 테스트에서 DI 받을 수 있다.

```java
@Configuration
@EnableBatchProcessing
@EnableAutoConfiguration
public class TestBatchConfig {
}

@ExtendWith(SpringExtension.class)
@SpringBatchTest
@SpringBootTest(classes = {JobConfig.class, TestBatchConfig.class})
public class BatchTest {

    @Autowired
    private JobLauncherTestUtils jobLauncherTestUtils;
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @AfterEach
    public void clear() {
        jdbcTemplate.execute("delete from customer2");
    }

    @Test
    public void jobTest() throws Exception {
        JobParameters jobParameters = new JobParametersBuilder()
                .addString("name", "user1")
                .addLocalDateTime("date", LocalDateTime.now())
                .toJobParameters();

        JobExecution jobExecution = jobLauncherTestUtils.launchJob(jobParameters);
        assertThat(jobExecution.getStatus())
                .isEqualTo(BatchStatus.COMPLETED);
        assertThat(jobExecution.getExitStatus())
                .isEqualTo(ExitStatus.COMPLETED);
    }
}
```

이를 통해서 간단하게 테스트를 해볼 수 있다.

```java
@Configuration
@EnableBatchProcessing
@EnableAutoConfiguration
```

위의 것들은 배치 환경을 자동 설정하는 것인데,

테스트 환경에서도 필요하기 때문에 별도의 설정에서 작성한다. 

(모든 테스트 클래스에서 선언하는 불편함을 없애기 위함)

위의 테스트 에서는 `jobExecution` 을 사용해서 job의 결과만 확인했지만, 

`(StepExecution) ((List) jobExecution.getStepExecutions()).get(0);` 와 같이 `stepExecution` 을 추출하여 테스트를 수행하는 것 또한 가능하다.

## JobExplorer / JobRegistry / JobOperation - 운영

### JobExplorer

- JobRepository의 readOnly 버전으로 실행중인 Job의 실행 정보인 JobExecution 또는 Step의 실행 정보인 StepExecution을 조회할 수 있다.

![Untitled](/static/images/batch/batch77.png)

### JobRegistry

- 생성된 Job을 자동으로 등록, 추적, 관리하며 여러 곳에서 Job을 생성한 경우 ApplicationContext에서 Job을 수집해서 사용할 수 있다.
- 기본 구현체로 Map기반의 MapJobRegistry를 제공하며 JobName을 Key로 Job을 Value로 매핑한다.
- Job등록
    - JobRegistryBeanPostProcessor - BeanPostProcessor 단계에서 bean초기화 시 자동으로 JobRegistry에 Job을 등록시켜준다.

![Untitled](/static/images/batch/batch78.png)

### JobOperation

- JobExplorer, JobRepository, JobRegistry, JobLauncher를 포함하여 배치의 중단, 재시작, job 요약 등의 모니터링이 가능하다.
- 기본 구현체로 SimpleJobOperator 를 제공한다.

![Untitled](/static/images/batch/batch79.png)
