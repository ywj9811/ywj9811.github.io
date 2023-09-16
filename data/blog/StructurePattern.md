---
title: 구조 패턴(Structure-Pattern) 종류
date: '2023-09-16'
tags: ['Design-Pattern']
draft: false
summary: 구조 패턴(Structure-Pattern)의 종류와 특징에 대해서 알아보자
---

## 1. Adapter Pattern (어댑터 패턴)

- 어댑터 패턴이란?
    
    어댑터 패턴이란 말 그대로 어댑터처럼 사용되는 패턴이다.
    
    실생활에서 어댑터는 한국의 220V를 사용하는 한국의 기기를 어댑터를 통해 110V로 사용할 수 있게 해주는 것이 있다.
    
    **이와 같이, 호환성이 없는 인터페이스 때문에 함께 동작할 수 없는 클래스들이 함께 동작할 수 있도록 해주는 패턴이 어댑터 패턴이다.**
    
    따라서 이를 위한 어댑터 역할을 하는 클래스를 새로 만들어야 한다.
    
    기존의 시스템에 새로운 써드파티 라이브러리가 추가되거나 레거시 인터페이스를 새로운 인터페이스로 교체하는 경우에 코드의 재사용성을 높일 수 있는 방법이 어댑터 패턴을 사용하는 것이다.
    

### 어댑터 패턴 구조

어댑터 패턴에는 기존 시스템의 클래스를 상속해서 호환 작업을 해주는지, 합성해서 호환 작업을 해주는지에 따라 두가지 패턴 방법으로 나뉜다.

### Object Adapter (객체 어댑터)

- 합성된 멤버에게 위임을 이용한 어댑터 패턴
- 자기가 해야 할 일을 클래스 멤버 객체의 메소드에게 다시 시킴으로써 목적을 달성하는 것을 위임이라 한다.
- 합성을 활용하였기 때문에 런타임 중에 Adaptee(Service)가 결정되어 유연하다.
- 하지만 Adaptee(Service) 객체를 필드 변수로 저장해야 되기 때문에 공간 차지 비용이 든다.

![Untitled](/static/images/dp/sdp1.png)

- Adaptee(Service) : 어댑터 대상 객체
    
    → 기존 시스템 / 외부 시스템 / 써드파티 라이브러리
    
- Target(Clinet Interface) : Adpater가 구현하는 인터페이스
- Adapter : Client와 Adaptee(Service) 중간에서 호환성이 없는 둘을 연결시켜주는 역할
    
    → Object Adapter 방식에서는 합성을 이용해 구성한다.
    
    → Adaptee(Service)를 따로 클래스 멤버로 설정하고 위임을 통해 동작을 매치시킨다.
    
- Client : 기존 시스템을 어댑터를 통해 이용하려는 쪽
    
    → Adapter를 통하여 Service를 이용할 수 있게 된다.
    

### 예시

```java
// Adaptee : 클라이언트에서 사용하고 싶은 기존의 서비스 (하지만 호환이 안되서 바로 사용 불가능)
class Service {
    void specificMethod(int specialData) {
        System.out.println("기존 서비스 기능 호출 + " + specialData);
    }
}
```

```java
// Client Interface : 클라이언트가 접근해서 사용할 고수준의 어댑터 모듈
interface Target {
    void method(int data);
}

// Adapter : Adaptee 서비스를 클라이언트에서 사용하게 할 수 있도록 호환 처리 해주는 어댑터
class Adapter implements Target {
    Service adaptee; // composition으로 Service 객체를 클래스 필드로

    // 어댑터가 인스턴스화되면 호환시킬 기존 서비스를 설정
    Adapter(Service adaptee) {
        this.adaptee = adaptee;
    }

    // 어댑터의 메소드가 호출되면, Adaptee의 메소드를 호출하도록
    public void method(int data) {
        adaptee.specificMethod(data); // 위임
    }
}
```

```java
class Client {
    public static void main(String[] args) {
        // 1. 어댑터 생성 (기존 서비스를 인자로 받아 호환 작업 처리)
        Target adapter = new Adapter(new Service());

        // 2. Client Interfac의 스펙에 따라 메소드를 실행하면 기존 서비스의 메소드가 실행된다.
        adapter.method(1);
    }
}
```

결과는

‘기존 서비스 기능 호출 + 1’ 이 출력되게 될 것이다.

## Class Adapter (클래스 어댑터)

- 클래스 상속을 이용한 어댑터 패턴
- Adaptee(Service)를 상속했기 때문에 따로 객체 구현없이 바로 코드 재사용이 가능하다.
- **상속은 대표적으로 기존에 구현된 코드를 재사용하는 방식이지만, 자바에서는 다중 상속 불가 문제 때문에 전반적으로 권장하지 않는 패턴방식이다.**

![Untitled](/static/images/dp/sdp2.png)

