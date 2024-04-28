---
title: ItemReader
date: '2024-04-26'
tags: ['spring batch']
draft: false
summary: ItemReader 상세
---
# XML, JSON 의 ItemReader

## ItemReader

### FlatFileItemReader

2차원 데이터(표) 로 표현된 유형의 파일을 처리하는 ItemReader이다.

일반적으로 고정 위치로 정의된 데이터 필드나 특수 문자에 의해 구별된 데이터의 행을 읽는다.

Resource, LineMapper 두가지 요소가 필요하다.

다음과 같은 구조를 가지고 잇다.

![Untitled](/static/images/batch/batch26.png)

- Resource
    - FileSystemResource → new FileSystemResource(파일의 경로)
    - ClassPathResource → new ClassPathResource(classPath 경로)
- LineMapper
    - 파일의 라인 한줄을 Object로 변환하여 FlatFileItemReader로 리턴한다.
    - 단순히 문자열을 받기 때문에 문자열을 토큰화 하여 객체로 매핑하는 과정이 필요하며, LineTokenize와 FieldSetMapper를 이용하여 처리한다.
    - FieldSet
        - 라인을 필드로 구분하여 만든 배열 토큰을 전달하면 토큰 필드를 참조할 수 있도록 한다.
        - JDBC의 ResultSet과 비슷하다.
    - LineTokenizer
        - 입력받은 라인을 FieldSet 으로 변환하여 리턴한다.
        - 파일마다 형식이 다르기 때문에 문자열을 FieldSet으로 변환하는 작업을 추상화시켜야 한다.
    - FieldSetMapper
        - FieldSet 객체를 받아서 원하는 객체로 매핑해서 리턴한다.
- LineTokenizer
    - DelimitedLineTokenizer
        - 한 개 라인의 String을 구분자 기준으로 나누어 토큰화 하는 방식으로, 기본적으로 해당 구분자가 존재하는지에 따라 파싱 예외를 발생시키는 strict가 true로 되어있다.
            - `IncorrectTokenCountExcetion`이 발생할 수 있다.
    - FixedLengthTokenizer
        - 한 개 라인의 String을 사용자가 설정한 고정길이 기준으로 나누어 토큰화 하는 방식으로, 기본적으로 길이가 정확하게 맞아 떨어지지 않으면 파싱 예외를 발생시키는 strict가 false로 되어있다.
            - `IncorrectLineLengthException` 이 발생할 수 있다.
- Exception Handling (strict)
    - 라인을 읽거나 토큰화 할 때 발생하는 파싱 예외를 처리할 수 있도록 예외 계층을 제공하는데, 토큰화 검증을 엄격하게 적용하지 않도록 strict를 false로 설정하게 되면 해당 예외를 발생하지 않게 할 수 있다.

FlatFileItemReader가 가지고 있는 메소드는 아래와 같다.

![Untitled](/static/images/batch/batch27.png)

### StaxEventItemReader

XML을 받을 수 있는 ItemReader의 종류이다.

XML 방식에는 3가지가 있다.

- DOM 방식
    - 문서 전체를 메모리에 로드한 후 Tree형태로 만들어 데이터를 처리하는 방식으로, pull 방식이다.
- SAX 방식
    - 문서의 항목을 읽을 때 이벤트가 발생하여 데이터를 처리하는 방식으로, push 방식이다.
- StAX 방식
    - DOM과 SA의 장단점을 보완한 API모델로, push와 pull을 동시에 제공하는 것이다.
    - Iterator API 방식
        - XMLEventReader의 `nextEvent()` 를 호출하여 이벤트 객체를 가지고 온다.
        - 이벤트 객체는 XML 태그 유형 (요소, 텍스트, 주석 등) 에 대한 정보를 제공한다.
    - Cursor API 방식
        - JDBC ResultSet 처럼 동작하는 API로 XMLStreamReader는 XML 문서의 다음 요소로 커서를 이동한다.
        - 커서에서 직접 메소드를 호출하여 현재 이벤트에 대한 자세한 정보를 얻는다.

**Spring-OXM**

스프링의 Object XML Mapping 기술로 XML 바인딩 기술을 추상화 한다.

- Marshaller
    - marshall - 객체를 XML로 직렬화 하는 행위
- Unmarchaller
    - unmarshall - XML을 객체로 역질렬화 하는 행위

따라서 스프링 배치는 특정한 XML바인딩 기술을 강요하지 않고 Spring OXM에 위임한다.

**Spring Batch XML**

