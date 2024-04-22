---
title: Semantic Versioning 이란
date: '2024-04-15'
tags: ['기타']
draft: false
summary: Versioning 과 Semantic Versioning 이란
---

## Versioning이란?

소프트웨어 개발을 하다보면 여러 사람에 의해 빠르게 변화가 생기고, 패키지가 새롭게 업데이트 되곤 한다.

하지만 이렇게 새로운 업데이트가 이루어 졌을 때 생각보다 다양한 문제가 발생할 수 있다.

따라서 새로운 변화와 기존의 것을 구분하기 위해 버전이라는 개념이 생겨났다고 한다.

## Semantic Versioning

버전이란 코드 형태의 구분방식은 많은 문제를 해결했지만, 버전 명의 작성 방식에 대한 기준이 모호하여 통일되지 않은 버전 관리가 되었었다.

물론, 대부분의 버전들은 어느 정도 적당한 공통점이 있었지만, 그 점이 미묘하게 차이가 있어서 의미 해석에 대한 어려움을 가져왔다.

이러한 어려움을 해결하기 위해 Github의 공동 창업자인 `Tom Preston-Werner` 가 기존의 현안을 모아 만든 제안이 Sementic Versioning이다.

![Untitled](/static/images/version.png)

Sementic Versioning은 위와 같이 Manjor, Minor, Patch로 구성된 소프트웨어 버전 변경 규칙에 대한 제안으로, 스펙 문서는 RFC 2119에 의해 규칙을 표기하여 의미적 엄격함을 높이고, 패키지 개발 생명주기에 발생할 수 있는 여러 상황을 포괄적으로 담아 일관성과 유연성을 균형 있게 갖추고 있다.

흔히 알고 있는 Node.js와 npm은 Semantic Versioning을 사용하며 Spring 또한 현재는 Semantic Versioning을 사용하고 있다.

## 규칙

1. Semantic Versioning을 쓰는 소프트웨어는 반드시 공개 API를 정의해야 한다. 이 API는 코드 자체에 정의되어 있거나, 명시적으로 문서화 되어있어야 한다.
    
    이 과정은 포괄적이며 정확해야 한다.
    
2. 일반 버전 명은 반드시 X.Y.Z 형태를 보여야 하며 X, Y, Z는 각각 Major, Minor, Patch이다.
    - Major : API 호환성이 깨질만한 변경사항
    - Minor : 하위 호환성 지키면서 API 기능이 추가된 것
    - Patch : 하위 호환성 지키는 범위 내에서 버그가 수정된 것
3. Major가 올라가는 경우 Minor와 Patch는 0으로 되어야 하며, Minor가 올라가는 경우 Patch는 0으로 되어야 한다.
4. 버전 1.0.0은 공개 API를 정의한 것으로, 이 공개 이후의 버전 숫자가 바뀌는 방법은 공개 API와 변경 방법에 따라 결정된다.

참고로, Major가 0으로 시작하는 버전은 초기 개발용인 버전으로 활발하게 계속 변경될 수 있고, 안정적으로 완성이 되고 정리가 되어 변경 사항을 적절하게 제어하고 관리할 수 있게 된다면 Major를 1로 설정해서 시작할 수 있다.

규칙은 이외에도 굉장히 많지만, 위의 규칙 정도만 지켜도 문제는 없을 것 같다!