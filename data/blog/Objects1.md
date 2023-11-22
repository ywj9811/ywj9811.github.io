---
title: 오브젝트 Chap1
date: '2023-11-16'
tags: ['JAVA', '스터디', '기술서적', '오브젝트']
draft: false
summary: 오브젝트 Java 챕터1 객체, 설계
---
### 들어가며

로버트 L.글래스 는 ‘이론 대 실무’ 라는 흥미로운 주제에 관한 개인적인 견해로, 이론보다 실무가 먼저라고 했다. 여느 다른 공학 분야에 비해 상대적으로 짧은 소프트웨어 분야의 역사를 감안했을 때 글래스가 우리에게 전하고자 하는 메시지는, 소프트웨어 분야는 아직 걸음마 단계에 머물러 있기 때문에 이론보다 실무가 더 앞서 있으며 실무가 더 중요하다는 것이다.

이에대한 대표적인 분야로 ‘소프트웨어 설계’와 ‘소프트웨어 유지보수’ 를 들 수 있다.

따라서 우리는 훌륭한 객체지향 프로그램을 설계하고 유지보수하는 데 필요한 원칙과 기법을 살펴보도록 할 것이다.

## 티켓 판매 어플리케이션 구현하기

예를 들어서 추첨을 통해서 무료로 무대를 관람할 수 있는 초대장을 나눠주었다고 가정해보자.

우선, 이벤트에 당첨된 관람객과 그러지 못한 관람객은 다른 방식으로 입장시켜야 할 것이다.

- 이벤트에 당첨된 관람객은 초대장을 티켓으로 교환하고 입장할 수 있다.
- 이벤트에 당첨되지 못한 관람객은 티켓을 구매해야 입장할 수 있다.

먼저 이벤트 당첨자에게 발송되는 초대장을 구현하자.

```java
public class Invitation {
	private LocalDateTime when;
}
```

이렇게 Invitation 이라는 초대장 클래스는 초대일자를 인스턴스 변수로 포함하는 간단한 클래스일 것이다.

```java
public class Ticket {
	private Long fee;

	public Long getFee() {
		return fee;
	}
}
```

공연을 관람학 위한 모든 사람들은 티켓을 소지하고 있어야만 하니 Ticket 클래스를 추가한다.

이벤트 당첨자는 티켓을 교환할 초대장을 가지고 있을 것이고, 이벤트에 당첨되지 못한 관람객은 티켓을 구매할 수 있는 현금을 가지고 있을 것이다.

따라서 관람객은

- 초대장
- 현금
- 티켓

이렇게 3가지의 소지품만 가질 수 있다고 가정하자.

```java
public class Bag {
    private Long amount;
    private Invitation invitation;
    private Ticket ticket;

    public boolean hasInvitation() {
        return invitation != null;
    }

    public boolean hasTicket() {
        return ticket != null;
    }

    public void setTicket(Ticket ticket) {
        this.ticket = ticket;
    }

    public void minusAmount(Long amount) {
        this.amount -= amount;
    }

    public void plusAmount(Long amount) {
        this.amount += amount;
    }
}
```

그러면 이렇게 관람객의 소지품을 나타낼 수 있는 Bag이라는 클래스를 만들 수 있다.

여기는 초대장의 유무, 티켓의 유무, 현금을 증가 혹은 감소, 초대장을 티켓으로 교환을 판단하거나 수행할 수 있는 메소드가 존재한다.

이때 Bag 인스턴스의 상태는

1. 현금과 초대장을 함께 보관
2. 초대장 없이 현금만 보관

이렇게 두가지 상태일 것이다.

```java
    public Bag(long amount) {
        this(null, amount);
    }

    public Bag(Invitation invitation, long amount) {
        this.invitation = invitation;
        this.amount = amount;
    }
```

이렇게 제약조건을 강제할 수 있는 생성자를 추가할 수 있다.

이번에는 관람객을 나타낼 수 있는 Audience 클래스를 살펴보자.

```java
public class Audience {
    private Bag bag;

    public Audience(Bag bag) {
        this.bag = bag;
    }

    public Bag getBag() {
        return bag;
    }
}
```