- Adpatee(Service) : 어댑터 대상 객체. 기존 시스템 / 외부 시스템 / 써드파티 라이브러리
- Target(Client Interface) : Adpater가 구현하는 인터페이스
- Adapter : Client와 Adaptee(Service) 중간에서 호환성이 없는 둘을 연결시켜주는 역할을 담당
    - Class Adapter 방식에선 상속을 이용해 구성한다.
    - Existing Class와 Adaptee(Service)를 동시에 implements, extends하여 구현한다.
- Client : 기존 시스템을 어댑터를 통해 이용하는 클래스로 Client Interface를 통해 Service를 이용할 수 있게 된다.

## 어댑터 패턴의 장단점

### 장점

1. 프로그램의 기존 비즈니스 로직에서 인터페이스 또는 데이터 변환 코드를 분리할 수 있기 때문에 SRP(단일 책임 원칙)을 만족한다.
2. 기존 클래스 코드를 건들지 않고 클라이언트 인터페이슬르 통해 어댑터와 작동하기 때문에 개방 폐쇄 원칙(OCP)를 만족한다.
3. 만일 추가로 필요한 메소드가 있다면 어댑터에 빠르게 만들 수 있다. 만약 버그가 발생해도 기존의 클래스에는 버그가 없기 때문에 Adapter의 클래스 중심으로 조사하면 되기에 프로그램 검사 또한 쉬워진다.

### 단점

1. 새로운 인터페이스와 어댑터 클래스를 세트로 도입해야 하기 때문에 코드의 복잡성이 증가한다.
2. 때로는 직접 서비스(Adaptee) 클래스를 변경하는 것이 간단할 수 있다.

## 2. Bridge Pattern (브리지 패턴)

- 브리지 패턴이란?
    
    구현부에서 추상층을 분리하여 각자 독립적으로 변형할 수 있게 하는 패턴으로 추상적 개념과 구체적인 구현을 서로 다른 두개의 인터페이스로 구현하는 디자인 패턴이다.
    
    브리지 패턴은 캡슐화(encapsulation), 집합(aggregation)을 사용하며 다른 클래스들로 책임을 분리시키기 위해 상속(inheritance)를 사용하고 있다.
    

### 브리지 패턴 구조

![Untitled](/static/images/dp/sdp3.png)

- Abstraction : 기능 계층의 최상위 클래스이며 **추상 인터페이스를** 정의한다.
    
    Implementor에 대한 레퍼런스를 유지한다.
    
    구현 부분에 해당하는 클래스 인스턴스를 가지고 해당 인스턴스를 통해 구현부분의 메소드를 호출한다.
    
- RefinedAbstraction : Abstraction에 의해 정의된 인터페이스를 확장한다. (extends)
    
    기능 계층에서 새로운 부분을 확장한 클래스
    
- Implementor : 구현 클래스를 위한 **인터페이스를 정의**한다.
    
    이는 Abstraction의 기능을 구현하기 위한 인터페이스를 정의한다.
    
- ConcreteImplementor : Implementor 인터페이스를 구현 즉, 실제 기능을 구현한다.

### 예시

```java
// Implementor
public intercace Color {
		public void applyColor();
}

// Abstraction
public abstract class Shape {
		// Composition
		protected Color color;
		
		// constructor with implementor as input argument
		public Shape(Color c) {
				this.color = c;
		}
	
		abstract public void applyColor();
}
```

```java
//RefinedAbstraction
public Class Triangle extends Shape {
		public Triangle(Color c) {
				super(c);
		}

		@Override
		public void applyColor() {
				System.out.print("Triangle filled with color");
				color.applyColor();
		}
}

//RefinedAbstraction
public class Pentagon extends Shape {
    public Pentagon(Color c) {
        super(c);
    }

    @Override
    public void applyColor() {
        System.out.print("Pentagon filled with color");
        color.applyColor();
    }
}
```

```java
// ConcreteImplementor
public class RedColor implements Color{
    public void applyColor(){
        System.out.println("red.");
    }
}

// ConcreteImplementor
public class GreenColor implements Color{
    public void applyColor(){
        System.out.println("green.");
    }
}
```

```java
// MainClass
public class ShapeMain {
		public static void main(String[] args)) {
				Shape tri = new Triangle(new RedColor());
				tri.applyColor();
		
				Shape pent = new Pentagon(new GreenColor());
				pent.applyColor();
		}
}
```

결과로

‘Triangle filled with color red.’

‘Pentagon filled with color green.’

이렇게 출력될 것이다.

`Shape` 와 `Color` 각각 추상, 인터페이스로 정의한 후 그것을 구현한 객체들을 함께 사용하는 방식이다.

## 3. Composite Pattern (합성 패턴)

- 합성 패턴이란?
    
    객체들의 관계를 트리 구조로 구성하여 전체-부분 계층을 표현하는 패턴으로 여러 개의 객체들로 구성된 **복합 객체와 단일 객체를 클라이언트에서 구별 없이** 다루게 한다.
    
    즉, 전체-부분의 관계(ex, Dir > File)를 가지는 객체들 사이의 관계를 정의할 때 유용하다.
    

### 합성 패턴 구조

