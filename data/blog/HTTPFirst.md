---
title: 김영한의 HTTP
date: '2022-09-18'
tags: ['HTTP', '인프런', '기술']
draft: false
summary: 인터넷 통신할 때... IP 지정한 IP 주소에 데이터를 전달할 수 있도록 해줌 패킷이라는 통신 단위로 데이터를 전달해줌.
---

# 인프런 김영한의 HTTP

## HTTP_1

**인터넷 통신할 때…**

- **IP**
  **지정한 IP 주소에 데이터를 전달할 수 있도록 해줌**
  **패킷이라는 통신 단위로 데이터를 전달해줌.**
  - **한계**
    - **비연결성 - 패킷을 받을 대상이 없거나 서비스 불능 상- 태여도 패킷은 일단 전송되게 된다.**
    - **비신뢰성 : 중간에 패킷이 사라지거나, 순서대로 오지않는다면 어떻게 처리할 것인가…**
    - **프로그램 구분 불가능 : 같은IP를 사용하는 서버에서 통신하는 어플리케이션이 둘 이상이라면 어떻게 구분…**
- **TCP, UDP**

![protoco_1](/static/images/protocol_1.png)

![protoco_2](/static/images/protocol_2.png)

![protoco_3](/static/images/protocol_3.png)

**IP패킷에는 출발지IP, 목적지IP, 기타 가 들어있음**

**TCP패킷은 출발지PORT, 목적지PORT, 전송 제어, 순서, 검증 정보, 전송 데이터가 들어있음 → 이 TCP패킷으로 위의 IP한계를 해결해줌**

- **TCP 특징**
  - **연결지향**
    **→ 클라이언트 : SYN**
    **서버 : SYN + ACK**
    **클라이언트 : ACK + 데이터전송**
    **이렇게 3way handshacke를 통해서 전송함.**
  - **데이터 전달 보증**
    **→ 데이터 전송하면 잘 받음을 답장**
  - **순서 보장**
    **→ 패킷1, 3, 2 순서로 받게되면 2번부터 다시 보내라고 알려줌.**
    **→ 신뢰할 수 있음**
- **UDP 특징**
  - **기능이 없음…**
  - **단순하고 빠름**
  - **IP + PORT인 것이다.(체크섬 정도만 추가 = 데이터 검증)**
- **PORT**
  **한번에 둘 이상 연결해야 한다면?**
  **IP주소는 하나인데 여러개의 어플리케이션을 구분해야 한다.**
  **이를 위해서 PORT를 이용함.**
- **DNS**
  **IP는 기억하기가 어렵기도 하고, IP가 변경될 수 있다.**
  **→DNS(도메인 네임 시스템)을 사용할 수 있다.**
  **도메인 명을 IP 주소로 변환을 하는 것이다.**
  **ex) DNS = google.com**
  **IP = 200.200.200.2 이렇게 저장되어 있는 것이다.**

---

## HTTP_2

### **URI, URL, URN?**

**URI는 로케이터(locator), 이름(name) 또는 둘 다 추가로 분류될 수 있다.**

**→ 로커에터(locator)면 URL**

**→ 이름(name)이면 URN**

**url→ foo://example.com:8042/over/there?name=ferret#nose
\*/ \/\/ \*\_/ \/
| | | | |
scheme authority path query fragment
| **\*\*****\_\_\_**\*\*\*\***|
/ \ / \
urn→ urn:example:animal:ferret:nose\*\*

**URI단어 뜻**

- **Uniform : 리소스 식별하는 통일된 방식**
- **Resource : 자원, URI로 식별할 수 있는 모든 것**
- **Identifier : 다른 항목과 구분하는데 필요한 정보**
  - **Identifer가 L이냐 N이냐…**

**실질적으로 URI == URL**

**URL ex) [https://www.google.com/search?q=hello&hl=ko](https://www.google.com/search?q=hello&hl=ko) 이렇게 볼 수 있다.**

**이 문법은**

**scheme://[userinfo@]host[:port][/path][?query][#fragment]**

**이렇게 이루어 진다.**

- **schema**
  **주로 프로토콜 사용**
  > - **프로토콜: 어떤 방식으로 자원에 접근할 것인가 하는 약속 규칙**
  > - **예) http, https, ftp 등등**
  > - **http는 80 포트, https는 443 포트를 주로 사용, 포트는 생략 가능**
  > - **https는 http에 보안 추가 (HTTP Secure)**
- **userinfo**
  **거의 사용되지 않음**
- **host**
  **호스트명 - 도메인명 혹은 IP 주소를 직접 사용가능**