스프링 배치에서는 StAX 방식으로 XML 문서를 처리하는 StaxEventItemReader를 제공하는데, XML을 읽어 자바 객체로 매핑하고 자바 객체를 XML로 쓸 수 있는 트랜잭션 구조를 지원한다.

참고로, 이를 위해서는 다음 의존성을 필요로 한다.

```java
    // https://mvnrepository.com/artifact/org.springframework/spring-oxm
    implementation 'org.springframework:spring-oxm:6.1.5'

    // https://mvnrepository.com/artifact/com.thoughtworks.xstream/xstream
    implementation 'com.thoughtworks.xstream:xstream:1.4.16'
    // 18 버전 이상 부터 설정이 추가되어 추가 조사가 필요함
```

![Untitled](/static/images/batch/batch28.png)

StaxEventItemReader를 생성할 때 제공되는 메소드를 확인하면 다음과 같다.

![Untitled](/static/images/batch/batch29.png)

이러한 방식을 간단하게 표현하면 아래와 같다.’

```xml
<?xml version="1.0" encoding="UTF-8"?>
<customers>
    <customer id="1">
        <id>1</id>
        <name>hong gil dong1</name>
        <age>40</age>
    </customer>
    <customer id="2">
        <id>2</id>
        <name>hong gil dong2</name>
        <age>34</age>
    </customer>
    <customer id="3">
        <id>3</id>
        <name>hong gil dong3</name>
        <age>44</age>
    </customer>
    <customer id="4">
        <id>4</id>
        <name>hong gil dong4</name>
        <age>57</age>
    </customer>
    <customer id="5">
        <id>5</id>
        <name>hong gil dong5</name>
        <age>12</age>
    </customer>
    <customer id="6">
        <id>6</id>
        <name>hong gil dong6</name>
        <age>45</age>
    </customer>

</customers>
```

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
                .build();
    }

    @Bean
    public Step step1() {
        return new StepBuilder("chunkStep", jobRepository)
                .<Customer, Customer>chunk(3, transactionManager)
                .reader(customItemReader())
                .writer(customItemWriter())
                .build();
    }

    @Bean
    public ItemWriter<Customer> customItemWriter() {
        return items -> {
            for (Customer item : items)
                System.out.println("item = " + item);
        };
    }

    @Bean
    public ItemReader<Customer> customItemReader() {
        return new StaxEventItemReaderBuilder<Customer>()
                .name("xmlFile")
                .resource(new ClassPathResource("customer.xml"))
                .addFragmentRootElements("customer")
                .unmarshaller(itemUnmarshaller())
                .build();
    }

    @Bean
    public Unmarshaller itemUnmarshaller() {
        Map<String, Class<?>> aliases = new HashMap<>();
        aliases.put("customer", Customer.class);
        aliases.put("id", Long.class);
        aliases.put("name", String.class);
        aliases.put("age", Integer.class);

        XStreamMarshaller xStreamMarshaller = new XStreamMarshaller();
        xStreamMarshaller.setAliases(aliases);

        return xStreamMarshaller;
    }
}
```

이를 실행하게 되면

```xml
item = Customer(id=1, name=hong gil dong1, age=40)
item = Customer(id=2, name=hong gil dong2, age=34)
item = Customer(id=3, name=hong gil dong3, age=44)
item = Customer(id=4, name=hong gil dong4, age=57)
item = Customer(id=5, name=hong gil dong5, age=12)
item = Customer(id=6, name=hong gil dong6, age=45)
```

이러한 출력을 확인할 수 있다.

### JsonItemReader

Json 데이터의 Parsing과 Binding을 JsonObjectReader 인터페이스 구현체에 위임하여 처리하는 ItemReader이다.

두가지 구현체를 제공하고 있다.

- JacksonJsonObjectReader
- GsonJsonObjectReader

![Untitled](/static/images/batch/batch30.png)

이를 활용하여 아래와 같이 간단한 코드를 작성할 수 있다.

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
                .build();
    }

    @Bean
    public Step step1() {
        return new StepBuilder("chunkStep", jobRepository)
                .<Customer, Customer>chunk(1, transactionManager)
                .reader(customItemReader())
                .writer(customItemWriter())
                .build();
    }

    @Bean
    public ItemWriter<Customer> customItemWriter() {
        return items -> {
            for (Customer item : items)
                System.out.println("item = " + item);
        };
    }

    @Bean
    public ItemReader<Customer> customItemReader() {
        return new JsonItemReaderBuilder<Customer>()
                .name("jsonReader")
                .resource(new ClassPathResource("customer.json"))
                .jsonObjectReader(new JacksonJsonObjectReader<>(Customer.class))
                .build();
    }
}
```

