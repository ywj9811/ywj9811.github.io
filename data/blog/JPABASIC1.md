---
title: 영속성 컨텍스트 및 영속성 관리
date: '2023-03-07'
tags: ['spring boot', 'JPA', '인프런', '김영한', '기술']
draft: false
summary: 영속성 컨텍스트가 무엇이며 영속성 관리에 대해서 알아보자
---

## 영속성 컨텍스트

> **엔티티를 영구 저장하는 환경 이라는 뜻**

이 영속성 컨텍스트는 논리적 개념으로 눈에 보이지는 않는다.

그리고 엔티티 매니저를 통해서 영속성 컨텍스트에 접근할 수 있다.

## 엔티티의 생명주기

엔티티의 생명주기는 위의 영속성과 함께 설명할 수 있는데,

- **비영속 (new / transient)**
  영속성 컨텍스트와 전혀 관계가 없는 새로운 상태 (ex: 새로 객체 생성한 상태)
  ```java
  Member member = new Member();
  member.setId("member1");
  member.setUsername("회원1");
  ```
- **영속 (managed)**
  영속성 컨텍스트에 관리되는 상태
  ```java
  //객체를 생성한 상태(비영속)
  Member member = new Member();
  member.setId("member1");
  member.setUsername(“회원1”);
  EntityManager em = emf.createEntityManager();
  em.getTransaction().begin();
  //객체를 저장한 상태(영속)
  em.persist(member);
  ```
- **준영속 (detached)**
  영속성 컨텍스트에 저장되었다가 분리된 상태
  ```java
  //회원 엔티티를 영속성 컨텍스트에서 분리, 준영속 상태
  em.detach(member);
  // 특정 엔티티만 준영속 상태로 전환
  //혹은
  em.clear();
  // 영속성 컨텍스트를 완전히 초기화
  em.close();
  // 영속성 컨텍스트를 종료
  ```
- **삭제 (removed)**
  삭제된 상태
  ```java
  //객체를 삭제한 상태(삭제)
  em.remove(member);
  ```

![Persist1](/static/images/Persist/persist1.png)

## 영속성 컨텍스트의 이점

1. **1차 캐시**

   ```java
   Member member = new Member();
   member.setId("member1");
   member.setUsername("회원1");

   //1차 캐시에 저장, 영속
   em.persist(member);

   //1차 캐시에서 조회
   Member findMember = em.find(Member.class, "member1");
   ```

   ### 1차 캐시에서 조회

   ![Persist2](/static/images/Persist/persist2.png)

   ### DB에서 조회

   ```java
   Member findMember2 = em.find(Member.class, "member2");
   ```

   ![Persist3](/static/images/Persist/persist3.png)

2. **동일성(identity) 보장**

   ```java
   Member a = em.find(Member.class, "member1");
   Member b = em.find(Member.class, "member1");

   System.out.println(a == b); //동일성 비교 true
   ```

3. **트랜잭션을 지원하는 쓰기 지원 (transactional write-behind)**

   ```java
   EntityManager em = emf.createEntityManager();
   EntityTransaction transaction = em.getTransaction();
   //엔티티 매니저는 데이터 변경시 트랜잭션을 시작해야 한다.

   transaction.begin(); // [트랜잭션] 시작
   em.persist(memberA);
   em.persist(memberB);
   //여기까지 INSERT SQL을 데이터베이스에 보내지 않는다.

   //커밋하는 순간 데이터베이스에 INSERT SQL을 보낸다.
   transaction.commit(); // [트랜잭션] 커밋
   ```

4. **변경 감지 (Dirty Checking)**

   수정시, `em.find()` 이후에 값을 변경하면 수정되는 원리이다.

5. **지원 로딩 (Lazy Loading)**

## 플러시란?

**변경을 감지하고 수정된 엔티티 쓰기 지연 SQL 저장소에 등록하였을 때 쓰기 지연 SQL 저장소의 쿼리를 데이터베이스에 전송하는 것이다.**

### 영속성 컨텍스트를 플러시 하는 방법

1. **em.flush() - 직접 호출**
2. **트랜잭션 커밋 - 플러시 자동 호출**
3. **JPQL 쿼리 실행 - 플러시 자동 호출 (트랜잭션이 커밋하지 않아도 자동으로 쿼리 날림)**

### 플러시의 특징

- **영속성 컨텍스틀 비우지 않음**
- **영속성 컨텍스트의 변경 내용을 데이터베이스에 동기화**
- **트랜잭션이라는 작업 단위가 중요 : 커밋 직전에만 동기화 하면 된다.**