이렇게 관람객은 Bag을 소유할 수 있을 것이다.

이제는 TicketOffice 클래스, 매표소를 살펴보자.

```java
public class TicketOffice {
    private Long amount;
    private List<Ticket> tickets = new ArrayList<>();

    public TicketOffice(Long amount, Ticket ... tickets) {
        this.amount = amount;
        this.tickets.addAll(Arrays.asList(tickets));
    }

    public Ticket getTicket() {
        return tickets.remove(0);
    }

    public void minusAmount(Long amount) {
        this.amount -= amount;
    }

    public void plusAmount(Long amount) {
        this.amount += amount;
    }
}
```

매표소는 판매할 티켓과 판매 금액이 보관되어 있는데, Ticket의 리스트인 tickets와 총 판매금액인 amount를 인스턴스 변수로 가진다.

이어서 TicketSeller 클래스, 판매원을 살펴보자.

```java
public class TicketSeller {
    private TicketOffice ticketOffice;

    public TicketSeller(TicketOffice ticketOffice) {
        this.ticketOffice = ticketOffice;
    }

    public TicketOffice getTicketOffice() {
        return ticketOffice;
    }
}
```

판매원은 매표소에서 초대장을 티켓으로 교환해주거나 티켓을 판매하는 역할을 수행하며, 판매원은 자신이 일하는 매표소(TicketOffice) 를 알고 있어야 한다.

마지막으로 소극장을 구현하는 Theater 클래스를 살펴보자.

```java
public class Theater {
    private TicketSeller ticketSeller;

    public Theater(TicketSeller ticketSeller) {
        this.ticketSeller = ticketSeller;
    }

    public void enter(Audience audience) {
        if (audience.getBag().hasInvitation()) {
            Ticket ticket = ticketSeller.getTicketOffice().getTicket();
            audience.getBag().setTicket(ticket);
        } else {
            Ticket ticket = ticketSeller.getTicketOffice().getTicket();
            audience.getBag().minusAmount(ticket.getFee());
            ticketSeller.getTicketOffice().plusAmount(ticket.getFee());
            audience.getBag().setTicket(ticket);
        }
    }
}
```

`enter()` 를 통해 관람객을 맞이하는데, 가방 안에 초대장이 들어 있는지 확인 후 있다면 초대장을 가방 안에 넣어준다.

만약 없다면, 가방에서 돈을 빼고 매표소에 그만큼의 돈을 올린 후 티켓을 넣어준다.

여기까지 작성된 프로그램을 보자.

**간단하고 예상대로 동작된다. 하지만, 이 작은 프로그램은 몇가지 문제를 가지고 있다.**

### 무엇이 문제인가

로버트 마틴에 따르면 소프트웨어 모듈은 세가지 기능을 가져야 한다고 한다.

> 여기서 모듈이란, 크기와 상관 없이 클래스나 패키지, 라이브러리와 같이 프로그램을 구성하는 임의의 요소를 의미한다.
> 
1. 모든 모듈은 제대로 실행되어야 한다.
2. 모든 모듈은 변경이 용이해야 한다.
3. 코드를 읽는 사람이 이해를 쉽게 해야 한다.

하지만, 우리의 작은 프로그램은 1번 외에 2,3을 만족시키지 못한다.

### 예상을 빗나가는 코드

무엇이 문제일까. 그것은 관람객과 판매원이 소극장의 통제를 받는 수동적인 존재라는 점이다.

우선, 관람객의 입장에서 바라보면 소극장이라는 제3자가 초대장을 확인하기 위해 마음대로 가방을 열어보고, 돈을 가져가고 티켓을 넣어버린다. 이것이 정상적인가?

혹은, 판매원의 입장에서 바라봐도 소극장이 판매원의 허락 없이 매표소에 보관중인 티켓과 현금에 마음대로 접근할 수 있고, 심지어는 돈을 빼고 넣고를 소극장이 수행한다.

**이제 다시 한번 생각해보자. 이 코드가 우리의 예상에서 벗어나지 않는 코드인가? 아니다. 말이 안되는 일이 일어는 코드이다.**

또 다른 문제도 있다.

