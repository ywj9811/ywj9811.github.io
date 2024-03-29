---
title: 오브젝트 Chap6
date: '2023-12-30'
tags: ['JAVA', '스터디', '기술서적', '오브젝트']
draft: false
summary: 오브젝트 Java 챕터6 메시지와 인터페이스
---
객체지향 프로그래밍에 대한 가장 흔한 오해는 어필리케이션이 클래스의 집합으로 구성된다는 것이다.

훌륭한 객체지향 코드를 얻기 위해서는 클래스가 아니라 객체를 지향해야 한다. 좀 더 정확하게 말해서 협력 안에서 객체가 수행하는 책임에 초점을 맞춰야 한다. 여기서 중요한 것은 책임이 객체가 수신할 수 있는 메시지의 기반이 된다는 것이다.

## 협력과 메시지

### 클라이언트-서버 모델

협력 안에서 메시지를 전송하는 객체를 클라이언트, 메시지를 수신하는 객체를 서버라고 부른다. 협력은 클라이언트가 서버의 서비스를 요청하는 단방향 상호작용이다.

예를 들어서 영화 예매 시스템을 다시 가져와 본다면, Screening은 Movie에게 가격을 계산하라고 메시지를 전송한다.

즉, Screening이 클라이언트이고 Movie가 서버이다.

하지만 이후에 Movie는 할인 요금을 계산하라 메시지를 DiscountPolicy에게 보낸다.

이때는 Movie가 클라이언트이고 DiscountPolicy가 서버이다.

이처럼 협력에 참여하는 동안 클라이언트와 서버 역할을 동시에 수행하는 것이 일반적이다.

### 메시지와 메시지 전송

협력의 관점에서 메시지는 두가지 종류의 집합으로 구분한다.

1. 객체가 수신하는 메시지의 집합
2. 외부의 객체에게 전송하는 메시지의 집합

그리고 메시지는 다음과 같이 구성된다.

`condition.isSatisfiedBy(screening)`

`수신자.오퍼레이션명(인자)` 이다.

### 메시지와 메소드

**메시지를 수신했을 때 실제로 실행되는 함수 또는 프로시저를 메소드라고 부른다.**

이러한 구분은 메시지 전송자와 메시지 수신자가 느슨하게 결합될 수 있게 한다.

서로의 정보를 몰라도 그저 어떤 메시지를 전송하는지, 어떤 메소드를 수행하면 되는지 그것만 알면 되기 때문이다.

### 퍼블릭 인터페이스와 오퍼레이션

외부에서 볼 때 객체의 안쪽은 검은 장막으로 가려진 미지의 영역이다.

따라서 외부의 객체는 오직 객체가 공개하는 메시지를 통해서만 객체와 상호작용할 수 있는데, 이처럼 객체가 의사소통을 위해 외부에 공개하는 메시지의 집합을 **퍼블릭 인터페이스라고** 부른다. 그리고 프로그래밍 언어의 관점에서 볼 때 퍼블릭 인터페이스에 포함된 메시지를 **오퍼레이션이라고** 부른다.

즉, 어떻게 보면 ‘메소드 호출’ 보다는 ‘오퍼레이션 호출’ 이라는 용어를 사용하는 것이 적절할지도 모른다.

### 시그니처

오퍼레이션의 이름과 파라미터 목록을 합쳐서 ******************시그니처****************** 라고 부른다.

오퍼레이션은 실행 코드 없이 시그니처만을 정의한 것이고 메소드는 이 시그니처에 구현을 더한 것으로 메시지를 수신하면 시그니처와 동일한 메소드가 실행된다.

## 인터페이스와 설계 품질

중요한 것은 객체가 수신할 수 있는 메시지가 객체의 퍼블릭 인터페이스와 그 안에 포함될 오퍼레이션을 결정한다는 것이다. 객체의 퍼블릭 인터페이스가 객체의 품질을 결정하기에 결국 메시지가 객체의 품질을 결정한다고도 할 수 있다.

우리는 **최소한의 인터페이스와 추상적인 인터페이스라는 조건**을 만족해야 한다고 살펴보았다.

