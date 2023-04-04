---
title: AWS Linux에 Redis를 설치해보자
date: '2023-04-03'
tags: ['기술', 'AWS']
draft: false
summary: AWS Linux EC2에 Redis를 설치해서 사용해보자
---

## AWS Linux EC2에 Redis를 설치해보자

JWT를 사용하며 Refresh Token을 관리하기 위해 Redis를 사용해야 하는데, 서버에서 동작하기 위해서 Redis를 설치하도록 하자.

## Redis 설치

1. **최신 패키지로 업데이트**

   최신 패키지로 업데이트 하기 위해서 아래와 같은 명령을 하자.

   ```bash
   sudo yum update
   ```

   > **`Complete!`** 하고 나오면 완료된 것이다.

1. **Redis 설치를 위한 gcc maker 설치**

   ```bash
   sudo yum install gcc make
   ```

1. **Redis 설치 파일 다운로드**

   Redis를 설치할 디렉토리를 생성하고 해당 디렉토리에 설치하자.

   ```bash
   mkdir Redis

   cd Redis
   ```

   이제 Redis 설치 파일을 다운로드 받도록 하자.

   ```bash
   sudo wget http://download.redis.io/redis-stable.tar.gz
   ```

   이제 ls를 통해 디렉토리 내용을 확인하면 **redis-stable.tar.gz** 가 설치되어 있을 것이다.

1. **Redis 압축 해제**

   현재 다운로드한 파일의 경우 압축 파일이기 때문에 압축을 풀어주도록 하자.

   ```bash
   sudo tar zxvf redis-stable.tar.gz
   ```

   **⚠️ 압축을 완료하고 나면 redis-stable 이라는 디렉토리가 생성되어 있어야 한다.**

1. **추가 작업**

   압축을 풀어주고 해당 파일을 컴파일 해야한다.

   ```bash
   cd redis-stable
   # 해당 디렉토리로 이동

   sudo make
   # MakeFile 실행을 통한 컴파일
   ```

   위 과정을 완료하고 src 폴더에 있는 redis-server 파일과 redis-cli 파일을 /usr/local/bin 디렉토리로 복사한다.

   ```bash
   sudo cp src/redis-server src/redis-cli /usr/local/bin
   ```

1. 복사해서 가져온 config 파일의 설정 수정

   ```bash
   sudo vi /etc/redis/redis.conf
   ```

   이제 수정할 부분이 몇가지 있다.

   - **bind** → 사용자가 bind 하고자 하는 ip로 변경
   - **daemonize** → **yes**로 변경 (Redis를 백그라운드에서 실행하기 위해)
   - **logfile** → **/var/log/redis.lg**
     Redis Log 파일을 저장할 위치 설정 (이 설정이 없다면 로그 기록이 안됨 - daemonize를 yes로 설정하였기 때문에…)
   - **dir** → **/var/lib/redis**
     마지막으로 Working Directory를 설정해준다.

1. **실행 확인**

   ```bash
   redis-server
   ```

   위 명령어를 통해

   ![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fa85c30ff-0846-4598-8ed6-6773f38b3fd0%2FUntitled.png?table=block&id=0a0fbeee-53dd-4352-8556-39020bb82701&spaceId=ed58f7c6-46bb-48c4-829a-b24be3b7faa2&width=1920&userId=db5d5977-127f-463d-b91b-77eec4b05d2d&cache=v2)

   **이렇게 Redis가 실행된 모습을 확인할 수 있다.**

   ### ⚠️ 이 상황에서는 다른 작업을 수행할 수 없다…!

   **따라서 Redis는 백그라운드에서 실행해야 한다.**

   우선, **ctrl + c 를 통해 종료**시키자.

## Redis 백그라운드 실행

**Daemon**으로 실행

```bash
redis-server --daemonize yes
```

이제 동작을 잘 하는지 확인해보자

PONG 이라는 대답이 돌아오면 잘 실행되고 있는 것이다.

```bash
redis-cli ping
```
