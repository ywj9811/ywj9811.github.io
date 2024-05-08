---
title: 스프링 배치 반복 및 오류 제어
date: '2024-04-28'
tags: ['spring batch']
draft: false
summary: 스프링 배체에서 반복 및 오류 제어
---

## Repeat

SpringBatch는 얼마나 작업을 반복해야 하는지 알려줄 수 있는 기능을 제공하는데, 특정 조건이 충족 될 때 까지 Job 또는 Step을 반복하도록 구성할 수 있다.

이때 Step의 반복과 Chunk의 반복을 RepeatOperation을 통해 처리하고 있으며 기본 구현체로 RepeatTemplate를 제공한다.

### 반복 종료 여부 설정

- RepeateStatus
    - 스프링 배치의 처리가 끝났는지 판별하기 위한 Enum 이다.
    - CONTINUABLE, FINISHED가 있다.
- CompletionPolicy
    - RepeateTemplate의 iterate 메소드 안에서 반복을 중단할지 결정한다.
    - 실행 횟수 또는 완료시기, 오류 발생시 수행 할 작업에 대한 반복여부 결정한다.
    - 정상 종료를 알리는데 사용된다.
    
    ![Untitled](/static/images/batch/batch46.png)
    
- ExceptionHandler
    - RepeatCallback 에서 예외가 발생하면 RepeateTemplate가 ExceptionHandler를 참조하여 예외를 던질지 말지 결정한다.
    - 예외를 던지게 되면 반복이 종료된다.
    - 비정상 종료를 알리는데 사용된다.
    
    ![Untitled](/static/images/batch/batch47.png)
    

이어서 전체적인 구조를 살펴보면 아래와 같다.

![Untitled](/static/images/batch/batch48.png)

간단하게 아래와 같이 작성할 수 있다.

```java
@Configuration
@RequiredArgsConstructor
public class JobConfig {
    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;
    private final static int chunkSize = 5;

    @Bean
    public Job batchJob() {
        return new JobBuilder("customJob", jobRepository)
                .incrementer(new RunIdIncrementer())
                .start(step1())
                .build();
    }

    @Bean
    public Step step1() {
        return new StepBuilder("step1", jobRepository)
                .<String, String>chunk(chunkSize, transactionManager)
                .reader(new ItemReader<String>() {
                    int i = 0;
                    @Override
                    public String read() throws Exception, UnexpectedInputException, ParseException, NonTransientResourceException {
                        i++;
                        return i>3 ? null : "item " + i;
                    }
                })
                .processor(new ItemProcessor<String, String>() {
                    RepeatTemplate repeatTemplate = new RepeatTemplate();
                    @Override
                    public String process(String item) throws Exception {

                        repeatTemplate.setCompletionPolicy(new SimpleCompletionPolicy(3));
                        repeatTemplate.iterate(new RepeatCallback() {

                            int i = 0;

                            @Override
                            public RepeatStatus doInIteration(RepeatContext context) throws Exception {
                                i++;
                                System.out.println("repeatTemplate is testing : " + i);
                                return RepeatStatus.CONTINUABLE;
                            }
                        });

                        return item;
                    }
                })
                .writer(items -> System.out.println("items = " + items))
                .build();
    }
}
```

이렇게 하게 되면, `SimpleCompletionPolicy` 를 사용하여 지정된 ChunkSize만큼 RepeatCallback을 반복해서 수행하게 되며 총 9번의 출력이 나오게 될 것이다.

```java
@Configuration
@RequiredArgsConstructor
public class JobConfig {
    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;
    private final static int chunkSize = 5;

    @Bean
    public Job batchJob() {
        return new JobBuilder("customJob", jobRepository)
                .incrementer(new RunIdIncrementer())
                .start(step1())
                .build();
    }

    @Bean
    public Step step1() {
        return new StepBuilder("step1", jobRepository)
                .<String, String>chunk(chunkSize, transactionManager)
                .reader(new ItemReader<String>() {
                    int i = 0;
                    @Override
                    public String read() throws Exception, UnexpectedInputException, ParseException, NonTransientResourceException {
                        i++;
                        return i>3 ? null : "item " + i;
                    }
                })
                .processor(new ItemProcessor<String, String>() {
                    RepeatTemplate repeatTemplate = new RepeatTemplate();
                    @Override
                    public String process(String item) throws Exception {

                        repeatTemplate.setCompletionPolicy(new SimpleCompletionPolicy(3));
                        repeatTemplate.setExceptionHandler(simpleLimitExceptionHandler());
                        repeatTemplate.iterate(new RepeatCallback() {

                            int i = 0;

                            @Override
                            public RepeatStatus doInIteration(RepeatContext context) throws Exception {
                                i++;
                                System.out.println("repeatTemplate is testing : " + i);
                                throw new RuntimeException("Exception !!");
                            }
                        });

                        return item;
                    }
                })
                .writer(items -> System.out.println("items = " + items))
                .build();
    }

    @Bean
    public ExceptionHandler simpleLimitExceptionHandler() {
        return new SimpleLimitExceptionHandler(2);
    }
}
```

