---
title: Redis Cluster 마이그레이션
date: '2025-03-31'
tags: ['기술', 'REDIS']
draft: false
summary: Redis Cluster로 마이그레이션 하는법
---
## Redis Cluster 구조

![image.png](/static/images/redis_cluster.png)

Redis Cluster는 위와 같은 구조로 이루어져 있다.

따라서, Redis Standalone 구조를 사용할 때와 다르게, key가 한 곳에 모여있는 것이 아닌, 여러 슬롯에 퍼지게 된다는 것을 유의해야 한다.

## 동시에 여러 Key에 접근하는 것을 주의하기

위에서 말한 것과 같이 Redis를 하나만 사용할 경우 모든 key가 한 곳에 있지만, Redis Cluster의 경우 key가 여러 노드에 나뉘어져 있다.

이러한 특성으로 인해 여러가지 고민거리를 만들어준다.

기존에는 Redis의 여러 key에 접근하는 방법으로 `mget` `mset` 을 수행할 수 있었다.

```bash
# redis의 현재 상황
# {key: key1, value: "first"}
# {key: key2, value: "second"}
redis-cli > SET key1 "first"
redis-cli > SET key2 "second"

# MGET으로 2개의 key에 대한 값을 동시에 가져옴
redis-cli > MGET key1 key2
1) "first"
2) "second"
```

하지만, Redis Cluster를 사용하는 경우 다음과 같은 오류가 발생할 수 있다.

`CROSSSLOT Keys in request don't hash to the same slot` 

이는, Redis Cluster는 16,384개의 슬롯이 있는데 각 키들이 서로 다른 슬롯에 들어가서 발생하는 것이다.

즉, mget과 같은 명령어를 사용하기 위해서는 해당 키들이 모두 같은 키 슬롯에 들어있어야 한다.

물론, 이를 변경하는 방법 중 가장 간단한 방법은 각 key들에 대해 모두 개별 연산을 수행하는 방법이 있을 수 있다.

```java
// keys : key들이 들어있는 ArrayList
for(var key : keys) {
    redisTemplate.opsForValue().get(key);  
}
```

이런식으로 변경할 수 있을 것이다.

`delete` 의 경우에도 단일 파라미터와 다중 파라미터를 모두 처리할 수 있기 때문에 주의해야 한다.

하지만, 트랜잭션의 범위 또한 달라지게 되기 때문에 머리아픈 일이 발생할 수 있다.

서로 다른 노드에 들어가있다면 Redis에서 제공하는 트랜잭션을 이용할 수 없다.

이러한 문제에 대한 해결책으로 Redis는 `hash tags` 를 제공하고 있다.

### hash tags

Redis의 key를 중괄호로 묶으면, 중괄호 내의 key를 hash한 결과값을 바탕으로 노드에 할당하게 된다.

```
1. key:{group}:test
2. key:{group}:hello
```

여기서 group이라는 문자열이 중괄호로 묶여 있는 것을 확인할 수 있고, 이를 hash tag라고 한다.

hash tag가 없는 key는 key전체를 hash하는 반면, hash tag를 포함한 key는 hash tag 내부에 있는 문자열에만 hash를 진행하기 때문에 같은 hash tag를 가진 다른 key도 같은 노드에 들어갈 수 있다.

따라서 이러한 hash tag를 이용한다면 트랜잭션 뿐만 아니라, 위에서 보았던 `mget` 과 같은 명령어도 사용할 수 있다.

단, 여러 노드에 분산되는 것이 아닌 하나의 노드에 집중될 수 있기 때문에 너무 자주 사용하는 것은 좋지 않을 수 있다고 한다.

## 데이터 마이그레이션

Redis Standalone → Redis Cluster 로 이전하기 위해서는

기존 Standalone Redis의 데이터를 Cluster 환경으로 옮기는 작업이 필요하다.

단순한 복사로 끝나는 것이 아니라,

실시간 데이터 유실 없이 안정적인 이관이 목표다.

이를 위해 3단계로 구성한다.

---

## 마이그레이션 프로세스

```
1. RDB를 이용한 Bulk Import
2. 실시간 데이터는 Dual Write (with MQ)
3. 모니터링 이후 Redis Cluster로 스위칭
```

---

## RDB를 이용한 Bulk Import

**RDB**(Redis Database Backup)는

Redis 메모리 상태를 스냅샷으로 저장한 파일이며

보통 `dump.rdb`로 저장된다.

| 단계 | 설명 |
| --- | --- |
| Step 1 | RDB 스냅샷 생성 (`BGSAVE`) |
| Step 2 | dump.rdb 파일을 Redis Cluster 서버로 복사 |
| Step 3 | Redis Cluster의 data 디렉토리에 dump.rdb 배치 |
| Step 4 | Cluster 노드 재시작 (dump.rdb 로딩) |
| Step 5 | Slot Rebalance로 데이터 자동 분산 |

---

## 실시간 데이터 Dual Write (MQ 활용)

RDB로 bulk로만 옮기면

dump 이후 실시간으로 들어오는 데이터는 유실될 수 있다.

이를 방지하기 위해

dump 이전부터 Redis Write 요청을

→ 기존 Standalone Redis

→ + MQ (RabbitMQ, Kafka 등)

에 동시에 기록한다.

Cluster가 준비된 이후

→ MQ에 쌓여있던 dump 이후의 Write 이벤트를

→ 순차적으로 Redis Cluster로 replay

이로써

→ dump → switchover 사이의 데이터를 보정

→ 완전 무손실 마이그레이션 가능

---

## 모니터링 및 전환

- Cluster에 적재된 데이터 정합성 검증
- MQ lag, replay 여부 확인
- 정상 확인 후 Read, Write를 Redis Cluster로 전환
- 이후 Dual Write 중단
    
    → Redis Cluster만으로 서비스 운영