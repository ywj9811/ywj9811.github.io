---
title: 오브젝트 Chap2
date: '2023-11-23'
tags: ['JAVA', '스터디', '기술서적', '오브젝트']
draft: false
summary: 오브젝트 Java 챕터2 객체지향 프로그래밍
---
### 요구사항 살펴보기

이번에는 온라인 영화 예매 시스템을 예시로 살펴보도록 할 것이다.

여기서는 ‘영화’라는 제목, 상영시간, 가격 정보와 같이 영화가 가지고 있는 기본적인 정보를 가지는 용어와, ‘상영’ 이라는 상영 일자, 시간, 순번 등을 가리키는 용어가 있다.

그리고 할인이 있는데, 이때 ‘순서 조건’과 ‘기간 조건’ 두가지 분류를 가지는 ‘할인 조건’과 ‘금액 할인 정책’ 과 ‘비율 할인 정책’ 두가지 분류를 가지는 ‘할인 정책’ 이 있다.

이렇게 용어들을 가지고 사용자가 예매를 완료하면 제목, 상영 정보, 인원, 정가, 결제 금액을 가지는 예매 정보를 만들 것이다.

## 객체지향 프로그래밍을 향해

### 협력, 객체, 클래스

우리는 객체지향 프로그램을 작성할 때 보통 어떤 클래스가 필요한가 생각하고 그 이후에 어떤 속성과 메소드를 가져야 하는지 생각하곤 한다.

하지만 이것은 잘못된 접근 방식이다.

진정한 객체지향 패러다임으로의 전환은 클래스가 아닌 객체에 초점을 맞춰야 한다.

1. 어떤 클래스가 필요한지 고민하기 이전에 어떤 객체들이 필요한지 고민하자.
    
    클래스는 공통적인 상태와 행동을 공유하는 객체들을 추상화한 것이다.
    
    따라서 어떤 상태와 행동을 가지는지 우선 결정해야 한다.
    
2. 객체를 독립적인 존재가 아니라 기능을 구현하기 위해 협력하는 공통체의 일원으로 바라봐야 한다.
    
    객체는 홀로 존재하는 것이 아닌 다른 객체에게 도움을 주거나 의존하면서 살아가는 협력적인 존재이다.
    

따라서 객체들의 모양과 윤곽이 잡히면 공통된 특성과 상태를 가진 객체들을 타입으로 분류하고 이 타입을 기반으로 클래스를 구현하자.

### 도메인의 구조를 따르는 프로그램 구조

도메인이라는 용어를 살펴보도록 하자.

**도메인이란 문제를 해결하기 위해 사용자가 프로그램을 사용하는 분야를 말한다.**

요구사항과 프로그램을 객체라는 동일한 관점에서 바라볼 수 있기 때문에 도메인을 구성하는 개념들이 프로그램의 객체와 클래스로 매끄럽게 연결될 수 있다.

![Untitled](/static/images/objectsChap2.png)

이런식으로 연결을 할 수 있는데, 이는 영화는 여러번 상영될 수 있고, 상영은 여러 번 예매될 수 있다는 것을 알 수 있다. 영화에는 할인 정책을 할당하거나 하지 않을 수 있고, 할인 정책은 하나 이상의 할인 조건이 반드시 존재한다는 것을 알 수 있다.

이것을 기반으로 클래스를 작성하고 클래스 구조를 잡으면 된다.

### 클래스 구현하기

그렇다면 이를 기반으로 클래스를 구현해보자.

```java
public class Screening {
    private Movie movie;
    private int sequence;
    private LocalDateTime whenScreened;

    public Screening(Movie movie, int sequence, LocalDateTime whenScreened) {
        this.movie = movie;
        this.sequence = sequence;
        this.whenScreened = whenScreened;
    }

    public LocalDateTime getStartTime() {
        return whenScreened;
    }

    public boolean isSequence(int sequence) {
        return this.sequence == sequence;
    }

    public Money getMovieFee() {
        return movie.getFee();
    }
}
```