바로 코드를 이해하기 위해서는 여러가지 세부적인 내용들을 한꺼번에 기억하고 있어야 한다는 점이다.

**즉, 하나의 클래스나 메소드에서 너무 많은 세부사항을 다루기 때문에 코드를 작성하는 사람 뿐만 아니라 읽는 사람에게도 너무 큰 부담을 준다.**

더 심각한 문제도 있다.

**Audience와 TicketSeller에 수정이 생긴다면 Theater도 함께 변경되어야 한다는 것이다.**

### 변경에 취약한 코드

만약 관람객이 가방을 들고 다닐 것이라는 가정이 깨진다면 어떻게 될까?

우선, Audience에 Bag을 제거해야 할 것이다. 그렇다면 Theater의 enter 또한 수정되어야 할 것이다.

이렇게 Theater가 관람객이 가방을 들고 있고 판매원이 매표소에서만 티켓을 판매한다는 사실에 의존하듯 지나치게 세부적인 사실에 의존하는 경우 하나라도 수정되면 이 클래스에 의존하는 다른 클래스까지 함께 변경되어야 한다.

이것은 객체 사이의 의존성과 관련된 문제로, 의존성이라는 말 속에는 어떤 객체가 변경될 때 그 객체에게 의존하는 다른 객체도 함게 변경될 수 있다는 사실이 내포되어 있다.

**이렇게 객체 사이의 의존성이 과한 경우를 ‘결합도가 높다’** 라고 말하며 두 객체 사이의 결합도가 높으면 높을수록 함께 변경될 확률이 높아지기 때문에 불필요한 의존성을 제거하는 것이 좋다.

## 설계 개선하기

우선 문제는 Theater가 괌람객의 가방과 판매원의 매표소에 직접 접근한다는 문제가 있었다.

이는 Theater가 Audience와 TicketSeller와 결합된다는 것을 의미한다.

**이를 해결하기 위해서는 관람객과 판매원을 자율적인 존재로 만들면 된다.**

### 자율성을 높이자.

Audience와 TicketSeller 각각 Bag과 TicketOffice를 처리할 수 있도록 하여 자율적인 존재가 되도록 설계를 변경할 것이다.

```java
public class Audience {
    private Bag bag;

    public Audience(Bag bag) {
        this.bag = bag;
    }

    public Long buy(Ticket ticket) {
        if (bag.hasInvitation()) {
            bag.setTicket(ticket);
            return 0L;
        } else {
            bag.setTicket(ticket);
            bag.minusAmount(ticket.getFee());
            return ticket.getFee();
        }
    }
}
```

이렇게 Audience가 스스로 가방에서 초대장의 유무를 확인하고, 티켓으로 교환하거나 돈을 지불하고 티켓을 받을 수 있도록 하는 것이다.

```java
public class TicketSeller {
    private TicketOffice ticketOffice;

    public TicketSeller(TicketOffice ticketOffice) {
        this.ticketOffice = ticketOffice;
    }

    public void sellTo(Audience audience) {
        ticketOffice.plusAmount(audience.buy(ticketOffice.getTicket()));
    }
}
```

또한 TicketSeller는 이제 직접 TicketOffice에서 티켓을 가져오고 돈을 증가시킬 수 있다.

즉, 두 클래스 모두 Bag과 TicketOffice가 private로 밖에서 접근이 안되기에 Bag에 대한 접근은 오직 Audience가, TicketOffice에 대한 접근은 TicketSeller만이 할 수 있고 스스로 수행할 수 밖에 없다.

**이러한 개념적이나 물리적으로 객체 내부의 세부사항을 감추는 것을 캡슐화라고 부른다.**

캡슐화를 통해 변경하기 쉬운 객체를 만들 수 있고 결합도를 낮출 수 있다.

```java
public class Theater {
    private TicketSeller ticketSeller;

    public Theater(TicketSeller ticketSeller) {
        this.ticketSeller = ticketSeller;
    }

    public void enter(Audience audience) {
        ticketSeller.sellTo(audience);
    }
}
```

이렇게 Theater가 다른 클래스들과 긴밀하게 결합되어 있지 않은 모습을 확인할 수 있다.

