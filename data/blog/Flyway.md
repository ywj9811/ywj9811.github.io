---
title: Flyway
date: '2024-08-19'
tags: ['SpringBoot', '기술']
draft: false
summary: Flyway 개념과 도입
---
# Flyway란

Flyway 공식문서에서는 다음과 같이 소개하고 있다.

> Flyway is an open-source database migration tool.
> 

즉, Flyway는 오픈소스 데이터베이스 마이그레이션 툴로, DB 형상관리를 위한 도구이다.

Git과 같은 도구라고 생각하면 편할 것 같다.

## 사용 이유

개발을 하다보면 데이터베이스가 여러 환경에서 존재할 것이고 (로컬, 테스트, 운영 등등) 만약 로컬에서 개발을 하다가 테이블 구조가 변경되게 된다면, 각각의 배포 환경에서 스키마 수정을 각 환경별로 진행해야 할 것이다.

물론 위에서 설명한 것과 같이 각각의 배포 환경에서 스키마 수정을 해줄 수 있을 것이다.

하지만 그렇게 하다보면 사람이다 보니 실수가 발생하기 쉽다.

Flyway와 같은 데이터베이스 마이그레이션 툴을 사용하게 되면 위와 같은 문제를 해결할 수 있다.

왜냐하면, Flyway가 변경 사항이 배포된다면 자동으로 스키마를 수정할 것이기 때문이다.

## 컨벤션

Flyway를 사용할 때 스크립트의 위치와 네이밍을 조심해야 하며, 이들에 대한 컨벤션을 꼭 따라야 한다.

### 위치

Flyway의 기본위치는 `main/resources/db/migration` 이다. 따라서 resources 패키지에 `db/migration` 패키지를 만들고 이 위치에 스크립트 파일에 추가하면 된다.

물론, 아래에서 설명할 내용이지만 위치는 커스텀할 수 있다.

### 네이밍

![image.png](/static/images/flyway.png)

Flyway 스크립트의 경우 위와 같은 네이밍 규칙을 따라야 한다.

- Prefix : V(Version), U(Undo), R(Repeatable)의 3가지 종류로, 각각 현재 버전을 새로운 버전으로 업데이트 하는 경우, 현재 버전을 이전으로 되돌리는 경우, 버전에 관계없이 매번 실행하는 경우 이렇게 사용하면 된다.
- Separator : 무조건 `__` 언더바 2개를 사용해서 작성해야 한다.
- Description : 스크립트 내용에 맞춰 자유롭게 작성하면 된다.

## 도입 및 적용

### 도입

우선, `build.gradle` 에 Flyway를 추가해야 한다.

```yaml
dependencies {
	// flyway 추가
	implementation 'org.flywaydb:flyway-mysql'
	implementation 'org.flywaydb:flyway-core'
}
```

그리고 `application.yml` 에도 내용을 추가한다.

```yaml
flyway:
  enabled: true
  baseline-on-migrate: true
```

- `enable: true` → Flyway가 어플리케이션 시작시 자동으로 실행되도록 활성화 하는 것이다.
- `baseline-on-migrate: true` → Flyway가 새로운 데이터베이스에 대해 처음 마이그레이션을 실행할 때 기준선을 설정하도록 하는 것으로, 만약 기존의 데이터베이스에 마이그레이션 기록이 없다면 Flyway는 첫번째 마이그레이션을 실행하기 전에 현재 상태를 기준선으로 설정할 것이다.
이 옵션을 통해 Flyway는 기존 데이터베이스 스키마를 그대로 유지하면서 이후의 마이그레이션을 적용할 수 있다.

그리고, 위에는 존재하지 않지만 추가로 사용할 수 있는 것 또한 다양하게 존재한다.

그중 대표적으로 사용되는 것을 알아보자.

- `locations: classpath:db/migration` → 예를 들어 작성한 부분이다. Flyway의 기본 경로를 변경하는 것인데 기본 설정인 `main/resources/db/migration` 이 아닌 다른 경로를 사용하고자 한다면 설정할 수 있다.
- `table: {테이블명}` → Flyway가 마이그레이션 상태를 저장할 테이블 이름을 지정한다.
- `schemas: {스키마명1}, {스키마명2}` → Flyway가 관리할 스키마를 설정한다.

이외에도 여러가지가 있으니 필요시 찾아보면 된다.

### 적용

Flyway를 제대로 실행시키기 위해서는 스크립트 파일을 작성해둬야 한다.

위에서 설명한 것과 같이 컨벤션을 지켜서, Flyway의 스크립트 지정 위치에 파일을 생성해두면 된다.

우선은 처음이니 `V1__test.sql` 처럼 파일을 생성해보도록 하자.

만약 우리의 프로젝트중 User 엔티티가 변경된 상황을 가정해보자.

```java
@Entity
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    private String email;
    private String password;
}
```

이렇게 존재하던 엔티티가 다음과 같이 변경된 경우를 가정해보자.

```java
@Entity
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    private String email;
    private String password;
    private String phoneNumber; // 핸드폰 번호 추가
}
```

핸드폰 번호를 추가하게 되어 데이터베이스에 `phone_number` 이라는 컬럼이 추가될 것이다.

그러면 이제 위에서 설명한 것과 같이 파일을 생성하면 된다.

```sql
ALTER TABLE USER ADD COLUMN phone_number VARCHAR(255);
```

이런식으로 sql을 작성하고 이 파일의 이름은 `V1__test.sql` 처럼 만들어주면 된다.

이제 각각의 환경에 대해 배포가 진행되면 Flyway는 버전이 변경되었다면 내용을 확인하고 우리의 데이터베이스에 적용을 해주며 우리는 데이터베이스가 엉키는 일을 걱정하지 않아도 된다.

## 주의점

당연하지만, 굉장히 주의해야하는 부분이 있다.

만약 변경사항이 생긴다면 그에 대한 스크립트 파일을 꼭 작성해줘야 한다는 것이다!

그리고, JPA의 `ddl-auto` 의 경우는 `validate` 로 설정해서 코드와 DB가 일치하는지 확인해주면 더 좋다고 한다.