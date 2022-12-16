---
title: 김영한의 HTTP2
date: '2022-09-18'
tags: ['HTTP', '인프런', '기술']
draft: false
summary: HTTP 상태코드, 헤더, 캐시 등등에 대하여
---

## **HTTP 상태코드**

- **1xx (informational) : 요청이 수신되어 처리중**
- **2xx (Successful) : 요청 정상 처리**
  - **200 OK**
  - **201 Created → 요청이 성공해서 새로운 리소스가 생성됨**
  - **202 Accepted → 요청이 접수되었으나 처리가 완료되지 않았음(ex 1시갇ㄴ 뒤에 배치 프로세스가 요청을 처리함)**
  - **204 No Content → 서버가 요청을 성공적으로 수행했지만, 응답 페이로드 본문에 보낼 데이터가 없음**
    **ex)웹 문서 편집기의 save 버튼 : 버튼의 결과로 아무 내용이 없어도 된다(눌러도 같은 화면 유지)**
- **3xx (Redirection) : 요청을 완료하려면 추가 행동이 필요**

  **301, 308 : 영구 리다이렉션**

  **302, 303, 307 : 일시적인 리다이렉션**

  - **301 Moved Permanently : 리다이렉트 요청 메소드가 GET으로 변하고, 본문은 제거될 수 있음**
  - **308 Permanent Redirect : 리다이렉트 요청 메소드와 본문 유지(처음 POST로 보내면 POST유지)**
    ![http_8](/static/images/http_8.png)

    ![http_7](/static/images/http_7.png)

- **302 Found : 리다이렉트 요청 메소드가 GET으로 변하고, 본문이 제거될 수 있음**
- **303 See Other : 302와 기능은 같음, 허나 리다이렉트 요청 메소드가 GET으로 변경**
- **307 Temporary Redirect : 302와 기능은 같음, 허나 요청 메소드와 본문을 유지함**

### **PRG : POST/REDIRECT/GET**

**일시적인 리다이렉션**

**→ POST로 주문후에 웹 브라우저를 새로고침하면?**

**→ 새로 고침은 다시 요청**

**→ 중복 주문이 될 수 있다.**
![http_9](/static/images/http_9.png)

**즉 새로 고침을 하면 POST 요청을 서버에 한번 더 보냄**

**→ POST로 주문하고 새로 고침으로 인한 중복 주문 방지**

**→ POST로 주문 후에 주문 결과 화면을 GET으로 리다이렉트**

**→ 새로 고쳐도 결과 화면을 GET으로 조회**

**→ 중복 주문 대신에 결과 화면만 GET으로 다시 요청**

![http_10](/static/images/http_10.png)

**이렇게 하게되면 새로고침 하면 /order-result/19로 이제 요청하게 된다.**

- **300 Multiple Choices**
- **304 Not Modified**
  - **캐시를 목적으로 사용**
  - **클라이언트에게 리소스가 수정되지 않았음을 알려줌 → 로컬의 캐시 사용**
- **4xx (Client Error) : 클라이언트 오류, 잘못된 문법등으로 서버가 요청 수행 불가**
  **클라이언트가 요청을 수정하지 않으면 복구 불가능**
  - **401 Unauthorized : 클라이언트가 해당 리소스에 대한 인증이 필요함**
  - **403 Forbidden : 서버가 요청을 이해했지만 승인을 거부함(접근 권한이 불충분)**
  - **404 Not Found : 요청 리소스를 찾을 수 없음**
- **5xx (Server Error) : 서버 오류, 서버가 요청을 처리하지 못함**
  **클라이언트가 똑같은 요청을 보내도 상황에 따라서 복구 가능**
  **→ 서버 문제로 오류 발생**
  - **500 Internal Server Error : 서버 내부 문제로 오류 발생, 애매하면 500 오류**
  - **503 Service Unavailable : 서버가 일시적인 과부하 혹은 예정된 작업으로 잠시 요청 처리할 수 없음**

