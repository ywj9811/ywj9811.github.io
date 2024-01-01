---
title: 오브젝트 Chap5
date: '2023-12-20'
tags: ['JAVA', '스터디', '기술서적', '오브젝트']
draft: false
summary: 오브젝트 Java 챕터5 책임 할당하기
---
책임에 초점을 맞춰서 설계할 때 직면하는 가장 큰 어려움은 어떤 객체에 어떤 책임을 할당할지를 결정하는 것이 쉽지 않다는 것이다.

이번장에서는 **GRASP 패턴과** 함께 책임 할당의 어려움을 해결하기 위한 답을 제시하고자 한다.

## 책임 주도 설계를 향해

우선, 책임 중심의 설계를 위해서는 다음 두가지 원칙을 따라야 한다.

- 데이터보다 행동을 먼저 결정하라
- 협력이라는 문맥 안에서 책임을 결정하라

### 데이터보다 행동을 먼저 결정하라

**객체에게 중요한 것은 데이터가 아닌 외부에 제공하는 행동이다.**

책임 중심의 설계에서는 “이 객체가 수행해야 하는 책임은 무엇인가”를 결정한 후 “이 책임을 수행하는 데 필요한 데이터는 무엇인가”를 결정한다.

### 협력이라는 문맥 안에서 책임을 결정하라

책임은 객체의 입장이 아니라 객체가 참여하는 협력에 적합해야 한다. 즉, 메시지 수신자가 아니라 메시지 전송자에게 적합한 책임을 의미하는 것이다. (메시지를 전송하는 클라이언트의 의도에 적합한 책임을 할당)

메시지를 먼저 결정하기 때문에 메시지 송신자는 메시지 수신자에 대한 어떠한 가정도 할 수 없다. 그렇기에 전송자의 관점에서 메시지 수신자가 깔끔하게 캡슐화 되는 것이다.

올바른 객체지향 설계는 클라이언트가 전송할 메시지를 결정한 후 비로소 객체의 상태를 저장하는 데 필요한 내부 데이터에 관해 고민하기 시작한다.

### 책임 주도 설계

- 시스템이 사용자에게 제공해야 하는 기능인 시스템 책임을 파악한다.
- 시스템 책임을 더 작은 책임으로 분할한다.
- 분할된 책임을 수행할 수 있는 적절한 객체 또는 역할을 찾아서 책임을 할당한다.
- 객체가 책임을 주도하는 도중 다른 객체의 도움이 필요한 경우 이를 책임질 적잘한 객체 또는 역할을 찾는다.
- 해당 객체 또는 역할에게 책임을 할당함으로써 두 객체가 협력하게 한다.

위는 3장에서 설명한 책임 주도 설계의 흐름이다.

살펴본 내용과 함께 본다면 좀 더 이해하기 쉬울 것이다.

## 책임 할당을 위한 GRASP 패턴

**GRASP 패턴은 “General Responsibility Assignment Software Pattern” 의 약자**로 객체에게 책임을 할당할 때 지침으로 삼을 수 잇는 원칙들의 집합을 패턴 형식으로 정리한 것이다.

### 도메인 개념에서 출발하기

설계를 시작하기 전에 도메인에 대한 개략적인 모습을 그려보는 것이 유용하다.

이전의 영화 예매 시스템을 구성하는 도메인 개념과 개념 사이의 관계를 생각해보자.

하나의 영화는 여러번 상영될 수 있고, 하나의 상영은 여러번 예약될 수 있을 것이다.

그리고 영화는 다수의 할인 조건을 가질 수 있으며 할인 조건에는 순번 조건과 기간 조건이 존재할 것이다.

마지막으로 할인 조건은 순번 조건과 기간 조건으로 분류되고 영화는 금액이나 비율에 따라 할인될 수 있지만 동시에 두 가지 할인 정책을 적용할 수 없다.

### 정보 전문가에게 책임을 할당하라

책임 주도 설계 방식의 첫 단계는 어플리케이션이 제공해야 하는 기능을 어플리케이션의 책임으로 생각하는 것이다.

우리가 사용자에게 제공해야 하는 기능은 영화를 예매하는 것이다.

그렇다면 어플리케이션은 영화를 예매할 책임이 있는 것이다.

따라서 첫번째 질문을 정할 수 있다.

1. 메시지를 전송할 객체는 무엇을 원하는가?

이에 대한 답은 바로 영화를 예매하는 것이다.

그렇다면 이후의 두번째 질문을 정할 수 있을 것이다.

1. 메시지를 수신할 적합한 객체는 누구인가?

이에 대한 대답을 위해서는 객체가 상태와 행동을 통합한 캡슐화의 단의인 것에 집중해야 한다.

