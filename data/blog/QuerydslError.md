---
title: querydsl cannot find symbol 오류
date: '2023-06-14'
tags: ['Spring Boot', 'JPA','ERROR']
draft: false
summary: querydsl cannot find symbol 발생시 해결법
---
QueryDsl 을 사용할 때 빌드 도중에 오류가 발생하는 경우가 종종 있다.

아래와 같은 내용이 발생한다

```bash
Exception is:
org.gradle.api.UncheckedIOException: java.io.StreamCorruptedException: invalid type code: 00
Caused by: java.io.StreamCorruptedException: invalid type code: 00
	at java.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:103)
	at org.gradle.tooling.internal.provider.serialization.PayloadSerializer.deserialize(PayloadSerializer.java:76)
	... 68 more
```

이런 오류를 만날때 마다 검색하고 해결하였기 때문에 해결책을 기록해놓는 것이 나을 것이라 생각했다.

발생하는 이유중 한가지는 Q클래스가 제대로 생성되지 않아서인데, 이 경우가 흔하게 많이 발생해서 이 경우에 대해 작성하도록 할 것이다.

위 이유의 경우 해결책은 Gradle 탭의 Tasks 에 들어가서 other의 compileQuerydsl 을 다시 해주는 것이다.

![Untitled](/static/images/queryerror.png)

위 과정을 수행하고 나서 Q 클래스가 생성되었는지 확인해보면 생성되어 있는 것을 확인할 수 있다.