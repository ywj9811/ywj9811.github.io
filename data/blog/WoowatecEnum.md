---
title: Enum을 사용하면 무엇이 좋을까
date: '2022-11-20'
tags: ['우아한테크코스5기', '프리코스', '기술']
draft: false
summary: '우테코의 피드백을 확인했더니 연관된 상수의 경우 private final 상수보다 enum을 활용하기를 권장하고 있었다.
enum은 무엇이 장점이길래 private final 상수보다 enum을 권장하는 것일까?'
authors: ['default']
---

### **우테코의 피드백을 확인했더니 연관된 상수의 경우 private final 상수보다 enum을 활용하기를 권장하고 있었다.**

**enum은 무엇이 장점이길래 private final 상수보다 enum을 권장하는 것일까?**

> **언어와 상관없이 공통적으로 가지는 enum의 장점은 다음과 같다고 한다.**
>
> - **문자열과 비교해 IDE의 적극적인 지원을 받을 수 있다.**
>   - **자동완성, 오타검증, 텍스트 리팩토링 등등**
> - **허용 가능한 값들을 제한할 수 있다.**
> - **리팩토링시 변경 범위가 최소화 된다.**
>   - **내용의 추가가 필요하더라도, Enum 코드외에 수정할 필요가 없다.**

**이외에 JAVA의 경우 더 많은 장점을 가지고 있다고 한다.**

**왜냐하면 JAVA의 경우 Enum은 완전한 기능을 갖춘 클래스로 취급되기 때문이다.**

**이제 Enum의 사용에 대해서 알아보도록 하자.**

---

### **1. 단순 정수 열거 패턴보다 뛰어난 자바의 Enum class**

**enum을 사용하게 되면 코드의 중복, if문의 사용 등등 을 줄여서 코드를 간결하고 보기 좋게 만들 수 있다.**

```java
public static final int APPLE_FUJI = 0;
public static final int APPLE_PIPPIN = 1;
public static final int APPLE_GRANNY_SMITH = 2;
public static final int ORANGE_NAVEL = 0;
public static final int ORANGE_TEMPLE = 1;
public static final int ORANGE_BLOOD = 2;
```

**이 경우 타입 안전을 보장할 방법이 없고 표현력도 좋지않다.**

**동등 연산자(==) 로 값을 비교할 수 없다.**

**값 자체가 숫자로만 보이기 때문에, 출력 및 디버거에서 크게 도움이 안된다.**

**namespace를 지원하지 않아, 위처럼 사과용 상수에는 'APPLE', 오렌지용 상수에는 'ORANGE'로 접두어를 사용하는 방식으로 값을 나누어야 한다.**

**이러한 문제점들이 있다.**

---

```java
public enum Apple {FUJI, PIPPIN, GRANNY_SMITH, ORIGINAL}
public enum Orange {NAVEL, TEMPLE, BLOOD, ORIGINAL}
```

**이 경우는 상수 하나당 자신의 인스턴스를 하니씩 만들어 public static final 필드로 공개하는 클래스이다.**

**따라서 허용 가능한 값들을 제한할 수 있고 컴파일 시 타입 안전성을 제공할 수 있다.**

**그리고 Enum 별로 namespace가 있어서 다른 Enum의 같은 이름을 가지는 값을 사용할 수 있다.**

---

### **2. Ordinal이 아닌 name 데이터 사용하기**

**Enum의 구조는 name과 ordinal 값으로 구성되어 있다.**

```java
public abstract class Enum<E extends Enum<E>> ... {
	private final String name;

	public final String name() {
		return name;
	}

	private final int ordinal;

	@Range(from = 0, to = java.lang.Integer.MAX_VALUE)
		public final int ordinal() {
		return ordinal;
	}
}
```

- **ordinal은 무엇일까**
  **ordinal 값은 값들이 나열된 순서대로 0,1,2,3…N 과 같은 정수 값을 가진다.**
    <aside>
    💡 **이때 값 사이에 다른 값이 추가 될 경우 뒤에 있는 값들의 ordinal 값이 변경되게 되므로 ordinal 값을 사용한다면 모두 영향을 받게 된다.**
    
    </aside>
    
    **따라서 ordinal을 사용하는 것은 추천하는 방식이 아니다.**

**즉, ordinal이 아닌 새로운 값이 추가되어도 뒤의 값이 변경되지 않는 name을 사용하는 것을 권장한다.**

---

### **3. 데이터와 메소드를 가지는 Enum**

**자바의 Enum은 메소드나 필드를 추가하고 인터페이스를 구현할 수 있다.**