객체의 책임과 책임을 수행하는데 필요한 상태는 동일한 객체안에 존재해야 하기에, 객체에게 책임을 할당하는 첫번째 원칙을 책임을 수행할 정보를 알고 있는 객체에게 책임을 할당하는 것이다.

이것을 **GRASP에서 INFORMATION EXPERT(정보 전문가) 패턴 이라고 부른다.**

우리는 따라서 2번 질문에 대한 답은 상영(Screening) 이라는 도메인이 적합하다는 것을 알 수 있다.

이때 Screening이 수행해야 하는 작업의 흐름을 생각해보면 된다.

그리고 스스로 처리할 수 없는 작업이 있다면 외부에 도움을 요청해야 한다. 이 요청이 외부로 전송해야 하는 새로운 메시지가 되고, 이 메시지가 새로운 객체의 책임으로 할당된다.

이 과정을 통해 Screening → Movie → DiscountCondition 이렇게 책임을 할당하게 된다.

### 높은 응집도와 낮은 결합도

만약 Movie → DiscountCondition이 아닌 Screening → DiscountCondition을 하여 결과를 Movie에게 전달하면 무엇이 안좋을까?

겉으로 보기에는 기능상 아무런 변화가 없다.

하지만 응집도와 결합도가 달라지게 된다. 우리는 높은 응집도와 낮은 결합도를 지향해야 한다.

**GRASP**에서는 이것을 **LOW COUPLING 패턴**, **HIGH COHESION 패턴** 이라고 한다.

이를 생각하며 각각의 시각으로 살펴보면, Screening이 DiscountCondition과 새로운 결합도를 가지기 때문에 옳지 않다.

또한, Screening에게 영화 요금 계산과 관련된 책임 일부를 떠안게 하기 때문에 옳지 않다.

### 창조자에게 객체 생성 책임을 할당하라

영화 예매 협력의 최종 결과물은 Reservation 인스턴스를 생성하는 것이다.

즉, 협력에 참여하는 어떤 객체에게는 Reservation 인스턴스를 생성할 책임을 할당하는 것이다. **GRASP의 CREATOR 패턴**은 이와 같은 경우에 사용할 수 있는 책임 할당 패턴으로 객체를 생성할 책임을 어떤 객체에게 할당할지에 대한 지침을 제공한다.

Reservation을 잘 알고 있거나, 긴밀하게 사용하거나, 초기화에 필요한 데이터를 가지고 있는 객체를 찾아야 하는데 여기는 Screening일 것이다.

따라서 이를 **CREATOR**로 선택하는 것이 좋아 보인다.

## 구현을 통한 검증

그렇다면 이러한 책임이 제대로 동작하는지 확인하려면 어떻게 해야할까? 유일한 방법은 실제로 코드를 작성하고 실행시켜 보는 것 뿐이다.

```java
public class Screening {
    private Movie movie;
    private int sequence;
    private LocalDateTime whenScreened;

    public Reservation reserve(Customer customer, int audienceCount) {
        return new Reservation(customer, this, calculateFee(audienceCount), audienceCount);
    }

    private Money calculateFee(int audienceCount) {
        return movie.calculateMovieFee(this).times(audienceCount);
    }

    public LocalDateTime getWhenScreened() {
        return whenScreened;
    }

    public int getSequence() {
        return sequence;
    }
}
```

여기서 Screening은 Movie의 내부 구현에 대한 어떤 지식도 없이 전송할 객체를 결정했다는 사실에 집중하자.

이처럼 Movie의 구현을 고려하지 않고 필요한 메시지를 결정한다면 Movie의 내부 구현을 깔끔하게 캡슐화 할 수 있다.

```java
public class Movie {
    private String title;
    private Duration runningTime;
    private Money fee;
    private List<DiscountCondition> discountConditions;

    private MovieType movieType;
    private Money discountAmount;
    private double discountPercent;

    public Money calculateMovieFee(Screening screening) {
        if (isDiscountable(screening)) {
            return fee.minus(calculateDiscountAmount());
        }

        return fee;
    }

    private boolean isDiscountable(Screening screening) {
        return discountConditions.stream()
                .anyMatch(condition -> condition.isSatisfiedBy(screening));
    }

    private Money calculateDiscountAmount() {
        switch(movieType) {
            case AMOUNT_DISCOUNT:
                return calculateAmountDiscountAmount();
            case PERCENT_DISCOUNT:
                return calculatePercentDiscountAmount();
            case NONE_DISCOUNT:
                return calculateNoneDiscountAmount();
        }

        throw new IllegalStateException();
    }

    private Money calculateAmountDiscountAmount() {
        return discountAmount;
    }

    private Money calculatePercentDiscountAmount() {
        return fee.times(discountPercent);
    }

    private Money calculateNoneDiscountAmount() {
        return Money.ZERO;
    }
}
```

