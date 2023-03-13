---
title: 고급 매핑
date: '2023-03-10'
tags: ['spring boot', 'JPA', '인프런', '김영한', '기술']
draft: false
summary: 매핑의 종류는 다양하게 있는데 더 깊이 알아보도록 하자.
---

## 상속 관계 매핑

관계형 데이터베이스에는 상속 관계가 없다.

관계형 데이터에서는 슈퍼 타입과 서브 타입 관계라는 모델링 기법이 객체의 상속과 유사하다.

따라서 **객체의 상속 구조와 DB의 슈퍼 서브 타입 관계를 매핑**하는 것이다.

![as1](/static/images/Persist/as1.png)

위의 DB를 이야기 하자면,

- Album : id, name, price, artist
- Movie : id, name, price, director, actor
- Book : id, name, price, author, isbn

이렇게 Item에 해당하는 값들을 공통적으로 가지고 간다고 보면 된다.

이렇게 만들기 위한 상속 관계 매핑에는 몇가지 전략이 있다.

### 상속 관계 매핑

- 각각 테이블로 변환 → **조인 전략**
  **@Inheritance(strategy=InheritanceType.JOINED)**
- 통합 테이블로 변환 → **단일 테이블 전략**
  **@Inheritance(strategy=InheritanceType.SINGLE_TABLE)**
- 서브타입 테이블로 변환 → **구현 클래스마다 테이블 전략**
  **@Inheritance(strategy=InheritanceType.TABLE_PER_CLASS)**

### ⚠️ 참고 - @DiscriminatorColumn(name=”DTYPE”) 이는 어떤 테이블인지 슈퍼 타입에 들어가서 구분할 수 있게 해준다.

### 1. 조인 전략

![as2](/static/images/Persist/as2.png)

- 장점
  - 테이블 정규화
  - 외래 키 참조 무결성 제약 조건 활용 가능
  - 저장 공간 효율화
- 단점
  - 조회시 조인을 많이 사용함 따라서 성능 저하
  - 조회 쿼리가 복잡함
  - 데이터 저장시 Insert SQL 2번 호출

### 2. 단일 테이블 전략

![as3](/static/images/Persist/as3.png)

말그대로 하나의 테이블에 모두 합치는 것이다.

- 장점
  - 조인이 필요 없으므로 일반적으로 조회 성능이 빠름
  - 조회 쿼리가 단순함
- 단점
  - 자식 엔티티가 매핑한 컬럼은 모두 NULL 허용
    (Album에도 director, actor 등등이 들어가야 함)
  - 단일 테이블에 모든 것을 저장하므로 테이블이 매우 커질 수 있다. 상황에 따라서 조회 성능이 오히려 느려질 위험이 있다.

### 3. 구현 클래스마다 테이블 전략

![as4](/static/images/Persist/as4.png)

**이 방식은 데이터베이스 설계자, ORM 개발자 모두 추천하지 않는다.**

## @MappedSuperclass

### 공통 매핑 정보가 필요할 때 사용하는 어노테이션이다.

![as5](/static/images/Persist/as5.png)

이렇게 객체에서는 나누어 가져가고, DB에는 합쳐져서 들어가게 된다.

### 특징

- 상속 관계 매핑이 아님
- 엔티티가 아니며 테이블과 매핑되지 않는다.
- 부모 클래스를 상속 받는 자식 클래스에 매핑 정보만 제공해주는 것이다.
- 조회, 검색 불가능 (em.find(BaseEntity) 불가능)
- 직접 생성해서 사용할 일이 없으므로 추상 클래스 권장
- 테이블과 관계 없고, 단순히 엔티티가 공통으로 사용하는 매핑 정보를 모으는 역할이다.
- 주로 등록일, 수정일, 등록자, 수정자 같은 전체 엔티티에서 공통으로 적용하는 정보를 모을 때 사용