각각 꼭 필요한 오퍼레이션만을 포함해야 한다와 어떻게 수행하는 것이 아닌 무엇을 하는지를 표현한다는 것이다.

이를 위해서 우리는 책임 주도 설계 방법을 따르면 된다고 하였는데, 우리는 메시지를 먼저 선택함으로써 협력과는 무관한 오퍼레이션이 인터페이스에 포함되는 것을 방지해야 한다.

이제 퍼블릭 인터페이스의 품질에 영향을 미치는 원칙과 기법을 살펴보자.

### 디미터 법칙

전에 4장에서 절차적인 방식의 영화 예매 시스템의 ReservationAgency 코드를 기억하는가.

이 코드에서 문제는 결합도가 너무 높아 여러 이유로 코드를 변경해야 했다.

이처럼 협력하는 객체의 내부 구조에 대한 결합으로 인해 발생하는 설계 문제를 해결하기 위해 제안된 원칙이 바로 **디미터 법칙이다.**

**이를 간단하게 요약하면 객체의 내부 고조에 강하게 결합되지 않도록 협력 경로를 제한하라는 것이다.**

디미터 법칙을 따르기 위해서는 클래스가 특정한 조건을 만족하는 대상에게만 메시지를 전송하도록 프로그래밍 해야 한다.

- this 객체
- 메소드의 매개변수
- this의 속성
- this의 속성인 컬렉션의 요소
- 메소드 내에서 생성된 지역 객체

우리는 디미터 법칙을 따르면 **부끄럼 타는 코드(shy code)**를 얻을 수 있다.

<aside>
⚠️ **디미터 법칙을 위반하는 코드의 전형적인 모습**`screening.getMovie().getDiscountConditions();`

이를 **기차 충돌(train wreck)** 이라고 한다.

내부 구조를 물어보고 반환받는 요소에 대해 연쇄적으로 메시지를 전송하기 때문이다.

</aside>

### 묻지 말고 시켜라

Screening은 내부의 Movie에 접근하는 대신 Screening에게 직접 요금을 계산하라고 시켰다.

**디미터 법칙은 이렇게 객체의 상태에 관해 묻지 말고 원하는 것을 시켜야 한다는 사실을 강조한다.**

이러한 방식을 묻지 말고 시켜라 라는 용어로 부른다.

이를 따르면 밀접하게 연관된 정보와 행동을 함께 가지는 객체를 만들 수 있고, 자연스럽게 정보 전문가에게 책임을 할당하게 되어 응집도를 높게 가져갈 수 있다.

### 의도를 드러내는 인터페이스

켄트 벡은 메소드를 명명하는 두가지 방법을 설명했다.

1. 메소드가 어떻게 수행하는지를 나타내도록 이름 짓는 방식
2. 메소드가 무엇을 수행하는지를 나타내도록 이름 짓는 방식

첫번째 방식은 좋지 않을 수 있다.

왜냐하면 메소드에 대해 제대로 커뮤니케이션 하지 못할 수 있고, 심지어는 메소드 수준의 캡슐화를 의반한다는 것이다.

만약 PeriodCondition을 사용하는 코드를 SequenceCondition을 사용하도록 변경하려면 단순히 참조하는 객체를 변경하는 것 뿐만 아니라 호출하는 메소드를 변경해야 하기 때문이다.

**따라서 두번째 방법을 따르는 것이 적당할 것이다.**

무엇을 하는지 드러내도록 메소드의 이름을 짓기 위해서는 객체가 협력 안에서 수행해야 하는 책임에 관해 고민해야 하며 외부의 객체가 메시지를 전송하는 목적을 먼저 생각하도록 만들어 결과적으로 협력하는 클라이언트의 의도에 부합하도록 메소드 이름을 짓게 된다.

이처럼 어떻게가 아닌 무엇을 하느냐에 따라 메소드 이름을 짓는 패턴을 **의도를 드러내는 선택자(Intention Revealing Selector)** 라고 부른다.

