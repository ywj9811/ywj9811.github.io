---
title: 스프링 배치 멀티 스레드 프로세싱
date: '2024-05-02'
tags: ['spring batch']
draft: false
summary: 스프링 배체에서 멀티 스레드 프로세싱
---

### AsyncItemProcessor / AsyncItemWriter

Step 안에서 ItemProcessor가 비동기적으로 동작하는 구조로, AysncItemProcessor와 AysncItemWriter가 함께 구성되어야 한다.

AysncItemProcessor로 부터 AsyncItemWriter가 받는 최종 결과 값은 `List<Future<T>>` 타입이며 비동기 실행이 완료될 때 까지 대기한다.

`spring-batch-integration` 의존성 추가가 필요하다.

![Untitled](/static/images/batch/batch60.png)

![Untitled](/static/images/batch/batch61.png)

이에 대해서 코드를 작성해보자면 다음과 같다.

```java
@Configuration
@RequiredArgsConstructor
public class JobConfig {
    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;
    private final DataSource dataSource;

    private final static int chunkSize = 5;

    @Bean
    public Job batchJob() throws InterruptedException {
        return new JobBuilder("customJob1", jobRepository)
                .incrementer(new RunIdIncrementer())
                .start(step())
                .build();
    }

    @Bean
    public Step step() throws InterruptedException {
        return new StepBuilder("step", jobRepository)
                .<Customer, Customer>chunk(100, transactionManager)
                .reader(pagingItemReader())
                .processor(asyncCustomItemProcessor())
                .writer(asyncCustomItemWriter())
                .build();
    }

    @Bean
    public ItemProcessor<Customer, Customer> customItemProcessor() throws InterruptedException {

        return new ItemProcessor<Customer, Customer>() {

            @Override
            public Customer process(Customer item) throws Exception {
                Thread.sleep(100);

                return new Customer(item.getId(), item.getFirstName(), item.getLastName(), item.getBirthdate());
            }
        };
    }

    @Bean
    public AsyncItemProcessor asyncCustomItemProcessor() throws InterruptedException {
        AsyncItemProcessor<Customer, Customer> itemProcessor = new AsyncItemProcessor<>();
        itemProcessor.setDelegate(customItemProcessor());
        itemProcessor.setTaskExecutor(new SimpleAsyncTaskExecutor());

        return itemProcessor;
    }

    @Bean
    public JdbcPagingItemReader<Customer> pagingItemReader() {
        JdbcPagingItemReader<Customer> reader = new JdbcPagingItemReader<>();

        reader.setDataSource(dataSource);
        reader.setFetchSize(300);
        reader.setRowMapper(new CustomRowMapper());

        MySqlPagingQueryProvider queryProvider = new MySqlPagingQueryProvider();
        queryProvider.setSelectClause("id, firstName, lastName, birthdate");
        queryProvider.setFromClause("from customer");

        Map<String, Order> sortKeys = new HashMap<>(1);
        sortKeys.put("id", Order.ASCENDING);

        queryProvider.setSortKeys(sortKeys);
        reader.setQueryProvider(queryProvider);

        return reader;
    }

    @Bean
    public JdbcBatchItemWriter customItemWriter() {
        JdbcBatchItemWriter<Customer> itemWriter = new JdbcBatchItemWriter<>();

        itemWriter.setDataSource(dataSource);
        itemWriter.setSql("insert into customer2 values (:id, :firstName, :lastName, :birthdate)");
        itemWriter.setItemSqlParameterSourceProvider(new BeanPropertyItemSqlParameterSourceProvider<>());
        itemWriter.afterPropertiesSet();

        return itemWriter;
    }

    @Bean
    public AsyncItemWriter asyncCustomItemWriter() {
        AsyncItemWriter<Customer> itemWriter = new AsyncItemWriter<>();
        itemWriter.setDelegate(customItemWriter());

        return itemWriter;
    }
}
```

즉, ItemProcessor와 ItemWriter를 각각 구현한 후 AsyncItemProcessor와 AsyncItemWriter가 각각 앞서 구현한 ItemProcessor와 ItemWriter에 역할을 위임하는 식으로 진행하게 된다.

