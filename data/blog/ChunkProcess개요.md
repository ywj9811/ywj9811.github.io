---
title: ChunkProcess
date: '2024-04-24'
tags: ['spring batch']
draft: false
summary: ChunkProcess 개요
---
## Chunk

Chunk란 여러개의 아이템을 묶은 하나의 덩어리 혹은 블록을 의미한다.

한번에 하나씩 아이템을 입력 받고, Chunk단위의 덩어리로 만든 후 Chunk 단위로 트랜잭션을 처리한다.

따라서 Chunk단위의 Commit혹은 Rollback을 처리한다.

일반적으로 대용량 데이터를 한번에 처리하는 것이 아닌 청크 단위로 쪼개어져 더이상 처리할 데이터가 없을 때 까지 입출력하는데 사용된다.

![Untitled](/static/images/batch/batch20.png)

### `Chunk<I>` vs `Chunk<O>`

`Chunk<I>` 는 ItemReader(입력기)로 읽은 하나의 아이템을 Chunk에서 저장한 개수만큼 반복해서 저장하는 타입

`Chunk<O>` 는 IteamReader로 부터 전달받은 `Chunk<I>`를 참조하여 ItemProcessor에서 가공 후 ItemWriter(출력기)에 전달하는 타입

![Untitled](/static/images/batch/batch21.png)

이것을 간단하게 흐름을 정리하자면 다음과 같다.

![Untitled](/static/images/batch/batch22.png)

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
                .start(chunkStep())
                .build();
    }

    @Bean
    public Step chunkStep() {
        return new StepBuilder("chunkStep", jobRepository)
                .<String, String>chunk(5, transactionManager)
                .reader(new ListItemReader<>(Arrays.asList("item1", "item2", "item3", "item4", "item5")))
                .processor(new ItemProcessor<String, String>() {
                    @Override
                    public String process(String item) throws Exception {
                        Thread.sleep(300);
                        System.out.println("item : " + item);
                        return "my " + item;
                    }
                })
                .writer(new ItemWriter<String>() {
                    @Override
                    public void write(Chunk<? extends String> chunk) throws Exception {
                        List<? extends String> items = chunk.getItems();
                        items.forEach(System.out::println);
                    }
                })
                .build();
    }
}
```

아주 간단하게 위와 같이 작성해 볼 수 있다.

## ChunkOrientedTasklet

ChunkOrientedTasklet은 스프링 배치에서 제공하는 Tasklet의 구현체로 Chunk 지향 프로세싱을 담당하는 도메인 객체이다.

여기서 ItemReader, ItemProcessor 를 사용하여 Chunk 기반의 데이터 입출력 처리를 담당한다.

TaskletStep에 의해 반복적으로 실행되며 각각의 ChunkOrientedTasklet가 실행될 때 마다 새로운 트랜잭션이 생성되어 처리가 된다. 따라서 Exception이 발생한다면 해당 Chunk만 롤백되고 다른 Chunk는 영향을 받지 않는다.

![Untitled](/static/images/batch/batch23.png)

### ChunkProvider

ItemReader를 사용해서 소스로부터 아이템을 ChunkSize 만큼 읽어서 Chunk단위로 만들어 제공하는 도메인 객체이다.

`Chunk<I>`를 만들고 내부적으로 반복문을 호출하여 ItemReader의 `read()` 를 계속 호출하며 Item을 Chunk에 쌓는다.

외부로 부터 ChunkProvider가 호출될 때 마다 새로운 Chunk가 생성되는 것이다.

반복문 종료 시점

1. ChunkSize 만큼 Item을 읽으면 반복문 종료되고 ChunkProcessor로 넘어간다.
2. ItemReader가 읽은 Item이 Null일 경우 반복문 종료 및 해당 Step 반복문까지 종료된다.

기본 구현체로 SimpleChunkProvider와 FaultTolerantChunkProvider가 존재한다.

### ChunkProcessor

ItemProcessor를 사용하여 Item을 변형, 가공, 필터링 하고 ItemWriter를 사용하여 Chunk 데이터를 저장 및 출력한다.

`Chunk<O>` 를 만들고 앞에서 넘어온 `Chunk<I>` 의 Item을 한건씩 처리한 후 `Chunk<O>`에 저장한다.

외부로 부터 ChunkProcessor가 호출될 때 마다 새로운 Chunk가 생성되는 것이다.

ItemWriter의 작업이 완료되게 되면 Chunk 트랜잭션이 종료하게 되고 Step 반복문에 있는 새로운 ChunkOrientedTasklet이 실행된다.

기본 구현체로 SimpleChunkProcessor와 FaultTolerantChunkProcessor가 존재한다.

## ItemReader / ItemWriter / ItemProcsesor

### ItemReader

다양한 입력으로 부터 데이터를 읽어서 제공하는 인터페이스이다.

- csv, txt, xml, JSON, DB, JMS, RabbitMQ와 같은 MessageQueue와 같은 것으로 부터 읽을 수 있으며 CustomReader를 통해 멀티 스레드 환경에서 스레드에 안전하게 구성할 수 있다.

ChunkOrientedTasklet 실행을 위해 필수로 설정해야 하는 요소이다.

### ItemProcessor

데이터를 출력하기 전에 데이터를 가공, 변형, 필터링 하는 역할이다.

ItemReader, ItemWriter와 분리되어 비즈니스 로직을 구현할 수 있다.

ChunkOritentedTasklet 실행 관련해서 필수적인 요소가 아닌 선택적인 요소로 반드시 필요한 것은 아니다.

### ItemWriter

Chunk단위로 데이터를 전달받아 일괄 출력 작업을 위한 인터페이스이다.

- csv, txt, xml, JSON 등등 Reader에서 읽을 수 있는 대부분의 데이터를 출력할 수 있으며 아이템 하나가 아닌 리스트로 전달을 받는다.

ChunkOrientedTasklet 실행을 위해 필수로 설정해야 하는 요소이다.

ItemWriter를 통해 출력을 완료하게 되면 트랜잭션이 종료되고, 이후 새로운 트랜잭션을 생성하게 된다.

예를 들어, name을 가지는 객체를 ItemReader에서 읽고, ItemReader에서 나온 객체를 Chunk단위로 ItemProcessor에게 전달하면 ItemProcessor에서 모두 대문자로 바꾸는 처리를 하고 모아서 ItemWriter로 전달하게 된다.

그렇게 하게 된다면 ItemWriter에서는 ItemProcessor에서 처리된 내용을 사용할 수 있는 것이다.

![Untitled](/static/images/batch/batch24.png)

## ItemStream

ItemReader와 ItemWriter 처리 과정 중 상태를 저장하고 오류가 발생하면 해당 상태를 참조하여 실패한 곳에서 재시작 할 수 있도록 지원한다.

리소스를 열고, 닫아야 하며 입출력 장치 초기화 등의 작업을 해야 하는 경우 사용할 수 있다.

ItemReader 및 ItemWriter와 함께 ItemStream을 구현해서 사용할 수 있다.

ItemStreamReader, ItemStreamWriter 구현.

- `open()` : 리소스 열고, 초기화를 하는 것으로 초기 1회 실행한다.
- `update()` : 현재 상태 정보 저장하는 것으로 Chunk Size만큼 반복한다.
- `close()`  : 모든 리소스를 닫는 것으로 마지막 1회 실행한다.

```java
@RequiredArgsConstructor
public class CustomItemReader implements ItemStreamReader<String> {
    private final List<String> items;
    private int index = -1;
    private boolean restart = false;