# DB 관련 ItemReader

배치 어플리케이션은 실시간 처리가 어려운 대용량 데이터를 다루며, 이 때 DB I/O 성능문제와 메모리 자원의 효율성 문제를 해결할 수 있어야 한다.

스프링 배치에서는 대용량 데이터 처리를 위해 두가지 해결 방안을 제시하고 있다.

1. Cusor Based
    
    JDBC ResultSet의 기본 메커니즘을 사용하는 것으로, 현재 행에서 커서를 유지하며 다음 데이터를 호출하면 다음 행으로 커서를 이동하며 데이터 반환이 이루어지는 Streaming 방식의 I/O 이다.
    
    ResultSet이 Open될 때 마다 `next()` 가 호출되어 DataBase의 데이터가 반환되고 객체와 매핑이 이루어진다.
    
    DB Connection이 연결되면 배치 처리가 완료될 때 까지 데이터를 읽어오기 때문에 DB와 SocketTimeout을 충분히 큰 값으로 설정할 필요가 있으며 모든 결과를 메모리에 할당하기 때문에 메모리 사용량이 많아진다는 단점이 있다.
    
    Connection 연결 유지 시간과 메모리 공간이 충분하다면 대량의 데이터 처리에 적합할 수 있다.
    
    fetchSize를 조절하며 한번에 가져올 데이터를 지정하는 것 또한 가능하다.
    
2. Paging Based
    
    페이징 단위로 데이터를 조회하는 방식으로 PageSize만큼 한번에 메모리로 가지고 온 다음 한개씩 읽는다.
    
    한 페이지를 읽을 때 마다 Connection을 맺고, 끊기 때문에 대량의 데이터를 처리하더라도 SocketTimeout이 발생하지 않을 수 있다.
    
    시작 행 번호를 지정하고, 페이지에 반환하고자 하는 행의 수를 지정한 후 사용하는 방식으로 Offset과 Limit를 적당히 지정해야 하며 페이징 단위의 결과만 메모리에 할당하기 때문에 메모리 사용량이 적어진다는 장점이 있다.
    
    또한 Connection연결 유지 시간이 길지 않고, 메모리 공간을 효율적으로 사용할 수 있기 때문에 이러한 특성이 필요한 데이터 처리에 적합하다.
    

![Untitled](/static/images/batch/batch31.png)

## Cusror Based

### JdbcCursorItemReader

Cursor 기반의 JDBC 구현체로 ResultSet과 함께 사용되며 Datasource에서 Connection을 얻어와 SQL을 실행한다.

하지만, Thread 안정성이 보장되지 않아 멀티 스레드 환경에서 사용하는 경우 같은 Cursor가 생기는 것과 같은 동시성 이슈가 발생하지 않도록 별도의 동기화 처리가 필요하다.

![Untitled](/static/images/batch/batch32.png)

이에 대해서는 아래와 같이 코드를 작성할 수 있다.

```java
@Configuration
@RequiredArgsConstructor
public class JobConfig {
    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;
    private final DataSource dataSource;
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
    public ItemReader<Customer> customerItemReader() {
        return new JdbcCursorItemReaderBuilder<Customer>()
                .name("jdbcReader")
                .fetchSize(chunkSize)
                .sql("select * from customer where firstName like ? order by id")
                .beanRowMapper(Customer.class)
                .queryArguments("A%")
                .dataSource(dataSource)
                .build();
    }

    @Bean
    public ItemWriter<Customer> customerItemWriter() {
        return items -> {
            for (Customer item : items) {
                System.out.println("item = " + item);
            }
        };
    }
}
```

### JpaCursorItemReader

SpringBatch 4.3 버전 부터 지원하기 시작한 ItemReader이다.

Cusor기반의 JPA 구현체로 EntityManagerFactory 객체가 필요하며 쿼리는 JPQL을 사용한다.

![Untitled](/static/images/batch/batch33.png)

이는 아래와 같이 작성할 수 있다.

```java
@Configuration
@RequiredArgsConstructor
public class JobConfig {
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
                .<Customer, Customer>chunk(chunkSize, transactionManager)
                .reader(customerItemReader())
                .writer(customerItemWriter())
                .build();
    }

    @Bean
    public ItemReader<Customer> customerItemReader() {
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("firstName", "A%");

        return new JpaCursorItemReaderBuilder<Customer>()
                .name("jpaReader")
                .entityManagerFactory(entityManagerFactory)
                .queryString("select c from Customer c where firstName like :firstName")
                .parameterValues(parameters)
                .build();
    }

    @Bean
    public ItemWriter<Customer> customerItemWriter() {
        return items -> {
            for (Customer item : items) {
                System.out.println("item = " + item);
            }
        };
    }
}
```

