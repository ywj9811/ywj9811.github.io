---
title: Mysql SQL문법
date: '2023-09-03'
tags: ['SQL']
draft: false
summary: MySql의 SQL문법을 정리하고 넘어가도록 하자
---

SQL문을 계속 사용하지만 사용하던 것들만 사용하니 기억이 안나는 내용이 많아 SQL 문법을 모두 정리하고 가도록 하자.

### Distinct

컬럼값들의 중복을 제거한 결과 출력

```sql
select distinct col from table;
# col의 중복을 제거하고 출력
select distinct col1, col2 from table;
# col1과 col2의 값이 모두 같은 경우만 제거하고 출력
```

### Alias

Select 절에서 사용하는 것으로 `as` 를 뜻

```sql
select col as name from table;
# col이 name으로 출력
```

### concat

간혹 여러 컬럼 값을 합쳐서 가져와야 하는 경우가 있는데, 이때 사용하는 방법

| idx | type | name |
| --- | --- | --- |
| 1 | 1 | 안중근 |
| 2 | 1 | 윤봉길 |
| 3 | 2 | 이순신 |
| 4 | 3 | 왕건 |
| 5 | 4 | 반갑수 |

```sql
select (type + '::' + name) as hero_name from table;
# 이 코드는 아래와 같다.
select concat(type, '::', name) as hero_name from table;
```

결과

| hero_name |
| --- |
| 1::안중근 |
| 1::윤봉길 |
| 2::이순신 |
| 3::왕건 |
| 4::반갑수 |

### 논리 연산자

1. NOT : ~가 아니다
    
    ```sql
    where NOT user_id in (1, 2)
    ```
    
2. AND : A와 B 만족
    
    ```sql
    where user_id = 1 AND user_name = 'nameA'
    ```
    
3. OR : A혹은 B 둘 중 하나 이상 만족
    
    ```sql
    where user_id = 1 OR user_name = 'nameA'
    ```
    

### SQL 연산자

```sql
where A between B and C
# B <= A <= C

where A in (1,2,3)
# A = 1 or A = 2 or A = 3

where A like '_ble%'
# A의 값중 2,3,4번째 값이 ble인 모든 값 선택
# _는 1개, %는 무한
```

### escape

SQL에서 ‘%’ , ‘_’와 같이 특수문자를 검색하는 것은 불가능하다.

하지만 검색하고 싶은 경우 escape를 사용하면 된다.

```sql
select name from table
where
product_name LIKE '%#_%' ESCAPE '#';
```

이렇게 escape 문자를 지정한 후에, 특수문자 앞에 escape 문자를 넣어주면 된다.

여기서는 `_` 언더바가 들어간 product_name을 검색하는 것이다.

### limit

```sql
select * from table limit 5;
# 5개만 가져온다.

select * from table limit 4, 10;
# 5번째부터 10개 추출 (0, 1, 2, 3, 4 이렇게 시작하기 때문에 5번째)
# 여기에 order by 를 넣는 등 활용 가능
```

### 숫자함수

- round
    
    숫자 데이터를 다룰 때 반올림 기능을 가지고 있다.
    
    ```sql
    select round(a) from table
    # a의 소숫점 없는 값이 나옴
    select round(a, n) from table
    # a의 소수 n번째 자리에서 반올림
    ```
    
- Truncate
    
    버림 기능을 가지고 있다.
    
    ```sql
    select truncate(a, n) from table
    # n번째 자리수 버림
    # round와 다르게 반드시 버림 할 자리수 명시해야함
    ```
    

### 조건문

- IF(조건값 = 비교값, TRUE시, FALSE시)
    
    ```sql
    # 조건 1개 사용시
    select DATE_FORMAT(NOW(), '%Y%m%d') as "오늘 날짜"
    , IF(DATE_FORMAT(NOW(), '%Y%m%d') = '20230830', 'O', 'X') as "오늘 날짜는 20230830"
    , IF(DATE_FORMAT(NOW(), '%Y%m%d') = '20220830', 'O', 'X') as "오늘 날짜는 20220830";
    ```
    
    | 오늘날짜 | 오늘 날짜는 20230830 | 오늘 날짜는 20220830 |
    | --- | --- | --- |
    | 202308030 | O | X |
    
    ```sql
    # 조건 여러개 사용시
    select IF(VAL_A = 'A', VAL_1, '조건1') as "A = 1"
    , IF(VAL_A = 'B', VAL_1, IF(VAL_B = 'B', VAL_2, 'X')) as "B = 2"
    , IF(VAL_A = 'C', VAL_1, IF(VAL_B = 'D', VAL_2, IF(VAL_C = 'C', VAL_3, VAL_4))) as "C = 3"
    FROM (select 'A' as VAL_A,
    'B' as VAL_B,
    'C' as VAL_C,
    'D' as VAL_D,
    '1' as VAL_1,
    '2' as VAL_2,
    '3' as VAL_3,
    '4' as VAL_4
    FROM DUAL
    ) A;
    ```
    
    | A = 1 | B = 2 | C = 3 |
    | --- | --- | --- |
    | 1 | 2 | 3 |