![Untitled](/static/images/dp/sdp4.png)

- Component : Leaf와 Composite를 같은 타입으로 취급하기 위한 **인터페이스**.
- Leaf : 구체적인 부분 클래스로 **단일 객체를 표현**하며 그룹의 구성원 역할을 하는데, 트리구조로 따지면 가장 밑에 있는 나뭇잎 역할을 한다.
- Composite : **복합 객체 그룹을 표현**할 클래스로 전체 클래스이다.
    
    자식으로 여러개의 Component 타입 멤버를 수용할 수 있도록 구현한다.
    

## 4. Decorator Pattern (데코레이터 패턴)

- 데코레이터 패턴이란?
    
    **객체의 결합을 통해 기능을 동적으로 유연하게 확장할 수 있게 해주는 패턴**
    
    객체에 추가적인 요건을 동적으로 첨가하여 기능 확장이 필요할 때 서브클래싱 대신쓸 수 있는 유연한 대안이 될 수 있다.
    
    즉, 기본 기능에 추가할 수 있는 기능의 종류가 많은 경우에 각 추가 기능을 Decorator 클래스로 정의한 후 필요한 Decorator 객체를 조합하여 추가 기능의 조합을 설계하는 방식이다.
    

### 데코레이터 패턴 구조

![Untitled](/static/images/dp/sdp5.png)

- Component : 원본 객체와 장식된 객체를 모두를 묶는 역할로ConcreteComponent와 Decorator가 구현할 인터페이스이다.
- ConcreteComponent : Decorate를 받을 객체로 기능 추가를 받을 기본 객체이다.
- Decorator : 추상화된 장식자 클래스
- Concrete Decorator : 구체적인 장식자 클래스로 Decorator를 상속받아 구현할 다양한 기능을 가진다.
    
    이 기능들은 ConcreteComponent에 추가하기 위해 만들어진다.
    

### 예제

```java
// 기본 객체와 장식된 객체 모두를 묶는 인터페이스
interface IComponent {
    void operation();
}

// 장식될 기본 객체
class ConcreteComponent implements IComponent {
    public void operation() {
    }
}

// 장식자 추상 클래스
abstract class Decorator implements IComponent {
    IComponent wrappee; // 기본 객체를 composition

    Decorator(IComponent component) {
        this.wrappee = component;
    }

    public void operation() {
        wrappee.operation(); // 위임
    }
}

// 장식자 클래스
class ComponentDecorator1 extends Decorator {

    ComponentDecorator1(IComponent component) {
        super(component);
    }

    public void operation() {
        super.operation(); // 기본 객체를 상위 클래스의 위임을 통해 실행하고
        extraOperation(); // 장식 클래스만의 메소드를 실행한다.
    }

    void extraOperation() {
    }
}

class ComponentDecorator2 extends Decorator {

    ComponentDecorator2(IComponent component) {
        super(component);
    }

    public void operation() {
        super.operation(); // 기본 객체를 상위 클래스의 위임을 통해 실행하고
        extraOperation(); // 장식 클래스만의 메소드를 실행한다.
    }

    void extraOperation() {
    }
}
```

```java
public class Client {
    public static void main(String[] args) {
        // 1. 기본 객체 생성
        IComponent obj = new ConcreteComponent();

        // 2. 장식 1 하기
        IComponent deco1 = new ComponentDecorator1(obj);
        deco1.operation(); // 장식된 객체의 장식된 기능 실행

        // 3. 장식 2 하기
        IComponent deco2 = new ComponentDecorator2(obj);
        deco2.operation(); // 장식된 객체의 장식된 기능 실행

        // 4. 장식 1 + 2 하기
        IComponent deco3 = new ComponentDecorator1(new ComponentDecorator2(obj));
    }
}
```

### 흐름

![Untitled](/static/images/dp/sdp6.png)

## 데코레이터 패턴의 장단점

### 장점

1. 데코레이터를 사용하면 서브클래스를 만들때보다 훨씬 더 유연하게 기능을 확장할 수 있다.
2. 객체를 여러 데코레이터로 래핑하여 여러 동작을 결합할 수 있다.
3. 컴파일 타임이 아닌 런타임에 동적으로 기능을 변경할 수 있다.
4. 각 장식자 클래스마다 고유의 책임을 가져 단일 책임 원칙(SRP)를 준수
5. 클라이언트 코드 수정없이 기능 확장을 가능하게 하여(데코레이터 클래스 추가) 개방 폐쇄 원칙(OCP)를 준수
6. 구현체가 아닌 인터페이스를 바라봄으로 의존 역전 원칙(DIP) 준수

### 단점

1. 만일 장식자 일부를 제거하고 싶을때 Wrapper 스택에서 특정 wrapper를 제거하는 것은 어렵다.
2. 데코레이터를 조합하는 초기 생성코드가 보기 안좋을 수 있다.
    
    `new A(new B(new C(new D())))`
    
