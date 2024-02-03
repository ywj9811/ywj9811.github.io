---
title: SonarCloud와 Jacoco를 통한 코드 정적 분석
date: '2024-02-02'
tags: ['기술']
draft: false
summary: SonarCloud와 Jacoco를 통한 코드 정적 분석 도입하기
---

## SonarCloud란?

개발을 진행하면서 깔끔하고 좋은 코드를 작성하고 유지보수를 쉽게 하기 위해서 코드 리뷰를 진행하고, 고민을 많이 한다.

그렇다면 서로의 코드 리뷰와 개인의 고민 뿐만 아니라 정확한 분석을 해줄 수 있다면 어떨까?

> SonarCloud is a cloud-based code analysis service designed to detect coding issues in **[26 different programming languages](https://docs.sonarsource.com/sonarcloud/advanced-setup/languages/overview/)**. By integrating directly with your CI pipeline or one of our **[supported DevOps platforms](https://docs.sonarsource.com/sonarcloud/getting-started/overview/)**, your code is checked against an extensive set of rules that cover many attributes of code, such as maintainability, reliability, and security issues on each merge/pull request. As a core element of our **[Sonar solution](https://www.sonarsource.com/)**, SonarCloud completes the analysis loop to help you deliver clean code that meets high-quality standards.
> 

SonarCloud는 정적 코드 분석기이다. 이는 각각의 개발 언어에서 지정된 코드 품질에 대한 포맷을 가지고 코드를 분석하여 코드의 유지보수성, 안정성 및 보안 등등에 대해서 지속적으로 관리를 해준다.

이를 통해서 **코드 스멜(code smell)** 이라고 불리는 문제점들과 보안 취약점 등등을 찾아준다.

### 참고 - SonarQube

근데 검색을 하다보면 SonarQube라는 단어가 많이 보일 것이다.

둘이 굉장히 비슷한 이름을 가지고 있는데 무엇이 다른 것일까?

우선, SonarQube는 자체서버 환경에서 사용할 수 있는 오픈소스 코드 품질 관리 플랫폼으로 이를 사용하기 위해서는 자체 서버에 설치하고 직접 관리해야 한다.

**하지만 SonarCloud는 클라우드 기반의 호스팅 서비스로 SonarQube와 유사한 기능을 제공하지만 클라우드 상에서 서비스를 제공하기 때문에 자체 서버에 따로 설치하고 관리할 필요가 없다.**

물론 SonarQube의 경우 좀 더 많은 기능과 다양한 플러그인이 있다고 한다.

## Jacoco란?

제목에서 알 수 있듯 SonarCloud와 Jacoco를 같이 사용할 것이다.

그렇다면 Jacoco는 무엇이길래 SonarCloud와 같이 사용하는 것일까

우선, Jacoco는 Java 진영에 코드 커버리지를 측정할 때 사용하는 오픈소스 라이브러리이다.

SonarCloud는 위에서 설명한 것과 같이 정적 코드 분석기다. 따라서 알아서 테스트를 돌려 커버리지에 대한 리포트를 남기기 어렵다.

따라서 build를 진행하고 리포트를 만들 때 테스트 커버리지에 대한 리포트 또한 남겨줘야 하는데, 이를 Jacoco가 수행해준다.

Jacoco가 코드 커버리지 측정한 결과를 저장한 xml 파일을 제공해서 SonarCloud에서 보여줄 수 있게 해주는 것이다.

## SonarCloud 적용

### SonarCloud 가입

우선 SonarCloud에 회원 가입을 해야 한다.

이때 Github 로그인을 이용하면 좀 더 편리하게 진행할 수 있는 듯 하다.

### Organization import

이후에 SonarCloud 사용을 원하는 레포지토리가 있는 Organization을 import 해준다.

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/ed58f7c6-46bb-48c4-829a-b24be3b7faa2/76bee0ab-3775-4adb-aed0-9829e687ad7d/Untitled.png)

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/ed58f7c6-46bb-48c4-829a-b24be3b7faa2/2a4b8ff2-3c3c-4f11-8973-998d10cb8601/Untitled.png)