```java
public class DiscountCondition {
    private DiscountConditionType type;
    private int sequence;
    private DayOfWeek dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;

    public boolean isSatisfiedBy(Screening screening) {
        if (type == DiscountConditionType.PERIOD) {
            return isSatisfiedByPeriod(screening);
        }

        return isSatisfiedBySequence(screening);
    }

    private boolean isSatisfiedByPeriod(Screening screening) {
        return dayOfWeek.equals(screening.getWhenScreened().getDayOfWeek()) &&
                startTime.compareTo(screening.getWhenScreened().toLocalTime()) <= 0 &&
                endTime.compareTo(screening.getWhenScreened().toLocalTime()) <= 0;
    }

    private boolean isSatisfiedBySequence(Screening screening) {
        return sequence == screening.getSequence();
    }
}
```

이렇게 코드를 작성했다.

완벽한가? 아니다. 몇가지 문제점이 있다.

### DiscountCondition 개선하기

DiscountCondition은 수정해야 하는 이유가 하나가 아니다. 여러개를 가지고 있다.

새로운 할인 조건을 추가하거나, 순번 조건을 판단하는 로직을 변경하거나, 기간 조건을 판단하는 로직이 변경되는 경우 모두 코드가 수정되어야 한다.

**우리는 변경의 이유에 따라 클래스를 분리하여 이를 해결할 수 있다.**

> **인스턴스 변수가 초기화 되는 시점에서 모든 속성이 함께 초기화 되지 않는다면 응집도가 낮은 클래스라고 판단할 수 있다.**
> 

### 타입 분리하기

그렇다면 우리는 SequenceCondition, PeriodCondition이라는 두개의 클래스로 분리할 수 있을 것이라 쉽게 판단할 수 있다.

물론 이는 좋은 방법이다. 하지만 단순하게 이렇게 분리만 한다면 Movie는 두가지 모두 가져야 하기에 결합도가 높아지게 된다.

그렇다면 어떻게 하면 좋을까.

### 다형성을 통해 분리하기

만약 추상 클래스 혹은 인터페이스를 사용하면 되지 않을까? 추측을 했다면 좋은 접근이다.

이전에 살펴보았던 역할이라는 개념을 떠올려서 생각해보자. Movie의 입장에서 SequenceCondition과 PeriodCondition은 동일한 책임을 수행한다. 

**이는 즉, 동일한 역할을 수행한다는 것을 의미한다.**

역할은 협력 안에서 대체 가능성을 의미하기 때문에 Movie가 구체적인 클래스는 알지 못한 채 오직 역할에 대해서만 결합되도록 의존성을 제한할 수 있다.

**우리는 이때 구현을 공유할 필요가 있다면 추상클래스를, 공유할 필요가 없다면 인터페이스를 활용할 수 있다.**

DiscountCondition은 공유할 구현이 없기 때문에 이를 인터페이스로 만들어 역할을 구현하면 더 좋은 코드를 만들 수 있다.

```java
public interface DiscountCondition {
    boolean isSatisfiedBy(Screening screening);
}

public class PeriodCondition implements DiscountCondition {
    private DayOfWeek dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;

    public PeriodCondition(DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime) {
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public boolean isSatisfiedBy(Screening screening) {
        return dayOfWeek.equals(screening.getWhenScreened().getDayOfWeek()) &&
                startTime.compareTo(screening.getWhenScreened().toLocalTime()) <= 0&&
                endTime.compareTo(screening.getWhenScreened().toLocalTime()) >= 0;
    }
}

public class SequenceCondition implements DiscountCondition {
    private int sequence;

    public SequenceCondition(int sequence) {
        this.sequence = sequence;
    }

    public boolean isSatisfiedBy(Screening screening) {
        return sequence == screening.getSequence();
    }
}
```

```java
public abstract class Movie {
    private List<DiscountCondition> discountConditions;

    public Money calculateMovieFee(Screening screening) {
        if (isDiscountable(screening)) {
            return fee.minus(calculateDiscountAmount());
        }

        return fee;
    }

    private boolean isDiscountable(Screening screening) {
        return discountConditions.stream()
                .anyMatch(condition -> condition.isSatisfiedBy(screening));
    }
}
```

이렇게 수정할 수 있다.

이렇게 Movie와 DiscountCondition 사이의 협력은 다형적으로 이루어지게 된다.

**GRASP**에서는 이를 **POLYMORPHISM(다형성) 패턴**이라고 한다.

### 변경으로부터 보호하기

그렇다면 만약 새로운 할인 조건이 추가되는 경우는 어떻게 될까?

