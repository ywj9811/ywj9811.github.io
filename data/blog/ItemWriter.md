---
title: ItemWriter
date: '2024-04-26'
tags: ['spring batch']
draft: false
summary: ItemWriter 상세
---
## FlatFileItemWriter

2차원 데이터(표)로 표현된 유형의 파일을 처리하는 ItemWriter로, 고정 위치로 정의된 데이터 필드나, 특수 문자에 의해 구별된 데이터의 행을 기록한다.

Resource와 LineAggregator 두가지 요소가 필요하다.

![Untitled](/static/images/batch/batch37.png)

### LineAggregator

Item을 받아서 String으로 변환하여 리턴하며 FieldExtractor를 사용해서 처리할 수 있다.

구현체로, PassThroughLineAggregator, DelimitedLineAggregator, FormatterLineAggregator가 있다.

### FieldExtractor

DelimitedLineAggregator, FormatterLineAggregator가 사용하며,

Item 객체의 필드를 배열로 만들고, 배열을 합쳐서 문자열을 만드는 메소드를 제공하는 인터페이스이다.

구현체로, BeanWrapperFieldExtractor, PassThroughFieldExtractor가 있다.

## StaxEventItemWriter

MXL 쓰는 과정은 읽기 과정에 대칭적이다.

StaxEventItemWriter는 Resource, marshaller, rootTagName이 필요하다.

![Untitled](/static/images/batch/batch38.png)

## JsonFileItemWriter

객체를 받아 JSON String으로 변환하는 역할을 한다.

![Untitled](/static/images/batch/batch39.png)

## JdbcItemWriter, JPAItemWriter

### JDBCItemWriter

JdbcCursorItemReqder 설정과 마찬가지로 dataSource를 지정하고, sql속성어 실행할 쿼리를 설정한다.

JDBC의 Batch기능을 사용하여 Bulk insert/updqte/delete 방식으로 처리한다.

단건 처리가 아닌 일괄처리이기 때문에 성능에 이점을 가진다.

![Untitled](/static/images/batch/batch40.png)

- `beanMapped()` 와 `columnMapped()` 둘 중 하나를 사용하면 된다.
    
    즉, 일반 클래스 타입 혹은 맵 형식으로 사용하면 된다.
    

```java
@RequiredArgsConstructor
@Configuration
public class JobConfigForWriter {
    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;
    private final DataSource dataSource;
    private final EntityManagerFactory entityManagerFactory;
    private final static int chunkSize = 10;

    @Bean
    public Job batchJob() {
        return new JobBuilder("customJob", jobRepository)
                .incrementer(new RunIdIncrementer())
                .start(step1())
                .build();
    }

    @Bean
    public Step step1() {
        return new StepBuilder("chunkStep", jobRepository)
                .<Customer, Customer>chunk(chunkSize, transactionManager)
                .reader(customerItemReader())
                .writer(customerItemWriter())
                .build();
    }

    @Bean
    public ItemWriter<? super Customer> customerItemWriter() {
        return new JdbcBatchItemWriterBuilder<Customer>()
                .dataSource(dataSource)
                .sql("insert into customer2 values (:id, :first_name, :last_name, :birthdate)")
                .beanMapped()
                .build();
    }

    @Bean
    public ItemReader<Customer> customerItemReader() {
        return new JpaCursorItemReaderBuilder<Customer>()
                .name("jpaReader")
                .entityManagerFactory(entityManagerFactory)
                .queryString("select c from Customer c")
                .build();
    }
}
```

이와 같이 사용하여 customer 테이블로 부터 읽어와, customer2 테이블에 저장할 수 있다.

### JPAItemWriter

JPA Entity 기반으로 데이터를 처리하며 EntityManagerFactory를 주입받아 사용한다.

Entity를 하나씩 Chunk크기만큼 insert혹은 merge한 다음 flush한다.

ItemReader나 ItemProcessor로 부터 아이템을 전달 받을 때에는 Entity 클래스 타입으로 받아야 한다.

![Untitled](/static/images/batch/batch41.png)

이는 아래와 같이 작성할 수 있다.

```java
public class CustomItemProceessor implements ItemProcessor<Customer, Customer2> {

    private ModelMapper modelMapper = new ModelMapper();
    // ModelMapper 의존성 추가

    @Override
    public Customer2 process(Customer item) throws Exception {
        return modelMapper.map(item, Customer2.class);
    }
}

@RequiredArgsConstructor
@Configuration
public class JobConfigForWriter {
    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;
    private final EntityManagerFactory entityManagerFactory;
    private final static int chunkSize = 10;

    @Bean
    public Job batchJob() {
        return new JobBuilder("customJob", jobRepository)
                .incrementer(new RunIdIncrementer())
                .start(step1())
                .build();
    }

    @Bean
    public Step step1() {
        return new StepBuilder("chunkStep", jobRepository)
                .<Customer, Customer2>chunk(chunkSize, transactionManager)
                .reader(customerItemReader())
                .processor(customItemProcessor())
                .writer(customerItemWriter())
                .build();
    }

    @Bean
    public ItemProcessor<Customer, Customer2> customItemProcessor() {
        return new CustomItemProceessor();
    }

    @Bean
    public ItemWriter<Customer2> customerItemWriter() {
        return new JpaItemWriterBuilder<Customer2>()
                .entityManagerFactory(entityManagerFactory)
                .build();
    }

    @Bean
    public ItemReader<Customer> customerItemReader() {
        return new JpaCursorItemReaderBuilder<Customer>()
                .name("jpaReader")
                .entityManagerFactory(entityManagerFactory)
                .queryString("select c from Customer c")
                .build();
    }
}
```

### ItemWriteAdapter

배치 Job 안에서 이미 있는 DAO나 다른 서비스를 ItemWriter 안에서 사용하고자 할 때 위임 역할을 한다.

![Untitled](/static/images/batch/batch42.png)