import를 누르게 되면 다음과 같은 화면이 나오는데, 여기서 Organization을 선택하여 SonarCloud 앱을 설치해주면 된다.

이후에 name과 key를 설정해주고 plan을 선택해주면 된다. (이 부분은 처음 레포지토리를 가져올 때 작성하는 부분이라서 스크린샷을 가져오지 못했다..)

이후에 프로젝트를 생성해주면 (Analyze a new project) 코드 분석에 대한 대시 보드가 생성되게 된다.

### Automatic Analysis 끄기

SonarCloud에서는 기본적으로 Automatic Analysis를 제공하고 있는데, 만약 CI 작업 과정에서 분석을 수행하고 싶다면 이를 꺼야 한다. (반드시 꺼야 한다)

`Administration -> Analysis Mehtod` 에서 Off로 바꿀 수 있다.

## SpringBoot 프로젝트 세팅

`build.gradle` 에 다음과 같이 몇가지 내용을 추가해야 한다.

### plugin 추가

```java
plugins {
    ...
    id 'jacoco'
    id 'org.sonarqube' version '4.4.1.3373'
}

...

jacoco {
		toolVersion = "0.8.11"
}
```

이때 jacoco의 Version은 https://www.eclemma.org/jacoco/ 여기를 참고하면 된다.

### Sonar 설정 추가

```java
sonar {
    properties {
        property 'sonar.host.url', 'https://sonarcloud.io'
        property 'sonar.organization', '{SonarCloud에서 확인하는 OrganizationKey}'
        property 'sonar.projectKey', '{SonarCloud에서 확인하는 ProjectKey}'
        property 'sonar.sources', 'src'
        property 'sonar.language', 'java'
        property 'sonar.sourceEncoding', 'UTF-8'
        property 'sonar.test.exclusions', jacocoExcludePatterns.join(',')
        property 'sonar.test.inclusions', '**/*Test.java'
        property 'sonar.java.coveragePlugin', 'jacoco'
        property 'sonar.coverage.jacoco.xmlReportPaths', jacocoDir.get().file("jacoco/test/jacocoTestReport.xml").asFile
    }
}
```

SonarCloud 를 위한 내용도 추가해야 한다.

### JacocoTestCoverageVerification 추가

JacocoTestCoverageVerification은 Jacoco 테스트 커버리지를 위한 rule이다.

```java
def QDomains = []
for (qPattern in '*.QA'..'*.QZ') { // qPattern = '*.QA', '*.QB', ... '*.QZ'
    QDomains.add(qPattern + '*')
}

def jacocoExcludePatterns = [
        // 측정 안하고 싶은 패턴
        "**/*Application*",
        "**/dto/**",
        "**/*Config*",
        "**/*Exception*",
        "**/*Request*",
        "**/*Response*",
        "**/*Dto*",
        "**/*Filter*",
        "**/*Resolver*",
        "**/entity/**",
        "**/test/**",
        "**/resources/**"
]

jacocoTestCoverageVerification {

    violationRules {
        rule {
            // rule 활성화
            enabled = true

            // 클래스 단위로 룰 체크
            element = 'CLASS'

            // 라인 커버리지를 최소 80% 만족
            limit {
                counter = 'LINE'
                value = 'COVEREDRATIO'
                minimum = 0.80
            }

            // 브랜치 커버리지를 최소 80% 만족
            limit {
                counter = 'BRANCH'
                value = 'COVEREDRATIO'
                minimum = 0.80
            }

            excludes = jacocoExcludePatterns + QDomains
        }
    }
}
```

위의 코드를 살펴보면, 측정하지 않을 패턴을 정의하고, rule을 활성화 하고, 단위를 설정하고, 커버리지 범위 설정을 하는 등등 설정을 할 수 있다.