우리는 DiscountCondition이라는 역할이 Movie로부터 PeriodCondtion과 SequenceCondition의 존재를 감춘다는 사실에 주목할 필요가 있다.

만약 새로운 할인 조건이 추가되더라도 DiscountCondition 인터페이스를 실체화 하는 클래스를 추가하는 것 하나만으로 할인 조건의 종류를 확장할 수 있다.

이처럼 변경을 캡슐화하도록 책임을 할당하는 것을 **GRASP**에서는 **PROTECTED VARIATIONS(변경 보호) 패턴**이라고 부른다.

### Movie 클래스 개선하기

현재의 Movie는 할인 정책에 따라 구현을 하나의 클래스에 포함하고 있기 때문에 여러개의 이유로 변경될 수 있다는 위험성을 마찬가지로 가지고 있다.

Movie 또한 **POLIMORPHISM 패턴**을 사용해 다형적으로 만들어 해결할 수 있다.

다만 이 경우에는 구현을 공유할 필요가 있기 때문에 추상 클래스를 활용하는 것이 좋다.

```java
public abstract class Movie {
    private String title;
    private Duration runningTime;
    private Money fee;
    private List<DiscountCondition> discountConditions;

    public Movie(String title, Duration runningTime, Money fee, DiscountCondition... discountConditions) {
        this.title = title;
        this.runningTime = runningTime;
        this.fee = fee;
        this.discountConditions = Arrays.asList(discountConditions);
    }

    public Money calculateMovieFee(Screening screening) {
        if (isDiscountable(screening)) {
            return fee.minus(calculateDiscountAmount());
        }

        return fee;
    }

    private boolean isDiscountable(Screening screening) {
        return discountConditions.stream()
                .anyMatch(condition -> condition.isSatisfiedBy(screening));
    }

    protected Money getFee() {
        return fee;
    }

    abstract protected Money calculateDiscountAmount();
}
```

**이렇게 추상 클래스를 작성하고 AmountDiscountMovie와 PercentDiscountMovie, NoneDiscountMovie를 각각 만들어 준다면** DiscountCondition과 마찬가지의 방법을 통해 문제를 해결할 수 있을 것이다.

### 변경과 유연성

새로운 할인 정책이 추가될 때마다 인스턴스를 생성하고, 상태를 복사하고, 식별자를 관리하는 코드를 추가하는 것은 번거로우며 오류가 발생할 확률이 높다.

해결 방법은 상속 대신 **합성을** 사용하는 것이다.

Movie의 상속 계층 안에 구현된 할인 정책을 독립적인 DiscountPolicy로 분리한 후 Movie에 합성하는 방식이다.

```java
Movie movie = new Movie("타이타닉",
												Duration.ofMinutes(120),
												Money.wons(10000),
												new AmountDiscountPolicy(...));

movie.changeDiscountPolicy(new PercentDiscountPolicy(...));
```

이렇게 합성을 사용한 예제의 경우 새로운 할인 정책이 추가되어도 할인 정책을 변경하는 데 필요한 추가적인 코드를 작성할 필요가 없다. 단순히 새로운 클래스를 추가하고 클래스의 인스턴스를 `changeDiscountPolicy()` 에 전달하면 된다.

### 책임 주도 설계의 대안

처음부터 책임 주도 설계를 하는 것은 어려울 수 있다.

대신에 우리는 일단 실행되는 코드를 얻고 난 이후 코드 상에 명확하게 드러나는 책임들을 올바른 위치로 이동시키는 것을 통해 발전할 수 있다.

이렇게 겉으로 보이는 동작은 바꾸지 않은 채 내부 구조를 변경하는 것을 **리팩토링** 이라고 부른다.

### 메소드 응집도

예전에 데이터 중심의 설계에서 작성한 ReservationAgency의 코드를 한번 생각해보자.

하나의 메소드에 엄청난 길이의 코드가 들어있을 것이다.

이는 가독성도 떨어지며 재사용하기도 어렵고 수정하기도 어렵게 만든다.

이를 작고 응집도 높은 메소드로 분리하면 각 메소드를 적절한 클래스로 이동하기가 수월해지기에 책임 주도 설계로 나아가는 첫걸음이 될 수 있다.

### 객체를 자율적으로 만들자

어떤 메소드를 어떤 클래스로 이동시켜야 할까? 객체가 자율적인 존재여야 한다는 사실을 떠올려보자.

이를 떠올리며 분리한 메소드를 각각의 적절한 클래스로 옮기고, 그와 함께 **POLYMORPHISM 패턴**과 **PROTECTED VARIATIONS 패턴**을 차례대로 적용하면 책임 주도 설계에서 얻어낸 최종 설계와 유사한 모습을 얻을 수 있을 것이다.