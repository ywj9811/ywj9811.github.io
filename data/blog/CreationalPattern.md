---
title: 생성 패턴(Creational-Pattern) 종류
date: '2023-09-10'
tags: ['Design-Pattern']
draft: false
summary: 생성 패턴(Creational-Pattern)의 종류와 특징에 대해서 알아보자
---

## 1. Abstract Factory Pattern (추상 팩토리 패턴)

- 추상 팩토리 패턴이란?
    
    **비슷한 속성의 객체들을 인터페이스로 규격화된 팩토리에서 일관된 방식으로 생성하고, 생성된 객체끼리는 쉽게 교체될 수 있도록 고안한 패턴**이다.
    
    추상 팩토리 패턴은 상세화된 서브클래스를 정의하지 않고도 서로 관련성이 있거나 독립적인 여러 객체의 군을 생성하기 위한 인터페이스를 제공한다.
    

### 추상 팩토리 패턴 구조

![Untitled](/static/images/dp/cdp1.png)

순서대로 살펴보면 다음과 같은 방식이다.

1. AbstractFactory : 최상위 공장 클래스. 여러개의 제품들을 생성하는 여러 메소드들을 추상화 한다.
2. ConcreteFactory : 서브 공장 클래스들은 타입에 맞는 제품 객체를 반환하도록 메소드들을 재정의한다.
3. AbstractProduct : 각 타입의 제품들을 추상화한 인터페이스
4. Product : 각 타입의 제품 구현체들로 이들은 팩토리 객체로부터 생성된다.
5. Client : 추상화된 인터페이스만을 이용하여 제품을 받기 때문에, 구체적인 제품, 공장에 대해서는 모른다.

AbstractFactory는 실제 객체가 정확히 무엇인지 알지 못해도 객체를 생성하고 조작할 수 있도록 한다.

이러한 방식으로 Product를 사용하는 코드를 변경하지 않으면서 손쉽게 새로운 Product를 추가할 수 있다.

AbstractFactory는 다양한 환경에서 작동하는 코드를 만들 수 있도록 해주는데, 예를 들면 시스템은 각 환경에 맞는 고유한 ConcreteFactory를 생성하고, 이를 통해 환경에 맞는 Product를 생성한다.

이는 구현 클래스가 아닌 인터페이스를 통해 이용하기 때문에 Client는 사용하고 있는 Product가 정확히 무엇인지 알 수 없다.

### Product 클래스

```java
// Product A 제품군
interface AbstractProductA {
}

// Product A - 1
class ConcreteProductA1 implements AbstractProductA {
}

// Product A - 2
class ConcreteProductA2 implements AbstractProductA {
}
```

```java
// Product B 제품군
interface AbstractProductB {
}

// Product B - 1
class ConcreteProductB1 implements AbstractProductB {
}

// Product B - 2
class ConcreteProductB2 implements AbstractProductB {
}
```

### Factory 클래스

```java
interface AbstractFactory {
    AbstractProductA createProductA();
    AbstractProductB createProductB();
}

// Product A1와 B1 제품군을 생산하는 공장군 1 
class ConcreteFactory1 implements AbstractFactory {
    public AbstractProductA createProductA() {
        return new ConcreteProductA1();
    }
    public AbstractProductB createProductB() {
        return new ConcreteProductB1();
    }
}

// Product A2와 B2 제품군을 생산하는 공장군 2
class ConcreteFactory2 implements AbstractFactory {
    public AbstractProductA createProductA() {
        return new ConcreteProductA2();
    }
    public AbstractProductB createProductB() {
        return new ConcreteProductB2();
    }
}
```

### Client 사용

그렇다면 어떻게 사용할 수 있을까?

```java
class Client {
    public static void main(String[] args) {
	    	AbstractFactory factory = null;
        
        // 1. 공장군 1을 가동시킨다.
        factory = new ConcreteFactory1();

        // 2. 공장군 1을 통해 제품군 A1와 B1을 생성하도록 한다 (클라이언트는 구체적인 구현은 모르고 인터페이스에 의존한다)
        AbstractProductA product_A1 = factory.createProductA();
        AbstractProductB product_B1 = factory.createProductB();
				System.out.println(product_A1.getClass().getName()); // ConcreteProductA1
				System.out.println(product_B1.getClass().getName()); // ConcreteProductB1

        // 3. 공장군 2를 가동시킨다.
        factory = new ConcreteFactory2();

        // 4. 공장군 2를 통해 제품군 A2와 B2를 생성하도록 한다 (클라이언트는 구체적인 구현은 모르고 인터페이스에 의존한다)
        AbstractProductA product_A2 = factory.createProductA();
        AbstractProductB product_B2 = factory.createProductB();
        System.out.println(product_A2.getClass().getName()); // ConcreteProductA2
        System.out.println(product_B2.getClass().getName()); // ConcreteProductB2
    }
}
```