이를 보면, 인스턴스 변수의 가시성은 private이고 메소드의 가시성은 public이라는 것이다.

**클래스를 구현하거나 다른 개발자에 의해 개발된 클래스를 사용할 때 가장 중요한 것은 클래스의 경계를 구분 짓는 것이다.**

이처럼 외부에서는 객체의 속성에 직접 접근할 수 없도록 막고 적절한 public 메소드를 통해서만 내부 상태를 변경할 수 있게 해야한다.

그렇다면 클래스의 내부와 외부를 구분해야 하는 이유는 무엇일까?

경계의 명확성이 객체의 자율성을 보장하기 때문이며 프로그래머에게 구현의 자유를 제공하기 때문이다.

### 자율적인 객체

우선, 두가지 중요한 사실을 알아야 한다.

1. 객체가 상태와 행동을 함께 가지는 복합적인 존재라는 것이다.
2. 객체가 스스로 판단하고 행동하는 자율적인 존재라는 것이다.

객체라는 단위 안에 데이터와 기능을 한 덩어리로 묶음으로서 문제 영역의 아이디어를 적절하게 표현할 수 있게 했는데, 이처럼 데이터와 기능을 객체 내부로 함께 묶는 것을 **캡슐화** 라고 한다.

캡슐화와 접근 제어는 객체를 두 부분으로 나누는데,

1. 외부에서 접근 가능한 ******************************************퍼블릭 인터페이스 (public)******************************************
2. 오직 내부에서만 접근 가능한 **구현 (private)**

이처럼 인터페이스와 구현의 분리 원칙은 훌륭한 객체지향 프로그램을 위해 따라야하는 핵심 원칙이다.

### 프로그래머의 자유

프로그래머의 역할은 **클래스 작성자와** **클라이언트 프로그래머로** 구분하면 유용하다.

- 클래스 작성자 : 새로운 데이터 타입을 프로그램에 추가
    
    → 이들의 목표는 클라이언트 프로그래머에게 필요한 부분만 공개하고 나머지는 꽁꽁 숨겨야 한다.
    
- 클라이언트 프로그래머 : 클래스 작성자가 추가한 데이터 타입을 사용
    
    → 이들의 목표는 필요한 클래스들을 엮어서 어플리케이션을 빠르고 안정적으로 구축하는 것이다.
    

이때 클라이언트 프로그래머가 숨겨 놓은 부분에 마음대로 접근할 수 없도록 방지하여 클라이언트 프로그래머에 대한 영향을 걱정하지 않고도 내부 구현을 마음대로 변경할 수 있게 하는 것을 **구현 은닉**이라고 한다.

이는, 두 프로그래머 역할 모두에 유용한 개념으로 서로에게 영향끼칠 수 있는 걱정과 구현을 위하 알아둬야 하는 지식들을 줄일 수 있다.

### 협력하는 객체들의 공동체

영화를 예매하는 기능을 구현하는 메소드를 살펴보면, Screen의 `reserve()` 에서 영화를 예매한 후 예매 정보를 담고 있는 Reservation 인스턴스를 생성해서 반환한다.

그리고 `calculateFee()`를 보면 영화의 예매 요금에 인원수를 곱하여 반환한다.

```java
public class Screening {
		...
    
		public Reservation reserve(Customer customer, int audienceCount) {
        return new Reservation(customer, this, calculateFee(audienceCount),
                audienceCount);
    }

    private Money calculateFee(int audienceCount) {
        return movie.calculateMovieFee(this).times(audienceCount);
    }
}
```

```java
public class Reservation {
    private Customer customer;
    private Screening Screening;
    private Money fee;
    private int audienceCount;

    public Reservation(Customer customer, Screening Screening, Money fee, int audienceCount) {
        this.customer = customer;
        this.Screening = Screening;
        this.fee = fee;
        this.audienceCount = audienceCount;
    }
}
```