이렇게 작성하게 되면 RepeateCallback 내부에서 2번의 예외가 발생하는 것 까지는 예외를 무시할 수 있지만, 3번째 예외 발생 부터는 예외를 던지게 된다.

## FaultTolerant

스프링 배치는 Job 실행 도중에 오류가 발생할 경우 장애를 처리하기 위한 기능을 제공하여 이를 통해 복원력을 향상시킬 수 있다.

오류가 발생해도 Step이 즉시 종료되지 않고 Retry 혹은 Skip 기능을 활성화 하여 내결함성 서비스가 가능하도록 한다.

프로그램의 내결함성을 위해 Skip과 Retry 기능을 제공한다.

- Skip
    - ItemReader / ItemProcessor / ItemWriter 에 적용할 수 있다.
- Retry
    - ItemProcessor / ItemWriter 에 적용할 수 있다.

FalutTolerance 구조는 Chunk 기반의 프로세스 기반에 Skip과 Retry 기능이 추가되어 재정의 되어 있다.

![Untitled](/static/images/batch/batch49.png)

```java
@Configuration
@RequiredArgsConstructor
public class JobConfig {
    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;
    private final static int chunkSize = 5;

    @Bean
    public Job batchJob() {
        return new JobBuilder("customJob", jobRepository)
                .incrementer(new RunIdIncrementer())
                .start(step1())
                .build();
    }

    @Bean
    public Step step1() {
        return new StepBuilder("step1", jobRepository)
                .<String, String>chunk(chunkSize, transactionManager)
                .reader(new ItemReader<String>() {
                    int i = 0;
                    @Override
                    public String read() throws Exception, UnexpectedInputException, ParseException, NonTransientResourceException {
                        i++;
                        if (i == 1)
                            throw new IllegalArgumentException("SkipException");
                        return i>3 ? null : "item " + i;
                    }
                })
                .processor(new ItemProcessor<String, String>() {
                    @Override
                    public String process(String item) throws Exception {
                        throw new IllegalStateException("retry Exception");
                    }
                })
                .writer(items -> System.out.println("items = " + items))
                .faultTolerant()
                .skip(IllegalArgumentException.class)
                .skipLimit(2)
                .retry(IllegalStateException.class)
                .retryLimit(2)
                .build();
    }
}
```

이런식으로 작성할 수 있다.

다만, 이 경우에는 retry의 한계를 넘어가기 때문에 결국 예외가 발생하게 되며 이를 잘 활용하여 다양하게 배치할 수 있다.

**Skip과 Retry에 대해 자세한 내용은 아래에서 살펴보도록 하자.**

## Skip

Skip은 데이터를 처리하는 동안 설정된 Exception이 발생하면 해당 데이터 처리를 건너 뛰는 기능이다.

데이터의 사소한 오류에 대해 Step의 실패 처리 대신 Skip을 발생시켜 배치 수행의 빈번한 실패를 줄일 수 있다.

![Untitled](/static/images/batch/batch50.png)

Item2에서 오류가 발생한다면 Item2를 건너 뛰고 Item3을 처리하는 것이지만, 내부적으로 동작하는 방식은 약간 다르다.

사실, ItemProcessor 혹은 ItemWriter에서 특정 Item에 대한 예외가 발생하는 경우 제일 처음으로 돌아가 ItemReader는 캐시에 남아있는 Chunk를 넘겨주면서 다시 시작하게 되는데(그림의 `Chunk<inputs>`단계) , 이후 해당 Item은 건너뛰고 처리하는 것이다.

다만 ItemReader에서는 예외가 발생하는 경우 처음으로 돌아가지 않고 그대로 스킵해서 작업하게 된다.

내부적인 동작을 생각하지 않고 이해하면 그냥 예외 발생 부분은 스킵하고 진행한다고 이해하면 된다.

