---
title: ItemProcessor
date: '2024-04-26'
tags: ['spring batch']
draft: false
summary: ItemProcessor 상세
---
## CompositeItemProcessor

ItemProcessor 들을 연결해서 위임하면 각 ItemProcessor를 실행시킨다.

이전 ItemProcessor의 반환 값은 다음 ItemProcessor의 값으로 연결된다.

![Untitled](/static/images/batch/batch43.png)

간단하게 코드로 작성하면 아래와 같다.

```java
public class CustomItemProcessor implements ItemProcessor<String, String> {
    int cnt = 0;

    @Override
    public String process(String item) throws Exception {
        cnt++;
        return (item + cnt).toUpperCase();
    }
}

public class CustomItemProcessor2 implements ItemProcessor<String, String> {
    int cnt = 0;

    @Override
    public String process(String item) throws Exception {
        cnt++;
        return (item + cnt);
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
                .<String, String>chunk(chunkSize, transactionManager)
                .reader(new ItemReader<String>() {
                    int i = 0;
                    @Override
                    public String read() throws Exception, UnexpectedInputException, ParseException, NonTransientResourceException {
                        i++;
                        return i > 10 ? null : "item";
                    }
                })
                .processor(customItemProcessor())
                .writer(items -> System.out.println("items = " + items))
                .build();
    }

    @Bean
    public ItemProcessor<String, String> customItemProcessor() {
        List<ItemProcessor<String, String>> itemProcessors = new ArrayList<>();
        itemProcessors.add(new CustomItemProcessor());
        itemProcessors.add(new CustomItemProcessor2());

        return new CompositeItemProcessorBuilder<String, String>()
                .delegates(itemProcessors)
                .build();
    }
}
```

이렇게 사용할 수 있다.

## ClassfierCompositeItemProcessor

Classifier로 라우팅 패턴을 구현해서 ItemProcessor 구현체 중에서 하나를 호출하는 역할을 한다.

![Untitled](/static/images/batch/batch44.png)

`Classifier<C, T>` 이는 C의 분류에 따라 적절한 T를 반환하는 것이다.

즉 C는 Input, T는 Output이다.

![Untitled](/static/images/batch/batch45.png)

이런식으로 Processor를 조건에 따라 분기할 수 있다.

```java
public class CustomProcessor1 implements ItemProcessor<ProcessorInfo, ProcessorInfo> {
    @Override
    public ProcessorInfo process(ProcessorInfo item) throws Exception {
        System.out.println("CustomProcessor1.process");

        return item;
    }
}

public class CustomProcessor2 implements ItemProcessor<ProcessorInfo, ProcessorInfo> {
    @Override
    public ProcessorInfo process(ProcessorInfo item) throws Exception {
        System.out.println("CustomProcessor2.process");

        return item;
    }
}

public class CustomProcessor3 implements ItemProcessor<ProcessorInfo, ProcessorInfo> {
    @Override
    public ProcessorInfo process(ProcessorInfo item) throws Exception {
        System.out.println("CustomProcessor3.process");

        return item;
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
                .<ProcessorInfo, ProcessorInfo>chunk(chunkSize, transactionManager)
                .reader(new ItemReader<ProcessorInfo>() {
                    int i = 0;
                    @Override
                    public ProcessorInfo read() throws Exception, UnexpectedInputException, ParseException, NonTransientResourceException {
                        i++;
                        ProcessorInfo processorInfo = ProcessorInfo.builder().id(i).build();

                        return i > 3 ? null : processorInfo;
                    }
                })
                .processor(customItemProcessor())
                .writer(items -> System.out.println("items = " + items))
                .build();
    }

    @Bean
    public ItemProcessor<ProcessorInfo, ProcessorInfo> customItemProcessor() {
        ClassifierCompositeItemProcessor<ProcessorInfo, ProcessorInfo> processor = new ClassifierCompositeItemProcessor<>();

        ClassiFierProcessor<ProcessorInfo, ItemProcessor<?, ? extends ProcessorInfo>> classiFierProcessor = new ClassiFierProcessor<>();

        Map<Integer, ItemProcessor<ProcessorInfo, ProcessorInfo>> processorMap = new HashMap<>();
        processorMap.put(1, new CustomProcessor1()); // 1번이 나오면 return
        processorMap.put(2, new CustomProcessor2()); // 2번이면
        processorMap.put(3, new CustomProcessor3()); // 3번이면

        classiFierProcessor.setProcessorMap(processorMap);
        processor.setClassifier(classiFierProcessor);

        return processor;
    }
}    
```

이렇게 작성하면,

id에 따라서 1~3 순서대로 나오게 된다.