**또한 Theater과 TicketSeller는 인터페이스에만 의존하는데, TicketSeller가 TicketOffice를 포함하고 있다는 사실은 구현의 영역에 속하기에 알 수 없고, 이러한 인터페이스만을 공개하는 것은 객체 사이의 결합도를 낮추고 변경하기 쉬운 코드를 작성하기 위해 따라야 하는 기본적인 설계 원칙이다.**

지금까지 개선된 코드를 보면, 이전과 달리 자신들의 내부 구현을 외부에 노출하지 않고 자신의 문제를 스스로 책임지고 해결하는 자율적인 존재가 되었다는 것이다.

### 캡슐화와 응집도

핵심은 객체 내부의 상태를 캡슐화하고 객체간에 오직 메시지를 통해서만 상호작용 하도록 만드는 것이다.

즉, Theater는 TicketSeller의 내부를 모르고, sellTo 메시지를 이해하고 응답하는 것과 같은 것이다.

밀접하게 연관된 작업만을 수행하고 연관성 없는 작업은 다른 객체에게 위임하는 객체를 가리켜 **응집도가** 높다고 한다. 따라서 **자율적인 객체를 만들면 결합도를 낮추고 응집도를 높일 수 있다.**

### 절차지향과 객체지향

우선, 처음에 작성한 코드를 살펴보면 Theater의 enter 메소드 안에서 Audience와 TicketSeller로 부터 Bag과 TicketOffice를 가져와 관람객을 입장시키는 절차를 구현했다.

이때 Theater의 enter 메소느는 Process, Audience와 TicketSeller, Bag, TicketOffice 이것들은 Data이다.

**이렇게 Process와 Data를 별도의 모듈에 위치시키는 방식을 절차적 프로그래밍이라고 한다.**

이후에 작성한 코드를 살펴보면 자신의 Data를 스스로 처리할 수 있도록 Process의 적절한 단계를 Audience와 TicketSeller로 이동시켰는데, 이렇게 Data를 사용하는 Process가 Data를 소유하고 있는 Audience와 TicketSeller 내부로 옮겨진 것을 확인할 수 있다.

**이렇게 Data와 Process가 동일한 모듈 내부에 위치시키는 방식을 객체지향 프로그래밍이라고 한다.**

### 책임의 이동

두 방식의 근본적인 차이를 만드는 것은 책임의 이동이다.

> 책임이란, 기능을 가리키는 객체지향 세계의 용어로 생각해도 무방하다.
> 

**절차적 프로그래밍 방식으로 작성된 경우 Theater로 작업의 흐름이 집중되는 즉, 책임이 Theater에 집중되어 있는 것이다.**

반면에

**객체지향 설계에서는 각 객체가 자신의 일을 스스로 처리하여 집중되어 있던 책임이 개별 객체로 이동한 것이다. 이것이 책임의 이동이다.**

## 추가 개선

우리는 객체를 자기 자신을 스스로 책임지는 자율적인 존재로 만들어야 한다고 했다.

<aside>
🤔 물론, 이는 현실에서 바라보는 세상의 직관과 일치하게 짜면 좋다고 했던 사실과 약간 맞지 않다.
왜냐하면 Theater와 Bag, TicketOffice는 사실 현실에서 능동적인 존재가 아니기 때문이다.
하지만 객체지향의 세계에서는 모든 것들이 능동적이고 자율적인 존재로 바뀐다.
이것이 - 의인화 - 이다.

</aside>

하지만, Bag과 TicketOffice를 살펴보면 여전히 Audience에게 그리고 TicketSeller에게 끌려다니는 모습을 확인할 수 있다.

따라서 이를 다음과 같이 수정할 수 있을 것이다.

```java
public class Bag {
    private Long amount;
    private Ticket ticket;
    private Invitation invitation;

    public Long hold(Ticket ticket) {
        if (hasInvitation()) {
            setTicket(ticket);
            return 0L;
        } else {
            setTicket(ticket);
            minusAmount(ticket.getFee());
            return ticket.getFee();
        }
    }

    private void setTicket(Ticket ticket) {
        this.ticket = ticket;
    }

    private boolean hasInvitation() {
        return invitation != null;
    }

    private void minusAmount(Long amount) {
        this.amount -= amount;
    }
}
```

