---
title: IAM(Identity and Access ManageMent)
date: '2023-03-31'
tags: ['기술', 'AWS']
draft: false
summary: IAM(Identity and Access ManageMent) 이란 무엇인가
---

## IAM (Identity and Access ManageMent)?

**IAM 이란** 사용자의 접근 권한을 관리 하는 서비스이다.

IAM을 통해 특정 그룹 내 AWS 를 사용하는 사람들에게 각각 사용자별로 AWS에서 제공하는 서비스들, 서비스에 생성된 자원 등에 대해 세분화된 권한을 지정해줄 수 있다.

**EX)** 개발 담당 : EC2와 S3서비스에 대한 액세스 권한 / DB 담당 : RDS 액세스 권한 이런식으로 정해줄 수 있다.

뿐만 아니고 설정에 따라서 특정 IP에 대해 시간까지 설정해줄 수 있다.

## IAM 기능 정리

- **사용자 생성 / 관리 / 계정의 보안**
- **AWS 계정에 대한 공유 액세스**
- **세분화된 권한**
  - 리소스에 따라 여러 사람에게 다양한 권한 부여를 할 수 있다.
- **EC2 애플리케이션 권한 자격 부여**
  - 어느 EC2가 S3, DB 등에 접근할 수 있도록 액세스 권한 부여
- **멀티 팩터 인증 (MFA)**
  - 보안 강화를 위한 것으로 암호나 액세스 키 뿐만 아닌 특별히 구성된 디바이스 코드를 제공하여 인증을 추가할 수 있다.
- **자격 증명 연동**
- **계정에 별명 부여 가능**
- **글로벌 서비스**

---

## **IAM 구성 요소**

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F76ce3a65-c627-4705-b1a6-94fd18dc05fe%2FUntitled.png?table=block&id=a72fcda6-037b-4eaa-a631-5e4c96f0bb4e&spaceId=ed58f7c6-46bb-48c4-829a-b24be3b7faa2&width=1920&userId=db5d5977-127f-463d-b91b-77eec4b05d2d&cache=v2)

**IAM은** 크게 **사용자(Users)**, **그룹(Groups)**, **역할(Roles)**, **정책(Policies)** 로 구성되어 있다.

### 1. 사용자 (User)

실제 AWS의 기능과 자원을 사용하는 **사람** 혹은 **애플리케이션**을 의미한다.

각 사용자 별로 서비스에 대한 액세스를 조정해줄 수 있다.

```
ℹ️ **Info**

아래와 같이 사용자 권한을 부여

**사용자1** : RDS 권한 부여
**사용자2** : S3 권한 부여
**사용자3** : S3 권한 부여
**사용자4** : RDS, S3, EC2 권한 부여
**사용자5** : EC2 권한 부여
```

### 2. 그룹 (Group)

사용자가 얼마 없을 경우는 사용자 각각에게 지정해주는 것이 가능하지만, 만약 사용자가 굉장히 많아지게 된다면, 그들을 **묶어서 그룹이라는 개념**을 사용하게 된다.

```
ℹ️ **Info**

**사용자를 그룹으로 묶어** 그룹별로 권한을 부여

**그룹1** : RDS 권한 부여
**그룹2** : S3, EC2 권한 부여
**그룹3** : S3, EC2, RDS 권한 부여
```

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fddef55dc-fbd1-4e1d-883f-2b6499f6701c%2FUntitled.png?table=block&id=c54df7f7-bc5b-4c7f-b7f3-69837e24a89d&spaceId=ed58f7c6-46bb-48c4-829a-b24be3b7faa2&width=1920&userId=db5d5977-127f-463d-b91b-77eec4b05d2d&cache=v2)

> **한명의 사용자가 여러 그룹에 속하는 것 또한 가능하다.**

### 3. 정책 (Policy)

사용자와 그룹, 역할이 무엇을 할 수 있는지에 대한 **permission 설정 모음**의 데이터 문서

이는 **JSON 형식**으로 저장된다.

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F8e8c561e-ef84-4c12-b255-0c7e5368b233%2FUntitled.png?table=block&id=c48ad833-190f-4705-82e2-1e1f31d0d4db&spaceId=ed58f7c6-46bb-48c4-829a-b24be3b7faa2&width=1920&userId=db5d5977-127f-463d-b91b-77eec4b05d2d&cache=v2)

**여기서 IAM Policy 종류는 어떻게 있을까?**

1. **자격 증명 기반 (Identity-based policies)**
   - AWS 관리형 정책 - AWS에서 미리 제공하는 정책
   - AWS 고객 관리형 정책 - 고객이 직접 만들어서 사용하는 정책 (사용자가 커스텀 하여 생성)
   - AWS 인라인 정책 - 단일 사용자, 그룹, 역할(Role)에 직접 추가하는 방식. (1 to 1 정책)
2. **리소스 정책 기반 (Resource-based policies)**
   - EC2 같은 리소스에 적용하는 정책 **(대표적으로 S3 버킷 정책)**
3. **권한 경계 기반 정책 (Permissions boundaries)**
4. **조직 SCP 기반 정책 (Organizations SCPs)**
5. **액세스 제어 리스트 (Access control lists -ACLs)**
6. **세션 정책 (Session policies)**

### 4. 역할 (Role)

위에서 사용자가 많아지면 이를 그룹 단위로 묶어서 관리한다고 했다.

하지만, **그룹 단위에서도 권한이 다양해지면 그룹이 복잡해지며, 관리가 복잡해진다.**

**이 때 역할이라는 개념을 추가로 사용하게 된다.**

역할에 대해 간단히 말을 하자면, 이는 리소스에 대한 **액세스 권한이 없는 사용자나 서비스에게 일시적으로 권한을 위임 하는 것이다.**

잠시 사용할 수 있도록 하기 위해서 사용자에게 **임시적인 자격 증명서**를 부여하는 것이다.

**→ 역할을 그룹 or 사용자에게 부여 → 임시적으로 권한을 가지고 사용할 수 있다.**

---

### 📰 참고 :

[https://inpa.tistory.com/entry/AWS-📚-IAM-개념-원리user-group-policy-role-IAM-계정-정책-생성#iam*계정*생성하기](https://inpa.tistory.com/entry/AWS-%F0%9F%93%9A-IAM-%EA%B0%9C%EB%85%90-%EC%9B%90%EB%A6%ACuser-group-policy-role-IAM-%EA%B3%84%EC%A0%95-%EC%A0%95%EC%B1%85-%EC%83%9D%EC%84%B1#iam_%EA%B3%84%EC%A0%95_%EC%83%9D%EC%84%B1%ED%95%98%EA%B8%B0)
