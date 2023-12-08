---
title: MongoDB 비밀번호 설정
date: '2023-12-08'
tags: ['Spring boot', 'MongoDB', '기술']
draft: false
summary: MongoDB 보안 이슈와 비밀번호 설정
---
MongoDB 비밀번호는 운영 서버 구축하며 함께 하려 했는데, 좀 더 앞당겨서 작업하게 된 계기는 아래와 같다.

### 그저 개발 단계의 로그를 저장한다고 너무 방심하고 있었다.

매일 전 세계 수많은 해커 비스무리한 아마 중국인들이ㅋㅋ 내 DB를 구경하고 있었다.

![Untitled](/static/images/mongo1.png)

위의 노란 ip는 저 유럽의 ip를 가리키고 있다. 아마 vpn돌렸을 것이다.

그리고 drop 명령어를 치고 있다..!

![Untitled](/static/images/mongo2.png)

그리고 사실 아무생각 없이 지나쳤던 Database를 확인해보니 기본이 아닌 누군가 만든 것이다!

이름은 말 그대로 너의 data를 살리기 위해서는 읽어보라는 것이다!

![Untitled](/static/images/mongo3.png)

그리고 여기서 안내해주는 페이지를 들어가면 돈 내놓으면 데이터 살려주겠다고 한다,,,

지독한 놈들이다.

**사실 이전에 진행하던 프로젝트에서 개발 단계에서 redis에 저장한 토큰을 삭제 당한 경험이 있어서 부랴부랴 비밀번호 설정하고 했던 기억이 있는데 인간은 망각의 동물이라더니,,**

이전 프로젝트는 그 이후에 해외 ip를 필터에서 걸러내기도 하고 몇가지 신경을 썼었는데 너무 안일했다.

## MongoDB 비밀번호 설정

어찌됐든 아무리 개발 단계여도 로그가 자꾸 삭제되는건 좋은게 없기 때문에 빠르게 비밀번호 설정을 진행해보고자 한다.

```yaml
version: '3'
services:
  mongodb:
    image: mongo:latest
    container_name: mongodb
    ports:
      - "27017:27017"
    environment:
      # provide your credentials here
      - MONGO_INITDB_ROOT_USERNAME= USERNAME
      - MONGO_INITDB_ROOT_PASSWORD= PASSWORD
      - TZ=Asia/Seoul
    networks:
      - ~~
networks:
  postgraduate_log:
    external: true
```

이렇게 작성해주고 mongo compass로 확인해보니 아이디 비밀번호가 올바르게 설정이 되었다.

그렇게 

```yaml
spring:
	data:
    mongodb:
      host: host
      port: 27017
      database: database_name
			username: {username}
			password: {pw}
      auto-index-creation: true
```

이렇게 `application.yml` 작업을 하고 바로 작동을 시켰다.

근데 왠걸 `Command failed with error 13 (Unauthorized)` 이런 오류를 뱉어냈다.

그동안 써본 NoSql이라곤 Redis뿐이고 그 외에 모든 DB는 RDBMS만을 사용해온 나는 이해가 안되는 상황이긴 했다…

찾아보니 이는 DB에 해당 계정이 없어서 발생하는 것이라고 한다.

이를 해결하기 위해서 MongoDB의 쉘에 들어가서 계정을 만들어주도록 하면 된다.

그냥 내가 미숙했던 것 같다.

### 근데 여기서 또 문제가 발생해서 몇시간은 헤맸던 것 같다.

아니 `mongo` 를 써서 쉘에 접속하려 하는데 `Command 'mongo' not found` 이러한 에러가 또 뜨고 말았다.

이또한 조사해보니 6.0 버전 이상을 사용하는 경우 `mongo` 가 아닌 `mongosh` 를 사용해야 한다고 한다.^^

(나는 7.0.3 버전이었다)

그냥 그렇게 허무하게 해결됐다.

### 사용할 database 비밀번호 설정

```bash
docker exec -it mongodb mongosh -u ${username} -p ${password} # 이렇게 shell 접근
# 나는 docker를 통해 mongodb를 올렸기 때문에 위와 같이 접근했다.

use ${database이름}
# 사용할 database

db.createUser({
  user: "${username}",
  pwd: "${password}",
  roles: ["readWrite", "dbAdmin"]
})
# 이후 ok:1 이렇게 출력되면 된다.
```

이제 다시 SpringBoot의 `application.yml` 으로 돌아와서

```yaml
spring:
  data:
    mongodb:
      uri: mongodb://username:password@host:port/?authSource=admin&authMechanism=SCRAM-SHA-1
      database: ${database 이름}
```

이전에 작성한 `application.yml` 으로 그대로 작동시켰을 때 문제가 발생해서 url 방식으로 변경하여 동작 시키니 다시 잘 동작했다.

아마 이전의 방식에서 몇가지 부분을 빼먹은 것 같다.