```java
public enum BasicOperation {
		PLUS("+", (x, y) -> x + y) {
        public double apply(double x, double y) { return x + y; }
    },
    MINUS("-", (x, y) -> x - y) {
        public double apply(double x, double y) { return x - y; }
    },
    TIMES("*", (x, y) -> x * y) {
        public double apply(double x, double y) { return x * y; }
    },
    DIVIDE("/", (x, y) -> x / y) {
        public double apply(double x, double y) { return x / y; }
    };

    private final String symbol;
    private final BiFunction<Integer, Integer, Integer> operation;
		abstract double apply(double value, double value);

    BasicOperation(String symbol, BiFunction<Integer, Integer, Integer> operation) {
        this.symbol = symbol;
        this.operation = operation;
    }

    public Integer operate(Integer x, Integer y) {
        return this.operation.apply(x, y);
    }

    @Override public String toString() {
        return symbol;
    }
}
```

**위와 같이 Enum의 원소들은 데이터(위의 symbol)와 메소드(위의 BiFunction과 apply) 를 가질 수 있다.**

**이러한 특징을 통해서 여러가지 장점을 만들어낼 수 있는데**

1. **데이터들 간의 연관관계 표현을 할 수 있다.**

   **Enum은 원소에 값을 가지게 하여 특정 의미를 가질 수 있도록 해주기도 한다.**

   **get 메소드를 만들어서 각 의미를 가지고 온다면 값이 추가된다고 해서 반복되는 코드가 생성되지 않는다.**

   ```java
   public enum TableStatus {

   		Y("1", true), // Y, "1", true가 같은 의미임을 쉽게 알 수 있다.
   		N("0", false);

   		private String table1value;
   		private boolean table2value;

   		TableStatus(String table1value, boolean table2value) {
   				this.table1value = table1value;
   				this.table2value = table2value;
   		}

   		// table1value의 getter는 enum에 값이 추가된다고 코드가 추가되지 않는다.
   		public String getTable1value() {
   				TableStatus.Y.ordinal();
   				return table1value;
   		}
   }
   ```

2. **상태와 행위를 한곳에서 관리할 수 있다.**

   **예를 들기 위해서 다음과 같은 코드를 보자**

   ```java
   public class LegacyOperation {

   		public static int operate(String symbol, int x, int y) {
   				if("PLUS".equals(symbol)) {
   						return x + y;
   				} else if("MINUS".equals(symbol)) {
   						return x - y;
   				} else if("TIMES".equals(symbol)) {
   						return x * y;
   				} else if("DIVIDE".equals(symbol)) {
   						return x / y;
   				}
   				throw new IllegalArgumentException("Do not operate. Not found symbol.");
   		}

   		public static void main(String[] args) {
   				String symbol = findSymbol(); // 데이터는 데이터 대로 조회하고
   				int x = 100;
   				int y = 200;
   				int result = LegacyOperation.operate(symbol, x, y); // 계산은 별도의 메소드를 통해서 진행
   		}
   }
   ```

   **Enum을 활용하지 않는 경우 위와 같은 코드를 짜게 되는데 이 경우 똑같은 기능을 하는 메소드를 중복 생성하게 된다는 점, 계산 메소드를 누락 할 위험이 존재한다는 점 등등의 단점이 존재한다.**

   **하지만**

   ```java
   public static void main(String[] args) {
   		BasicOperation operation = findOperation();
   		int x = 100;
   		int y = 200;
   		int result = operation.operate(x, y); // Enum에게 직접 계산을 요청
   }
   ```

   **위의 Enum 클래스 BasicOperation 에게 요청을 하게 된다면 단순하게 처리할 수 있다.**

**이외에도 수많은 장점이 있으니**

[Java Enum 활용기 | 우아한형제들 기술블로그](https://techblog.woowahan.com/2527/)

**해당 블로그를 참고하면서 공부하면 좋을 듯 하다.**

---

### **마무리**

**물론 Enum 클래스를 사용해본 경험이 거의 전무하고 이번을 계기로 접하게 되었는데 아직까지는 무엇이 어떻게 편해지는지 실감하기는 어려운 듯 하다.**

**아직 어떻게 활용할지 방법에 대해서 이해가 부족한 면도 많은 듯 하고 자료를 찾아보면서 이해가 가지 않는 부분도 많았던 것이 사실이었다.**

**물론 백문이불여일코 라고 이론을 찾아보며 이해하려 하는 것 보다 직접 작성해보고 다양한 방법으로 시도하는 것이 나의 이해에 큰 도움을 줄 것이라고 생각한다.**

**새로운 지식을 알 수 있는 기회를 얻었으니 이제 사용해 보면서 좋은 습관을 들이고 편함을 찾아보도록 하자!**