3. 어느 장식자를 먼저 데코레이팅 하느냐에 따라 데코레이터 스택 순서가 결정되는데, 순서에 의존하지 않도록 데코레이터를 구현하기는 어렵다.

### 원리

Decorator 객체의 생성자로 Component를 받아서 Decorator를 이어 붙일 수 있고, super를 통해 넘어오는 Component의 operation()을 수행하기 때문이다.

추가적인 장식을 만들고자 하면 Decorator를 상속받아서 하나 더 구현하면 된다.

## 5. Facade Pattern (퍼사드 패턴)

- 퍼사드 패턴이란?
    
    Facade는 “건물의 정면”을 의미하는 단어로, 어떤 소프트웨어의 다른 **커다란 코드 부분에 대해 간략화된 인터페이스를 제공해주는 디자인 패턴**을 의미한다.
    
    퍼사드 객체는 복잡한 소프트웨어 바깥쪽의 코드가 라이브러리 안쪽 코드에 의존하는 일을 감소시켜주며 **복잡한 소프트웨어를 사용할 수 있게 간단한 인터페이스를 제공**해준다.
    
    ![Untitled](/static/images/dp/sdp7.png)

### 퍼사드 패턴 구조

![Untitled](/static/images/dp/sdp8.png)

- Facade : 서브시스템 기능을 편리하게 사용할 수 있도록 하기 위해 여러 시스템과 상호작용 하는 복잡한 로직을 재정리하여 높은 레벨의 인터페이스를 구성한다.
    
    Facade의 역할은 서브시스템의 많은 역할에 대해 ‘단순한 창구’를 하는 것이다.
    
    이를 통해 클라이언트와 서브시스템이 서로 긴밀하게 연결되지 않도록 하낟.
    
- Additional Facade : 퍼사드 클래스는 반드시 한개만 존재해야 한다는 규칙같은 것은 없다.
    
    연관 되지 않은 기능이 있다면 얼마든지 퍼사드 2세로 분리하는데, 퍼사드 2세는 다른 퍼사드에서 사용할 수도 있고 클라이언트에서 직접 접근할 수 있다.
    
- SubSystem : 수십가지 라이브러리 혹은 클래스들
- Client : 서브 시스템에 직접 접근하는 대신 Facade를 사용한다.

### 재귀적인 Facade Pattern의 적용

재귀적 퍼사드란 위에서 언급한 Additional Facade를 의미하는 것이다.

예를 들어 다수의 클래스, 다수의 패키지를 포함하는 큰 시스템에 **요소 요소 마다 Facade 패턴을 여기 저기 적용**하고 **다시 그 Facade를 합친 Facade를 만드는 식**으로, **퍼사드를 재귀적으로 구성**하면 시스템은 보다 편리하게 된다.

즉, 퍼사드는 한개만 있으라는 법이 없고 필요에 따라 얼마든지 늘려 의존 할 수 있다.

![Untitled](/static/images/dp/sdp10.png)

### 예시 (**복잡한 DMBS 시스템 간편하게 구성하기)**

데이터베이스로부터 어떤 데이터를 조회해서 출력하는 패키지가 있다.

이 패키지에는 Cache, DBMS, Row, Message 클래스가 존재한다.

그리고 아래 그림에서 볼 수 있듯이 각 행위에 대한 각 클래스들의 역할이 정해져 있다.

![Untitled](/static/images/dp/sdp11.png)

그리고 이를 사용하고 데이터베이스를 조회하고 데이터를 가공하기 까지 몇가지 규칙이 있다.

1. DBMS조회하기 위해
    1. 과거에 조회된 데이터인지 캐시에서 먼저 조사
        1. 캐시에 데이터가 있다면 이 캐시에서 데이터를 가공하고 출력
        2. 없다면 DBMS를 통해서 조회
2. 조회된 데이터를 가공하고 출력하며 동시에 캐시에 저장

라이브러리의 각 클래스는 아래와 같다.

```java
// DBMS에 저장된 데이터를 나타내는 클래스
class Row  {
    private String name;
    private String birthday;
    private String email;

    public Row(String name, String birthday, String email) {
        this.name = name;
        this.birthday = birthday;
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public String getBirthday() {
        return birthday;
    }

    public String getEmail() {
        return email;
    }
}

// 데이터베이스 역할을 하는 클래스
class DBMS {
    private HashMap<String, Row> db = new HashMap<>();

    public void put(String name, Row row) {
        db.put(name, row);
    }

    // 데이터베이스에 쿼리를 날려 결과를 받아오는 메소드
    public Row query(String name) {
        try {
            Thread.sleep(500); // DB 조회 시간을 비유하여 0.5초대기로 구현
        } catch(InterruptedException e) {}

        return db.get(name.toLowerCase());
    }
}

// DBMS에서 조회된 데이터를 임시로 담아두는 클래스 (속도 향상)
class Cache {
    private HashMap<String, Row> cache = new HashMap<>();

    public void put(Row row) {
        cache.put(row.getName(), row);
    }

    public Row get(String name) {
        return cache.get(name);
    }
}

// Row 클래스를 보기좋게 출력하는 클래스
class Message {
    private Row row;

    public Message(Row row) {
        this.row = row;
    }

    public String makeName() {
        return "Name : \"" + row.getName() + "\"";
    }

    public String makeBirthday() {
        return "Birthday : " + row.getBirthday();
    }

    public String makeEmail() {
        return "Email : " + row.getEmail();
    }
}
```