이어서 Reservation

```java
public class Money {
    public static final Money ZERO = Money.wons(0);

    private final BigDecimal amount;

    public static Money wons(long amount) {
        return new Money(BigDecimal.valueOf(amount));
    }

    public static Money wons(double amount) {
        return new Money(BigDecimal.valueOf(amount));
    }

    Money(BigDecimal amount) {
        this.amount = amount;
    }

    public Money plus(Money amount) {
        return new Money(this.amount.add(amount.amount));
    }

    public Money minus(Money amount) {
        return new Money(this.amount.subtract(amount.amount));
    }

    public Money times(double percent) {
        return new Money(this.amount.multiply(BigDecimal.valueOf(percent)));
    }

    public boolean isLessThan(Money other) {
        return amount.compareTo(other.amount) < 0;
    }

    public boolean isGreaterThanOrEqual(Money other) {
        return amount.compareTo(other.amount) >= 0;
    }
}
```

참고로 Money의 클래스는 이렇게 구성되어 있다.

이때 생각해보면, 1장에서는 금액을 구현하기 위해 Long타입을 사용했다. 하지만 Money타입처럼 저장하는 값이 금액과 관련되어 있다는 의미를 전달할 수 없었다.

객체지향의 장점은 객체를 이용해 도메인의 의미를 풍부하게 표현할 수 있다는 것인데, 따라서 의미를 좀 더 명시적이고 분명하게 표현할 수 있다면 객체를 사용해서 해당 개념을 구현하는 것이 좋다. 비록 하나의 인스턴스 변수만 포함하더라도 개념을 명시적으로 표현하는 것은 전체적인 설계의 명확성과 유연성을 높이는 첫 걸음이다.

이렇게 보면 영화를 예매하기 위해 Screening, Movie, Reservation 인스턴스들은 서로의 메소드를 호출하며 상호작용 한다.

**이러한 관계를 협력이라고 한다.**

### 협력에 대해서…

짧게 다루고 지나가면, 객체와 다른 객체가 상호작용 할 수 있는 유일한 방법은 **메시지를 전송하는 것**이다.

**이때, 우리가 메소드를 호출한다고 하는 것이 사실은 메시지를 전송하는 것이다.**

## 할인 요금 구하기

### 할인 요금 계산을 위한 협력 시작

```java
public class Movie {
    private String title;
    private Duration runningTime;
    private Money fee;
    private DiscountPolicy discountPolicy;

    public Movie(String title, Duration runningTime, Money fee, DiscountPolicy discountPolicy) {
        this.title = title;
        this.runningTime = runningTime;
        this.fee = fee;
        this.discountPolicy = discountPolicy;
    }

    public Money getFee() {
        return fee;
    }

    public Money calculateMovieFee(Screening screening) {
        return fee.minus(discountPolicy.calculateDiscountAmount(screening));
    }
}
```

calculateMovieFee 메소드는 discountPolicy에 calculateDiscountAmount 메시지를 전송하여 할인 요금을 반환 받고, Movie는 기본요금인 fee에서 반환된 할인 요금을 차감한다.

이때, 코드 어디에도 할인 정책을 판단하는 코드가 존재하지 않고 단순히 discountPolicy에게 메시지를 전송(메소드 호출)하고만 있다.

이를 알아보기 위해서 할인 정책과 할인 조건을 살펴보도록 하자.

### 할인 정책과 할인 조건

할인 정책을 AmountDiscountPolicy와 percentDiscountPolicy라는 클래스로 구현할 것인데, 이는 DiscountPolicy를 상속하여 구현할 것이다.

