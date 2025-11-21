---
title: DB Connection 누수로 인한 서비스 지연 트러블슈팅
date: '2025-11-14'
tags: ['기술', '트러블슈팅']
draft: false
summary: DB Connection 누수로 인한 서비스 지연에 원인 파악 및 해결
---
### 문제 상황

한국토지주택공사(LH) 대상 신규 서비스 오픈 첫날, 초기 모니터링 과정에서

**출근 시간대에 약 10,000명 규모의 로그인 요청이 단시간에 몰리며**

서버 응답 지연 및 일부 Timeout이 발생하며 Scouter에서 주요 API들이 **빨간색 경고 상태**로 다수 표시되었습니다.

---

### 문제 탐색 과정

1. **SlowQuery 탐색**
    
    타사와 동일한 로직 및 인덱스 구조를 사용하고 있었고, 타임아웃을 유발할 수준의 쿼리는 없어 쿼리로 인한 **병목 가능성 낮음**으로 판단하였습니다.
    
2. **서버 병목 탐색**
    
    이전 유사 이슈에서 WebServer 병목을 해결한 상태였고, 로그를 확인한 결과 에러가 발생하지 않는 상황이었으며 DB 서버의 자원을 확인한 결과, **CPU·메모리 사용률 30~40% 수준으로 여유있었습니다.**
    
    따라서 하드웨어·쿼리 이슈 모두 배제 후 **Connection Pool 문제 가능성**을 생각하며 점검해보게 되었습니다.
    
3. **DB Connection 상태 점검**
    
    ```sql
    SELECT count(*) AS total_conn, state
    FROM pg_stat_activity
    GROUP BY state;
    ```
    
    - `max_connections = 1000` 중 `Idle` 상태 Connection이 **900개 이상**
    - Tomcat에 설정된 ConnectionPool 확인한 결과 Pool 설정은(`MaxTotal=100`, `MaxIdle=20`)이었고, 5대의 WAS_SERVER로 구성을 하였기에 약 100개의 Connection이 유지되며 최대 약 500개의 Connection이 정상적인 상황이었습니다.
    - `pg_stat_activity` 분석 결과, **수일 이상 Idle 유지 세션 다수 확인** → 비정상 연결 확정

---

### 근본 원인 규명

- **근태 연동 배치(15분 주기, Node.js 기반)** 로직에서 원인 발견
- 해당 배치는 Tomcat Pool을 사용하지 않고 **단일 client 연결** 방식으로 동작
- **`finally` 구문 내 연결 종료 누락**으로 실행 주기마다 Connection이 누적되는 구조적 결함 존재
- 배치 주기(15분)가 짧아 누적이 빠르게 증가했고, 로그인 요청이 집중된 시점에 DB 연결 한계치에 도달하면서 병목이 표면에 드러나게 된 것이었습니다.

---

### 조치 및 개선

1. **즉시 조치**
    
    ```sql
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE state = 'idle'
      AND now() - state_change > interval '1 hour';
    ```
    
    - 장기 Idle Connection 강제 종료 → Idle 세션 **900 → 약 100개 수준으로 감소**
    - API 응답 속도 및 로그인 정상화
2. **근본 조치**
    - 배치 로직 수정
        - `try-finally` 구조로 Connection 종료를 **항상 보장**
    - 장애 원인 및 조치 내역을 **유지보수팀에 전달**
    - **인프라팀에 DB Connection 모니터링 항목 추가 요청**,
    
    이와 같은 조치를 통해 향후 동일 유형 장애 발생 시 즉각 감지 가능하도록 개선하였다.

## 결론
Postgresql의 경우 Connection마다 스레드가 아닌 프로세스를 생성하는 방식을 이용한다고 한다.
위와 같이 Postgresql을 사용하며 Connection의 누수가 발생하는 경우, 이번에는 서버 스펙이 좋아서 서버 자원에 문제가 발생하지 않았지만 Connection이 고갈되는 문제와 별개로 서버 자원이 고갈되는 문제가 발생할 수 있는 문제라 생각한다.
물론, Connection Pool을 설정했고 해당 Pool을 이용하는 방식의 로직이라면 괜찮을 수 있지만, 이처럼 배치를 돌리는 로직이 있고 가끔 수행하기에 새롭게 Connection을 맺고 끊어주는 로직을 작성하게 된다면 Try-Finally를 통해 무조건 연결을 끊을 수 있도록 해야한다는 것을 느끼게 되었던 것 같다. 