이러한 사항들을 묶은 클래스를 하나 추가해서 단순화된 인터페이스를 통해 서브 클래스를 다룸으로써 개발자의 실수를 줄이고자 하는 것이 바로 퍼사드 패턴이다.

![Untitled](/static/images/dp/sdp12.png)

```java
class Facade {
    private DBMS dbms = new DBMS();
    private Cache cache = new Cache();

    public void insert() {
        dbms.put("홍길동", new Row("홍길동", "1890-02-14", "honggildong@naver.com"));
        dbms.put("임꺽정", new Row("임꺽정", "1820-11-02", "imgguckjong@naver.com"));
        dbms.put("주몽", new Row("주몽", "710-08-27", "jumong@naver.com"));
    }

    public void run(String name) {
        Row row = cache.get(name);

        // 1. 만약 캐시에 없다면
        if (row == null){
            row = dbms.query(name); // DB에 해당 데이터를 조회해서 row에 저장하고
            if(row != null) {
                cache.put(row); // 캐시에 저장
            }
        }

        // 2. dbms.query(name)에서 조회된 값이 있으면
        if(row != null) {
            Message message = new Message(row);

            System.out.println(message.makeName());
            System.out.println(message.makeBirthday());
            System.out.println(message.makeEmail());
        }
        // 3. 조회된 값이 없으면
        else {
            System.out.println(name + " 가 데이터베이스에 존재하지 않습니다.");
        }
    }
}
```

```java
class Client {
    public static void main(String[] args) {

        // 1. 퍼사드 객체 생성
        Facade facade = new Facade();

        // 2. db 값 insert
        facade.insert();

        // 3. 퍼사드로 데이터베이스 & 캐싱 & 메세징 로직을 한번에 조회
        String name = "홍길동";
        facade.run(name);
    }
}
```

이렇게 메인의 로직은 단순하고, 핵심적인 로직은 모두 퍼사드에게 넘긴 것이다.

## 퍼사드 패턴의 장단점

### 장점

1. 하위 시스템의 복잡성에서 코드를 분리하여, 외부에서 시스템을 사용하기 쉬워진다.
2. 하위 시스템 간의 의존 관계가 많을 경우 이를 감소시키고, 의존성을 한 곳에 모을 수 있다.
3. 복잡한 코드를 감춤으로써, 클라이언트가 시스템의 코드를 모르더라도 Facade 클래스만 이해하고 사용 가능하다.

### 단점

1. 퍼사드가 앱의 모든 클래스에 결합된 God 객체가 될 수 있다.
2. 퍼사드 클래스 자체가 서브시스템에 대한 의존성을 가지게 되어 의존성을 완전히 피할 수는 없다.
3. 어찌되었던 추가적인 코드가 늘어나는 것이기 때문에 유지보수 측면에서 공수가 더 많이 들게 된다.

## 6 Flyweight Pattern (플라이웨이트 패턴)

- 플라이웨이트 패턴이란?
    
    어떤 클래스의 인스턴스 한개만 가지고 여러 가지의 ‘가상 인터페이스’ 를 제공하고 싶을 때 사용하는 패턴이다.
    
    즉, 인스턴스를 가능한대로 공유시켜 쓸데없이 new 연산자를 통한 메모리 소비를 막자는 것이다.
    
    간단히 말하면, Cache의 개념을 코드로 패턴화 한 것으로 보면 되는데, 자주 변하는 속성(extrinsit)과 변하지 않는 속성(intrinsit)을 분리하고 변하지 않는 속성을 캐시하여 재사용하는 것이다.
    

### 플라이웨이트 패턴 구조

![Untitled](/static/images/dp/sdp13.png)

- Flyweigth : 경량 객체를 묶는 인터페이스
- ConcreteFlyweight : 공유 가능하여 재사용되는 객체 (intrinsic state)
- UnsharedConcreteFlyweight : 공유 불가능한 객체 (extrinsic state)
- FlyweightFacytory : 경량 객체를 만드는 공장 역할과 캐시 역할을 겸비하는 Flyweight 객체 관리 클래스
    - GetFlyweight() 메소드는 팩토리 메소드 역할과 비슷하다.
    - 만일 객체가 메모리에 존재하면 그대로 가져와 반환하고, 없다면 새로 생성해 반환한다.
- Client : 클라이언트는 FlyweightFactory를 통해 Flyweight 타입의 객체를 얻어 사용

### Instrinsic와 extrinsic 상태

플라이웨이트 패턴에서는 Instrinsic와 Extrinsic을 구분하는 것이 중요하다.

