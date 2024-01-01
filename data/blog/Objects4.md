---
title: 오브젝트 Chap4
date: '2023-12-09'
tags: ['JAVA', '스터디', '기술서적', '오브젝트']
draft: false
summary: 오브젝트 Java 챕터4 설계 품질과 트레이드 오프
---
**앞장까지 설명한 것과 같이 책임이 객체지향 어플리케이션 전체의 품질을 결정하는 것이다.**

이번 장에서는 이전의 어플리케이션을 책임이 아닌 상태를 표현하는 데이터 중심의 설계를 살펴보고 객체지향적으로 설계한 구조와 어떠한 차이가 있는지 살펴볼 것이다.

## 데이터 중심의 영화 예매 시스템

책임 중심의 관점에서는 객체가 다른 객체가 요청할 수 있는 오퍼레이션을 위해 필요한 상태를 보관했지만, 데이터 중심의 관점에서는 객체의 상태에 초점을 맞추고 책임 중심의 고나점은 객체의 행동에 초점을 맞춘다.

### 데이터 준비

```java
public class Movie {
    private String title;
    private Duration runningTime;
    private Money fee;
    private List<DiscountCondition> discountConditions;

    private MovieType movieType;
    private Money discountAmount;
    private double discountPercent;
}
```

이렇게 하게 되면 할인 조건의 목록이 인스턴스 변수로 Movie안에 직접 포함되어 있게 된다.

```java
public enum MovieType {
		ACCOUNT_DISCOUNT,
		PERCENT_DISCOUNT,
		NONE_DISCOUNT
}
```

그리고 이와 같은 MovieType 인스턴스가 들어가게 된다.

이는 말 그대로 데이터 중심의 접근 방법이다.

즉, 객체의 책임을 결정하기 전에 어떤 데이터가 포함되어야 하는지 생각하며 진행한 것이다.

그리고 이에 대한 `setter` , `getter` 를 통해서 데이터를 캡슐화하고 접근할 수 있도록 해주었다고 하자.

```java
public class DiscountCondition {
    private DiscountConditionType type;

    private int sequence;

    private DayOfWeek dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
}
```

```java
public enum DiscountConditionType {
    SEQUENCE,       // 순번조건
    PERIOD          // 기간 조건
}
```

이런식으로 할인 조건을 구현하는데 필요한 데이터 준비도 한다.

이때도 캡슐화 원칙을 지키기 위해 private로 하였고, 접근자와 수정자를 만들어 주었다.

```java
public class Screening {
		private Movie movie;
		private int sequence;
		private LocalDateTime whenScreened;
}
```

이렇게 Screening 또한 데이터를 준비해주고, 영화를 예매하기 위한 Reservation 클래스도 만들어준다.

```java
public class Reservation {
		private Customer customer;
		private Screening screening;
		private Money fee;
		private int audienceCount;
}
```

```java
public class Customer {
		private String name;
		private String id;
}
```

이렇게 영화 예매 시스템을 위해 필요한 모든 데이터를 클래스로 구현했다.

이러한 과정 속에서 모두 내부에 접근자와 수정자가  있다고 하자.

### 영화 예매하기

```java
public class ReservationAgency {
    public Reservation reserve(Screening screening, Customer customer,
                               int audienceCount) {
        Movie movie = screening.getMovie();

        boolean discountable = false;
        for(DiscountCondition condition : movie.getDiscountConditions()) {
            if (condition.getType() == DiscountConditionType.PERIOD) {
                discountable = screening.getWhenScreened().getDayOfWeek().equals(condition.getDayOfWeek()) &&
                        condition.getStartTime().compareTo(screening.getWhenScreened().toLocalTime()) <= 0 &&
                        condition.getEndTime().compareTo(screening.getWhenScreened().toLocalTime()) >= 0;
            } else {
                discountable = condition.getSequence() == screening.getSequence();
            }

            if (discountable) {
                break;
            }
        }

        Money fee;
        if (discountable) {
            Money discountAmount = Money.ZERO;
            switch(movie.getMovieType()) {
                case AMOUNT_DISCOUNT:
                    discountAmount = movie.getDiscountAmount();
                    break;
                case PERCENT_DISCOUNT:
                    discountAmount = movie.getFee().times(movie.getDiscountPercent());
                    break;
                case NONE_DISCOUNT:
                    discountAmount = Money.ZERO;
                    break;
            }

            fee = movie.getFee().minus(discountAmount).times(audienceCount);
        } else {
            fee = movie.getFee().times(audienceCount);
        }

        return new Reservation(customer, screening, fee, audienceCount);
    }
}
```