이를 실행하게 되면 비동기 방식의 Processor와 Writer가 동작을 하며 내부적으로 ItemProcessor와 ItemWriter가 동작하게 된다.

**만약 동기적으로 실행하게 된다면 ItemProcessor 내부에 `Thread.sleep(100)` 이 있기 때문에 100개의 데이터를 처리하며 약 10초 가량 시간이 걸리지만,
비동기로 실행하게 되면 각각의 스레드가 처리를 하기 때문에 각 스레드마다 100ms의 시간 이후 처리를 하게 되어 굉장히 빠르게 마무리 될 수 있다.**

즉, 비동기로 실행하게 되면 멀티 스레드와 같이 동작하는 것이다.

## Multi-threaded Step

Step 내에서 멀티 스레드로 Chunk 기반 처리가 이루어지는 구조

TaskExecutorRepeateTemplate이 반복자로 사용되며 설정한 개수 만큼의 스레드를 생성하여 수행한다.

![Untitled](/static/images/batch/batch62.png)

![Untitled](/static/images/batch/batch63.png)

이때 각 스레드간에 데이터는 공유되지 않으며, 각 Worker는 각각 다음 단계에 전달하게 된다.

TaskExecutorRepeateTemplate의 경우, TaskExecutor를 생성할 때 별도로 지정하지 않는다면 SyncTaskExecutor를 사용한다. 

즉 동기적으로 동작하게 된다.

따라서 비동기를 사용하기 위해서는 비동기가 가능한 `SimpleAsyncTaskExecutor` 와 같은 구현체를 사용하거나 직접 구현하는 것이 좋다.

⚠️ **참고로, 멀티 스레드 환경에서 동기화 이슈를 방지하기 위해서는 `PagingReader` 종류를 사용하는 것이 좋다.**

```java
@Configuration
@RequiredArgsConstructor
public class JobConfig {
    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;
    private final DataSource dataSource;

    private final static int chunkSize = 5;

    @Bean
    public Job batchJob() throws InterruptedException {
        return new JobBuilder("customJob1", jobRepository)
                .incrementer(new RunIdIncrementer())
                .listener(new StopWatchJobListener())
                .start(step1())
                .build();
    }

    @Bean
    public Step step1() throws InterruptedException {
        return new StepBuilder("step1", jobRepository)
                .<Customer, Customer>chunk(100, transactionManager)
                .reader(pagingItemReader())
                .listener(new CustomItemReadListener())
                .processor(customItemProcessor())
                .listener(new CustomItemProcessListener())
                .writer(customItemWriter())
                .listener(new CustomWriteListener())
                .taskExecutor(new SimpleAsyncTaskExecutor())
                .build();
    }

    @Bean
    public ItemProcessor<Customer, Customer> customItemProcessor() throws InterruptedException {

        return new ItemProcessor<Customer, Customer>() {

            @Override
            public Customer process(Customer item) throws Exception {
                return new Customer(item.getId(), item.getFirstName(), item.getLastName(), item.getBirthdate());
            }
        };
    }

    @Bean
    public JdbcPagingItemReader<Customer> pagingItemReader() {
        JdbcPagingItemReader<Customer> reader = new JdbcPagingItemReader<>();

        reader.setDataSource(dataSource);
        reader.setFetchSize(300);
        reader.setRowMapper(new CustomRowMapper());

        MySqlPagingQueryProvider queryProvider = new MySqlPagingQueryProvider();
        queryProvider.setSelectClause("id, firstName, lastName, birthdate");
        queryProvider.setFromClause("from customer");

        Map<String, Order> sortKeys = new HashMap<>(1);
        sortKeys.put("id", Order.ASCENDING);

        queryProvider.setSortKeys(sortKeys);
        reader.setQueryProvider(queryProvider);

        return reader;
    }

    @Bean
    public JdbcBatchItemWriter customItemWriter() {
        JdbcBatchItemWriter<Customer> itemWriter = new JdbcBatchItemWriter<>();

        itemWriter.setDataSource(dataSource);
        itemWriter.setSql("insert into customer2 values (:id, :firstName, :lastName, :birthdate)");
        itemWriter.setItemSqlParameterSourceProvider(new BeanPropertyItemSqlParameterSourceProvider<>());
        itemWriter.afterPropertiesSet();

        return itemWriter;
    }
}
```

