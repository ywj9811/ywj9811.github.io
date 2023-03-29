---
title: CI/CD
date: '2023-03-29'
tags: ['기술', 'Git', 'Spring Boot']
draft: false
summary: 지속적 통합(Continuos Integration)/지속적 배포(Continous Deployment)
---

# CI/CD

## CI/CD란? - 지속적 통합(Continuos Integration)/지속적 배포(Continous Deployment)

### CI란?

CI는 간단히 말하자면 빌드/테스트 자동화 과정을 말하는 것이다.

CI를 성공적으로 구현하게 되면 애플리케이션에 대한 새로운 코드 변경 사항이 정기적으로 빌드 및 테스트되어 공유 레포지토리에 통합되어 여러 명의 개발자가 동시에 애플리케이션 개발과 관련된 코드 작업을 할 경우 충돌 위험성을 해결할 수 있다.

이를 통해 코드/버전 관리에 대한 **변경 사항을 정기적으로 커밋하여 팀원들이 동일한 작업 기반으로 진행할 수 있도록 하는 것**이다.

이러한 지속적 통합은 CI/CD 파이프라인 구현하기 위한 첫 단계이다.

### CD란?

CD는 간단히 말하면 배포 자동화 과정을 말하는 것이다.

즉, 이는 지속적인 배포를 의미하는 것으로 빌드, 테스트 및 배포 단계를 자동화하는 DevOps 방식을 논리적 극한까지 끌어올린다.

코드 변경이 파이프라인의 이전 단계를 모두 성공적으로 통과하면 **수동 개입 없이 해당 변경 사항이 프로덕션에 자동으로 배포**될 수 있다.

### CI/CD 종류

- **Jenkins**
- **CircleCI**
- **TravisCI**
- **Github Actions**
- **etc**…

이렇게 여러가지 종류가 존재하는데 이 중에서 Github Actions에 대해서 알아보도록 할 것이다.

## Spring Boot + Docker + Github Action 자동 배포

### **📌 우선 EC2 인스턴스에서 작업에 필요한 Docker와 Docker-Compose를 설치하도록 한다.**

```bash
# docker및 docker-compose 설치에 필요한 유틸 다운로드
sudo apt update

sudo apt install \
	apt-transport-https \
	ca-certificates \
	curl \
	software-properties-common
```

- `**software-properties-common` :\*\*
  PPA를 추가, 제거시 사용되는 유틸이다.
  즉, 패키지 매니저가 참고하는 repository 정보를 쉽게 추가 제거해준다.
- `**apt-transport-https` :\*\*
  https를 통해 데이터 및 패키지에 접근할 수 있도록 한다.

### **📌 Docker 설치**

```bash
# 도커 설치
sudo yum install docker -y

# 도커 실행
sudo service docker start

# 도커 상태 확인
systemctl status docker.service

# Docker 관련 권한 추가
sudo chmod 666 /var/run/docker.sock
docker ps
```

### **📌 Docker-compose 설치**

```bash
# 도커 컴포즈 설치
sudo curl \
-L "https://github.com/docker/compose/releases/download/1.26.2/docker-compose-$(uname -s)-$(uname -m)" \
-o /usr/local/bin/docker-compose

# 권한 추가
sudo chmod +x /usr/local/bin/docker-compose

# 버전 확인
docker-compose --version
```

---

### 🖥️ GitHub-Actions 스크립트 파일 생성하기

**배포할 때 사용할 GitHub-Actions 스크립트 파일을 생성해 보도록 하자**

> **GitHub 레포지토리 → Actions → Continuous integration 의 Java With Gradle 의 Configure 클릭**

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F277c20bf-3427-4805-9955-704b70dfa573%2FUntitled.png?table=block&id=265900cc-5ec1-4feb-b4b7-07ab68ff90a8&spaceId=ed58f7c6-46bb-48c4-829a-b24be3b7faa2&width=1920&userId=db5d5977-127f-463d-b91b-77eec4b05d2d&cache=v2)

클릭하게 되면 아래와 같이 **~/.github/workflow/gradle.yml** 파일이 생성된다.

이때, **gradle.yml이라는 이름은 본인이 원하는 대로 변경**해도 문제가 없으며 이는 **현재 gradle build 전용 스크립트 파일**이다.

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F3804a248-936a-4ff0-ac2b-6aacbe8b7335%2FUntitled.png?table=block&id=544a975b-7711-46d3-8532-0d25d581d9da&spaceId=ed58f7c6-46bb-48c4-829a-b24be3b7faa2&width=1920&userId=db5d5977-127f-463d-b91b-77eec4b05d2d&cache=v2)