조금 자세히 알아보자면 다음과 같다.

- enable : 해당 rule의 활성화 여부를 boolean으로 나타낸다.
    - default로 true이다.
- element : 측정의 큰 단위를 나타낸다.
    - “CLASS” 란, 클래스 단위로 룰 체크를 하는 것이다.
- includes : rule 적용 대상을 패키지 수준으로 정의한다.
    - 아무런 설정을 하지 않는다면 전체가 된다.
- limit : rule의 상세 설정을 나타내는 block이다.
    - counter : 커버리지 측정의 최소 단위를 나타낸다. (CLASS, METHOD, LINE, BRANCH 등등)
        - CLASS : 클래스 내부 메소드가 한번이라도 실행된다면 실행된 것으로 간주
        - METHOD : 클래스와 마찬가지로 METHOD가 한번이라도 실행되면 실행된 것으로 간주
        - LINE : 한 라인이라도 실행되었다면 측정이 됩니다.소스 코드 포맷에 영향을 받는 측정방식
        - BRANCH : `if`, `switch` 구문에 대한 커버리지 측정
        - INSTRUCTION : jacoco의 가장 작은 측정 방식 (바이트 코드를 읽는다.)
        LINE과 다르게 소스 코드 포맷에 영향을 받지 않는다.
    - value : 측정한 counter의 정보를 어떠한 방식으로 보여줄지 정한다.
        - TOTALCOUNT, COVEREDCOUNT, MISSEDCOUNT, COVEREDRATIO, MISSEDRATIO
            - 커버리지 측정에서는 비율을 나타내는 COVERAGERATIO를 사용
    - minimum : count 값을 value에 맞게 표현했을때 최소의 값이다.
        - 이를 통해서 실패 혹은 성공이 나뉜다.
- excludes : verify에서 제외할 클래스를 지정할 수 있다.
    - 패키지 레벨의 경로로 지정한다.

### JacocoTestReport 작성

위에서 JacocoTestCoverageVerification의 rule을 통해 JacocoTestReposrt는 이제 검사를 진행할 것이다.

```java
tasks.named('test') {
    useJUnitPlatform()
    finalizedBy 'jacocoTestReport'
}

def jacocoDir = layout.buildDirectory.dir("reports/")

jacocoTestReport {
    dependsOn test	// 테스트가 수행되어야만 report를 생성할 수 있도록 설정
    reports {
        html.required.set(true)
        xml.required.set(true)
        csv.required.set(true)
        html.destination jacocoDir.get().file("jacoco/index.html").asFile
        xml.destination jacocoDir.get().file("jacoco/index.xml").asFile
        csv.destination jacocoDir.get().file("jacoco/index.csv").asFile
    }

    afterEvaluate {
        classDirectories.setFrom(
                files(classDirectories.files.collect {
                    fileTree(dir: it, excludes: jacocoExcludePatterns + QDomains) // Querydsl 관련 제거
                })
        )
    }
    finalizedBy jacocoTestCoverageVerification
```

JacocoTestReport에서 reports는 html, xml, csv를 생성할 수 있고, 전역 변수로 생성한 jacocoDir은 build 디렉토리 하위로 reports를 생성하여 report 파일을 해당 경로에 생성할 수 있도록 설정해주었다.

또한 afterEvaluate로 특정 파일 및 디렉토리(jacocoExcludePatterns + QDomains)를 제외하기 위해 설정하였다.

### build.gradle 전체

