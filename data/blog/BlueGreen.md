---
title: 무중단 배포와 Blue-Green 배포 전략
date: '2023-08-07'
tags: ['기술', 'AWS']
draft: false
summary: 무중단 배포 전략 종류와 Blue-Green 배포 전략
---

## 무중단 배포란 무엇인가

서비스가 운영 중일 때 새로운 버전을 배포하기 위해서는 

1. 기존 서비스를 종료 
2. 새로운 서비스를 시작

이러한 과정을 거치게 된다.

1번과 2번 사이의 과정에서 서버가 멈추는 시간이 필연적으로 발생하며, 이 시간동안 사용자들은 서비스를 이용할 수 없게 된다.

이러한 문제를 해결해주는 방법이 바로 무중단 배포로, 말그대로 중단이 없는 배포를 무중단 배포라고 합니다.

## 무중단 배포 방식 종류

1. **롤링(Rolling Update) 방식**
    사용중인 인스턴스 내에서 새 버전을 교체하는 가장 기본적인 방식으로 서비스 중인 인스턴스 하나를 로드밸런서에서 라우팅하지 않도록 한 뒤 새 버전을 적용하여 다시 라우팅하도록 하는 방식이다.
        
    이렇게 모든 배포된 인스턴스를 순차적으로 한 대씩 새로운 버전으로 업데이트 해주는 방식이다. **(신.구 버전이 공존하는 방식 → 호환성 문제 조심)**
        
    ![Untitled](/static/images/server/rolling.png)
        
2. **블루 그린 (Blue-Green Deployment) 방식**
    
    구 버전, 신 버전을 각각 블루, 그린이라 칭하여 운영 환경에서 구 버전과 동일하게 신 버전을 배포하고 구 버전에서 신 버전으로 일제히 전환하는 방식이다.
    
    **(롤링 방식에 비해 시스템 자원이 2배 이상 필요 → 리소스 낭비 조심)**
    
    ![Untitled](/static/images/server/bluegreen.png)
    
3. **카나리 (Canary Release) 방식**
    
    카나리 배포 방식은 위험을 빠르게 감지할 수 있는 배포 전략으로 신 버전의 제공 범위를 늘려가면서 모니터링 및 피드백 과정을 거칠 수 있다.
    
    로드밸런서를 통해 신 버전의 제품을 경험하는 사용자를 조절할 수 있다는 것이 특징으로 신 버전을 특정 사용자 혹은 단순 비율에 따라 구분하여 제공할 수 있다.
    
    **(롤링 방식과 마찬가지로 신.구 버전이 공존하기에 관리가 필요하다)**
    
    ![Untitled](/static/images/server/canary.png)
    

이렇게 3가지 방식이 있다.

## 블루 그린 배포 방식

나는 AWS **인스턴스를 한개만 사용하기에** 블루 그린 배포 방식을 택하였다.

블루 그린 배포 방식을 사용하기 위해 **Nginx**를 추가하여 8080으로 들어오는 요청을 상황에 따라 8080, 8081로 맞춰 보내도록 설정하였다.

우선 기존의 배포 과정을 수정해야 한다.

### **github actions의 workflow 작성**

```yaml
name: Java CI with Gradle

on:
  push:
    branches: [ "main" ]

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

      - name: Create application.yml
        run: |
          echo "${{env.APPLICATION}}" > ./src/main/resources/application.yml

      - name: Grant execute permission for gradlew
        run: chmod +x gradlew
        working-directory: ${{ env.working-directory }}

      - name: Build with Gradle
        run: ./gradlew build
        working-directory: ${{ env.working-directory }}

      - name: Login to DockerHub
        uses: docker/login-action@v1
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and Push Docker image
        run: |
          docker build -t ywj9811/encore:latest .
          docker push ywj9811/encore:latest

      - name: Cleanup Gradle Cache
        if: ${{ always() }}
        run: |
          rm -f ~/.gradle/caches/modules-2/modules-2.lock
          rm -f ~/.gradle/caches/modules-2/gc.properties

      - name: Deploy
        uses: appleboy/ssh-action@v0.1.10
        with:
          host: ${{ secrets.EC2_SERVER_HOST }}
          username: ${{ secrets.EC2_SERVER_USERNAME }}
          key: ${{ secrets.PRIVATE_KEY }}
          envs: GITHUB_SHA
          script: |
            chmod +x 경로/deploy.sh
            경로/deploy.sh
          debug: true
```