```java
public abstract class DiscountPolicy {
    private List<DiscountCondition> conditions = new ArrayList<>();

    public DiscountPolicy(DiscountCondition ... conditions) {
        this.conditions = Arrays.asList(conditions);
    }

    public Money calculateDiscountAmount(Screening screening) {
        for(DiscountCondition each : conditions) {
            if (each.isSatisfiedBy(screening)) {
                return getDiscountAmount(screening);
            }
        }

        return Money.ZERO;
    }

    abstract protected Money getDiscountAmount(Screening Screening);
}
```

```java
public class AmountDiscountPolicy extends DiscountPolicy {
    private Money discountAmount;

    public AmountDiscountPolicy(Money discountAmount, DiscountCondition... conditions) {
        super(conditions);
        this.discountAmount = discountAmount;
    }

    @Override
    protected Money getDiscountAmount(Screening screening) {
        return discountAmount;
    }
}
```

```java
public class PercentDiscountPolicy extends DiscountPolicy {
    private double percent;

    public PercentDiscountPolicy(double percent, DiscountCondition... conditions) {
        super(conditions);
        this.percent = percent;
    }

    @Override
    protected Money getDiscountAmount(Screening screening) {
        return screening.getMovieFee().times(percent);
    }
}
```

이때, 부모 클래스인 DiscountPolicy는 DiscountConditioin의 리스트인 conditions를 인스턴스로 가지기 때문에 하나의 할인 정책은 여러개의 할인 조건을 가질 수 있다.

위 코드를 보면 부모인 DiscountPolicy는 할인 여부와 요금 계산에 필요한 전체적인 흐름은 정의하지만, 실제로 요금을 계산하는 부분은 대부분 추상 메소드인 `getDiscountAmount()` 에게 위임한다..

따라서 실제로는 자식 클래스에서 오버라이딩한 메소드가 실행될 것이다.

**이처럼 부모 클래스에 기본적인 알고리즘의 흐름을 구현하고 중간에 필요한 처리를 자식 클래스에게 위임하는 디자인 패턴을 템플릿 메소드 패턴이라 한다.**

이어서 할인 조건을 살펴보면

```java
public interface DiscountCondition {
    boolean isSatisfiedBy(Screening screening);
}
```

```java
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
        return screening.getStartTime().getDayOfWeek().equals(dayOfWeek) &&
                startTime.compareTo(screening.getStartTime().toLocalTime()) <= 0 &&
                endTime.compareTo(screening.getStartTime().toLocalTime()) >= 0;
    }
}
```

```java
public class SequenceCondition implements DiscountCondition {
    private int sequence;

    public SequenceCondition(int sequence) {
        this.sequence = sequence;
    }

    public boolean isSatisfiedBy(Screening screening) {
        return screening.isSequence(sequence);
    }
}
```

이렇게 인터페이스로 구현된 부모를 각 자식이 상속받아 구현되어 있다.

### 할인 정책 구성하기

하나의 영화에 대해 단 하나의 할인 정책만 설정할 수 있지만 할인 조건의 경우에는 여러개를 적용할 수 있다고 하였다.

이는, Movie와 DiscountPolicy의 생성자를 통해 강제된다.

```java
public class Movie {
		public Movie (String title, Duration runningTime, Money fee, DiscountPolicy discountPolicy) {
				...
				this.discountPolicy = discountPolicy;
		}
}
// 이렇게 단 하나의 정책만을 허용하고 있다.
```

```java
public abstract class DiscountPolicy {
		public DiscountPolicy (DiscountCondition ... conditions) {
				this.conditions = Arrays.asList(conditions);
		}
}
// 이렇게 여러개의 조건을 허용하고 있다.
```

이렇게 생성자의 파라미터 목록을 통해 초기화에 필요한 정보를 전달하도록 강제한다면 올바른 상태를 가진 객체의 생성을 보장할 수 있다.

## 상속과 다형성

### 컴파일 시간 의존성과 실행 시간 의존성

Policy클래스와 같이 이처럼 어떤 클래스에 접근할 수 있는 경로를 가지거나 해당 클래스의 객체의 메소드를 호출할 경우 두 클래스 사이에 의존성이 존재한다고 말한다.