이렇게 Bag이 스스로 자신의 돈과 티켓 여부 등을 확인할 수 있도록 개선하고

```java
public class Audience {
    private Bag bag;

    public Audience(Bag bag) {
        this.bag = bag;
    }

    public Long buy(Ticket ticket) {
        return bag.hold(ticket);
    }
}
```

Audience는 단순히 메시지로 주고받을 수 있다.

```java
public class TicketOffice {
    private Long amount;
    private List<Ticket> tickets = new ArrayList<>();

    public TicketOffice(Long amount, Ticket... tickets) {
        this.amount = amount;
        this.tickets.addAll(Arrays.asList(tickets));
    }

    public void sellTicketTo(Audience audience) {
        plusAmount(audience.buy(getTicket()));
    }

    private Ticket getTicket() {
        return tickets.remove(0);
    }

    private void plusAmount(Long amount) {
        this.amount += amount;
    }
}
```

이렇게 TicketOffice가 자신의 Ticket을 줄이고, 돈을 올릴 수 있다.

```java
public class TicketSeller {
    private TicketOffice ticketOffice;

    public TicketSeller(TicketOffice ticketOffice) {
        this.ticketOffice = ticketOffice;
    }

    public void sellTo(Audience audience) {
        ticketOffice.sellTicketTo(audience);
    }
}
```

TicketSeller는 마찬가지로 단순히 메시지로 주고받을 수 있다.

**하지만, 만족스럽지 못한 결과를 가져오고 말았다.**

**왜냐하면 TicketOffice와 Audience 사이에 의존성이 추가되었기 때문이다.**

변경하기 이전에는 TicketOffice는 Audience의 존재를 몰라도 됐다. 하지만 이제 TicketOffice가 Audience에게 직접 티켓을 판매하기 때문에 Audience에 대해서 알고있어야 하기 때문이다.

즉, TicketOffice의 자율성은 높였지만 전체 설계의 결합도가 올라간 것이다.

### 트레이드 오프

이는 트레이드 오프의 시점이 다가온 것이다.

어떻게 하는 것이 좋을까. 개발팀은 TicketOffice의 자율성 보다는 Audience에 대한 결합도를 낮추는 것이 더 중요하다는 결론을 내리게 되었고, 이 부분은 되돌리게 되었다.

여기서 두가지를 알 수 있다.

1. 어떤 기능을 설계하는 방법은 한가지 이상일 수 있다.
2. 동일한 기능을 한가지 이상의 방법으로 설계할 수 있기 때문에 결국 설계는 트레이드 오프의 산물이다.

## 객체지향 설계

### 설계가 왜 필요한가

> 설계란 코드를 배치하는 것이다. [Metz12]
> 

좋은 설계란 무엇이고 왜 우리는 이게 필요할까?

우리는 오늘 완성해야 하는 기능을 구현하는 코드를 짜야하는 동시에 내일 쉽게 변경할 수 있는 코드를 짜야한다. 즉, 좋은 설계란 오늘 요구하는 기능을 온전히 수행하면서 내일의 변경을 매끄럽게 수용할 수 있는 설계이다.

그리고 이러한 설계는 코드를 변경할 때 버그가 추가될 가능성이 높기 때문에 중요하기도 하다.

왜냐하면 요구사항은 항상 변경되고 따라서 코드도 항상 변경될 가능성이 높기 때문이다.

### 객체지향 설계에 대해

우리가 원하는 코드는 변경에 유연하게 대응할 수 있는 코드인데, 객체지향 프로그래밍은 의존성을 효율적으로 통제할 수 있는 다양한 방법을 제공함으로써 요구사항 변경에 좀 더 수월하게 대응할 수 있는 가능성을 높여준다.

우리는 어플리케이션의 기능을 구현하기 위해 객체들이 협력하는 과정 속에서 의존성을 만들게 되는데, 훌륭한 객체지향 설계란 이러한 의존성을 적절하게 관리하는 설계이다.