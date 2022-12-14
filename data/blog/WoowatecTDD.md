---
title: TDD? 단위 테스트?
date: '2022-11-12'
tags: ['우아한테크코스5기', '프리코스', '기술']
draft: false
summary: 'TDD가 뭘까? TDD란 Test Driven Development의 약자로 테스트 주도 개발 이라고 한다. 테스트 주도 개발은...'
authors: ['default']
---

## **TDD가 정확히 뭘까?**

> **TDD란 Test Driven Development의 약자로 ‘테스트 주도 개발’ 이라고 한다.**

**테스트 주도 개발은 설계 이후 코드 개발 및 테스트 케이스를 작성하는 기존 개발 프로세스와 다르게 테스트 케이스를 작성한 후 실제 코드를 개발하여 리펙토링하는 것이다.**

**이런 이유로 Test First Development 로 부르기도 한다고 한다.**
![TDD](/static/images/TDD.png)

---

## **TDD는 그럼 어떻게 그려나갈까**

**TDD는 마치 작가가 글을 쓰는 과정과 비슷하다.**

**책을 쓸 때 목차를 처음 구성하고 목차에 맞는 내용을 구상하여 초안을 작성하고 고쳐쓰기를 반복하는데, 이 과정을 프로그래밍에 접목 시켜서 생각하면 그것이 TDD의 방법과 유사하다.**

<aside>
💡 **그래서 우테코에서 기능 목록을 작성하고 진행하는 것을 요구했구나..!**

</aside>

### **왜 TDD를 해야 할까?**

**애자일에서 설명한 것과 같이 불확실성이 높을 때 “피드백”과 “협력”이 중요하니 이 과정이 자주 일어난다면 더 좋은 결과가 나올 것이다.**

### **그럼 TDD는 어떤 상황에서 해야 할까?**

**만약 자신이 작성하는 과정을 굉장히 자주 해봤고 어떻게 나올지 안봐도 뻔한 상황에서는 안해도 될 수 있다.**

**하지만..**

1. **처음 해보는 주제**
2. **고객의 요구 조건이 바뀔 수 있는 경우**
3. **개발하는 도중에 코드가 변할 가능성이 높은 경우**
4. **내가 개발하고 이 코드를 나 이외의 사람이 유지보수 할 경우**
5. **이외에 위의 장점이 필요한 경우 사용하면 좋겠다.**

### **왜 TDD가 협력과 피드백에 좋을까?**

**TDD를 잘 작성하게 되면 공유가 쉬워진다.**

**다른 사람의 코드에 접근하기 쉬워지고, 남들도 나의 코드에 접근하기 쉬운 것이다.**

**그렇게 되면 서로의 의도를 쉽게 파악할 수 있고 이야기를 나누기에 좋을 것이다.**

## **결론**

### **TDD를 사용하면 여러가지 장점이 나오게 된다.**

- **이전보다 튼튼한 객체 지향적인 코드를 생산할 수 있다.**
  - **TDD는 코드의 재사용을 보장하기에 이를 통한 소프트웨어 개발 시 기능 별 철저한 모듈화가 이뤄진다.**
- **재설계 시간의 단축**
  - **테스트 코드를 먼저 작성하기 때문에 개발자가 지금 무엇을 해야하는지 분명히 정의하고 개발을 시작하게 된다.**
  - **동시에 테스트 시나리오 중에 다양한 예외 사항을 생각할 수 있다.**
- **디버깅 시간의 단축**
  - **유닛 테스팅의 이점과 일치한다.**
  - **어디서 잘못된 것인지 쉽게 알 수 있으니 디버깅 하는데 시간이 단축되게 된다.**

---

# **단위 테스트는?**

## **단위 테스트는(Unit Test) 무엇일까**

> **응용 프로그램에서 테스트 가능한 가장 작은 소프트웨어를 실행하여 예상대로 동작하는지 확인하는 테스트를 말한다**

### **그럼 테스트 대상 단위는 어떻게 정해지나…**

**테스트 대상 단위는 엄격하게 정해져 있지는 않다.**

**클래스 혹은 메소드 수준으로 정하면 된다.**

**당연히 작은 단위일 수록 단위의 복잡성이 낮아진다.**

**→ 디버깅이 쉬워진다!**

**그리고 참고로 TDD와 함께 진행하게 되면 효과가 배로 늘어난다!!**

---

**이 외에 통합 테스트, 인수 테스트에 대한 정보는 아래의 링크를 참고하자**

[단위 테스트 vs 통합 테스트 vs 인수 테스트](https://tecoble.techcourse.co.kr/post/2021-05-25-unit-test-vs-integration-test-vs-acceptance-test/)