### **이렇게 첫자리의 상위 상태코드로 해석해서 처리할 수 있다.**

---

![http_11](/static/images/http_11.png)

**HTTP 전송에 필요한 모든 부가정보를 가지고 있음**

![http_11](/static/images/http_12.png)

## **→ 표현**

**표현 헤더 + 표현 데이터 = 표현 이라고 말한다.**

**표현 헤더는 요청 / 응답 둘 다 사용함**

- **Content-Type : 표현 데이터의 형식 설명**
  - **text/html; charset=utf-8**
  - **application/json**
  - **image/png**
- **Content-Encoding : 표현 데이터 인코딩**
  - **gzip**
  - **deflate**
  - **identity**
  ![http_13](/static/images/http_13.png)
- **Content-Language : 표현 데이터의 자연 언어**
  - **ko**
  - **en**
  - **en-US**
  ![http_14](/static/images/http_14.png)
- **Content-Length : 표현 데이터의 길이**
  **바이트 단위**

## **협상 : 클라이언트가 선호하는 표현 요청**

**협상 헤더는 요청시에만 사용함**

- **Accept**
- **Accept-Charset**
- **Accept-Encoding**
- **Accept-Language**

![http_15](/static/images/http_15.png)

![http_16](/static/images/http_16.png)

**만약 한국어를 원하는데, 서버는 영어와 독일어(기본값)만 제공한다면?**

**한국어 요청하면 해당 언어가 없으니 기본값인 독일어가 돌아오게 된다.**

![http_17](/static/images/http_17.png)

**Quality Values(q) 값 사용**