Skip은 내부적으로 SkipPolicy를 통해서 구현되어 있는데, Skip 가능 여부를 판단하는 기준은 다음과 같다.

- 스킵 대상에 포함된 예외인지 여부
- 스킵 카운터를 초과 했는지 여부

![Untitled](/static/images/batch/batch51.png)

스킵 정책에 따라 아이템의 Skip여부를 판단하는 클래스가 SkipPolicy 클래스로 내부적으로 구현체들이 있으며 필요시 직접 생성해서 사용할 수 있다.

![Untitled](/static/images/batch/batch52.png)

이를 통해, 간단하게 작성해 보면 아래와 같다.

```java
public class SkipItemProcessor implements ItemProcessor<String, String> {
    @Override
    public String process(String item) {
        if (item.equals("6") || item.equals("7")) {
            System.out.println("itemProcessor exception = " + item);
            throw new SkippableExceptoin("Process skip");
        }
        System.out.println("itemProcessor = " + item);
        return String.valueOf(Integer.parseInt(item) * -1);
    }
}

public class SkipItemWriter implements ItemWriter<String> {
    @Override
    public void write(Chunk<? extends String> chunk) {
        List<? extends String> items = chunk.getItems();
        items.forEach(item -> {
            if (item.equals("-12")) {
                System.out.println("itemWriter exception = " + item);
                throw new SkippableExceptoin("write skip");
            }
            System.out.println("itemWriter = " + item);
        });
    }
}

@Configuration
@RequiredArgsConstructor
public class JobConfig {
    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;
    private final static int chunkSize = 5;

    @Bean
    public Job batchJob() {
        return new JobBuilder("customJob", jobRepository)
                .incrementer(new RunIdIncrementer())
                .start(step1())
                .build();
    }

    @Bean
    public Step step1() {
        return new StepBuilder("step1", jobRepository)
                .<String, String>chunk(chunkSize, transactionManager)
                .reader(new ItemReader<String>() {
                    int i = 0;
                    @Override
                    public String read() throws Exception, UnexpectedInputException, ParseException, NonTransientResourceException {
                        i++;
                        if (i == 3) {
                            System.out.println("itemReader exception = " + i);
                            throw new SkippableExceptoin("readSkip");
                        }
                        System.out.println("itemReader = " + i);
                        return i>20 ? null : String.valueOf(i);
                    }
                })
                .processor(itemProcessor())
                .writer(itemWriter())
                .faultTolerant()
                .skip(SkippableExceptoin.class)
                .skipLimit(2)
                .build();
    }

    @Bean
    public ItemProcessor<String, String> itemProcessor() {
        return new SkipItemProcessor();
    }

    @Bean
    public ItemWriter<String> itemWriter() {
        return new SkipItemWriter();
    }
}
```

동작을 시키게 되면

```prolog
itemReader = 1
itemReader = 2
itemReader exception = 3
itemReader = 4
itemReader = 5
itemReader = 6
itemProcessor = 1
itemProcessor = 2
itemProcessor = 4
itemProcessor = 5
itemProcessor exception = 6
itemProcessor = 1
itemProcessor = 2
itemProcessor = 4
itemProcessor = 5
itemWriter = -1
itemWriter = -2
itemWriter = -4
itemWriter = -5
itemReader = 7
itemReader = 8
itemReader = 9
itemReader = 10
itemReader = 11
itemProcessor exception = 7

org.springframework.batch.core.step.skip.SkipLimitExceededException: Skip limit of '2' exceeded
```

이렇게 나오는 것을 확인할 수 있는데 이는 2번의 예외가 발생하여 실패하게 된 것이고, 찍힌 출력문을 자세히 살펴보면 위에서 설명한 것과 같이 ItemProcessor와 ItemWriter에서 예외가 발생하면 `Chunk<Inputs>` 부터 하는 것을 확인할 수 있다.

만약 아래와 같이 `noSkip()` 에 해당하는 예외가 발생한다면