이렇게 똑같은 `createProductA()` 와 `createProductB()` 를 사용하고 있지만, 어떤 팩토리 객체이냐에 따라 반환되는 객체가 달라진다.

## 2. Builder Pattern (빌더 패턴)

- 빌더 패턴이란?
    
    **복잡한 객체를 생성하는 방법을 정의하는 클래스와 표현하는 방법을 정의하는 클래스를 별도로 분리**하여 서로 다른 표현이라도 이를 생성할 수 있는 동일한 절차를 제공하는 패턴이다.
    
    이는 많은 Optional한 멤버 변수 혹은 파라미터나 지속성 없는 상태 값들에 대해 처리해야 하는 문제들을 해결해준다.
    
    예를 들어 아래에서 설명할 팩토리 패턴 혹은 추상 팩토리 패턴에서는 생성해야 하는 클래스에 대한 속성 값이 많을 때 아래와 같은 이슈들이 있다.
    
    1. 클라이언트 프로그램으로부터 팩토리 클래스로 많은 파라미터를 넘겨줄 때 타입, 순서 등에 대한 관리가 어려워 에러가 발생할 수 있다.
    2. 경우에 따라 필요 없는 파라미터들에 대해서 팩토리 클래스에 Null을 넘겨줘야 한다.
    3. 생성해야 하는 sub class가 무거워지고 복잡해짐에 따라 팩토리 클래스 또한 복잡해진다.
    
    빌더 패턴은 이러한 문제들을 해결하기 위해 별도의 Builder클래스를 만들어 필수 값에 대해서는 생성자를 통해, 선택적인 값들에 대해서는 메소드를 통해 step-by-step으로 값을 입력받은 후에 `build()` 메소드를 통해 최종적으로 하나의 인스턴스를 리턴하는 방식이다.
    
    이러한 방식은 **롬복의 @Builder**로 쉽게 사용할 수 있다.
    

## 3. Factory Method Pattern (팩토리 메소드 패턴)

- 팩토리 메소드 패턴이란?
    
    팩토리 메소드 패턴은 객체를 생성하기 위해 인터페이스를 정의하지만 어떤 클래스의 인스턴스를 생성할 지에 대한 결정은 서브클래스가 내리도록 할 때 유용하게 사용된다.
    
    어떤 클래스가 자신이 생성해야 하는 객체의 클래스를 예측할 수 없을 때 사용한다.
    
    → 어떤 클래스의 인스턴스를 만들지는 미리 정의한 공장 서브 클래스에서 결정
    

### 팩토리 메소드 패턴 구조

![Untitled](/static/images/dp/cdp2.png)

1. Creator : 최상위 공장 클래스로 팩토리 메소드를 추상화하여 서브 클래스로 하여금 구현하도록 한다.
    - 객체 생성 처리 메소드(`someOperation()`) : 객체 생성에 관한 전처리, 후처리를 템플릿화한 메소드
    - 팩토리 메소드(`createProduct()`) : 서브 공장 클래스에서 재정의할 객체 생성 추상 메소드
2. ConcreteCreator : 각 서브 공장 클래스들은 이에 맞는 제품 객체를 반환하도록 생성 추상 메소드를 재정의한다.
    
    이를 통해 제품 객체 하나당 그에 걸맞는 생산 공장 객체가 위치된다.
    
3. Product : 제품 구현체를 추상화
4. ConcreteProduct : 제품 구현체

### Product 클래스

```java
// 제품 객체 추상화 (인터페이스)
interface IProduct {
    void setting();
}

// 제품 구현체
class ConcreteProductA implements IProduct {
    public void setting() {
    }
}

class ConcreteProductB implements IProduct {
    public void setting() {
    }
}
```

### Factory 클래스

