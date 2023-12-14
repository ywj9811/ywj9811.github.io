---
title: Docker 사용하지 않는 이미지, 컨테이너, 볼륨 삭제
date: '2023-12-10'
tags: ['기술', 'Docker']
draft: false
summary: 서버의 볼륨 사용량을 잡아먹는 Docker의 사용하지 않는 이미지, 컨테이너, 볼륨을 삭제하기
---

### Docker는 사용하지 않는 이미지, 컨테이너, 볼륨을 스스로 정리해주지 않는다.

직접 삭제하지 않는다면 쭉 쌓이게 될 것이다.

### 그러면 어느 순간 서버의 볼륨 사용량이 높아지게 될 것이다.

이러한 상황을 예방하기 위해서는 한번씩 사용하지 않는 Docker의 이미지, 컨테이너, 볼륨을 삭제해주는 것이다.

### Docker 컨테이너, 이미지, 캐시

- 도커 용량 확인 : `docker system df --verbose`
- 도커 미사용 컨테이너 삭제 : `docker container prune`
- 도커 미사용 이미지 삭제 : `docker image prune`
- 도커 미사용 볼륨 삭제 : `docker volume prune`
- 도커 미사용 오브젝트 전체 삭제 (로그는 삭제 안됨) : `docker system prune -a`
- 도커 미사용 컨테이너, 이미지, 볼륨 삭제 : `docker system prune`

### 확인

우선 도커 용량을 확인해보자

![Untitled](/static/images/dockerclear/dockerclear1.png)

사실 이중에 대부분은 사용하지 않는 것이다.^^ 정리를 해주지 않았을 뿐

이제 `docker system prune` 를 사용해서 사용하지 않는 것들을 정리해주자.

![Untitled](/static/images/dockerclear/dockerclear2.png)

많이도 정리됐다.

하지만, 매번 생각날때마다 이렇게 지워주는 것 보다는 cron 작업을 만들어서 매일 자정마다 위와 같이 삭제하는 작업을 시켜야 겠다.

물론 workflow를 작성할 때 기존의 이미지를 삭제해주는 등 방법이 있겠지만 서버에서 직접 이미지를 가져오는 등 몇가지 경우가 있어서 이 방법을 선택했다.

### Cron 세팅

- **crontab -e :** 새로운 예약된 작업을 등록하거나 수정할 때 사용하는 옵션입니다. 무엇인가 새로운 설정들을 편집하고 정의해야 하기 때문에 vi 에디터와 함께 편집 모드가 활성화됩니다.
- **crontab -l :** 크론탭에 설정된 내용들을 확인하거나 출력할 때 사용합니다. 
→ 만약 출력이 되지 않는다면 설정이 없는 것입니다.
- **crontab -r :** 크론탭에 설정된 내용을 삭제할 때 사용합니다.

우선 위와 같은 명령어를 알아두고 작업하면 된다. (필요한 경우 sudo)

나의 경우 amazon linux2023을 사용하고 있었는데, 위의 명령어가 작동하지 않아서 찾아보니

[[Amazon Linux 2023] crontab: command not found](https://tech.chhanz.xyz/linux/2023/05/15/al2023-crontab/)

이러한 이야기가 있었다.

따라서 이러한 경우에는 누락된 패키지 설치를 하고 진행을 하도록 하자.

이어서 `crontab -e` 를 명령하면 편집 모드가 활성화 되는데 여기에 cron job을 작성하면 된다.

```bash
* * * * * [명령어]

# 초 분 시 일 월 요일 - 순서이다
```

여기에

```bash
0 0 * * * /usr/bin/docker system prune -f
```

이렇게 작성해주었는데, 이러면 매일 정각에 해당 명령어를 동작시키는 것이다.

![Untitled](/static/images/dockerclear/dockerclear3.png)

이후에 `ps -ef|grep crond` 명령어를 통해 현재 작동중인 cron데몬프로그램이 무엇이 있는지 확인했을 때 제대로 나온다면 동작중인 것이다.

만약 나오지 않는다면 `status crond.service` 를 통해 active 상태인지 확인해보자.

![Untitled](/static/images/dockerclear/dockerclear4.png)

이렇게 active 상태가 나오지 않는다면

```bash
sudo systemctl enable crond
sudo systemctl start crond
```

위의 명령어를 순서대로 작성하여 키고, 시작시키고 다시 확인하면 된다.

이렇게 매일 자정 사용하지 않는 이미지, 컨테이너, 볼륨을 삭제하도록 세팅하였다.