## Paging Based

### JdbcPagingItemReader

Paging기반의 JDBC 구현체로, 쿼리에 시작 행 번호(offset), 페이징에서 반환할 행 수(limit)를 지정해서 sql을 실행한다.

스프링 배치에서 offset과 limit를 PageSize에 맞게 자동으로 생성해 주며 페이징 단위로 데이터를 조회할 때 마다 새로운 쿼리가 실행된다.

페이지마다 새로운 쿼리를 실행하기 때문에 순서를 보장하기 위해 orderBy 구분을 작성이 강제된다.

장점은 멀티 스레드 환경에서 Thread안정성을 보장하기 때문에 별도의 동기화를 할 필요가 없다.

![Untitled](/static/images/batch/batch34.png)

단, `queryProvider()` 를 설정하게 되면 `select~sortKey` 가 필요 없다.

```java
@Configuration
@RequiredArgsConstructor
public class JobConfig {
    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;
    private final DataSource dataSource;
    private final static int chunkSize = 10;

    @Bean
    public Job batchJob() throws Exception {
        return new JobBuilder("customJob", jobRepository)
                .incrementer(new RunIdIncrementer())
                .start(step1())
                .build();
    }

    @Bean
    public Step step1() throws Exception {
        return new StepBuilder("chunkStep", jobRepository)
                .<Customer, Customer>chunk(chunkSize, transactionManager)
                .reader(customerItemReader())
                .writer(customerItemWriter())
                .build();
    }

    @Bean
    public ItemReader<Customer> customerItemReader() throws Exception {
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("first_name", "A%");
        return new JdbcPagingItemReaderBuilder<Customer>()
                .name("pagingReader")
                .pageSize(chunkSize)
                .dataSource(dataSource)
                .rowMapper(new BeanPropertyRowMapper<>(Customer.class))
                .queryProvider(createQueryProvider())
                .parameterValues(parameters)
                .build();
    }

    @Bean
    public PagingQueryProvider createQueryProvider() throws Exception {
        SqlPagingQueryProviderFactoryBean queryProvider = new SqlPagingQueryProviderFactoryBean();
        queryProvider.setDataSource(dataSource);
        queryProvider.setSelectClause("id, first_name, last_name, birthdate");
        queryProvider.setFromClause("from customer");
        queryProvider.setWhereClause("where first_name like ?");

        Map<String, Order> sortKeys = new HashMap<>();
        sortKeys.put("id", Order.ASCENDING);

        queryProvider.setSortKeys(sortKeys);
        return queryProvider.getObject();
    }

    @Bean
    public ItemWriter<Customer> customerItemWriter() {
        return items -> {
            for (Customer item : items) {
                System.out.println("item = " + item);
            }
        };
    }
}
```

### JpaPagingItemReader

Paging기반의 JPA 구현체로 EntityManagerFactory가 필요하며 쿼리는 JPQL을 사용한다.

![Untitled](/static/images/batch/batch35.png)

이는 아래와 같이 간단하게 작성해 볼 수 있다.

```java
@Configuration
@RequiredArgsConstructor
public class JobConfig {
    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;
    private final EntityManagerFactory entityManagerFactory;
    private final static int chunkSize = 5;

    @Bean
    public Job batchJob() throws Exception {
        return new JobBuilder("customJob", jobRepository)
                .incrementer(new RunIdIncrementer())
                .start(step1())
                .build();
    }

    @Bean
    public Step step1() throws Exception {
        return new StepBuilder("chunkStep", jobRepository)
                .<Customer, Customer>chunk(chunkSize, transactionManager)
                .reader(customerItemReader())
                .writer(customerItemWriter())
                .build();
    }

    @Bean
    public ItemReader<Customer> customerItemReader() throws Exception {
        return new JpaPagingItemReaderBuilder<Customer>()
                .name("jpaReader")
                .entityManagerFactory(entityManagerFactory)
                .pageSize(chunkSize)
                .queryString("select c from customer c join fetch c.address")
                .build();
    }

    @Bean
    public ItemWriter<Customer> customerItemWriter() {
        return items -> {
            for (Customer item : items) {
                System.out.println("item = " + item);
            }
        };
    }
}
```

### ItemReaderAdapter

배치 Job 안에서 이미 있는 DAO나 다른 서비스를 ItemReader안에서 사용하고자 할 때 위임 역할을 한다.

![Untitled](/static/images/batch/batch36.png)