조금 살펴보자면

```yaml
name: Java CI with Gradle

on:
  push:
    branches: [ "main" ]

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

      - name: Create application.yml
        run: |
          echo "${{env.APPLICATION}}" > ./src/main/resources/application.yml

      - name: Grant execute permission for gradlew
        run: chmod +x gradlew
        working-directory: ${{ env.working-directory }}

      - name: Build with Gradle
        run: ./gradlew build
        working-directory: ${{ env.working-directory }}

      - name: Login to DockerHub
        uses: docker/login-action@v1
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and Push Docker image
        run: |
          docker build -t ywj9811/encore:latest .
          docker push ywj9811/encore:latest

      - name: Cleanup Gradle Cache
        if: ${{ always() }}
        run: |
          rm -f ~/.gradle/caches/modules-2/modules-2.lock
          rm -f ~/.gradle/caches/modules-2/gc.properties

```

여기까지는 JDK 버전 설정과 application.yml 올리기, build, 그리고 Docker에 올리는 과정이 나와있는 것이고 

이후의 Deploy 단계에서 이제 배포 스크립트를 실행시켜서 다음 단계를 실행시킬 것이다.

```yaml
      - name: Deploy
        uses: appleboy/ssh-action@v0.1.10
        with:
          host: ${{ secrets.EC2_SERVER_HOST }}
          username: ${{ secrets.EC2_SERVER_USERNAME }}
          key: ${{ secrets.PRIVATE_KEY }}
          envs: GITHUB_SHA
          script: |
            chmod +x 경로/deploy.sh
            경로/deploy.sh
          debug: true
```

이 과정에서 나의 서버에 접근하여 해당 경로에 있는 배포 스크립트를 동작 시킬 수 있게 권한을 주고 동작 시키게 되는데 해당 부분에서 블루 그린 배포 전략이 실행된다.

### 참고

```yaml
version: '3'
services:
  encore-blue:
    image: 이미지 이름
    container_name: 컨테이너 이름
    ports:
      - "8080:8080"
    command: "java -jar /app.jar"
    restart: always
    environment:
      - TZ=Asia/Seoul
    networks:
      - 공유 네트워크 이름
    volumes:
      - ./logs:/logs
networks:
  encore_network:
    external: true
```

이런 식으로 docker-compose 파일을 작성해서 컨테이너를 올릴 준비를 해놔야 한다.

### deploy.sh 배포 스크립트

```bash
DOCKER_APP_NAME=encore

# Check if nginx is running
EXIST_NGINX=$(docker ps | grep "nginx")

# If not, start nginx
if [ -z "$EXIST_NGINX" ]; then
    sudo cp 경로/nginx.blue.conf 경로/nginx.conf
    docker-compose -f 경로/docker-compose.nginx.yml up -d
fi

# Blue 를 기준으로 현재 떠있는 컨테이너를 체크한다.
EXIST_BLUE=$(docker ps | grep "${DOCKER_APP_NAME}-blue")

ls
pwd

# 컨테이너 스위칭
if [ -z "$EXIST_BLUE" ]; then
    echo "blue up"
    docker-compose -p ${DOCKER_APP_NAME}-blue -f 경로/docker-compose.blue.yml pull
    docker-compose -p ${DOCKER_APP_NAME}-blue -f 경로docker-compose.blue.yml up -d --force-recreate --build
    BEFORE_COMPOSE_COLOR="green"
    AFTER_COMPOSE_COLOR="blue"
else
    echo "green up"
    docker-compose -p ${DOKCER_APP_NAME}-green -f 경로/docker-compose.green.yml pull
    docker-compose -p ${DOCKER_APP_NAME}-green -f 경로/docker-compose.green.yml up -d --force-recreate --build
    BEFORE_COMPOSE_COLOR="blue"
    AFTER_COMPOSE_COLOR="green"
fi

sleep 10

# 새로운 컨테이너가 제대로 떴는지 확인
EXIST_AFTER=$(docker ps | grep "${DOCKER_APP_NAME}-${AFTER_COMPOSE_COLOR}")

if [ -n "$EXIST_AFTER" ]; then
  #nginx.config를 컨테이너에 맞게 변경 및 reload
  sudo cp /경로/nginx.${AFTER_COMPOSE_COLOR}.conf /경로/nginx.conf
  docker exec encore-nginx nginx -s reload

  # 이전 컨테이너 종료
  docker-compose -p ${DOCKER_APP_NAME}-${BEFORE_COMPOSE_COLOR} -f /경로/docker-compose.${BEFORE_COMPOSE_COLOR}.yml down
  echo "$BEFORE_COMPOSE_COLOR down"
fi
```