우리는 Movie클래스와 DiscountPolicy 클래스가 연결되어 있다는 사실에 주목할 필요가 있다.

Movie 인스턴스를 생성할 때 구현체 인스턴스를 전달한다.

이때, 코드의 의존성과 실행 시점의 의존성은 서로 다를 수 있다는 것을 알 수 있다.

다시 말해서 클래스 사이의 의존성과 객체 사이의 의존성은 동일하지 않을 수 있다.

이렇게 코드의 의존성과 실행 시점의 의존성이 서로 다르다면 코드는 더욱 유연해지고 확장이 가능해지지만 코드를 이해하기는 어려워진다. 이렇듯 의존성의 양면성은 설계가 트레이드 오프의 산물이라는 것을 잘 나타낸다.

따라서 우리는 항상 유연성과 가독성 사이에서 고민해야 한다.

### 차이에 의한 프로그래밍

상속을 통해 부모 클래스와 다른 부분만을 추가하여 새로운 클래스를 쉽고 빠르게 만드는 방법을 **차이에 의한 프로그래밍이라고 한다.**

### 상속과 인터페이스

사람들은 일반적으로 상속의 목적이 메소드나 인스턴스 변수를 재사용 하는 것이라고 생각한다.

하지만 부모 클래스가 제공하는 모든 인터페이스(외부 접근 가능)을 자식 클래스가 물려받을 수 있다는 것이 가치있는 이유이다.

**즉, 자식 클래스는 부모 클래스가 수신할 수 있는 모든 메시지를 마찬가지로 수신할 수 있는 것이다. 그렇기에 외부 객체는 자식과 부모를 동일한 타입으로 간주할 수 있는 것이다.**

### 다형성

다시한번 말하지만, 메시지와 메소드는 다른 개념이다.

위에서 Movie는 DiscountPolicy에게 `calculateDiscountAount` 메시지를 전송한다.

메시지로 바라보면, 어떤 객체의 클래스가 연결되었는가와 상관없이 동일한 메시지이다.

하지만 실행되는 메소드는 Movie와 연결된 객체의 클래스가 무엇인가에 따라서 달라지게 된다.

**이렇듯 동일한 메시지를 전송하지만 실제로 어떤 메소드가 실행되는지는 어떤 객체가 메시지를 수신하는가에 따라서 달라지는데 이것을 다형성이라 한다.**

이러한 다형성은 객체지향 프로그램이 컴파일 시간 의존성과 실행 시간 의존성이 다를 수 있다는 사실을 기반으로 한다.

<aside>
🤔 **참고
지연 바인딩 & 동적 바인딩 : 메시지와 메소드를 실행 시점에 바인딩한다.
초기 바인딩 & 정적 바인딩 : 컴파일 시점에 실행될 함수나 프로시저를 결정**

</aside>

객체지향이 컴파일 시점의 의존성과 실행 시점의 의존성이 다를 수 있는 이유는 지연 바인딩 메커니즘을 사용하기 때문이다.

## 추상화와 유연성

### 추상화의 힘

DiscountPolicy와 DiscountCondition이 더 추상적인 이유는 인터페이스에 초점을 맞추기 때문이다.

둘 다 같은 계층에 속하는 클래스들이 공통으로 가질 수 있는 인터페이스를 정의하며 구현의 일부(추상 클래스의 경우) 또는 전체 (자바 인터페이스의 경우)를 자식 클래스가 결정할 수 있도록 결정권을 위임한다.

이렇게 추상화를 사용하면 두가지 장점이 있다.

1. 추상화의 계층만 따로 떼어 놓고 살펴보면 요구사항의 정책을 높은 수준에서 서술할 수 있다.
2. 추상화를 이용하면 설계가 좀 더 유연해진다.
    
    할인 정책이나 할인 조건의 새로운 자식을 추가하는 경우 단순히 상위 협력 흐름을 그대로 따르면 된다.
    
    즉, 새로운 기능을 쉽게 추가하고 확장할 수 있다.
    