- **port**
  **접속 포트로 일반적으로 생략한다.**
- **path**
  **리소스 경로(path), 계층적 구조**
  > - **/home/file1.jpg**
  > - **/members**
  > - **/members/100, /items/iphone12**
  >   **위의 예시에서는 /search이다.**
- **query**
  **key = value 형태**
  **?로 시작, &로 추가 가능 ?keyA=valueA&keyB=valueB**
  **query parameter, query string 등으로 불림, 웹서버에 제공하는 파라미터, 문자 형태로 넘어감**
- **fragment**
  **#뒤를 얘기하며 서버전송 정보는 아님**
  **그저 html 내부 북마크 등에 사용된다.**

---

### **웹 브라우저 요청**

![protoco_4](/static/images/protocol_4.png)

**TCP/IP 패킷 내부에 전송 정보에 HTTP요청 메시지를 담아서 보냄**

**그럼 서버에서 해당 요청 메시지를 받아서 돌려주게 된다.**

![protocol_5](/static/images/protocol_5.png)

**이렇게 응답 패킷을 전달해준다. → 웹 브라우저가 HTM 렌더링을 하여 보여주게 되는 것이다.**

---

## HTTP3

### **모든 것이 HTTP이다.**

**HTML, TEXT
• IMAGE, 음성, 영상, 파일
• JSON, XML (API)
• 거의 모든 형태의 데이터 전송 가능
• 서버간에 데이터를 주고 받을 때도 대부분 HTTP 사용**

### **HTTP의 특징?**

- **클라이언트 서버 구조**
  - **Request Response 구조**
  - **클라이언트는 서버에 요청을 보내고 응답을 기다림**
  - **서버가 요청에 대한 결과를 만들어서 보내줌**
    **→ 클라이언트는 단순한 UI 등등에 집중을 하고 서버에 비즈니스 로직을 모두 담아두고 작동하도록 설계**
- **무상태 프로토콜, 비 연결성**
  - **서버가 클라이언트의 상태를 보존하지 않음**
  - **장점 : 서버 확장성 높음**
  - **단점 : 클라이언트가 추가 데이터 전송**
  ### **상태 유지(Stateful), 무상태(Stateless)의 차이**
  - **상태 유지 : 이전에 상태를 기억하고 처리함**
    - **항상 같은 서버가 유지되어야 함.**
    - **만약 중간에 서버 장애가 생기면? 서버를 증설해야 하면?**
    - **문제가 생길 수 있다.**
  - **무상태 : 이전에 상태를 기억하지 않음**
    - **중간에 다른 서버로 변경되어도 된다.**
    - **중간에 서버 장애가 생기면? 아무 다른 서버로 교환**
    - **클라이언트 요청이 급증가? 서버를 증설하면 된다**
    - **하지만, 데이터 전송량이 많다는 단점이 존재**
  **무상태를 최대한 지향 하지만 모두 무상태로 사용할 수 없다.**
  **로그인을 위한 상태 유지 등등을 위해서 → 상태 유지는 최소한으로**
  ### **비 연결성?**
  **요청하고 응답할 때는 연결을 하고 주고받으나, 마치고 나면 TCP/IP연결을 종료한다.**
  **→ 계속 연결을 하면 자원 낭비 최소한의 자원 유지를 할 수 있다.**
  **→ 서버 자원을 매우 효율적으로 사용할 수 있다.**
  **→ 단점 :**
  - **연결을 다시 할 때 3-way handshake작업 필요 시간 지체**
  - **웹 브라우저로 사이트 요청하는 경우 HTML외에 자바스크립트, CSS, 이미지 등등 수많은 자원이 함께 다운로드 되야함(연결, 해지, 연결 반복은 너무 많음)**

  - **→ 극복 : HTTP 지속연결(ex. 0.5초 동안 연결유지)를 통해 해결**
- **HTTP메시지**
  ![protocol_6](/static/images/protocol_6.png)

## **시작 라인(빨간 부분)**

**→ request-line / status-line**

### **요청 메시지**

- **request-line : 요청 메시지로 HTTP메소드(GET | POST | PUT | DELETE … )**
  - **GET : 리소스 조회 , POST : 요청 내역 처리**
- **요청 대상 : 절대 경로**
- **HTTP 버전**

### **응답 메시지**

- **HTTP 버전**
- **HTTP 상태 코드 : 요청 성공 / 실패를 나타냄**
  - **200 : 성공**
  - **400 : 클라이언트 요청 오류**
  - **500 : 서버 내부 오류**
- **그리고 내용**