```java
@Configuration
@RequiredArgsConstructor
public class JobConfig {
    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;
    private final static int chunkSize = 5;

    @Bean
    public Job batchJob() {
        return new JobBuilder("customJob", jobRepository)
                .incrementer(new RunIdIncrementer())
                .start(step1())
                .build();
    }

    @Bean
    public Step step1() {
        return new StepBuilder("step1", jobRepository)
                .<String, String>chunk(chunkSize, transactionManager)
                .reader(new ItemReader<String>() {
                    int i = 0;
                    @Override
                    public String read() throws Exception, UnexpectedInputException, ParseException, NonTransientResourceException {
                        i++;
                        if (i == 3) {
                            System.out.println("itemReader exception = " + i);
                            throw new NoSkippableExceptoin("readSkip");
                        }
                        System.out.println("itemReader = " + i);
                        return i>20 ? null : String.valueOf(i);
                    }
                })
                .processor(itemProcessor())
                .writer(itemWriter())
                .faultTolerant()
                .skip(SkippableExceptoin.class)
                .skipLimit(2)
                .noSkip(NoSkippableExceptoin.class)
                .build();
    }

    @Bean
    public ItemProcessor<String, String> itemProcessor() {
        return new SkipItemProcessor();
    }

    @Bean
    public ItemWriter<String> itemWriter() {
        return new SkipItemWriter();
    }
}
```

```prolog
itemReader = 1
itemReader = 2
itemReader exception = 3

org.springframework.batch.core.step.skip.NonSkippableReadException: Non-skippable exception during read
```

이렇게 실패하는 것을 확인할 수 있다.

## Retry

Retry는 ItemProcessor, ItemWriter에서 설정된 Exception이 발생하면 지정한 정책에 따라 데이터 처리를 재시도하는 기능이다.

Skip과 마찬가지로, Retry함으로써 배치 수행의 빈번한 실패를 줄일 수 있다.

![Untitled](/static/images/batch/batch53.png)

오류 발생 시 재시도 설정에 의해서 Skip과 마찬가지로 처음으로 돌아가 시작하게 되는데 이때는 아예 RepeatTemplate 부터 다시 시작하게 된다.

![Untitled](/static/images/batch/batch54.png)

Retry 기능은 내부적으로 RetryPolicy를 통해 구현되어 있는데, Retry 가능 여부를 판단하는 기준은 다음과 같다.

- 재시도 대상에 포함된 예외인지 여부
- 재시도 카운터를 초과 했는지 여부

![Untitled](/static/images/batch/batch55.png)

RetryPoilcy는 재시도 정책에 따라 아이템의 retry 여부를 판단하는 클래스로 기본적으로 제공하는 RetryPolicy 구현체들이 있으며 필요시 직접 생성하여 사용할 수 있다.

![Untitled](/static/images/batch/batch56.png)

이에 대해서 간단하게 코드를 작성해 보면 다음과 같다.

```java
public class RetryItemProcessor implements ItemProcessor<String, String> {
    @Override
    public String process(String item) throws Exception {
        System.out.println(item);
        if (item.equals("2") || item.equals("3"))
            throw new RetryableException();
        return item;
    }
}

@Configuration
@RequiredArgsConstructor
public class JobConfig {
    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;
    private final static int chunkSize = 5;

    @Bean
    public Job batchJob() {
        return new JobBuilder("customJob", jobRepository)
                .incrementer(new RunIdIncrementer())
                .start(step1())
                .build();
    }

    @Bean
    public Step step1() {
        return new StepBuilder("step1", jobRepository)
                .<String, String>chunk(chunkSize, transactionManager)
                .reader(reader())
                .processor(processor())
                .writer(items -> items.forEach(System.out::println))
                .faultTolerant()
                .retry(RetryableException.class)
                .retryLimit(2)
                .build();
    }

    @Bean
    public ItemProcessor<String, String> processor() {
        return new RetryItemProcessor();
    }

    @Bean
    public ListItemReader<String> reader() {
        List<String> items = new ArrayList<>();
        for (int i = 0; i < 30; i++)
            items.add(String.valueOf(i));
        return new ListItemReader<>(items);
    }
}
```

실행하게 되면

```prolog
0
1
2
0
1
2
0
1

org.springframework.retry.RetryException: Non-skippable exception in recoverer while processing
```

이렇게 나오면서 실패하게 되는데, item이 0~2 를 계속해서 반복하는 이유는 이전에 설명한 것과 같이 재시작 하는 경우 다시 처음부터 진행하기 때문에 다시 0으로 돌아가는 것이다.

따라서 그렇게 2에서 실패하고 다시 재시도를 하더라도 0부터 시작하기 때문에 결국에는 `retryLimit(2)` 에 걸려서 실패하게 된다.

```java
...
		@Bean
    public Step step1() {
        return new StepBuilder("step1", jobRepository)
                .<String, String>chunk(chunkSize, transactionManager)
                .reader(reader())
                .processor(processor())
                .writer(items -> items.forEach(
                        item -> {
                            return;
                        }
                ))                .faultTolerant()
                .retry(RetryableException.class)
                .retryLimit(2)
                .skip(RetryableException.class)
                .skipLimit(2)
                .build();
    }
 ...
```