이렇게 코드를 작성하고, 각각의 listener를 통해 현재의 스레드와 읽은 값을 확인하면 여러가지의 Thread의 값이 나오며 일정한 순서가 아닌 Item의 ID값이 나오는 것을 확인할 수 있다.

하지만, 만약 `.taskExecutor(new SimpleAsyncTaskExecutor())` 이 부분을 사용하지 않게 되면 기본인 동기 방식을 사용하게 되기 때문에 Thread의 값이 모두 main으로 나오면서 Item의 ID 또한 1번부터 차례대로 나오는 것을 확인할 수 있다.

## Parallel Steps

SplitState를 사용해서 여러개의 Flow를 병렬적으로 실행하는 구조이다.

실행이 다 완료된 후 FlowExecutionStatus 결과를 취합해서 다음 단계 결정을 한다.

![Untitled](/static/images/batch/batch64.png)

![Untitled](/static/images/batch/batch65.png)

각 Worker는 독립적으로 병렬 처리를 수행하게 되며, 이후 결과를 모두 받고 이를 고려하여 FlowExecutionStatus를 반환하는데 이를 통해 다음 Flow를 진행할 것인지 결정하게 된다.

![Untitled](/static/images/batch/batch66.png)

여기서, `flow1()` , `flow2()` , `flow3()` 는 병렬 처리가 되지만,

 `flow4()` 의 경우는 병렬 처리에 포함되지 않는다.

이를 코드로 살펴보도록 하자.

```java
public class CustomTasklet implements Tasklet {
    private long sum;

    @Override
    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
            for (int i = 0; i < 1000000000; i++)
                sum++;
            System.out.println(
                    chunkContext.getStepContext().getStepName() +
                            Thread.currentThread() +
                            " sum : " + sum
            );
        return RepeatStatus.FINISHED;
    }
}

@Configuration
@RequiredArgsConstructor
public class JobConfig {
    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;

    @Bean
    public Job job() {
        return new JobBuilder("job", jobRepository)
                .incrementer(new RunIdIncrementer())
                .start(flow1())
                .split(new SimpleAsyncTaskExecutor()).add(flow2())
                .end()
                .listener(new StopWatchJobListener())
                .build();
    }

    @Bean
    public Flow flow1() {
        TaskletStep step1 = new StepBuilder("step1", jobRepository)
                .tasklet(tasklet(), transactionManager)
                .build();

        return new FlowBuilder<Flow>("flow1")
                .start(step1)
                .build();
    }

    @Bean
    public Flow flow2() {
        TaskletStep step2 = new StepBuilder("step2", jobRepository)
                .tasklet(tasklet(), transactionManager)
                .build();
        TaskletStep step3 = new StepBuilder("step3", jobRepository)
                .tasklet(tasklet(), transactionManager)
                .build();

        return new FlowBuilder<Flow>("flow2")
                .start(step2)
                .next(step3)
                .build();
    }

    @Bean
    public Tasklet tasklet() {
        return new CustomTasklet();
    }
}
```

이를 수행하게 되면, 아래와 같은 출력을 확인할 수 있다.

```java
step1Thread[SimpleAsyncTaskExecutor-2,5,main] sum : 1023172995
step2Thread[SimpleAsyncTaskExecutor-1,5,main] sum : 1026581165
step3Thread[SimpleAsyncTaskExecutor-1,5,main] sum : 2026581165
```

여기서 보면 sum의 값이 이상한 것을 확인할 수 있다.

올바른 값이 나오게 된다면 Tasklet에서 10억번 sum을 하기 때문에 순서대로 10억, 20억, 30억이 나와야 한다.

하지만 여기서 나오게 된 값은 `step1()` 과 `step2()` 는 거의 일치하게 나온 것을 확인할 수 있다.

이는 동시성 문제가 발생하였기 때문이다.