- Instrinsic한 객체 : **장소나 상황에 의존하지 않기 때문**에 값이 고정되어 공유할 수 있는 객체
- Extrinsic한 객체 : **장소나 상황에 의존하기 때문**에 매번 값이 바뀌어 공유할 수 없는객체

### 예제 (마인크래프트 필드에 나무 심기)

지형(Terrain)에 나무 객체를 심으려 한다.

나무(Tree) 객체에 필요한 데이터는 다음과 같다.

- 나무 종류
- 메시 폴리곤 (mesh)
- 나무 껍질 텍스쳐(texture)
- 잎사귀 텍스쳐(texture)
- 위치 매개변수

나무는 여러 종류가 있고, 나무의 형태를 구현하는 mesh와 texture 그리고 나무가 어느 지형 좌표에 심어질지에 대한 x, y 가 필요하다.

나무를 생성할 때 사용된 mesh와 texture는 재사용해도 같은 나무라면 문제가 되지 않는다.

따라서 위치만 받아서 사용하면 나무 모델 인스턴스를 하나 공유받아서 생성할 수 있을 것이다.

![Untitled](/static/images/dp/sdp14.png)

```java
// ConcreteFlyweight - 플라이웨이트 객체는 불변성을 가져야한다. 변경되면 모든 것에 영향을 주기 때문이다.
final class TreeModel {
    // 메시, 텍스쳐 총 사이즈
    long objSize = 90; // 90MB

    String type; // 나무 종류
    Object mesh; // 메쉬
    Object texture; // 나무 껍질 + 잎사귀 텍스쳐

    public TreeModel(String type, Object mesh, Object texture) {
        this.type = type;
        this.mesh = mesh;
        this.texture = texture;

        // 나무 객체를 생성하여 메모리에 적재했으니 메모리 사용 크기 증가
        Memory.size += this.objSize;
    }
}

// 여기는 공유 가능한 Instrinsic 객체
```

```java
// UnsahredConcreteFlyweight
class Tree {
    // 죄표값과 나무 모델 참조 객체 크기를 합친 사이즈
    long objSize = 10; // 10MB

    // 위치 변수
    double position_x;
    double position_y;

    // 나무 모델
    TreeModel model;

    public Tree(TreeModel model, double position_x, double position_y) {
        this.model = model;
        this.position_x = position_x;
        this.position_y = position_y;

        // 나무 객체를 생성하였으니 메모리 사용 크기 증가
        Memory.size +=  this.objSize;
    }
}

// 여기는 공유할 수 없는 Extrinsic 객체
```

위의 코드에서는 Tree와 TreeModel의 관계를 맺을 때 Composition(합성)을 통해 맺어 주었는데, 상속을 통해 해주어도 된다.

```java
// FlyweightFactory
class TreeModelFactory {
    // Flyweight Pool - TreeModel 객체들을 Map으로 등록하여 캐싱
    private static final Map<String, TreeModel> cache = new HashMap<>(); // static final 이라 Thread-Safe 함

    // static factory method
    public static TreeModel getInstance(String key) {
        // 만약 캐시 되어 있다면
        if(cache.containsKey(key)) {
            return cache.get(key); // 그대로 가져와 반환
        } else {
            // 캐시 되어있지 않으면 나무 모델 객체를 새로 생성하고 반환
            TreeModel model = new TreeModel(
                    key,
                    new Object(),
                    new Object()
            );
            System.out.println("-- 나무 모델 객체 새로 생성 완료 --");

            // 캐시에 적재
            cache.put(key, model);

            return model;
        }
    }
}
```

```java
// Client
class Terrain {
    // 지형 타일 크기
    static final int CANVAS_SIZE = 10000;

    // 나무를 렌더릴
    public void render(String type, double position_x, double position_y) {
        // 1. 캐시 되어 있는 나무 모델 객체 가져오기
        TreeModel model = TreeModelFactory.getInstance(type);

        // 2. 재사용한 나무 모델 객체와 변화하는 속성인 좌표값으로 나무 생성
        Tree tree = new Tree(model, position_x, position_y);

        System.out.println("x:" + tree.position_x + " y:" + tree.position_y + " 위치에 " + type + " 나무 생성 완료");
    }
}
```

이를 통해 매번 `new` 를 통해 새로운 객체를 생성하는 것이 아닌, 공유할 수 있는 객체는 캐시로 저장하고 가져와서 사용할 수 있다.

```java
public static void main(String[] args) {
    // 지형 생성
    Terrain terrain = new Terrain();

    // 지형에 Oak 나무 5 그루 생성
    for (int i = 0; i < 5; i++) {
        terrain.render(
                "Oak", // type
                Math.random() * Terrain.CANVAS_SIZE, // position_x
                Math.random() * Terrain.CANVAS_SIZE // position_y
        );
    }

    // 지형에 Acacia 나무 5 그루 생성
    for (int i = 0; i < 5; i++) {
        terrain.render(
                "Acacia", // type
                Math.random() * Terrain.CANVAS_SIZE, // position_x
                Math.random() * Terrain.CANVAS_SIZE // position_y
        );
    }

    // 지형에 Jungle 나무 5 그루 생성
    for (int i = 0; i < 5; i++) {
        terrain.render(
                "Jungle", // type
                Math.random() * Terrain.CANVAS_SIZE, // position_x
                Math.random() * Terrain.CANVAS_SIZE // position_y
        );
    }

    // 총 메모리 사용률 출력
    Memory.print();
}
```