이렇게 예매 절차를 구현해보자.

이때 `reserve` 메소드를 크게 두 부분으로 나눌 수 있다. 첫번째는 **DiscountCondition**에 대해 루프를 돌면서 할인 가능 여부를 확인하는 for문이고, 두번째는 **discountable** 변수의 값을 체크하고 적절한 할인 정책에 따라 예매 요금을 계산하는 if문이다.

또한 할인 요금을 계산하기 위해서는 할인 정책의 타입에 따라 할인 요금을 계산하는 로직을 분기해야 한다.

## 설계 트레이드 오프

### 캡슐화

상태와 행동을 하나의 객체 안에 모으는 이유는 객체의 내부 구현을 외부로부터 감추기 위한 것이다.

변경될 가능성이 높은 부분을 구현이라고 부르고 상대적으로 안정적인 부분을 인터페이스라고 부른다.

이렇게 캡슐화를 하면 구현과 인터페이스를 구분하고 외부에서는 인터페이스에만 의존하여 변경에 영향을 받지 않도록 해준다.

따라서 캡슐화는 객체지향의 핵심이다.

### 응집도와 결합도

응집도는 변경이 발생할 때 모듈 내부에서 발생하는 변경의 정도로 측정되는데 즉, **모듈 내의 요소들이 하나의 목적을 위해 긴밀하게 협력하는가** 이다.

결합도는 한 모듈이 변경되기 위해서 다른 모듈의 변경을 요구하는 정도로 측정할 수 있는데, **의존성 정도를 나타내면서 다른 모듈에 대해 얼마나 많은 지식을 갖고 있는가** 이다.

따라서 우리는 높은 응집도와 낮은 결합도를 가질 수 있도록 설계해야 한다.

또한 캡슐화의 정도가 응집도와 결합도에 영향을 미친다는 사실을 강조한다. 캡슐화를 지키면 응집도는 높아지고 결합도는 낮아지게 된다.

## 데이터 중심의 영화 예매 시스템의 문제점

캡슐화, 응집도, 결합도 이 세가지 척도를 이용해서 평가를 해보도록 하자.

근본적으로 책임 중심의 방식과 데이터 중심의 방식은 캡슐화를 다루는 방식이 다르다.

즉, 데이터 중심의 방식은 캡슐화를 위반하고 객체의 내부 구현을 인터페이스의 일부로 만든다.

따라서 3가지 문제를 가진다.

1. 캡슐화 위반
2. 높은 결합도
3. 낮은 응집도

### 캡슐화 위반

Movie클래스를 생각해보면 오직 메소드를 통해서만 객체의 내부 상태에 접근할 수 있다.

예를 들면 fee 를 읽기 위해서 혹은 수정하기 위해서는 `getFee()` 혹은 `setFee()` 를 사용해야만 한다.

어떻게 보면 이는 캡슐화를 지키고 있는 것 처럼 보인다. 하지만 이는 Movie 내부에 Money 타입의 fee라는 변수가 있다는 사실을 퍼블릭 인터페이스에 노골적으로 드러낸다.

### 높은 결합도

캡슐화를 위반한다는 사실 이외에 객체의 내부 구현을 변경하면 인터페이스에 의존하는 모든 클라이언트들도 함께 변경해야 한다는 더욱 나쁜 사실이 있다.

예를 들어 이전의 ReservationAgency 코드를 보면 한 명의 예매 요금을 계산하기 위해서 Movie의 `getFee()` 메소드를 호출해 계산된 결과를 Money 타입의 fee에 저장하고 있다.

이때 만약 fee의 타입을 변경하게 된다면 `getFee()` 의 반환 타입 또한 변경될 것이다. 그렇게 된다면 ReservationAgency의 구현도 함께 수정해야 할 것이다.

이러한 현상은 fee를 정상적으로 캡슐화 하지 못한 것이다. 즉, 클라이언트가 객체의 구현에 강하게 결합된다.

또 다른 단점은 데이터 객체들을 사용하는 제어 로직이 특정 객체 안에 집중되기 때문에 하나의 제어 객체가 다수의 데이터 객체에 강하게 결합된다는 것이다.

ReservationAgency를 살펴보면 DiscountPolicy부터 Screening 등등 모든 의존성이 모이게 된다.

**즉, 시스템 안의 어떤 변경도 ReservationAgency의 변경을 유발하게 된다.**

### 낮은 응집도