### 📌 gradle.yml (현재 파일 이름) 작성 → 상황에 맞게 변경해서 사용

```yaml
name: Java CI with Gradle

on:
  push:
    branches: ['master']

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      working-directory: ./
      APPLICATION: ${{ secrets.APPLICATION }}

    steps:
      - uses: actions/checkout@v2
      - name: Set up JDK 11
        uses: actions/setup-java@v2
        with:
          java-version: '11'
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

      - uses: actions/checkout@v2
      - run: |
          mkdir ./src/main/resources
          cd ./src/main/resources
          touch ./application.yml 
          echo "${{env.APPLICATION}}" > ./application.yml

      - uses: actions/upload-artifact@v2
        with:
          name: application.yml
          path: ./src/main/resources/application.yml

      - name: Grant execute permission for gradlew
        run: chmod +x gradlew
        working-directory: ${{ env.working-directory }}

      - name: Build with Gradle
        run: ./gradlew build
        working-directory: ${{ env.working-directory }}

      - name: Cleanup Gradle Cache
        if: ${{ always() }}
        run: |
          rm -f ~/.gradle/caches/modules-2/modules-2.lock
          rm -f ~/.gradle/caches/modules-2/gc.properties

      - name: Docker build
        run: |
          docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}
          docker build -t ${{ secrets.PROJECT_NAME }} .
          docker tag ${{ secrets.PROJECT_NAME }} ${{ secrets.DOCKER_HUB_REPO }}:${GITHUB_SHA::7}
          docker push ${{ secrets.DOCKER_HUB_REPO }}:${GITHUB_SHA::7}

      - name: Deploy
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_SERVER_HOST }}
          username: ec2-user
          key: ${{ secrets.PRIVATE_KEY }}
          envs: GITHUB_SHA
          script: |
            docker rmi $(docker images -q)
            docker pull ${{ secrets.DOCKER_HUB_REPO }}:${GITHUB_SHA::7}
            docker tag ${{ secrets.DOCKER_HUB_REPO }}:${GITHUB_SHA::7} ${{ secrets.PROJECT_NAME }}
            docker stop ${{ secrets.PROJECT_NAME }}
            docker rm ${{ secrets.PROJECT_NAME }}
            docker run -d --name ${{ secrets.PROJECT_NAME }} -p 80:8080 ${{ secrets.PROJECT_NAME }}
```

이 과정은 **GitHub 레포지토리 main 브랜치에 push가 될 때 AWS EC2 인스턴스에 배포가 되는 과정**이다.

참고로 **이때 노출되어서는 안되는 properties와 같은 파일은 깃허브에 올리면 안되기 때문에 GitHub-Actions의 스크립트에 직접 작성**해야한다.