```java
// 공장 객체 추상화 (추상 클래스)
abstract class AbstractFactory {

    // 객체 생성 전처리 후처리 메소드 (final로 오버라이딩 방지, 템플릿화)
    final IProduct createOperation() {
        IProduct product = createProduct(); // 서브 클래스에서 구체화한 팩토리 메서드 실행
        product.setting(); // .. 이밖의 객체 생성에 가미할 로직 실행
        return product; // 제품 객체를 생성하고 추가 설정하고 완성된 제품을 반환
    }

    // 팩토리 메소드 : 구체적인 객체 생성 종류는 각 서브 클래스에 위임
    // protected 이기 때문에 외부에 노출이 안됨
    abstract protected IProduct createProduct();
}

// 공장 객체 A (ProductA를 생성하여 반환)
class ConcreteFactoryA extends AbstractFactory {
    @Override
    public IProduct createProduct() {
        return new ConcreteProductA();
    }
}

// 공장 객체 B (ProductB를 생성하여 반환)
class ConcreteFactoryB extends AbstractFactory {
    @Override
    public IProduct createProduct() {
        return new ConcreteProductB();
    }
}
```

### Client 사용

```java
class Client {
    public static void main(String[] args) {
        // 1. 공장 객체 생성 (리스트)
        AbstractFactory[] factory = {
                new ConcreteFactoryA(),
                new ConcreteFactoryB()
        };

        // 2. 제품A 생성 (안에서 createProduct() 와 생성 후처리 실행)
        IProduct productA = factory[0].createOperation();

        // 3. 제품B 생성 (안에서 createProduct() 와 생성 후처리 실행)
        IProduct productB = factory[1].createOperation();
    }
}
```

## 4. Prototype Pattern (프로토타입 패턴)

- 프로토타입 패턴이란?
    
    프로토타입은 주로 실제 제품을 만들기에 앞서 대략적인 샘플 정도의 의미로 사용되는 단어이다.
    
    생성할 객체들의 타입이 프로토타입인 인스턴스로부터 결정되도록 하여 인스턴스는 새 객체를 만들기 위해 자신을 복제(clone)하게 된다.
    
    따라서 패턴을 구현하려면 우선 `clone()` 메소드를 선언하는 추상 클래스를 하나 만든다.
    
    다형적 생성자 기능이 필요한 클래스가 있다면 위의 추상 클래스를 상속받게 한 후, `clone()` 메소드 내의 코드를 구현한다.
    
- 프로토타입 패턴 특징
    1. 추상 팩토리 패턴과는 반대로 클라이언트 응용 프로그램 코드 내에서 객체 창조자(creator)를 서브클래스(subclass)하는 것을 피할 수 있게 해준다.
    2. 새로운 객체를 일반적인 방법으로 객체를 생성하는 고유의 주어진 응용 프로그램 상황에 있어서 불가피하게 매우 클 때 이 비용을 감내하지 않을 수 있게 해준다.
    
    즉, 객체를 복사하여 생성하는 방식이므로 다수의 객체를 생성해야 할 때 객체 생성의 비용을 효과적으로 감소시킬 수 있다.
    

### 프로토타입 패턴 구조

![Untitled](/static/images/dp/cdp3.png)

1. Prototype : 복제하는 인터페이스 정의
2. ConcretePrototype : 복제하는 연산 구현
3. Client : 복제를 요청 및 새로운 객체 생성

### Prototype

`cone()` 을 가지는 Cloneable 인터페이스가 기본으로 자바의 `java.lang` 에 존재한다.

### ConcretePrototype 클래스

```java
public class ConcretePrototype implements Cloneable {
		private List<String> empList;

		public ConcretePrototype(){
        empList = new ArrayList<String>();
    }

    public ConcretePrototype(List<String> list){
        this.empList=list;
    }

    public void loadData(){
        //read all employees from database and put into the list
        empList.add("Pankaj");
        empList.add("Raj");
        empList.add("David");
        empList.add("Lisa");
    }

    public List<String> getEmpList() {
        return empList;
    }
		
		// Clonable의 clone()을 구현하는 부분
    @Override
    public Object clone() throws CloneNotSupportedException{
        List<String> temp = new ArrayList<String>();
        for(String s : this.empList){
            temp.add(s);
        }
        return new ConcretePrototype(temp);
    }
}
```

### Client 사용

```java
public class Client {
    public static void main(String[] args) throws CloneNotSupportedException {
        ConcretePrototype emps = new ConcretePrototype();
        emps.loadData();

        //Use the clone method to get the ConcretePrototype object
        ConcretePrototype empsNew = (ConcretePrototype) emps.clone();
        ConcretePrototype empsNew1 = (ConcretePrototype) emps.clone();
        List<String> list = empsNew.getEmpList();
        list.add("John");
        List<String> list1 = empsNew1.getEmpList();
        list1.remove("Pankaj");

        System.out.println("emps List: "+emps.getEmpList());
        System.out.println("empsNew List: "+list);
        System.out.println("empsNew1 List: "+list1);
    }
}
```