만약 `step()` 부분에 위와 같이 `skip()` 을 추가하게 되면 예외가 발생한 Item에 대해서 다음부터 skip을 하게 된다.

```prolog
0
1
2
0
1
2
0
1
3
0
1
3
0
1
4
5
6
7
8
.
.
.
29

```

따라서 위와 같이 성공하게 되는데 자세히 살펴보면, `0, 1, 2` 와 `0, 1, 3` 이 두번씩 재시도를 하고, 세번째 부터는 둘 다 skip하고 넘어가게 된다.

따라서 `skip()` 을 사용하게 되면 재시도 횟수를 넘어가고 `skip()` 의 조건에 해당하면 다시 시도를 하지 않는 것이다.

물론 이와 같이 작성하는 것 뿐만 아니라 RetryPolicy와 SkipPolicy를 직접 구현하여 사용하는 것 또한 가능하다.

만약 RecoveryCallback 을 사용하게 되면 다음과 같이 동작할 수 있다.

```java
@RequiredArgsConstructor
public class RetryItemProcessor2 implements ItemProcessor<String, Customer> {
    private final RetryTemplate retryTemplate;

    @Override
    public Customer process(String item) throws Exception {
        Customer customer = retryTemplate.execute(new RetryCallback<Customer, RuntimeException>() {
            @Override
            public Customer doWithRetry(RetryContext context) throws RuntimeException {
                if (item.equals("1") || item.equals("2"))
                    throw new RetryableException();
                return new Customer(item);
            }
        }, new RecoveryCallback<Customer>() {
            @Override
            public Customer recover(RetryContext context) throws Exception {
                return new Customer(String.valueOf(Integer.parseInt(item)*-1));
            }
        });
        return customer;
    }
}

@Configuration
@RequiredArgsConstructor
public class JobConfig2 {
    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;
    private final static int chunkSize = 5;

    @Bean
    public Job batchJob() {
        return new JobBuilder("customJob2", jobRepository)
                .incrementer(new RunIdIncrementer())
                .start(step1())
                .build();
    }

    @Bean
    public Step step1() {
        return new StepBuilder("step1", jobRepository)
                .<String, Customer>chunk(chunkSize, transactionManager)
                .reader(reader())
                .processor(processor())
                .writer(items -> {
                    List<? extends Customer> customers = items.getItems();
                    customers.forEach(
                            customer -> System.out.println(customer.getItem())
                    );
                })
                .faultTolerant()
                .build();
    }

    @Bean
    public ItemProcessor<String, Customer> processor() {
        return new RetryItemProcessor2(retryTemplate());
    }

    @Bean
    public ListItemReader<String> reader() {
        List<String> items = new ArrayList<>();
        for (int i = 0; i < 30; i++)
            items.add(String.valueOf(i));
        return new ListItemReader<>(items);
    }

    @Bean
    public RetryTemplate retryTemplate() {
        Map<Class<? extends Throwable>, Boolean> exceptionClass = new HashMap<>();
        exceptionClass.put(RetryableException.class, true);

        FixedBackOffPolicy backOffPolicy = new FixedBackOffPolicy();
        backOffPolicy.setBackOffPeriod(2000);

        SimpleRetryPolicy simpleRetryPolicy = new SimpleRetryPolicy(2, exceptionClass);

        RetryTemplate retryTemplate = new RetryTemplate();
        retryTemplate.setRetryPolicy(simpleRetryPolicy);
        retryTemplate.setBackOffPolicy(backOffPolicy);
        return retryTemplate;
    }
}
```

이렇게 RecoveryCallback을 만들어서 사용하게 되면

```prolog
0
-1
-2
3
4
5
6
7
.
.
.
29
```

이와 같이 나오게 된다.

이는 `retryLimit(2)` 에 의해 두번 실패를 하게 되면, `recover()` 가 동작하게 되고, 실패 후 다시 처리하여 넘어가서 출력되는 것이다.

하지만, 여기서 기존과 달라지는 부분이 재시도를 할 때 처음으로 돌아가서 0부터 재시도를 하는 것이 아닌, 실패한 부분만 재시도를 한다는 것이다.

**이는 내부적으로 동작할 때 동작되는 차이인데, RecoveryCallback을 포함하여 직접 2개를 만들어서 넘겨주게 된다면 RetryState가 null이 되기 때문에 달라지는 것이다.**