병렬 처리를 할 때 하나의 빈으로 등록된 Tasklet을 같이 처리했기 때문에 동시에 `sum` 에 접근하였고, 동시성 문제가 발생하여 제대로된 값이 나오지 않은 것이다.

이러한 문제를 해결해야 하는데, 단순한 방법으로는 `synchronized()` 를 사용하는 것이다.

```java
public class CustomTasklet implements Tasklet {
    private long sum;
    private Object lock = new Object();

    @Override
    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
        synchronized (lock) {
            for (int i = 0; i < 1000000000; i++)
                sum++;
            System.out.println(
                    chunkContext.getStepContext().getStepName() +
                            Thread.currentThread() +
                            " sum : " + sum
            );
        }
        return RepeatStatus.FINISHED;
    }
}
```

만약 위와 같이 수정하게 된다면, 동기적으로 처리하도록 하여 동시성 문제를 해결할 수 있다.

물론 성능적인 문제를 감수해야 한다.

수정 이후 동작을 시키게 된다면

```java
step1Thread[SimpleAsyncTaskExecutor-2,5,main] sum : 1000000000
step2Thread[SimpleAsyncTaskExecutor-1,5,main] sum : 2000000000
step3Thread[SimpleAsyncTaskExecutor-1,5,main] sum : 3000000000
```

이렇게 출력이 되는 것을 확인할 수 있다.

## Partitioning

MasterStep이 SlaveStep을 실행시키는 구조이다.

SlaveStep은 각 스레드에 의해 독립적으로 실행이 되며, 독립적인 StepExecution파라미터 환경을 구성한다.

또한 ItemReader / ItemProcessor / ItemWriter 등을 가지고 동작하며 작업을 독립적으로 병렬 처리한다.

MasterStep은 PartitionStep 이며 SlaveStep은 TaskletStep, FlowStep 등이 올 수 있다.

![Untitled](/static/images/batch/batch67.png)

![Untitled](/static/images/batch/batch68.png)

전체적인 흐름을 살펴보자면 아래와 같이 동작하게 된다.

![Untitled](/static/images/batch/batch69.png)

![Untitled](/static/images/batch/batch70.png)

이어서 제공되는 API를 살펴보자.

![Untitled](/static/images/batch/batch71.png)

- `partitioner()` 에는 이름과 구현체를 파라미터로 넘기게 된다.
- `step()` 의 경우 Slave 역할을 하는 Step설정을 하며 TaskletStep, FlowStep이 들어올 수 있다.
- `gridSize()` 파티션 구분을 위한 값 설정으로 몇개의 파티션으로 나눌지 설정한다.

이를 사용하여 아래와 같이 코드를 작성해볼 수 있다.