- **0~1, 클수록 높은 우선순위**
- **생략하면 1**
- **Accept-Language: ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7**

  **1. ko-KR;q=1 (q생략)**

  **2. ko;q=0.9**

  **3. en-US;q=0.8**

  **4. en:q=0.7**

  ![http_18](/static/images/http_18.png)

  **혹은 구체적인 것이 우선순위임**

  ![http_18](/static/images/http_18.png)

  **Accept: text/_, text/plain, text/plain; format=flowed, _/\***

  1. **text/plain;format=flowed**

  2. **text/plain**

  3. **text/\***

  4. **/**

  **이렇게 우선순위가 잡힌다**

  ***

  **구체적인 것을 기준으로 미디어 타입을 맞춘다**

  **Accept: text/_; q=0.3, text/html; q=0.7, text/html; level=1,text/html; level=2; q=0.4, _/\*; q=0.5**

  **이것은**

  ![http_20](/static/images/http_20.png)

---

## **전송 방식**

- **단순 전송 Content-Length**
  ![http_21](/static/images/http_21.png)
- **압축 전송 Content-Encoding**
  ![http_22](/static/images/http_22.png)
- **분할 전송 Transfer-Encoding** **\*Content-Length를 넣으면 안된다.**
  ![http_23](/static/images/http_23.png)
- **범위 전송 Range, Content-Range**
  ![http_24](/static/images/http_24.png)

---

## **일반 정보**

- **From : 유저 에이전트의 이메일 정보(잘 사용x)**
- **Referer : 현재 요청된 페이지의 이전 웹 페이지 주소(어디서 여기로 넘어왔는가)**
  **A → B 일 경우 Referer : A 를 포함해서 요청**
- **User-Agent : 유저 에이전트 애플리케이션 정보(클라이언트의 웹 브라우저 정보. 등등)**
  **→ 어떠한 웹 브라우저에서 오류가 나는지 파악 가능, 통계 등등**
  **요청에서 사용**
- **Server : 요청을 처리하는 ORIGIN 서버의 소프트웨어 정보**
  - **Server: Apache/2.2.22 (Debian**
  - **server: nginx**
  **응답에서 사용**
- **Date : 메시지가 발생한 날짜와 시간**
  **응답에서 사용**

---

## **특별한 정보**

- **Host : 요청한 호스트 정보**
  **요청에서 사용**
  - **필수**
  - **하나의 서버가 여러 도메인을 처리해야 할 때**
  - **하나의 IP 주소에 여러 도메인이 적용되어 있을 때**
  ![http_25](/static/images/http_25.png)
  **이런식으로 aaa.com으로 들어가라고 설정 가능**
- **Location : 페이지 리다이렉션**
  - **웹 브라우저는 3xx 응답의 결과에 Location 헤더가 있으면, Location 위치로 자동 이동
    (리다이렉트)**
- **Allow : 허용 가능한 HTTP 메소드**
- **Retry-After : 유저 에이전트가 다음 요청을 하기까지 기다려야 하는 시간**
  - **503 (Service Unavailable): 서비스가 언제까지 불능인지 알려줄 수 있음**
  - **Retry-After: Fri, 31 Dec 1999 23:59:59 GMT (날짜 표기)**
  - **Retry-After: 120 (초단위 표기)**

---

## **인증**

- **Authorization : 클라이언트 인증 정보를 서버에 전달**
- **WWW-Authenticate : 리소스 접근시 필요한 인증 방법 정의**
  - **401 Unauthorized 응답과 함께 사용**
  - **WWW-Authenticate: Newauth realm="apps", type=1 title="Login to \"apps\"", Basic realm="simple" 이처럼 사용**

---

## **쿠키**

- **Set-Cookie : 서버에서 클라이언트로 쿠키 전달(응답)**
- **Cookie : 클라이언트가 서버에서 받은 쿠키를 저장하고, HTTP 요청시 서버로 전달**

### **쿠키를 미사용 시**

**→ 모든 요청과 링크에 사용자 정보를 포함시켜야 하나… → 세션 혹은 쿠키 사용**

### **쿠키 사용**

![http_26](/static/images/http_26.png)

![http_27](/static/images/http_27.png)

![http_28](/static/images/http_28.png)

**ex) set-cookie: sessionId=abcde1234; expires=Sat, 26-Dec-2020 00:00:00 GMT; path=/; domain=.google.com; Secure**

**이런식으로 설정한다.**

**→ 다만 쿠키 정보는 항상 서버에 전달됨**

- **네트워크 트래픽 추가 유발**
- **최소한의 정보만 사용**
- **서버에 전송하지 않고, 웹 브라우저 내부에 데이터를 저장하고 싶으면 웹 스토리지 참고**
- **보안에 민감한 데이터는 저장하면 안됨!**

### **쿠키의 생명주기**

- **Expire**
- **max-age**

**→ Set-Cookie: expires=Sat, 26-Dec-2020 04:39:21 GMT**

**→ Set-Cookie: max-age=3600 (3600초)**

**세션 쿠키 : 만료 날짜를 생략하면 브라우저 종료시 까지만 유지**

**영속 쿠키 : 만료 날짜를 입력하면 해당 날짜까지 유지**

**→ 컴퓨터를 종료해도 유지 가능 : 로그인 유지 기능**

### **쿠키 도메인**

**예) domain=example.org**

- **명시: 명시한 문서 기준 도메인 + 서브 도메인 포함**
- **domain=example.org를 지정해서 쿠키 생성**
- **example.org는 물론이고**
- **dev.example.org도 쿠키 접근**
- **생략: 현재 문서 기준 도메인만 적용**
- **example.org 에서 쿠키를 생성하고 domain 지정을 생략**
- **example.org 에서만 쿠키 접근**
- **dev.example.org는 쿠키 미접근**

### **쿠키 경로**

**예) path=/home**

- **이 경로를 포함한 하위 경로 페이지만 쿠키 접근**
- **일반적으로 path=/ 루트로 지정**
- **예)**
- **path=/home 지정**
- **/home -> 가능**
- **/home/level1 -> 가능**
- **/home/level1/level2 -> 가능**
- **/hello -> 불가능**

### **쿠키 보안**

**Secure**

- **쿠키는 http, https를 구분하지 않고 전송**
- **Secure를 적용하면 https인 경우에만 전송**

**HttpOnly**