```bash
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.1.4'
    id 'io.spring.dependency-management' version '1.1.3'

    id 'jacoco'
    id 'org.sonarqube' version '4.4.1.3373'
}

group = 'com'
version = '0.0.1-SNAPSHOT'

java {
    sourceCompatibility = '17'
}

configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-thymeleaf'
    implementation 'org.springframework.boot:spring-boot-starter-amqp'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-webflux'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    compileOnly 'org.projectlombok:lombok'
    runtimeOnly 'com.mysql:mysql-connector-j'
    annotationProcessor 'org.projectlombok:lombok'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'io.projectreactor:reactor-test'
    testImplementation 'org.springframework.amqp:spring-rabbit-test'
    testImplementation 'org.springframework.security:spring-security-test'
    testCompileOnly 'org.springframework.security:spring-security-test'
    testAnnotationProcessor 'org.springframework.security:spring-security-test'

    // https://mvnrepository.com/artifact/com.slack.api/slack-api-client
    // 슬랙 api 추가
    implementation group: 'com.slack.api', name: 'slack-api-client', version: '1.29.2'

    // https://mvnrepository.com/artifact/com.slack.api/slack-api-client
    // 슬랙 api 추가
    implementation group: 'com.slack.api', name: 'slack-api-client', version: '1.29.2'

    implementation 'io.jsonwebtoken:jjwt-api:0.11.5'
    implementation 'io.jsonwebtoken:jjwt-impl:0.11.5'
    implementation 'io.jsonwebtoken:jjwt-jackson:0.11.5'
    //jwt 추가

    // https://mvnrepository.com/artifact/org.springdoc/springdoc-openapi-starter-webmvc-ui
    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.2.0'
    //swagger 추가

    // Spring boot 3.x이상에서 QueryDsl 패키지를 정의하는 방법
    implementation 'com.querydsl:querydsl-jpa:5.0.0:jakarta'
    annotationProcessor "com.querydsl:querydsl-apt:5.0.0:jakarta"
    annotationProcessor "jakarta.annotation:jakarta.annotation-api"
    annotationProcessor "jakarta.persistence:jakarta.persistence-api"

    // prometheus metric
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
    runtimeOnly 'io.micrometer:micrometer-registry-prometheus'

    // aws s3
    implementation 'org.springframework.cloud:spring-cloud-starter-aws:2.2.6.RELEASE'

// https://mvnrepository.com/artifact/org.mockito/mockito-core
    testImplementation 'org.mockito:mockito-core:5.6.0'
}

tasks.named('test') {
    useJUnitPlatform()
    finalizedBy 'jacocoTestReport'
}

def jacocoDir = layout.buildDirectory.dir("reports/")

def QDomains = []
for (qPattern in '*.QA'..'*.QZ') { // qPattern = '*.QA', '*.QB', ... '*.QZ'
    QDomains.add(qPattern + '*')
}

def jacocoExcludePatterns = [
        // 측정 안하고 싶은 패턴
        "**/*Application*",
        "**/dto/**",
        "**/*Config*",
        "**/*Exception*",
        "**/*Request*",
        "**/*Response*",
        "**/*Dto*",
        "**/*Filter*",
        "**/*Resolver*",
        "**/entity/**",
        "**/test/**",
        "**/resources/**"
]

sonar {
    properties {
        property 'sonar.host.url', 'https://sonarcloud.io'
        property 'sonar.organization', 'we-are-raccoons'
        property 'sonar.projectKey', 'WE-ARE-RACCOONS_postgraduate-back'
        property 'sonar.sources', 'src'
        property 'sonar.language', 'java'
        property 'sonar.sourceEncoding', 'UTF-8'
        property 'sonar.test.exclusions', jacocoExcludePatterns.join(',')
        property 'sonar.test.inclusions', '**/*Test.java'
        property 'sonar.java.coveragePlugin', 'jacoco'
        property 'sonar.coverage.jacoco.xmlReportPaths', jacocoDir.get().file("jacoco/test/jacocoTestReport.xml").asFile
    }
}

jacoco {
    toolVersion = "0.8.11"
}

jacocoTestReport {
    dependsOn test	// 테스트가 수행되어야만 report를 생성할 수 있도록 설정
    reports {
        html.required.set(true)
        xml.required.set(true)
        csv.required.set(true)
        html.destination jacocoDir.get().file("jacoco/index.html").asFile
        xml.destination jacocoDir.get().file("jacoco/index.xml").asFile
        csv.destination jacocoDir.get().file("jacoco/index.csv").asFile
    }

    afterEvaluate {
        classDirectories.setFrom(
                files(classDirectories.files.collect {
                    fileTree(dir: it, excludes: jacocoExcludePatterns + QDomains) // Querydsl 관련 제거
                })
        )
    }
    finalizedBy jacocoTestCoverageVerification
}

jacocoTestCoverageVerification {

    violationRules {
        rule {
            // rule 활성화
            enabled = true

            // 클래스 단위로 룰 체크
            element = 'CLASS'

            // 라인 커버리지를 최소 80% 만족
//            limit {
//                counter = 'LINE'
//                value = 'COVEREDRATIO'
//                minimum = 0.80
//            }

            // 브랜치 커버리지를 최소 80% 만족
//            limit {
//                counter = 'BRANCH'
//                value = 'COVEREDRATIO'
//                minimum = 0.80
//            }

            excludes = jacocoExcludePatterns + QDomains
        }
    }
}
```