```java
@Configuration
@RequiredArgsConstructor
public class PartitionConfig {
    private final JobRepository jobRepository;
    private final DataSource dataSource;
    private final PlatformTransactionManager transactionManager;

    @Bean
    public Job job() {
        return new JobBuilder("job", jobRepository)
                .incrementer(new RunIdIncrementer())
                .start(masterStep())
                .build();
    }

    @Bean
    public Step masterStep() {
        return new StepBuilder("master", jobRepository)
                .partitioner(slaveStep().getName(), partitioner())
                .step(slaveStep())
                .gridSize(4)
                .taskExecutor(new SimpleAsyncTaskExecutor())
                .build();

    }

    private Partitioner partitioner() {
        ColumnRangePartitioner partitioner = new ColumnRangePartitioner();

        partitioner.setColumn("id");
        partitioner.setDataSource(dataSource);
        partitioner.setTable("customer");

        return partitioner;
    }

    @Bean
    public Step slaveStep() {
        return new StepBuilder("slaveStep", jobRepository)
                .<Customer, Customer>chunk(100, transactionManager)
                .reader(pagingItemReader(null, null)) //컴파일 에러 방지용 null
                .writer(customItemWriter())
                .build();
    }

    @Bean
    public ItemProcessor<Customer, Customer> customItemProcessor() throws InterruptedException {

        return new ItemProcessor<Customer, Customer>() {

            @Override
            public Customer process(Customer item) throws Exception {
                return new Customer(item.getId(), item.getFirstName(), item.getLastName(), item.getBirthdate());
            }
        };
    }

    @Bean
    @StepScope
    public JdbcPagingItemReader<Customer> pagingItemReader( //동적으로 실행시에 맞춰서 파라미터가 들어각 된다.
            @Value("#{stepExecution['minValue']}") Long minValue,
            @Value("#{stepExecution['maxValue']}") Long maxValue
    ) {
        System.out.println("reading : " + minValue + " to " + maxValue);

        JdbcPagingItemReader<Customer> reader = new JdbcPagingItemReader<>();

        reader.setDataSource(dataSource);
        reader.setFetchSize(300);
        reader.setRowMapper(new CustomRowMapper());

        MySqlPagingQueryProvider queryProvider = new MySqlPagingQueryProvider();
        queryProvider.setSelectClause("id, firstName, lastName, birthdate");
        queryProvider.setFromClause("from customer");
        queryProvider.setWhereClause("where id >= " + minValue + " and id < " + maxValue);

        Map<String, Order> sortKeys = new HashMap<>(1);
        sortKeys.put("id", Order.ASCENDING);

        queryProvider.setSortKeys(sortKeys);
        reader.setQueryProvider(queryProvider);

        return reader;
    }

    @Bean
    public JdbcBatchItemWriter customItemWriter() {
        JdbcBatchItemWriter<Customer> itemWriter = new JdbcBatchItemWriter<>();

        itemWriter.setDataSource(dataSource);
        itemWriter.setSql("insert into customer2 values (:id, :firstName, :lastName, :birthdate)");
        itemWriter.setItemSqlParameterSourceProvider(new BeanPropertyItemSqlParameterSourceProvider<>());
        itemWriter.afterPropertiesSet();

        return itemWriter;
    }
}
```

```java
public class ColumnRangePartitioner implements Partitioner {
    private JdbcOperations jdbcTemplate;

    private String table;

    private String column;

    /**
     * The name of the SQL table the data are in.
     * @param table the name of the table
     */
    public void setTable(String table) {
        this.table = table;
    }

    /**
     * The name of the column to partition.
     * @param column the column name.
     */
    public void setColumn(String column) {
        this.column = column;
    }

    /**
     * The data source for connecting to the database.
     * @param dataSource a {@link DataSource}
     */
    public void setDataSource(DataSource dataSource) {
        jdbcTemplate = new JdbcTemplate(dataSource);
    }

    /**
     * Partition a database table assuming that the data in the column specified are
     * uniformly distributed. The execution context values will have keys
     * <code>minValue</code> and <code>maxValue</code> specifying the range of values to
     * consider in each partition.
     *
     * @see Partitioner#partition(int)
     */
    @Override
    public Map<String, ExecutionContext> partition(int gridSize) {
        int min = jdbcTemplate.queryForObject("SELECT MIN(" + column + ") from " + table, Integer.class);
        int max = jdbcTemplate.queryForObject("SELECT MAX(" + column + ") from " + table, Integer.class);
        int targetSize = (max - min) / gridSize + 1;

        Map<String, ExecutionContext> result = new HashMap<>();
        int number = 0;
        int start = min;
        int end = start + targetSize - 1;

        while (start <= max) {
            ExecutionContext value = new ExecutionContext();
            result.put("partition" + number, value);

            if (end >= max) {
                end = max;
            }
            value.putInt("minValue", start);
            value.putInt("maxValue", end);
            start += targetSize;
            end += targetSize;
            number++;
        }

        return result;
    }

}
```

## SynchronizedItemStreamReader

Thread-safe하지 않은 ItemReader를 Thread-safe하게 처리하도록 하는 역할을 한다.

Thread-safe하게 처리되어 있는 Paging관련 Reader가 아닌 다른 Reader를 사용하면서 Thread-safe를 하기 위해서 사용할 수 있다.

![Untitled](/static/images/batch/batch72.png)

`new SynchronizedItemStreamReaderBuilder<T>()` 와 `.delegate(사용하는 Reader)` 를 통해서 만들 수 있다.

사용법은 기존에 Reader를 설정하는 것과 동일하며 간단하다.