- **XSS 공격 방지**
- **자바스크립트에서 접근 불가(document.cookie)**
- **HTTP 전송에만 사용**

**SameSite**

- **XSRF 공격 방지**
- **요청 도메인과 쿠키에 설정된 도메인이 같은 경우만 쿠키 전송**

---

## **캐시 Cache**

**만약 캐시가 없다면…**

**데이터가 변경되지 않아도 계속 네트워크를 통해서 데이터를 다운로드 받아야 한다.**

**→ 효율성이 떨어짐**

**캐시를 적용시키면…**

![http_29](/static/images/http_29.png)

_max-age=60 : 60초 동안 캐시가 유효함_

![http_30](/static/images/http_30.png)

_이후의 요청_

**요청을 하면 브라우저 캐시에서 바로 가져와서 사용할 수 있다.**

**→ 효율성 증가**

### **만약 캐시 시간이 초과됐다면?**

**무조건 네트워크 다운로드를 통해서 다시 받아야 할까**

**만약 서버에서 기존 데이터를 변경하지 않았다면 캐시를 재사용 할 수 있다.**

**→ 클라이언트의 데이터와 서버의 데이터가 같다는 사실을 확인할 수 있어야 함**

![http_31](/static/images/http_31.png)

_첫번째 응답할 때 검증 헤더를 추가하여 응답_

![http_32](/static/images/http_32.png)

_캐시 만료시 브라우저 캐시의 검증 헤더와 서버의 검증 헤더를 비교_

![http_33](/static/images/http_33.png)

_헤더만 다시 보내줘서 캐시 다시 세팅함_

**매우 효율적인 해결책을 가질 수 있다.**

**하지만 1초 미만 단위로 캐시 조정이 불가능하기도 하고 날짜가 다르지만, 같은 데이터를 수정해서 데이터 결과가 똑같은 경우에 구분할 수 없는 등 단점이 있다.**

**→**

**ETag, If-None-Match를 사용할 수 있다.**

**ETag : 캐시용 데이터에 임의의 고유한 버전 이름을 달아둠**

- **캐시용 데이터에 임의의 고유한 버전 이름을 달아둠**
  - **예) ETag: "v1.0", ETag: "a2jiodwjekjl3"**
- **데이터가 변경되면 이 이름을 바꾸어서 변경함(Hash를 다시 생성)**
  - **예) ETag: "aaaaa" -> ETag: "bbbbb"**

**이를 통해서 구분함**

![http_34](/static/images/http_34.png)

_ETag를 브라우저 캐시에 저장_

![http_35](/static/images/http_35.png)

_위와 마찬가지로 같은지 판단하고 같으면 304를 보내줌_

## **캐시 제어 헤더**

- **Cache-Control : 캐시 제어**
  - **Cache-Control: max-age**
    - **캐시 유효 시간, 초 단위**
  - **Cache-Control: no-cache**
    - **데이터는 캐시해도 되지만, 항상 원(origin) 서버에 검증하고 사용**
  - **Cache-Control: no-store**
    - **데이터에 민감한 정보가 있으므로 저장하면 안됨 (메모리에서 사용하고 최대한 빨리 삭제)**

## **프록시 캐시**

![http_36](/static/images/http_36.png)

![http_37](/static/images/http_37.png)

**캐시 제어와 함게 설명을 하면**

- **Cache-Control: public**
  - **응답이 public 캐시에 저장되어도 됨**
- **Cache-Control: private**
  - **응답이 해당 사용자만을 위한 것임, private 캐시에 저장해야 함(기본값)**
- **Cache-Control: s-maxage**
  - **프록시 캐시에만 적용되는 max-age**
- **Age: 60 (HTTP 헤더)**
  - **오리진 서버에서 응답 후 프록시 캐시 내에 머문 시간(초)**

## **캐시 무효화**

**Cache-Control: no-cache, no-store, must-revalidate**

**Pragma: no-cache (과거 버전이 들어오면 이것도 있어야 함)**
