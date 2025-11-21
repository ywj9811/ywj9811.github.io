---
title: WebServer 병목 트러블슈팅
date: '2025-11-16'
tags: ['기술', '트러블슈팅']
draft: false
summary: Apache 병목 트러블슈팅 및 설정
---
## 문제 상황

서비스 운영 중 출근시간에 10000여명의 사용자가 동시에 로그인을 하면서 **API 요청 실패 및 응답 지연**이 빈번히 발생하였고, Scouter 모니터링에서도 다수의 **지연 및 Timeout API 호출**이 감지되었습니다.

---

## 문제 파악 과정

1. **WAS 병목 가능성 배제**
    - WAS는 5대 구성으로 부하가 균등하게 분산되어 있었고, 로그 또한 균일하게 남고 있었음
    - 따라서 **WAS 구간의 병목 가능성은 낮다**고 판단.
2. **WebServer 구간 집중 분석**
    - WebServer는 2대만 운영되고 있었기 때문에, 트래픽 집중 시 앞단 병목이 발생할 가능성이 높다고 판단.
    - Apache의 `error.log`를 확인하던 중 아래 로그 다수 확인:
        
        ```
        AH03490: scoreboard is full, not at MaxRequestWorkers. Increase ServerLimit
        AH10159: server is within MinSpareThreads of MaxRequestWorkers, consider raising the MaxRequestWorkers setting
        ```
        
    - 이를 통해 **WebServer의 동시 처리 한계(ServerLimit / MaxRequestWorkers)** 로 인한 병목임을 확정.

---

## 원인 분석

- Apache 기본 설정:
    
    ```xml
    <IfModule mpm_event_module>
        StartServers 3
        MinSpareThreads 75
        MaxSpareThreads 250
        ThreadsPerChild 25
        MaxRequestWorkers 400
        MaxConnectionsPerChild 0
    </IfModule>
    ```
    
- `ServerLimit` 기본값(16) 기준으로 `16 × 25 = 400`개의 스레드가 최대치.
- 트래픽이 순간적으로 400 요청을 초과하자 **scoreboard(프로세스 슬롯)** 이 가득 차며
    
    `AH03490`, `AH10159` 로그 발생 → WebServer가 더 이상 요청을 처리하지 못하고 API가 처리되지 못하는 현상이 발생한 것이었다.
    

---

## 조치 및 개선

### 인프라팀 협의 및 자원 기반 재산정

- 인프라팀과 협력하여 서버 자원(CPU 16코어 / RAM 15GB) 및 트래픽 패턴 분석.
- 스레드당 메모리 사용량을 보수적으로 1MB로 가정하고,
    
    OS 캐시 및 여유분(5~7GB)을 확보한 상태에서
    
    **MaxRequestWorkers를 서버당 3,072개로 상향 조정** 결정.
    

### 설정 변경 및 반영

```xml
<IfModule mpm_event_module>
    StartServers              16
    MinSpareThreads           384
    MaxSpareThreads           1024
    ThreadsPerChild           64
    MaxRequestWorkers         3072
    ServerLimit               48
    MaxConnectionsPerChild    0
</IfModule>
```

- `ServerLimit × ThreadsPerChild = 3072` 구조로 확장.
- 설정 반영 시 **graceful restart 불가 → 완전 재시작 수행.**

### 모니터링 체계 정비

- APM 모듈 없이 CLI 기반 모니터링 구성:
    - `docker stats`: CPU, MEM, I/O, PIDs 모니터링
    - `top`: load average, 스레드 상태, 메모리 점유 확인
- 변경 후 부하 테스트 결과 CPU 약 25%, MEM 약 20%로 안정 유지.

---

## 결과

- **scoreboard 포화 및 요청 실패 현상 완전 해소.**
- `AH03490`, `AH10159` 로그 재발 없음.
- 인프라팀과 협업하여 **MPM Event 튜닝 가이드 문서화 및 운영 반영** 완료.

---