만약 수동으로 RetryTemplate을 생성하여 사용하는 것이 아닌 제공되는 API를 사용한다면 기본 RetryState가 설정되게 되지만, 수동으로 생성하며 `execute()` 에 RetryCallback만 파라미터로 넘겨주게 된다면 다음과 같이 생성하게 된다.

```java
	/**
	 * Keep executing the callback until it either succeeds or the policy dictates that we
	 * stop, in which case the most recent exception thrown by the callback will be
	 * rethrown.
	 *
	 * @see RetryOperations#execute(RetryCallback)
	 * @param retryCallback the {@link RetryCallback}
	 * @throws TerminatedRetryException if the retry has been manually terminated by a
	 * listener.
	 */
	@Override
	public final <T, E extends Throwable> T execute(RetryCallback<T, E> retryCallback) throws E {
		return doExecute(retryCallback, null, null);
	}

	/**
	 * Keep executing the callback until it either succeeds or the policy dictates that we
	 * stop, in which case the recovery callback will be executed.
	 *
	 * @see RetryOperations#execute(RetryCallback, RecoveryCallback)
	 * @param retryCallback the {@link RetryCallback}
	 * @param recoveryCallback the {@link RecoveryCallback}
	 * @throws TerminatedRetryException if the retry has been manually terminated by a
	 * listener.
	 */
	@Override
	public final <T, E extends Throwable> T execute(RetryCallback<T, E> retryCallback,
			RecoveryCallback<T> recoveryCallback) throws E {
		return doExecute(retryCallback, recoveryCallback, null);
	}

	/**
	 * Execute the callback once if the policy dictates that we can, re-throwing any
	 * exception encountered so that clients can re-present the same task later.
	 *
	 * @see RetryOperations#execute(RetryCallback, RetryState)
	 * @param retryCallback the {@link RetryCallback}
	 * @param retryState the {@link RetryState}
	 * @throws ExhaustedRetryException if the retry has been exhausted.
	 */
	@Override
	public final <T, E extends Throwable> T execute(RetryCallback<T, E> retryCallback, RetryState retryState)
			throws E, ExhaustedRetryException {
		return doExecute(retryCallback, null, retryState);
	}
```

하지만 여기서 만약

```java
@RequiredArgsConstructor
public class RetryItemProcessor2 implements ItemProcessor<String, Customer> {
    private final RetryTemplate retryTemplate;

    @Override
    public Customer process(String item) throws Exception {
        Classifier<Throwable, Boolean> rollbackClassifier = new BinaryExceptionClassifier(true);
        //추가
        Customer customer = retryTemplate.execute(new RetryCallback<Customer, RuntimeException>() {
            @Override
            public Customer doWithRetry(RetryContext context) throws RuntimeException {
                if (item.equals("1") || item.equals("2"))
                    throw new RetryableException();
                return new Customer(item);
            }
        }, new RecoveryCallback<Customer>() {
            @Override
            public Customer recover(RetryContext context) throws Exception {
                return new Customer(String.valueOf(Integer.parseInt(item)*-1));
            }
        }, new DefaultRetryState(rollbackClassifier));
        //추가
        return customer;
    }
}
```

이와 같이 RetryState를 추가하여 재시도하는 경우 기본 제공되는 메소드를 통해 설정한 것과 같이, RetryState가 null이 아니게 되어 처음으로 돌아가 재시도를 하게 되며 따라서 이전과 같이

```java
org.springframework.retry.RetryException: Non-skippable exception in recoverer while processing
```

이러한 예외가 발생하는 것이다.

물론, 여기서 동일하게 `skip()` 을 추가하게 된다면 이전과 마찬가지로 성공하게 될 것이다.

## Skip & Retry 아키텍처

### ItemReader

![Untitled](/static/images/batch/batch57.png)

ItemReader는 Skip 기능만 제공한다.

위와 같이 ItemReader에서 Skip이 동작하게 되며 복잡하지 않다.

### ItemProcessor

![Untitled](/static/images/batch/batch58.png)

ItemProcessor는 Skip과 Retry 두가지 모두 제공한다.

그림만 봐서는 이해가 잘 되지 않을 수 있지만, 위의 예시 코드와 함께 살펴보면 이해가 갈 것이다.

### ItemWriter

![Untitled](/static/images/batch/batch59.png)

ItemWriter 또한 Skip과 Retry 모두 가능하다.

흐름 또한 ItemProcessor와 거의 비슷하게 동작한다.