그리고 이를 인터페이스 레벨로 확장한 **의도를 드러내는 인터페이스(Intention Revealing Interface)** 라는 용어를 에릭 에반스가 제시했는데, 구현과 관련된 모든 정보를 캡슐화 하고 객체의 퍼블릭 인터페이스에는 협력과 관련된 의도만을 표현해야 한다는 것이다.

### 함께 모으기

**디미터 법칙**은 객체 간의 협력을 설계할 때 캡슐화를 위반하는 메시지가 인터페이스에 포함되지 않도록 제한한다.

**묻지 말고 시켜라 원칙**은 디미터 법칙을 준수하는 협력을 만들기 위한 스타일을 제시한다.

**의도를 드러내는 인터페이스 원칙**은 객체의 퍼블릭 인터페이스에 어떤 이름이 드러나야 하는지에 대한 지침을 제공하여 코드의 목적을 명확하게 커뮤니케이션 할 수 있게 해준다.

## 원칙의 함정

소프트웨어 설계에 법칙이란 거의 존재하지 않는다. 법칙은 예외가 없지만, 원칙에는 예외가 넘쳐난다.

### 디머터 법칙은 하나의 도트(.)를 강제하는 규칙이 아니다.

```java
IntStream.of(1,2,3,4,4,5).filter(x -> x > 3).distinct().count()
```

이것이 디미터 법칙을 위반한 것일까? 아니다.

이것을 위반한다고 생각한다면 디미터 법칙을 잘못 이해한 것이다.

이 메소드들은 모두 IntStream이라는 동일한 클래스의 인스턴스를 반환한다.

**디미터 법칙은 결합도와 관련된 것이며, 이 결합도가 문제가 되는 것은 객체의 내부 구조가 외부로 노출되는 경우에 한정된다.**

만약 이러한 종류의 코드와 마주친다면 과연 여러개의 도트를 사용한 코드가 객체 내부 구조를 노출하고 있는가? 하는 물음을 가져보자.

### 결합도와 응집도 충돌

일반적으로 어떤 객체의 상태를 물어본 후 반환된 상태를 기반으로 결정을 내리고 그 결정에 따라 객체의 상태를 변경하는 코드는 묻지 말고 시켜라 스타일로 변경해야 한다.

하지만, 이 또한 언제나 옳은 방식은 아니다.

맹목적으로 위임 메소드를 추가하게 된다면 퍼블릭 인터페이스 안에 어울리지 않는 오퍼레이션들이 공존하게 된다. 결과적으로 객체는 상관 없는 책임을 한꺼번에 떠안게 되기 때문에 결과적으로 응집도가 낮아진다.

```java
public class PeriodCondition implements DiscountCondition {
		public bollean isSatisfiedBy(Screening screening) {
				return screening.getStartTime().getDayOfWeek().equals(dayOfWeek) &&
					startTime.compareTo(screening.getStartTime().toLocalTime()) <= 0 &&
					endTime.compareTo(screening.getStartTime().toLocalTime()) >= 0;
		}
}				
```

**이는 Screening에게 질의한 값을 통해 할인 여부를 결정한다.**

**이 코드는 얼핏 보기에 캡슐화를 위반했다고 생각할 수 있다.**

따라서 Screening의 isDiscountable 메소드로 할인 여부 판단 로직을 옮기고 PeriodCondition이 이 메소드를 호출하도록 변경한다면 묻지 말고 시켜라 스타일을 준수하는 퍼블릭 인터페이스를 얻을 수 있다고 생각할 것이다.

```java
public class Screening {
		public boolean is Discountable(DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime) {
				return whenScreend.getDayOfWeek().equals(dayOfWeek) &&
					startTime.compareTo(whenScreend.toLocalTime()) <= 0 &&
					endTime.compareTo(whenScreend.toLocalTime()) >= 0;
		}
}

public class PeriodCondition implements DiscountCondition {
		public boolean isSatisfiedBy(Screening screening) {
				return screening.isDiscountable(dayOfWeek, startTime, endTime);
		}
}
```

이렇게 된다면 옳은 코드가 완성된 것일까?

아니다.

오히려 Screening에게 기간에 따른 할인 조건을 판단하는 책임을 떠안게 한 것이다.