- IFNULL(대상값, NULL일 경우 출력값)
    
    IF와 마찬가지로 사용할 수 있음
    
    IF와 섞어서 사용할 수 있음
    
- **CASE 문**
    
    CASE WHEN 조건 THEN 값 WHEN 조건 THEN 값 ELSE 값 END
    
    ```sql
    select 
    CASE 
    WHEN VAL_A = 'A' THEN VAL_1
    ELSE VAL_4
    END AS "조건 한개"
    ,
    CASE 
    WHEN VAL_A = 'A' AND VAL_B = 'B' THEN CONCAT(VAL_A, VAL_B)
    WHEN VAL_C = 'X' THEN VAL_3
    ELSE VAL_4
    END AS "조건 두개"
    ,
    CASE
    WHEN VAL_A = IS NOT NULL 
    	THEN
    	CASE 
    		WHEN VAL_D = 'D' THEN '조건 ELSE 조건'
    			ELSE ''
    			END
    		WHEN VAL_C = 'C' THEN '조건 계속1'
    		WHEN VAL_C = 'K' THEN '조건 계속2'
    		ELSE '0'
    	END AS "다중조건"
    FROM (select 'A' as VAL_A,
    'B' as VAL_B,
    'C' as VAL_C,
    'D' as VAL_D,
    '1' as VAL_1,
    '2' as VAL_2,
    '3' as VAL_3,
    '4' as VAL_4
    FROM DUAL
    ) A;
    ```
    

## 문자 함수

[https://codingspooning.tistory.com/entry/MySQL-문자열-함수](https://codingspooning.tistory.com/entry/MySQL-%EB%AC%B8%EC%9E%90%EC%97%B4-%ED%95%A8%EC%88%98)

### Group by

Mysql에서 GROUP BY는 특정 컬럼 이름을 지정해주면 그 컬럼의 UNIQUE한 값에 따라서 데이터를 그룹 짓고, 중복된 열은 제거된다.

예를 들어 아래와 같이 있을 때

| user_id | product_id |
| --- | --- |
| 1 | A |
| 2 | B |
| 1 | A |
| 3 | C |
| 2 | B |
| 1 | B |

여기서 `GROUP BY user_id`를 적용하면 "user_id"별로 그룹화된다.

| user_id | product_id |
| --- | --- |
| 1 | A |
| 2 | B |
| 3 | C |

Group BY는 집계 함수와 주로 같이 쓰인다.

<aside>
💡 집계 함수란

COUNT, SUM, SVG, MAX, MIN

COUNT는 행의 개수를 세는 함수로

```sql
select count(*) from players;
# 이런식으로 사용되며, player의 행의 개수를 가진다.
# *은 모든 행의 개수
select count(birthYear) from players;
# 이는 birthYear를 세는 것으로 null은 제외한다.
select count(case when cs_type=2 then 1 end)
# 이는 cs_type이 2일때 +1을 하는 것이다.
```

AVG는 말그대로 평균을 구하는 함수이고 SUM은 합을 구하는 함수이다.

MIN과 MAX역시 말그대로 최소와 최대이다.

</aside>

| ID | NAME | Quantity |
| --- | --- | --- |
| 1 | Item1 | 2 |
| 2 | Item1 | 4 |
| 3 | Item2 | 3 |
| 4 | Item3 | 8 |

이때

```sql
select name, count(name) as count, sum(quantity) as sum from table1
group by name;
```

이렇게 실행하게 되면

| name | count | sum |
| --- | --- | --- |
| Item1 | 2 | 7 |
| Item2 | 1 | 3 |
| Item3 | 1 | 8 |

이렇게 나온다.

### Having

이는 Group by 절에서 조건을 추가할 때 사용하는 것으로 Group by는 where이 아닌 having으로 조건을 추가한다.

```sql
select name, count(name) as count from table1
group by name
having count(name) > 1;
```

이렇게 하면

| name | count |
| --- | --- |
| Item1 | 2 |

이렇게 나오게 된다.

### 날짜 데이터 추출

- YEAR : 연도 추출
- MONTH : 월 추출
- DAY : 일 추출
- HOUR : 시 추출
- MINUTE : 분 추출
- SECOND : 초 추출

```sql
YEAR(DATETIME(컬럼명)) BETWEEN '2022' AND '2024'
MONTH(DATETIME(컬럼명)) BETWEEN '09' AND '12'
HOUR(DATETIME(컬럼명)) BETWEEN '01' AND '20'
등등
```