## **HTTP 헤더(노란 부분)**

- **HTTP 전송에 필요한 모든 부가정보**
  - **EX) 메시지 바디의 내용, 크기, 압축, 인증, 요청 클라이언트 정보 …**

## **HTTP 메시지 바디(파란 부분)**

- **실제 전송할 데이터**
- **단순함, 확장 가능**

---

## HTTP-4

## **HTTP API 설계**

**API URI 고민**

- **리소스의 의미는 무엇일까**
  - **EX) 회원을 조회하는 것의 리소스는 `회원`이다.**
  - **따라서 리소스와 행위는 분리해야함**
    - **리소스 : 회원 (명사)**
    - **행위 : 조회 (동사)**

### **HTTP메소드 종류**

- **GET : 리소스 조회**
  > **서버에 전달하고 싶은 데이터는 query(쿼리 파라미터, 쿼리 스트링)를 통해서 전달**
- **POST : 요청 데이터 처리, 주로 등록에 사용**

  > **메시지 바디를 통해서 서버로 요청 데이터 전달 → 서버에서 요청 데이터를 처리함**
  >
  > **ex) 받은 데이터로 신규 리소스 등록, 프로세스 처리에 사용**

- **PUT : 리소스를 대체, 해당 리소스가 없으면 생성**
  > **POST와의 차이점은 대체한다는 점, 그리고 클라이언트가 리소스 위치를 알고 URI를 지정해줌.**
  >
  > **_기존 리소스를 완전히 대체하게 됨 → 부분만 변하려면 PATCH_**
- **PATCH : 리소스 부분 변경**
- **DELETE : 리소스 삭제**
- **기타 메소드**
  - **HEAD**
  - **OPTIONS**
  - **CONNECT**
  - **TRACE**

**HTTP 메소드의 속성**

**안전함**

- **호출해도 리소스를 변경하지 않는다.**

**멱등함**

- **1번 ~ 100번 ~ 몇번을 호출하던 결과가 똑같다.(POST는 멱등X)**

**캐시가능**

- **응답 결과 리소스를 캐시해서 사용해도 된다(잠시 로컬에 저장해서 사용 가능)**

---

### **클라이언트에서 서버로 데이터 전송**

- **쿼리 파라미터를 통한 데이터 전송**
  - **GET → 쿼리 파라미터를 사용해서 데이터를 전달**
  - **주로 정렬 필터(검색어)**
  ```
  GET /search?q=hello&hl=ko HTTP/1.1
  Host: www.google.com
  ```
  **이런식으로 search?q=hello&hl=ko와 같은 쿼리 파라미터를 사용할 수 있다.**
- **메시지 바디를 통한 데이터 전송**

  - **POST, PUT, PATCH**
  - **회원 가입, 상품 주문, 리소스 등록, 리소스 변경**

  ```html
  <form action="/save" method="post">
    <input type="text" name="username" />
    <input type="text" name="age" />
    <button type="submit">전송</button>
  </form>
  ```

  ```html
  POST /save HTTP/1.1 Host: localhost:8080 Content-Type: application/x-www-form-urlencoded
  username=kim&age=20
  ```

  **이렇게 자동으로 생성되어 넘어가게 된다.**

  ```html
  <form action="/save" method="get">
    <input type="text" name="username" />
    <input type="text" name="age" />
    <button type="submit">전송</button>
  </form>
  ```

  ```html
  GET /save?username=kim&age=20 HTTP/1.1 Host: localhost:8080
  ```

  **이렇게 자동으로 생성되게 된다.**

  ## **HTTP API 설계 예시**

- **회원 목록 `/members` → GET**
- **회원 등록 `/members` → POST**
- **회원 조회 `/members/{userId}` → GET**
- **회원 수정 `/members/{userId}` → PATCH, PUT, POST**
- **회원 삭제 `/members/{userId}` → DELETE**

# but?

### **HTML FORM 사용 → GET, POST만 지원**

- **회원 목록 `/members` → GET**
- **회원 등록 폼 `/members/new` → GET**
- **회원 등록 `/members/new`, `/members` → POST**
- **회원 조회 `/members/{userId}` → GET**
- **회원 수정 폼 `/members/{userId}/edit` → GET**
- **회원 수정 `/members/{userId}/edit` → POST**
- **회원 삭제 `/members/{userId}/delete` → POST**

**→ 폼의 경우는 무엇인가 변경이 일어나는 것이 아님 : GET사용**

**→ 폼을 사용한다면 POST / GET만 사용하는 한계가 존재함 따라서 컨트롤URI를 사용할 수 있다.**