    @Override
    public String read() {
        String item = null;

        if (this.index < this.items.size()) {
            item = this.items.get(index);
            index++;
        }

        if (this.index == 6 && !restart)
            throw new RuntimeException("Restart is Required");

        return item;
    }

    @Override
    public void open(ExecutionContext executionContext) throws ItemStreamException {
        if (executionContext.containsKey("index")) {
            // 만약 재시작에 해당하는 경우 index가 들어 있음
            // (한번만 수행하기 때문에, 첫 시작 이후 다시 빌드하는 경우 해당) -> 즉, 실패한 그 이후 순간부터 진행
            index = executionContext.getInt("index");
            this.restart = true;
            return;
        }
        // 첫 시작의 경우 index가 들어있지 않기 때문에 0으로 초기화 해주고, 진행
        index = 0;
        executionContext.put("index", index);
    }

    @Override
    public void update(ExecutionContext executionContext) throws ItemStreamException {
        executionContext.put("index", index); // 현재 상태 저장 (매번 업데이트)
    }

    @Override
    public void close() throws ItemStreamException {
        System.out.println("close");
    }
}

public class CustomItemWriter implements ItemStreamWriter<String> {
    @Override
    public void write(Chunk<? extends String> chunk) {
        chunk.forEach(System.out::println);
    }

    @Override
    public void open(ExecutionContext executionContext) throws ItemStreamException {
        System.out.println("open");
    }

    @Override
    public void update(ExecutionContext executionContext) throws ItemStreamException {
        System.out.println("update");
    }

    @Override
    public void close() throws ItemStreamException {
        System.out.println("close");
    }
}

public class CustomItemProcessor implements ItemProcessor<String, String> {
    @Override
    public String process(String item) {
        return item;
    }
}

@Configuration
@RequiredArgsConstructor
public class JobConfig {
    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;

    @Bean
    public Job batchJob() {
        return new JobBuilder("customJob", jobRepository)
                .start(chunkStep())
                .build();
    }

    @Bean
    public Step chunkStep() {
        return new StepBuilder("chunkStep", jobRepository)
                .<String, String>chunk(5, transactionManager)
                .reader(itemReader())
                .processor(itemProcessor())
                .writer(itemWriter())
                .build();
    }

    @Bean
    public ItemReader<String> itemReader() {
        List<String> items = new ArrayList<>();
        for (int i = 0; i < 10; i++)
            items.add(String.valueOf(i));
        return new CustomItemReader(items);
    }

    @Bean
    public ItemProcessor<String, String> itemProcessor() {
        return new CustomItemProcessor();
    }

    @Bean
    public ItemWriter<String> itemWriter() {
        return new CustomItemWriter();
    }
}
```

이렇게 활용하여, 첫 시작때 index 0부터 4까지 출력 후 index 5가 될 때 `RuntimeException` 을 발생한다면, Job이 실패처리 될 것이고 이후 두번째 시작은 index가 5부터 시작하여 나머지 5부터 9를 처리할 수 있다.

즉, 실패 지점을 기억하고 해당 지점부터 재시작 할 수 있는 것이다.

전체적으로 살펴보면 아래와 같다.

![Untitled](/static/images/batch/batch25.png)