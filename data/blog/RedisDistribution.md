---
title: Redis의 데이터 분산 처리 방법
date: '2025-03-30'
tags: ['기술', 'REDIS']
draft: false
summary: Redis의 분산 시스템 구축 방법
---
Sharding, Consistent Hashing, Redis Cluster 이렇게 세가지 방법을 알아보도록 하자.

![image.png](/static/images/distribute/distributed1.png)

Redis는 위와 같이 운영 모드가 있다고 한다.

Standalone 은 단순히 하나의 Redis를 올려서 사용하는 방식이고, 고가용성을 확보하기 위해서 Master-Slave 구조인 Sentinel 구조를 선택할 수 있다.

그렇다면, 고가용성과 데이터 분산을 모두 해결하고자 한다면? Redis Cluster를 선택할 수 있을 것이다.

Redis Cluster 모드를 사용하거나, 어플리케이션 레벨에서 데이터를 나누어 사용하는 것 또한 가능하다.

## Sharding

샤딩이란, DB 분산 저장 기법중 하나로, 하나의 거대한 데이터베이스를 여러개의 작은 조각으로 나누어 분산 저장하는 관리 기법을 의미한다.

이때 어떤 방식을 통해 샤딩을 할 것인가에 따라 몇가지 전략이 있다.

### Range

Range Sharding은 가장 쉬운 방법이다. PK를 기준으로 혹은 특정 값을 기준으로 범위를 특정하여 해당하는 DB에 저장하도록 나누는 방식이다.

하지만, 이렇게 진행하게 되면 데이터를 균등하게 나누지 못하고 한 곳에 몰릴 수 있다.

### Modular

Modular Sharding은 특정 값을 모듈러 연산한 결과로 데이터를 분산하는 것이다.

나머지 연산을 통해 분배하기 때문에 Range 보다는 균등하게 분포되게 된다.

하지만, 이 경우 분산된 서버가 증가하거나 감소할 때 Rebalancing (재분배) 해야하는 데이터가 많아진다.

만약 Rebalancing의 부하를 줄이기 위해서는 1 → 2 → 4 → 8 이런 방식으로 증설해야 하는데, 너무 많은 서버를 한번에 증설해야 한다는 문제가 있다.

### Indexed

특정 Key가 어디로 이동해야 하는지 알려주는 인덱스 서버를 두고, 데이터를 분산시키는 방식이다.

이 경우 데이터가 없어서 노는 서버에는 더 많이, 많은 서버에는 조금 넣어주는 등 조절이 가능한 장점이 있다.

하지만, Index 관리 서버에 의존하기 때문에 장애 포인트가 늘어난다.

## Consistent Hashing

Consistent Hashing은 분산 처리 환경에서 사용되는 알고리즘이다.

이 방식을 사용하게 되면 서버의 증감된 데이터 분량만 재분배 하도록 하여 부담을 줄일 수 있다.

만약 해시함수를 통해 부하를 균등하게 나누고 있었다고 가정을 해보자.

해시함수로 나온 값에 대해 Modular연산을 통해 서버에 접근하였는데, 서버가 추가되거나 서버가 삭제되면 문제가 발생할 수 있다.

위에서 말한 것과 같이 재분배 과정이 복잡해지는 것이다.

Consistent Hashing을 사용하게 되면, `키의 개수/서버 수` 만큼만 키를 재분배할 수 있다.

### Consistent Hashing 동작 원리

### 해시 공간과 해시 링

해시 함수를 사용할 때, 출력 값은 x0~xn 이라고 가정하자.

그렇다면 해시 공간은 x0~xn 까지 존재하게 될 것이다.

![image.png](/static/images/distribute/distributed2.png)

이 공간을 동그랗게 구부리면 해시 링이 나오게 된다.

![image.png](/static/images/distribute/distributed3.png)

이후, 각 서버를 해시 함수를 통해 특정 위치에 배치하게 되면 다음과 같게 나온다.

이때는 Modular 연산을 사용하는 것이 아니다.

![image.png](/static/images/distribute/distributed4.png)

그리고, 각 키값을 해시 링에 위치시키게 되면 다음과 같다.

![image.png](/static/images/distribute/distributed5.png)

이제 키가 저장되는 서버는, 해당 키의 위치로 부터 시계방향으로 링을 탐색해 나가면서 만나는 첫번째 서버이다.

![image.png](/static/images/distribute/distributed6.png)

즉, key0은 s0에, key1은 s1 에 저장되는 것이다.

따라서 만약에 서버를 추가하게 된다면, 이러한 키들 중 가까운 서버가 변경되는 값들만 재배치 하면 되는 것이다.

![image.png](/static/images/distribute/distributed7.png)

마찬가지로, 서버가 제거되면 이러한 키들 중 가까운 서버가 변경되는 값들만 재배치 된다.

![image.png](/static/images/distribute/distributed8.png)

하지만, 기본적인 이 방식에는 몇가지 문제점이 있다.

1. 서버가 추가되거나 삭제되는 상황에서 파티션의 크기를 균등하게 유지하기 어렵다는 점이 있다.
    
    우에서 보는 것과 같이 서버가 추가되거나 제거될 때 특정 서버의 파티션이 작아지거나 커지는 것을 볼 수 있다.
    
2. 키의 균등 분포를 달성하기 어렵다는 점이 있다.
    
    추가되는 모습을 보았을 때 s0에는 아무런 값이 들어가지 않게 된다.
    
    뿐만 아니라 다양한 키가 존재하더라도, 파티션의 크기가 균등하지 않기 때문에 특정 서버에 키가 몰릴 수 있다.
    

