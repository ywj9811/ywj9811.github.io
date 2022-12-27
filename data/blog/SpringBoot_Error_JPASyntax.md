---
title: java.sql.SQLSyntaxErrorException:(conn=602) Table 'DB이름.hibernate_sequence' doesn't exist 에러
date: '2022-12-28'
tags: ['spring boot', 'JPA', 'ERROR']
draft: false
summary: JPA를 연습하며 진행하던 도중 save를 호출했을 때 오류가 발생했다. 무슨 오류일까.
---

```java
Caused by: java.sql.SQLSyntaxErrorException: Table 'umc_board.hibernate_sequence' doesn't exist
```

**즉 `umc_board` 라는 DBNAME에서 오류가 발생한 것이다.**

### 원인

**Entity의 ID 생성 strategy가 디폴트 상태인 GenerateType.AUTO 일 경우 hibernate는 자동으로 기본 sequence 정보 테이블인 hibernate_sequence를 찾는데 이때 해당 정보를 찾지 못해서 발생하는 것이다.**

### 해결 방안

1. **DDL 자동생성 설정하기**
2. **GenerationType 변경하기**

1번의 경우 실제 운영 환경에서 쓰기에는 매우 위험하다고 한다.

DDL을 자동으로 생성한다는 의미는 애플리케이션 실행 이후로 DB의 테이블 구조가 막 바뀔 가능성이 있다는 의미이기 때문이다.

개발환경의 경우는 종종 사용하는 경우가 있다고 한다.

이는 JPA의 설정만 바꿔주면 된다.

아래와 같이 `application.properties` 설정 변경

```java
spring.jpa.hibernate.ddl-auto=create
```

### 2번 방법을 사용하도록 할 것인데, 이는 GenerateType을 IDENTITY로 변경하는 것이다.

**이를 통해서 PK 값 할당을 DB에게 맡긴다.**

**이후로는 DB의 Auto Increment에 따라서 작동할 것이다.**

```java
@GeneratedValue(strategy = GenerationType.IDENTITY)
```

이렇게 변경하면 된다.