위와 같이 배포 스크립트를 작성했고 해당 스크립트를 살펴보면 다음과 같다.

1. **우선 Nginx가 실행 중인지 체크한다.**
    
    ```bash
    # Check if nginx is running
    EXIST_NGINX=$(docker ps | grep "nginx")
    
    # If not, start nginx
    if [ -z "$EXIST_NGINX" ]; then
        sudo cp /경로/nginx.blue.conf 경로/nginx.conf
        docker-compose -f /경로/docker-compose.nginx.yml up -d
    fi
    
    ```
    
    만약 실행중이 아니라면 실행시킨다.
    
2. **현재 어떤 종류의 컨테이너가 올라와 있는지 확인 후 교환한다.**
    
    ```bash
    # Blue 를 기준으로 현재 떠있는 컨테이너를 체크한다.
    EXIST_BLUE=$(docker ps | grep "${DOCKER_APP_NAME}-blue")
    
    ls
    pwd
    
    # 컨테이너 스위칭
    if [ -z "$EXIST_BLUE" ]; then
        echo "blue up"
        docker-compose -p ${DOCKER_APP_NAME}-blue -f /경로/docker-compose.blue.yml pull
        docker-compose -p ${DOCKER_APP_NAME}-blue -f /경로/docker-compose.blue.yml up -d --force-recreate --build
        BEFORE_COMPOSE_COLOR="green"
        AFTER_COMPOSE_COLOR="blue"
    else
        echo "green up"
        docker-compose -p ${DOKCER_APP_NAME}-green -f /경로/docker-compose.green.yml pull
        docker-compose -p ${DOCKER_APP_NAME}-green -f /경로/docker-compose.green.yml up -d --force-recreate --build
        BEFORE_COMPOSE_COLOR="blue"
        AFTER_COMPOSE_COLOR="green"
    fi
    
    sleep 10
    ```
    
    위의 스크립트를 보면 어떤 색상의 컨테이너가 동작중인지 확인하는데, 확인된 색상 반대의 색상의 컨테이너를 빌드하여 올려주고, 제대로 동작할 수 있게 `sleep 10` 을 하여 10초 동안 정지를 한다.
    
3. **제대로 동작하는지 확인 후 이전 컨테이너 종료**
    
    ```bash
    # 새로운 컨테이너가 제대로 떴는지 확인
    EXIST_AFTER=$(docker ps | grep "${DOCKER_APP_NAME}-${AFTER_COMPOSE_COLOR}")
    
    if [ -n "$EXIST_AFTER" ]; then
      #nginx.config를 컨테이너에 맞게 변경 및 reload
      sudo cp /경로.${AFTER_COMPOSE_COLOR}.conf /경로/nginx.conf
      docker exec nginx컨테이너이름 nginx -s reload
    
      # 이전 컨테이너 종료
      docker-compose -p ${DOCKER_APP_NAME}-${BEFORE_COMPOSE_COLOR} -f /경로/docker-compose.${BEFORE_COMPOSE_COLOR}.yml down
      echo "$BEFORE_COMPOSE_COLOR down"
    fi
    ```
    
    만약 제대로 올라왔다면 이제 Nginx의 설정을 새롭게 올라간 컨테이너에 맞춰서 변경하고, 이전에 올라와있던 컨테이너는 종료시킨다.
    

### Nginx 설정 파일 작성