위에서 살펴본바와 같이 ReservationAgency는 거의 모든 변경에 따라서 변경이 이루어져야 한다.

이렇게 하나의 변경을 위해서 여러 클래스를 동시에 수정해야 한다는 것은 낮은 응집도를 의미한다.

## 자율적인 객체를 향해

```java
class Rectangle {
		private int left;
		private int top;
		private int right;
		private int bottom;
}
```

이렇게 클래스가 존재하고 접근자와 수정자가 있을 때 너비와 높이를 증가시키기 위한 코드를 추가하고자 한다고 가정하자.

그렇다면 아마 아래와 같이 구현되어 있을 것이다.

```java
class AnyClass {
		void anyMethod(Rectangle rec, int multiple) {
				rec.setRight(rec.getRight() * multiple);
				rec.setBottom(rec.getBottom() * multiple);
				...
		}
}
```

하지만 이 경우 인스턴스 변수의 존재 사실을 인터페이스를 통해 외부로 노출되게 된다.

이를 해결하기 위해서는 캡슐화를 강화시키는 것이다.

즉, Rectangle 내부에 너비와 높이를 조절하는 로직을 캡슐화하는 것이다.

```java
class Rectangle {
		...
		public void enlarge(int multiple) {
				right *= multiple;
				bottom *= multiple;
		}
}
```

이렇게 하면 Rectangle을 변경하는 주체를 외부에서 Rectangle로 이동시켰다.

**즉, 자신의 크기를 자신이 증가시키도록 ‘책임을 이동’ 시킨 것이다.**

이것이 바로 객체가 자기 스스로를 책임진다는 말의 의미이다.

### 스스로 자신의 데이터를 책임지는 객체

우리는 위의 방식을 기존의 데이터 중심의 설계 방식에 적용을 하고자 할 수 있다.

그렇게 한다면 데이터를 처리하는 데 필요한 메소드를 데이터를 가지고 있는 객체 스스로 구현하고 있게 되기에 객체들을 스스로를 책임진다고 할 수 있을 것이다.

### 하지만 여전히 부족하다…

그렇지만 기존에 발생하던 문제는 대부분이 그대로 발생하게 될 것이다.

이유를 살펴보자.

### 캡슐화 위반

자기 스스로를 책임질 수 있도록 하였음에도 불구하고 내부의 정보를 파라미터를 받고 있으며, 접근자를 통해 내부의 정보 또한 노출시키기 때문이다.

이러한 영향으로 내부의 수정은 해당 메소드를 사용하는 모든 클라이언트의 수정으로 퍼지게 될 것이다.

**이렇게 내부의 변경이 외부로 퍼져나가는 파급 효과는 캡슐화가 부족하다는 명백한 증거이다.**

### 높은 결합도

캡슐화 위반으로 인해 내부 구현이 외부로 노출됐기 때문에 결합도는 높아질 수 밖에 없다.

이렇듯 인터페이스를 변경하는 것이 아닌, ‘구현’을 변경하는 경우에도 외부에 수정을 요구하게 되는 경우를 결합도가 높다고 한다.

이러한 일은 우선적으로 캡슐화를 지키지 못했기 때문이다.

### 낮은 응집도

높은 결합도와 마찬가지로 하나의 변경을 수용하기 위해서 코드의 여러 곳을 동시에 변경해야 한다는 것은 설계의 응집도가 낮다는 증거이다.

## 데이터 중심 설계의 문제점

우선, 이번에 변경에 유연하지 못했던 이유는 캡슐화를 위반했기 때문이다.

### 데이터 중심 설계는 객체의 행동보다는 상태에 초점을 맞춘다

데이터 중심의 설계를 시작할 때 던졌던 첫 질문은 “이 객체가 포함해야 하는 데이터가 무엇인가?” 이다.

데이터는 구현의 일부라는 사실을 명심하자. 데이터 주도 설계는 설계를 시작하는 시점부터 데이터에 관해 결정하도록 강요하기 때문에 너무 이른 시점에 내부 구현에 초점을 맞추게 한다.

### 데이터 중심 설계는 객체를 고립시킨 채 오퍼레이션을 정의하도록 만든다.

올바른 객체지향 설계의 무게 중심은 항상 객체의 내부가 아니라 외부에 맞춰져 있어야 한다.

객체가 내부에 어떤 상태를 가지고 그 상태를 어떻게 관리하는가는 부가적인 문제다.

중요한 것은 다른 객체와 협력하는 방식이라는 것을 명심하도록 하자.