이러한 문제를 해결하기 위해 제안된 방법이 가상 노드 기법이다.

### VNodes

가상 노드는 실제 노드 또는 서버를 가리키는 노드로, 하나의 서버는 링 위에 여러개의 가상 노드를 가질 수 있다는 방식이다.

![image.png](/static/images/distribute/distributed9.png)

이 경우 서버는 두개지만, 각각 3개의 가상 노드를 가지게 된다.

기존과 다르게 s0이 아닌 s0_0, s0_1, s0_2 이렇게 3개의 서버가 할당되어 있는 모습을 확인할 수 있다.

따라서 각 서버는 하나가 아닌 여러개의 파티션을 관리해야 한다.

그리고, 기존의 방식과 마찬가지로 키의 위치에서 시계방향으로 탐색하다가 만나는 첫번째 서버가 해당 키가 존재하는 서버인 것이다.

![image.png](/static/images/distribute/distributed10.png)

이렇게 가상 노드를 늘리게 되면 키의 분포는 점점 더 균등하게 될 것이다.

### VNodes에서의 Rebalancing

그러면, 가상 노드를 사용할 때 재배치는 어떻게 진행될까.

이번에도 추가되거나 삭제되면 기존의 키 중 일부는 재배치를 진행해야 한다.

방법은 마찬가지지만, 가상 노드가 여러곳에 존재하기 때문에 기존보다 적은 키 값의 재배치가 필요하게 될 것이다.

## Redis Cluster 모드 : Hash Slot

Redis Cluster 모드로 데이터를 분산 저장하여 운영할 수 있다.

Redis Cluster는 Consistent Hashing을 사용하지 않는 대신 모든 키가 개념적으로 해시 슬롯이라고 부르는 것의 일부분인 형태의 샤딩을 사용한다.

**→ 16,384 개의 고정된 해시 슬롯을 만들어놓고, 여기에 데이터를 분배하는 방식으로 샤딩을 진행한다.**

`CRC16(key) % 16384` 를 통해 슬롯 번호를 결정하는 방식을 이용한다.

이때, 각 Redis 노드는 슬롯을 여러개 맡는 방식이다. (ex 0~4000번 슬롯 담당)

그리고, 서버가 추가되면 슬롯을 적당히 쪼개서 새로운 서버로 넘기게 된다.

### 동작 방식

Redis Cluster는 Primary 노드와 Secondary 노드 세트로 이루어져있다. primary 노드마다 Slot Range가 할당되며, 들어오는 값의 슬롯이 자신에 해당된다면 저장하는 방식이다.

Cluster 모드는 고가용성은 Replication과 Auto Failure 기능으로 기존의 Redis와 같은 방식을 제공하는데,

Primary == Master

Secondary == Slave

이러한 방식으로 이해하면 된다.

![image.png](/static/images/distribute/distributed11.png)

### Redis Cluster는 라이브러리에 의존적이다

Redis 서버에서 자동으로 분산, 라우팅을 처리하지 않기 때문에 로직에서 이를 처리해서 해당하는 Redis에 저장해야 한다.

1. 슬롯 분포 정보를 가져옴
2. 키가 어떤 슬롯에 들어가는지 계산
3. 해당 슬롯을 관리하는 노드로 직접 요청
4. 만약 잘못된 노드에 요청하면 → `MOVED` `ASK` 응답을 받고, 재요청 처리까지 수행

이렇게 모든 과정을 처리해줘야 한다.

하지만, 이러한 과정들을 Reddison, Lettuce와 같은 Cluster 모드 지원 라이브러리를 사용해서 처리하게 되기 때문에 라이브러리에 의존적이라고 말할 수 있다.

### Redis Cluster 서버 추가 및 삭제

### 초기 상태

- Node A : Slot 0 ~ 8191
- Node B : Slot 8192 ~ 16383
- 총 16384개의 슬롯을 2대가 50:50으로 나눠서 담당

### 서버 증설

- Node C 추가
- 아직 슬롯은 재분배되지 않은 상태
- 클러스터 명령어로 새로운 Node C를 클러스터에 등록 (`CLUSTER MEET`)

### 슬롯 Rebalancing (재분배)

- Node A, Node B가 각각 자신이 가진 슬롯의 일부를 Node C에게 넘김
- ex)
    
    Node A: 0 ~ 5460
    
    Node B: 5461 ~ 10922
    
    Node C: 10923 ~ 16383
    

### 클라이언트 자동 갱신

- 클러스터 명령어: `CLUSTER ADDSLOTS`, `CLUSTER REBALANCE`
- 클라이언트는 `MOVED` 응답을 받고 새로운 슬롯 분포를 자동 반영

---

### 초기 상태

- Node A: Slot 0 ~ 5460
- Node B: Slot 5461 ~ 10922
- Node C: Slot 10923 ~ 16383
- 3대의 Redis 노드가 16384개의 슬롯을 분산 담당

### 슬롯 Rebalancing (슬롯 회수)

- `CLUSTER SETSLOT`, `MIGRATE` 명령어로
    
    Node C의 슬롯을 Node A, Node B에게 재분배
    
    (ex. A와 B가 균등하게 가져감)
    

### 서버 삭제 (Node 탈퇴)

- `CLUSTER FORGET` 명령어로
    
    Node C를 클러스터에서 제거
    
- 클러스터의 Slot Mapping 갱신 완료

### 클라이언트 자동 갱신

- 클라이언트는 `CLUSTER SLOTS` 또는
    
    `MOVED` 응답을 통해 Slot 재분배 상황을 자동 인지
    
- 이후에는 Node A, B로만 요청