만약 모두 새로 생성하게 되면 1500MB의 메모리 사용이 나오지만 위의 결과는 420MB가 나오게 된다.

## 플라이웨이트 패턴의 장단점

### 장점

1. 어플리케이션에서 사용하는 메모리를 줄일 수 있다.
2. 프로그램 속도를 개선할 수 있다.

### 단점

1. 코드의 복잡도가 증가한다.

## 7. Proxy Pattern (프록시 패턴)

- 프록시 패턴이란?
    
    **실제 기능을 수행하는 객체(Real Object) 대신에 가상의 객체(Proxy Object)를 사용하여 로직의 흐름을 제어**하는 디자인 패턴이다.
    
    프록시 패턴을 사용하는 경우는 어떤 클래스의 객체 생성이 오래 걸리는 경우 그 일을 분업하여 proxy클래스에서 처리 할 수 있는 부분은 처리하고 proxy클래스에서 처리 할 수 없는 작업에 대해서만 실제 클래스의 객체를 생성하고 위임하는 방식을 취한다.
    

### 프록시 패턴 구조

![Untitled](/static/images/dp/sdp15.png)

- Subject : Proxy와 RealSubject를 하나로 묶는 인터페이스 (다형성)
    - 대상 객체와 프록시 역할을 동일하게 하는 추상 메소드 `operation()` 정의
    - 인터페이스가 있기 때문에 **클라이언트는 Proxy 역할과 RealSubject 역할의 차이를 의식할 필요가 없다.**
- RealSubject : 원본 대상 객체
- Proxy : 대상 객체(RealSubject)를 중계할 대리자 역할
    - 프록시는 대상 객체를 합성(composition)한다.
    - 프록시는 대상 객체와 같은 이름의 메소드를 호출하며, 별도의 로직을 수행할 수 있다. (인터페이스 구현 메소드)
    - 프록시는 흐름제어만 할 뿐 결과값을 조작하거나 변경시키면 안된다.
- Client : Subject 인터페이스를 이용하여 프록시 객체를 생성해 이용
    - 클라이언트는 프록시를 중간에 두고 프록시를 통해서 RealSubject와 데이터를 주고 받는다.

## 프록시 패턴 종류와 예제

프록시 패턴은 활용 방식이 다양한데, 같은 프록시 객체라 하여도 어떠한 로직을 짜느냐에 따라 그 활용도는 천차만별이 된다.

프록시 패턴의 기본형을 어떤 방식으로 변형하는가에 따라 프록시 종류가 나뉘게 된다.

```java
interface ISubject {
    void action();
}

class RealSubject implements ISubject {
    public void action() {
        System.out.println("원본 객체 액션 !!");
    }
}
```

이걸 기본으로 가지고 살펴보도록 하자.

### Normal Proxy (기본형 프록시)

```java
class Proxy implements ISubject {
    private RealSubject subject; // 대상 객체를 composition

    Proxy(RealSubject subject) {
        this.subject = subject;
    }

    public void action() {
        subject.action(); // 위임
        /* do something */
        System.out.println("프록시 객체 액션 !!");
    }
}

class Client {
    public static void main(String[] args) {
        ISubject sub = new Proxy(new RealSubject());
        sub.action();
    }
}
```

### Virtual Proxy (가상 프록시)

지연 초기화 방식으로 실제 객체의 생성에 많은 자원이 소모 되지만 사용 빈도는 낮을 때 사용된다.

서비스가 시작될 때 객체를 생성하는 대신에 객체 초기화가 실제로 필요한 시점이 일어나는 방식이다.

```java
class Proxy implements ISubject {
    private RealSubject subject; // 대상 객체를 composition

    Proxy() {
    }

    public void action() {
    	// 프록시 객체는 실제 요청(action(메소드 호출)이 들어 왔을 때 실제 객체를 생성한다.
        if(subject == null){
            subject = new RealSubject();
        }
        subject.action(); // 위임
        /* do something */
        System.out.println("프록시 객체 액션 !!");
    }
}

class Client {
    public static void main(String[] args) {
        ISubject sub = new Proxy();
        sub.action();
    }
}
```

### Protection Proxy (보호 프록시)

프록시가 대상 객체에 대한 자원으로의 엑세스 제어(접근 권한)

특정 클라이언트만 서비스 객체를 사용할 수 있도록 하는 경우에 사용할 수 있다.