### 유연한 설계

우리는 정책이 없는 경우를 다루지 않았다. 따라서 정책이 없는 경우를 추가하기 위해서는 Movie에서 discountPolicy가 Null인 경우를 찾아서 조건문을 통해 처리해야 한다.

하지만 이 경우는 지금까지 일관성 있던 협력 방식이 무너지게 된다. 즉, 할인 금액을 계산하는 책임이 DiscountPolicy가 아닌 Movie에게 가는 것이다.

이를 해결하기 위해 우리는 0원이라는 할인 요금을 계산할 수 있도록 DiscountPolicy를 상속받는 NoneDiscountPolicy를 만들 수 있다.

```java
public class NoneDiscountPolicy extends DiscountPolicy {
		@Override
		protected Money getDiscountAmount(Screening screening) {
				return Money.ZERO;
		}
}
```

이렇게 하면 기존의 Movie와 DiscountPolicy를 수정하지 않고 어플리케이션의 기능을 확장할 수 있을 것이다.

이렇듯 추상화를 중심으로 코드의 구조를 설계하면 유연하고 확장 가능한 설계를 만들 수 있다.

### 추상 클래스와 인터페이스 트레이드 오프

위의 코드들을 자세히 살펴보면 사실 NoneDiscountPolicy의 `getDiscountAmount()` 가 어떤 값을 반환하더라도 상관없다는 사실을 알 수 있다.

왜냐하면 DiscountPolicy에서 할인 조건이 없을 경우 `getDiscountAmount()` 를 호출하지 않기 때문이다.

하지만 이는 부모 클래스인 DiscountPolicy와 NoneDiscountPolicy를 개념적으로 결합시킨다.

왜냐하면 이러한 사실을 가정하고있기 때문이다.

이 문제를 해결하기 위해서는 DiscountPolicy를 인터페이스로 바꾸고 NoneDiscountPolicy가 `calculateDiscountAmount()` 를 오버라이딩 하도록 하는 것인데, 이 경우 NoneDiscountPolicy만을 위한 인터페이스를 생성하게 되는 것으로 이상적이지만 설계의 복잡도를 야기할 수 있다는 것이다.

**즉, 구현과 관련된 모든 것들은 트레이드 오프의 대상이 될 수 있다는 것이다.**

### 코드 재사용 합성과 상속

**상속은** 객체지향 코드를 재사용하기 위해서 널리 사용 되는 기법이지만 두가지 관점에서 안 좋은 영향을 끼친다.

1. 상속이 캡슐화를 위반한다.
    
    상속을 이용하기 위해서는 부모 클래스의 내부 구조를 잘 알고 있어야 하기 때문이다.
    
2. 설계를 유연하지 못하게 만든다.
    
    상속은 부모와 자식의 관계를 컴파일 시점에 결정하기 때문이다.
    

인터페이스에 정의된 메시지를 통해서만 코드를 재사용하는 방법을 **합성이라** 한다.

합성은 컴파일 시점에 하나의 단위로 강하게 결합하는 상속과 다르게 인터페이스를 통해 약하게 결합된다.

Movie와 DiscountPolicy와 같은 관계를 말할 수 있다.

그렇다고 상속은 무조건 지양해야 하고, 합성을 지향해야 하는 것은 아니다.

DiscountPolicy와 그 아래 자식들 혹은 DiscountCondition과 그 아래 자식들 이 관계는 상속의 관계이다.

**이처럼 코드를 재사용하는 경우에는 상속보다는 합성을 선호하는 것이 옳지만, 다형성을 위해 인터페이스를 재사용하는 경우에는 상속과 합성을 적절히 조합하여 사용하는 것이 좋다.**