Screening의 본질은 예매를 하는 것이고, PeriodCondition은 할인 조건을 판단하는 것이 본질이다.

심지어 Screening은 PeriodCondition의 인스턴스 변수를 인자로 받기 때문에 PeriodCondition의 인스턴스 변수 목록이 변경될 경우에도 영향을 받게 된다.

이것은 결합도를 높이게 된다.

**따라서 Screening의 캡슐화를 향상시키는 것 보다 Screening의 응집도를 높이고 결합도를 낮추는 것이 전체적인 관점에서 더 좋다.**

또한, 가끔씩은 묻는 방법 외에는 방법이 존재하지 않는 경우도 있다.

```java
for(Movie each : movies) {
		total += each.getFee();
}
```

혹은, 물으려는 객체가 정말로 데이터인 경우도 있다.

**로버트 마틴**은 디미터 법칙의 위반 여부는 묻는 대상이 객체인지, 자료구조인지에 달려있다고 한다.

즉, 다시한번 말하지만 설계는 트레이드 오프의 산물이다.

**소프트웨어 설계에서 몇가지 안되는 법칙 중 하나가 “경우에 따라 다르다” 라는 사실을 명심하자.**

## 명령-쿼리 분리 원칙

**명령-쿼리 분리(Command-Query Separation) 원칙** 을 알아두면 도움일 될 것이다.

우선, 몇가지 용어를 살펴보자.

어떤 절차를 묶어 호출 가능하도록 이름을 부여한 기능 모듈을 **루틴** 이라고 부른다. 루틴은 다시 **프로시저**와 **함수**로 구분할 수 있다.

- 프로시저는 부수효과를 발생시킬 수 있지만 값을 반환할 수 없다. **즉, 객체의 상태를 변경하는 명령은 반환값을 가질 수 없는 것이다.**
- 함수는 값을 반환할 수 있지만 부수효과를 발생시킬 수 없다. **즉, 객체의 정보를 반환하는 쿼리는 상태를 변경할 수 없는 것이다.**

위의 명령과 쿼리는 각각 프로시저와 함수를 객체의 인터페이스 관점에서 부르는 이름이다.

이제, 명령-쿼리 분리의 원칙을 한문장으로 표현해 보자면, “질문이 답변을 수정해서는 안된다” 라는 것이다.

이러한 명령-쿼리 분리 원칙에 따라 작성된 인터페이스를 **명령-쿼리 인터페이스** 라고 부른다.

### 왜 분리해야 할까

예를 들어서 이벤트와 반복일정 이라는 객체가 있다.

이 이벤트는 특정 요일에 특정 시간동안 진행하는 행위이다. (매주 수요일 10시~10시 30분에 회의를 한다 = 이벤트)

그리고 이렇게 일주일 단위로 돌아오는 특정 시간 간격에 발생하는 사건 전체를 반복일정 이라고 한다.

반복일정의 사건이 이벤트이다.

이러한 상황을 가정해보자.

이때, 특정 인스턴스가 반복일정의 이벤트인지 검사하는 로직이 있다고 가정하자.

예를 들어 2019년 5월 8일 10시~10시30분의 회의는 반복일정인가? 그러면 T/F 를 반환하는 로직이 있는 것이다.

이러한 상황에서 개발자들에게 굉장히 곤란한 이슈가 발생했다.

왜냐하면 특정 이벤트 인스턴스를 검사했을 때 처음에는 F가 나왔는데 다시 하면 T가 나오는 것이다.

결국 밤을 세워가며 원인을 찾아내고 보니, T/F 검사를 했을 때 F가 나오면 해당 이벤트를 반복일정을 만족하는 이벤트로 변경하여 저장하는 로직이 있었던 것이다.

**즉, T/F를 반환하는 쿼리와 이벤트를 변경하는 명령이 뒤섞여 있던 것이다.**

이처럼 명령과 쿼리를 뒤섞어 버리면 실행 결과를 예측하기 어려워질 수 있다.

물론 이를 분리하게 되면 1개의 메소드가 2개 이상이 되어 인터페이스가 더 복잡해 보일 수 있지만 얻는 이점이 더 크다.