[(공식 문서 필요시 참고)](https://docs.github.com/en/actions)

이제, 위 코드를 하나씩 분석해보도록 하자.

### 🔗 on: push: branch:

> **이는 해당 브랜치에 push가 되었을 때 Workflow를 Trigger 실행한다는 뜻이다.**

```yaml
name: Java CI with Gradle

on:
  push:
    branches:
			- main

permissions:
  contents: read
```

### 🔗 jobs:

> **GitHub-Actions의 Workflow는 다양한 Job으로 구성되며 Job은 다시 Steps로 구성이 된다.**

- **GitHub-Actions에서 사용될 JDK**를 세팅
- **Java-Version으로 11을 사용하고, distribution으로 ‘temurin’**을 사용

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    # Ubuntu로 실행할 것이다.

    env:
      working-directory: ./
      APPLICATION: ${{ secrets.APPLICATION }}
    # 작업경로는 여기로 지정한다.

    steps:
      - uses: actions/checkout@v2
      - name: Set up JDK 11
        uses: actions/setup-java@v2
        with:
          java-version: '11'
          distribution: 'adopt'
  # 자바는 이것으로 사용할 것이다.
```

### 🔗 Gradle Caching

> **Gradle을 캐싱하는 코드이다.**

```yaml
- name: Cache Gradle packages
      uses: actions/cache@v2
      with:
        path: |
             ~/.gradle/caches
             ~/.gradle/wrapper
        key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
        restore-keys: |
              ${{ runner.os }}-gradle-
```

**⚠️ 필수 아님!! 사용하면 빌드 시간이 단축된다고 함!**

### 🔗 application.yml 등록

> **파일을 생성하는 부분 (여러개의 환경이 있다면 여러개 작성하면 된다)**

**(민감한 정보가 있기 때문에 직접 GitHub-Actions에서 작업)**

```yaml
		- uses: actions/checkout@v2
    - run: |
          mkdir ./src/main/resources
          cd ./src/main/resources
          touch ./application.yml
          echo "${{env.APPLICATION}}" > ./application.yml

    - uses: actions/upload-artifact@v2
      with:
        name: application.yml
				path: ./src/main/resources/application.yml
```

이때 GitHub-Actions에서 설정한 값을 properties에 쓰기 위해서는 다음과 같은 과정이 필요하다.

**레포지토리의 Settings → Secrets → Actions → New repository secret 버튼**

**(한번 만들면 확인이 불가능함, 변경만 가능)**

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fd2d507ea-0971-488f-b7bb-d696962a64d8%2FUntitled.png?table=block&id=a4b8d6a0-18cc-47d1-b960-59faae2a41aa&spaceId=ed58f7c6-46bb-48c4-829a-b24be3b7faa2&width=1920&userId=db5d5977-127f-463d-b91b-77eec4b05d2d&cache=v2)

| APPLICATION     | application.yml 파일            |
| --------------- | ------------------------------- |
| DOCKER_HUB_REPO | 도커 허브 계정 id/project name  |
| DOCKER_PASSWORD | 도커 허브 계정 비번             |
| DOCKER_USERNAME | 도커 허브 계정 id               |
| EC2_SERVER_HOST | AWS 인스턴스 (EC2) 퍼블릭 IP    |
| PRIVATE_KEY     | AWS 인스턴스 Key(.ppm형태)      |
| PROJECT_NAME    | 프로젝트 이름(이건 별로 안중요) |

### ➕등등과 같이 본인이 필요한 내용을 상황에 따라 추가하면 된다.

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fa5b54a76-0d63-4fb9-9bbd-9c80b828f04e%2FUntitled.png?table=block&id=0c71e9e9-932f-4ea0-a52a-cd4f777de7af&spaceId=ed58f7c6-46bb-48c4-829a-b24be3b7faa2&width=1920&userId=db5d5977-127f-463d-b91b-77eec4b05d2d&cache=v2)

→ **Name**에 변수 명을 **Secret**에 값을 복사하여 넣어주면 된다.

### 🔗 Gradle Build - Docker Build & Push

> **Gradle Build 및 Docker Build 및 Push 과정이다.**

```yaml
		- name: Grant execute permission for gradlew
      run: chmod +x gradlew
      working-directory: ${{ env.working-directory }}

    - name: Build with Gradle
      run: ./gradlew build
      working-directory: ${{ env.working-directory }}

    - name: Cleanup Gradle Cache
      if: ${{ always() }}
      run: |
          rm -f ~/.gradle/caches/modules-2/modules-2.lock
          rm -f ~/.gradle/caches/modules-2/gc.properties

    - name: Docker build
      run: |
          docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}
          docker build -t ${{ secrets.PROJECT_NAME }} .
          docker tag ${{ secrets.PROJECT_NAME }} ${{ secrets.DOCKER_HUB_REPO }}:${GITHUB_SHA::7}
          docker push ${{ secrets.DOCKER_HUB_REPO }}:${GITHUB_SHA::7}
```

**Gradle 빌드를 하며 동시에 도커 로그인 및 jar파일 빌드(이미지화) 하여 도커 허브에 푸시를 부탁하는 부분이다.**

### 🔗 EC2 연결

```yaml
		- name: Deploy
      uses: appleboy/ssh-action@master
      with:
          host: ${{ secrets.EC2_SERVER_HOST }}
          username: ec2-user
          key: ${{ secrets.PRIVATE_KEY }}
          envs: GITHUB_SHA
          script: |
            docker rmi $(docker images -q)
            docker pull ${{ secrets.DOCKER_HUB_REPO }}:${GITHUB_SHA::7}
            docker tag ${{ secrets.DOCKER_HUB_REPO }}:${GITHUB_SHA::7} ${{ secrets.PROJECT_NAME }}
            docker stop ${{ secrets.PROJECT_NAME }}
            docker rm ${{ secrets.PROJECT_NAME }}
            docker run -d --name ${{ secrets.PROJECT_NAME }} -p 80:8080 ${{ secrets.PROJECT_NAME }}
```

**순서대로**

**도커 허브에서 푸쉬된 내용을 pull, 기존에 실행하던 내용 stop 후 삭제하고 새로 받은 것을 실행한다.**

> **참고** : [https://minsu20.tistory.com/23](https://minsu20.tistory.com/23) , [https://a-half-human-half-developer.tistory.com/12](https://a-half-human-half-developer.tistory.com/12)