```java
class Proxy implements ISubject {
    private RealSubject subject; // 대상 객체를 composition
    boolean access; // 접근 권한

    Proxy(RealSubject subject, boolean access) {
        this.subject = subject;
        this.access = access;
    }

    public void action() {
        if(access) {
            subject.action(); // 위임
            /* do something */
            System.out.println("프록시 객체 액션 !!");
        }
    }
}

class Client {
    public static void main(String[] args) {
        ISubject sub = new Proxy(new RealSubject(), false);
        sub.action();
    }
}
```

### Logging Proxy (로깅 프록시)

대상 객체에 대한 로깅을 추가하려는 경우로 프록시는 서비스 메소드를 실행하기 전에 로깅을 하는 기능을 추가하여 재정의 한다.

```java
class Proxy implements ISubject {
    private RealSubject subject; // 대상 객체를 composition

    Proxy(RealSubject subject {
        this.subject = subject;
    }

    public void action() {
        System.out.println("로깅..................");
        
        subject.action(); // 위임
        /* do something */
        System.out.println("프록시 객체 액션 !!");

        System.out.println("로깅..................");
    }
}

class Client {
    public static void main(String[] args) {
        ISubject sub = new Proxy(new RealSubject());
        sub.action();
    }
}
```

### Remote Proxy (원격 프록시)

프록시 클래스는 로컬에 있고, 대상 객체는 원격 서버에 존재하는 경우

프록시 객체는 네트워크를 통해 클라이언트의 요청을 전달하여 네트워크와 관련된 불필요한 작업들을 처리하고 결과값만 반환한다.

즉, 클라이언트 입장에선느 프록시를 통해 객체를 이용하는 것이니 원격인지 로컬인지 신경 쓸 필요가 없다.

### Caching Proxy (캐시 프록시)

데이터가 큰 경우 캐싱하여 재사용을 유도하는 것으로 클라이언트 요청의 결과를 캐시하고 이 캐시의 수명 주기를 관리한다.

## 프록시 패턴 장단점

### 장점

1. 기존 대상 객체의 코드를 변경하지 않고 새로운 기능을 추가할 수 있으니 개방 폐쇄 원칙(OCP) 준수
2. 대상 객체는 자신의 기능에만 집중하고, 그 이외 부가 기능을 제공하는 역할은 프록시 객체에 위임하여 다중 책임을 피할 수 있다.(SRP) 준수
3. 원래 하려던 기능을 수행하며 그 외의 부가적인 작업(로깅, 인증, 네트워크 통신 등)을 수행하는데 유용하다.
4. 클라이언트는 객체를 신경쓰지 않고, 서비스 객체를 제어하거나 생명 주기를 관리할 수 있다.
5. 사용자 입장에서 프록시 객체나 실제 객체나 사용법은 유사하므로 사용성에 문제되지 않는다.

### 단점

1. 많은 프록시 클래스를 도입해야 하므로 코드의 복잡도가 증가한다.
2. 프록시 클래스 자체에 들어가는 자원이 많다면 응답이 늦을 수 있다.

> 참고 :
> 
> 
> [https://inpa.tistory.com/entry/GOF-💠-프록시Proxy-패턴-제대로-배워보자](https://inpa.tistory.com/entry/GOF-%F0%9F%92%A0-%ED%94%84%EB%A1%9D%EC%8B%9CProxy-%ED%8C%A8%ED%84%B4-%EC%A0%9C%EB%8C%80%EB%A1%9C-%EB%B0%B0%EC%9B%8C%EB%B3%B4%EC%9E%90)
> 
> [https://inpa.tistory.com/entry/GOF-💠-Flyweight-패턴-제대로-배워보자](https://inpa.tistory.com/entry/GOF-%F0%9F%92%A0-Flyweight-%ED%8C%A8%ED%84%B4-%EC%A0%9C%EB%8C%80%EB%A1%9C-%EB%B0%B0%EC%9B%8C%EB%B3%B4%EC%9E%90)
> 
> [https://inpa.tistory.com/entry/GOF-💠-퍼사드Facade-패턴-제대로-배워보자](https://inpa.tistory.com/entry/GOF-%F0%9F%92%A0-%ED%8D%BC%EC%82%AC%EB%93%9CFacade-%ED%8C%A8%ED%84%B4-%EC%A0%9C%EB%8C%80%EB%A1%9C-%EB%B0%B0%EC%9B%8C%EB%B3%B4%EC%9E%90)
> 
> [https://inpa.tistory.com/entry/GOF-💠-데코레이터Decorator-패턴-제대로-배워보자](https://inpa.tistory.com/entry/GOF-%F0%9F%92%A0-%EB%8D%B0%EC%BD%94%EB%A0%88%EC%9D%B4%ED%84%B0Decorator-%ED%8C%A8%ED%84%B4-%EC%A0%9C%EB%8C%80%EB%A1%9C-%EB%B0%B0%EC%9B%8C%EB%B3%B4%EC%9E%90)
> 
> [https://velog.io/@ha0kim/Design-Pattern-구조-패턴Structural-Patterns](https://velog.io/@ha0kim/Design-Pattern-%EA%B5%AC%EC%A1%B0-%ED%8C%A8%ED%84%B4Structural-Patterns)
>