### 실행 확인

build.gradle을 다시 새로 고침하고, gradle항목에서 jacocoTestReport를 실행해보자.

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/ed58f7c6-46bb-48c4-829a-b24be3b7faa2/5fc81708-0bbe-4f52-a9c0-7fdaca4f62bb/Untitled.png)

그러면 build아래에

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/ed58f7c6-46bb-48c4-829a-b24be3b7faa2/1e09e62d-e2bb-49ec-9cb7-d57f922b0a3e/Untitled.png)

이렇게 파일이 생성된 것을 확인할 수 있다.

## Github Actions Workflow 작성

이제 CI 환경에서 구동시키기 위해 Workflow를 작성해보도록 하자.

```bash
name: SonarCloudScan
on:
  pull_request:
    branches: [ "develop" ]
jobs:
  sonarcloud:
    name: SonarCloud
    runs-on: ubuntu-latest
    env:
      working-directory: ./
      APPLICATION: ${{ secrets.APPLICATION }}

    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Set up JDK 17
        uses: actions/setup-java@v2
        with:
          java-version: '17'
          distribution: 'adopt'

      - name: Cache Gradle packages
        uses: actions/cache@v2
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
          restore-keys: |
            ${{ runner.os }}-gradle-

      - name: Create application.yml
        run: |
          echo "${{env.APPLICATION}}" > ./src/main/resources/application.yml

      - name: Grant execute permission for gradlew
        run: chmod +x gradlew
        working-directory: ${{ env.working-directory }}

      - name: Cache SonarCloud packages
        uses: actions/cache@v3
        with:
          path: ~/.sonar/cache
          key: ${{ runner.os }}-sonar
          restore-keys: ${{ runner.os }}-sonar

      - name: SonarCloud scan
        run: ./gradlew sonar --info --stacktrace
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

해당 Workflow의 경우 develop 브랜치를 향해 PR이 생성될 경우 동작하도록 구성하였다.

이때 두개의 secrets를 사용하는데

- `GITHUB_TOKEN` : Github에서 기본으로 제공되는 토큰으로 별도의 설정이 필요 없다. (자동으로 들어감)
- `SONAR_TOKEN` : SonarCloud에 대한 엑세스를 인증하는데 사용되는 토큰으로 SonarCloud의 Security항목에서 발급받을 수 있다.

## 마무리

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/ed58f7c6-46bb-48c4-829a-b24be3b7faa2/30290701-f251-4867-86c3-40a486ea8f90/Untitled.png)

(초기에는 별다른 추가 사항이 없어서 위와 같이 내용이 나올 수 있다고 한다.)

이렇게 설정을 하고 나면 PR을 올릴 때 해당 Workflow가 동작하고 코드에 대한 분석과 테스트 커버리지에 대한 분석이 이루어져서 결과가 뜰 것이다.

이때 적절하게 minimum을 조정하여 테스트 커버리지를 강제하거나 관리할 수 있다.