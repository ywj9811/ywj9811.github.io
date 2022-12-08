---
title: 쿠키, 세션 그리고 JWT
date: '2022-11-27'
tags: ['Spring boot', '기술']
draft: false
summary: 본 설명에 앞서 왜 쿠키, 세션 JWT를 사용할까 HTTP의 특징에 연관이 있다. HTTP 프로토콜은 1. Connectionless 2. Stateless 이렇게 두개의 특징을 가지고 있는데 비연결성, 무상태성 이라는 특징에 의해 연결이 지속적으로 유지되지 않는 것이다.
---

## 본 설명에 앞서 왜 쿠키, 세션, JWT를 사용할까

**HTTP의 특징에 연관이 있다.**

> 1. **Connectionless**
> 2. **Stateless**

**이렇게 두개의 특징을 가지고 있는데 비연결성, 무상태성 이라는 특징에 의해 연결이 지속적으로 유지되지 않는 것이다.**

**따라서 사용자 인증에 대한 정보를 유지하기 위해서는 쿠키, 세션 혹은 JWT를 사용해야 하는 것이다.**

---

# 인증 방식

## 1. 쿠키

**쿠키는 클라이언트에 저장되는 `KEY`와 `VALUE`로 이루어진 데이터이다.**

**인증 유효 시간을 설정할 수 있고 유효 시간이 정해진다면 클라이언트가 종료되어도 쿠키가 유지된다.**

**서버와 요청 응답으로 인해 쿠키가 저장되면 다음 요청은 쿠키에 담긴 정보를 이용해 참조할 수 있다.**

- **쿠키 동작 방식**
  - **클라이언트가 로그인 요청**
  - **서버에서 쿠키 생성 후 클라이언트로 전달**
  - **클라이언트가 서버로 요청을 보낼 때 쿠키를 전송**
  - **쿠키를 이용해 유저 인증을 진행**

**그러나 문제점으로 사용자 인증에 대한 정보를 모두 클라이언트가 가지고 있게 되므로 HTTP 요청을 탈취당하면 쿠키에 대한 정보 자체를 탈취 당할 수 있다는 보안에 대한 문제가 있다.**

---

## 2. 세션

**세션은 쿠키를 기반으로 하는 것이지만 클라이언트에 저장하는 쿠키와 다르게 서버에 저장하여 관리한다.**

**서버에서는 클라이언트를 구별하기 위해 각각의 세션ID 를 클라이언트마다 부여하게 되며 클라리언트가 종료되기 전까지 유지한다.**

**→ 보안으로는 서버에 저장하는 세션이 쿠키보다 좋다.**

- **세션 동작 방식**
  - **서버에서는 클라이언트에게 고유한 세션ID 를 부여하고 세션 저장소에 저장한 후 클라이언트에게 발급한다.**
  - **클라이언트는 서버에서 발급받은 세션 ID를 쿠키에 저장하게 되고 요청을 보낼 때마다 쿠키를 보낸다.**
  - **서버는 쿠키에 담겨있는 세션ID와 세션 저장소에 있는 정보와 대조한 후 데이터를 가져온다.**

**세션 또한 세션 하이재킹이 가능하다는 문제점이 있으나 이는 세션의 유효시간을 만들어 예방할 수 있다.**

**하지만 세션의 경우 서버에서 관리하기 때문에 사용자가 많다면 서버에 부하가 증가하게 된다는 문제점은 여전히 남아있다.**

---

## 3. JWT(토큰)

**`JWT`는 `Json Web Token` 의 약자로 인증에 필요한 정보를 암호화 시킨 토큰을 의미한다.**

**이 방식은 세션처럼 토큰을 쿠키에 담아서 보낼 수 있고 혹은 HTTP 헤더에 담아서 전송하는 방식을 사용할 수 있다.**

- **토큰의 요소**
  - **Header : 3가지 요소를 암호화할 알고리즘 등과 같은 옵션이 들어간다.**
  - **Payload : 유저의 고유 ID 등 인증에 필요한 정보가 들어간다.**
  - **Verify Signature : Header, Payload와 Secret Key가 더해져 암호화가 된다.**
  **Header와 Payload는 누구나 디코딩하여 내용을 확인할 수 있으니 유저의 비밀번호 등등의 정보는 넣지 않고 Verify Signature에 넣어준다.**
- **토큰의 동작 방식**
  - **클라이언트가 로그인 요청**
  - **서버에서 유저의 고유한 ID와 다른 인증 정보들과 함께 Payload에 담는다.**
  - **JWT의 유효기간 설정 및 옵션을 설정해준다.**
  - **Secret Key를 통해 토큰을 발급한다.**
  - **발급된 토큰은 클라이언트에 쿠키 혹은 로컬스토리지 등에 저장하여 요청을 보낼 때마다 같이 보낸다.**
  - **서버는 토크늘 Secret Key로 복호화 하여 검증하는 과정을 거친다.**
  - **검증이 완료되면 대응하는 데이터를 보내준다.**

**토큰의 경우 우선 세션보다 훨씬 간편하다.**

**그리고 별도의 저장소 관리가 필요하지 않고 토큰을 발급 후 클라이언트에게 전송하고 검증하는 과정만 있으면 된다.**

**하지만 발급된 JWT는 삭제가 불가능하다.**

**세션 같은 경우 악의적으로 사용된다면 해당 세션을 삭제하면 되지만 토큰의 경우 탈취당하게 되면 유효 시간이 종료되기 이전까지 탈취자가 얼마든지 악의적으로 사용이 가능하다.**

**물론 이 경우 Refresh Token 이라는 것을 이용해 피해를 조금이라도 줄일 수 있다.**