```java
// nginx.blue.conf

events {
    worker_connections 1024;
}

http {
    upstream backend {
        server www.dacheserver.com:8080;
    }
    access_log /var/log/nginx/access.log;

    server {
    	listen 80;
    	server_name api.dacheserver.com www.dacheserver.com dacheserver.com;
    	return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        server_name api.dacheserver.com www.dacheserver.com dacheserver.com;
        ssl_certificate /etc/letsencrypt/live/api.dacheserver.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api.dacheserver.com/privkey.pem;

        location / {
            proxy_pass https://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
				    proxy_redirect https://www.dacheserver.com:8080/ /;
        }
    }
}

//nginx.green.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server www.dacheserver.com:8080;
    }
    access_log /var/log/nginx/access.log;

    server {
    	listen 80;
    	server_name api.dacheserver.com www.dacheserver.com dacheserver.com;
    	return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        server_name api.dacheserver.com www.dacheserver.com dacheserver.com;
        ssl_certificate /etc/letsencrypt/live/api.dacheserver.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api.dacheserver.com/privkey.pem;

        location / {
            proxy_pass https://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
				    proxy_redirect https://www.dacheserver.com:8081/ /;
        }
    }
}
```

이렇게 두가지 종류의 nginx.conf 를 작성한다.

**각각 blue와 green에 대한 conf 파일로 배포되는 컨테이너 색상에 맞춰 변경해준다.**

**→ 이 과정은 위의 배포 스크립트에 적용되어있다.**

설정 파일도 간단하게 확인해보자.

`http { }` 안에 서버 블록, 업스트림 블록, 로깅 설정 등등을 작성할 수 있는데, 

```java
upstream backend {
	server www.dacheserver.com:8080;
}
```

이렇게 `upstream`을 설정해준다.

이를 통해서 프록시 서버인 **Nginx**에서 실제 백엔드 서버인 `www.dacheserver.com:8080` 로 요청을 전달하게 된다.

이 과정은 아래의 server 블록의 `proxy_pass:` 를 통해 처리된다.

```java
server {
	listen 80;
	server_name api.dacheserver.com www.dacheserver.com dacheserver.com;
	return 301 https://$host$request_uri;
}
```

이 부분은 80 서버 블록으로 즉 http 요청이 들어오는 경우 https로 변경하여 다시 리다이렉트 하는 부분이다.

```java
server {
	listen 443 ssl;
	server_name api.dacheserver.com www.dacheserver.com dacheserver.com;
	ssl_certificate /etc/letsencrypt/live/api.dacheserver.com/fullchain.pem;
	ssl_certificate_key /etc/letsencrypt/live/api.dacheserver.com/privkey.pem;

	location / {
		proxy_pass https://backend;
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
    proxy_redirect https://www.dacheserver.com:8081/ /;
	}
}
```

이 부분은 443 서버 블록으로 즉 https 요청이 들어온 경우 처리하는 부분이다.

ssl_certificate 부분을 통해 인증서 처리를 해준다.

**→ 이 부분은 ec2 서버에 Docker로 Nginx를 올려서 처리할 때 aws의 인증서가 등록되지 않아 오류가 발생해 직접 인증서를 서버에 올려서 사용하기 때문에 추가한 부분이다.**

아래는 위에서 설명한 것과 같이 요청이 들어오면 몇가지 설정을 하여 `proxy_pass` 를 통해 백엔드 서버에 요청을 보낸다.

그리고 `proxy_redirect` 에서 `https://www.dacheserver.com:8080` 로 돌아온 요청을 `/` 로 변경하여 클라이언트로 https 응답을 하는 것이다.

즉, 정리하면

```
프론트 요청 → Nginx 프록시 서버 → 백엔드

백엔드 응답 → Nginx 프록시 서버 → 클라이언트
```

이렇게 될 수 있도록 해주는 것이다.

서버에서는 이를 위해서 이러한 파일을 가지고 있다.

- /서버 내부 경로/
    - docker-compose.blue.yml
    - docker-compose.green.yml
    - docker-compose.nginx.yml
        
        (여기까지 컨테이너 올리기 위한 compose 파일)
        
    - deploy.sh
    - nginx.blue.conf
    - nginx.green.conf
    - nginx.conf

이를 통해서 nginx.blue.conf 혹은 nginx.green.conf가 nginx.conf에 복사되어 **nginx.conf가 재등록 되어 설정이 변하는 방식**이다.