이렇게 되면 emps와 empsNew, EmpsNew1은 모두 각자 다른 객체가 되는 것이다.

하지만 new와 같이 생성하는 부분은 `clone()` 내부에 구현되어 있기 때문에 보이지 않게 된다.

즉, 다른 객체로 생성된 empsNew, empsNew1은 초기에 emps와 동일한 내용을 가지고 생성되어 이후에 각자 필요한 내용을 추가하는 방식으로 사용될 수 있다.

## 5. Singleton Pattern (싱글톤 패턴)

- 싱글톤 패턴이란?
    
    싱글톤 패턴은 인스턴스를 하나만 만들어 사용하기 위한 패턴이다.
    
    커넥션 풀, 스레드 풀, 디바이스 설정 객체 등의 경우 인스턴스를 여러개 만들게 되면 자원을 낭비하게 되거나 버그를 발생시킬 수 있으므로 오직 하나만 생성하고 그 인스턴스를 사용하도록 하는 것이 이 패턴의 목적이다.
    

### 싱글톤 패턴 구현 원리

![Untitled](/static/images/dp/cdp4.png)

위와 같이 싱글톤으로 이용할 클래스를 외부에서 마음대로 new 생성자를 통해 인스턴스화 하는 것을 제한하기 위해 클래스 생성자 메소드에 private 키워드를 붙여주는 것이다.

그리고, `getInstance()` 와 같은 메소드에서 검사를 하여 null일 경우 초기화를, null이 아닐 경우 기존에 존재하는 객체를 반환하는 방식으로 구성하면 된다.

> 참고 :
> 
> 
> https://kingchan223.tistory.com/295
> 
> [https://inpa.tistory.com/entry/GOF-💠-싱글톤Singleton-패턴-꼼꼼하게-알아보자](https://inpa.tistory.com/entry/GOF-%F0%9F%92%A0-%EC%8B%B1%EA%B8%80%ED%86%A4Singleton-%ED%8C%A8%ED%84%B4-%EA%BC%BC%EA%BC%BC%ED%95%98%EA%B2%8C-%EC%95%8C%EC%95%84%EB%B3%B4%EC%9E%90)
> 
> [https://inpa.tistory.com/entry/GOF-💠-팩토리-메서드Factory-Method-패턴-제대로-배워보자](https://inpa.tistory.com/entry/GOF-%F0%9F%92%A0-%ED%8C%A9%ED%86%A0%EB%A6%AC-%EB%A9%94%EC%84%9C%EB%93%9CFactory-Method-%ED%8C%A8%ED%84%B4-%EC%A0%9C%EB%8C%80%EB%A1%9C-%EB%B0%B0%EC%9B%8C%EB%B3%B4%EC%9E%90)
> 
> [https://inpa.tistory.com/entry/GOF-💠-빌더Builder-패턴-끝판왕-정리#빌더_클래스_구현하기](https://inpa.tistory.com/entry/GOF-%F0%9F%92%A0-%EB%B9%8C%EB%8D%94Builder-%ED%8C%A8%ED%84%B4-%EB%81%9D%ED%8C%90%EC%99%95-%EC%A0%95%EB%A6%AC#%EB%B9%8C%EB%8D%94_%ED%81%B4%EB%9E%98%EC%8A%A4_%EA%B5%AC%ED%98%84%ED%95%98%EA%B8%B0)
> 
> [https://inpa.tistory.com/entry/GOF-💠-추상-팩토리Abstract-Factory-패턴-제대로-배워보자](https://inpa.tistory.com/entry/GOF-%F0%9F%92%A0-%EC%B6%94%EC%83%81-%ED%8C%A9%ED%86%A0%EB%A6%ACAbstract-Factory-%ED%8C%A8%ED%84%B4-%EC%A0%9C%EB%8C%80%EB%A1%9C-%EB%B0%B0%EC%9B%8C%EB%B3%B4%EC%9E%90)
> 
> [https://velog.io/@ha0kim/Design-Pattern-생성-패턴Creational-Patterns](https://velog.io/@ha0kim/Design-Pattern-%EC%83%9D%EC%84%B1-%ED%8C%A8%ED%84%B4Creational-Patterns)
>