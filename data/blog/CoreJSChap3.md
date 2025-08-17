---
title: 코어 자바스크립트 Chap3
date: '2025-08-16'
tags: ['JavaScript', '기술서적', '코어자바스크립트']
draft: false
summary: 코어 자바스크립트 Chap3 this
---

## Chap3 this

다른 객체지향 언어(Java와 같은)는 this가 가리키는 대상이 생성한 인스턴스 객체를 의미한다. 따라서 클래스에서만 사용할 수 있기 때문에 혼란의 여지가 없다.

하지만, 자바스크립트에서의 this는 어디서든 사용할 수 있고, 상황에 따라 바라보는 대상이 달라진다. 따라서 혼란을 가져다준다.

### 상황에 따라 달라지는 this

자바스크립트의 this는 기본적으로 실행컨텍스트가 생성될 때 함께 결정된다.

실행 컨텍스트는 함수를 호출할 때 생성되므로, 바꿔 말하면 this는 함수를 호출할 때 결정되는 것이다.

→ 함수를 어떤 방식으로 호출하느냐에 따라 값이 달라지는 것

전역 공간에서 this는 전역 객체를 가리킨다. 개념상 전역 컨텍스트를 생성하는 주체가 전역 객체이기 때문이다. (브라우저 환경 - window, Node.js 환경 - global)

> 전역변수를 선언하면, 자바스크립트에서는 이것을 전역객체의 프로퍼티로 할당한다.
> 변수이면서, 객체의 프로퍼티가 되는 것이다.
> var a = 1 을 생성한 뒤, a / window.a / this.a 모두 확인해보면 같은 1이 나오는 것을 볼 수 있다.

### 메소드로서 호출할 때 그 메소드 내부에서의 this

어떤 함수를 실행하는 방법 중 일반적인 방법 두가지는

1. 함수로서 호출하는 경우
2. 메소드로서 호출하는 경우

이렇게 두가지가 있다.

**함수는 그 자체로 독립적인 기능을 수행하지만, 메소드는 자신을 호출한 대상 객체에 관한 동작을 수행한다.**

```jsx
var func = function (x) {
  console.log(this, x)
}
func(1)

var obj = {
  method: fulnc,
}

obj.method(2)
```

이 경우, 첫번째 출력과 두번째 출력의 값이 다르다.

첫번째는 window 전역객체가 출력되고, 두번째는 obj 객체가 출력될 것이다.

익명함수는 그대로인데, 이를 변수에 담아 호출한 경우와 obj 객체의 프로퍼티에 할당해서 호출한 경우에 this가 달라지는 것이다.

그렇다면 ‘함수로서 호출’과 ‘메소드로서 호출’ 을 어떻게 구분하냐.

**함수 앞에 (.)의 여부로 구분할 수 있다.**

**즉, 점 표기법이든 대괄호 표기법이든, 어떤 함수를 호출할 때 그 함수 이름 앞에 객체가 명시돼 있는 경우에는 메소드로 호출한 것이고, 그렇지 않은 모든 경우에는 함수로 호출한 것이다.**

```jsx
var obj = {
	methodA: function () {console.log(this);},
	inner: {
		methodB: funciton() {console.log(this);}
	}
}

obj.methodA(); // this는 obj
obj.inner.methodB(); // this는 inner
```

- **메소드 내부에서의 this**
  → this에는 호출한 주체의 정보가 담긴다.

### **함수로서 호출할 때 그 함수 내부에서의 this**

어떤 함수를 함수로서 호출할 경우에는 this가 지정되지 않는다.

**this는 호출한 주체의 정보가 담긴다고 하였으나, 함수로서 호출하는 것은 호출 주체를 명시하지 않기 때문이다.**

**2장에서 this가 지정되지 않은 경우 this는 전역 객체를 바라본다고 했다.**

```jsx
var obj1 = {
  outer: function () {
    console.log(this) // (1)
    var innerFunc = function () {
      console.log(this) // (2) (3)
    }
    innerFunc()

    var obj2 = {
      innerMethod: innerFunc,
    }
    obj2.innerMethod()
  },
}
obj1.outer()
```

이 결과 출력은 어떻게 나올 것인가.

```
(1) obj1
(2) window
(3) obj2
```

이렇게 나오게 된다.

처음에는 `obj1.outer();` 로 obj1이 호출했기 때문에 obj1이 나오고, `innerFunc()` 을 통해 함수로 호출하게 되면 호출한 주체가 없어 window가 나오게 된다.

하지만, 마지막에는 `obj2.innerMehtod()` 로 호출하여 obj2가 나오게 되는 것이다.

**즉, this 바인딩에 관해서는 함수를 실행하는 당시의 주변 환경은 중요하지 않고, 오로지 해당 함수를 호출하는 구문 앞에 점 혹은 대괄호 표기가 있는지가 관건인 것이다.**

- 하지만, 약간의 우회를 통해 this를 원하는 대로 쓸 수 있긴 하다.

  ```jsx
  var obj1 = {
    outer: function () {
      console.log(this) // (1)

      var innerFunc1 = function () {
        console.log(this) // (2)
      }
      innerFunc()

      var self = this

      var innerFunc2 = function () {
        console.log(this) // (3)
      }
      innerFunc2()
    },
  }
  obj1.outer()
  ```

  이 경우

  ```
  (1) obj
  (2) window
  (3) obj
  ```

  이렇게 self에 원하는 this를 할당시켜 사용하는 방법이 있기도 하다.

**this를 바인딩하지 않는 함수**

ES6 에서는 함수 내부에서 this가 전역객체를 바라보는 문제를 보완하기 위해, this를 바인딩하지 않는 화살표 함수라는 개념을 도입했다.

화살표 함수는 실행 컨텍스트를 생성할 때 this 바인딩 과정 자체가 빠지게 되면서, 상위 스코프의 this를 그대로 활용할 수 있게 했다.

```jsx
var obj = {
  outer: function () {
    console.log(this)
    var innerFunc = () => {
      console.log(this)
    }
    innerFunc()
  },
}
obj.outer()
```

이렇게 하는 경우 두개 다 obj가 this로 나오게 된다. (상위 스코프의 this 그대로 사용)

### 콜백 함수 호출 시 그 함수 내부에서의 this

콜백 함수에 대해서 자세히는 chap4 에서 다룰 예정이다.

우선, 간단히 ‘함수 A의 제어권을 다른 함수 B에게 넘겨주는 경우 함수 A를 콜백 함수라고 한다.’

함수 A는 함수 B의 내부 로직에 따라 실행되며, this 역시 함수 B가 내부 로직에서 정한 규칙에 따라 값이 결정된다.

물론, 특별히 정의하지 않는 이상 콜백 함수 역시 함수이기 때문에 기본적인 함수와 마찬가지로 전역객체를 바라보게 된다.

### 생성자 함수 내부에서의 this

new 명령어와 함께 함수를 호출하면 해당 함수가 생성자로서 동작하게 된다.

**이때 내부에서 this를 이용하게 되면 새로 만들 구체적인 인스턴스 자신을 가리키게 된다.**

(자바랑 비슷한 듯)

```jsx
var cat = function (name, age) {
  this.bark = '야옹'
  this.name = name
  this.age = age
}

var choco = new Cat('초코', 7)
var nabi = new Cat('나비', 5)
```

### 명시적으로 this를 바인딩하는 방법

- **call 메소드**

  ```jsx
  Function.prototype.call(thisArg[, arg1[, arg2[, ...]]])
  ```

  call 메소드는 메소드의 호출 주체인 함수를 즉시 실행하도록 하는 명령이다.
  이때, 첫번째 인자를 this로 바인딩 하고, 이후의 인자들은 호출할 함수의 매개변수로 사용한다.

  ```jsx
  var func = function (a, b, c) {
    console.log(this, a, b, c)
  }

  func.call({ x: 1 }, 4, 5, 6)
  ```

  이렇게 하게 되면

  ```
  {x:1} 4 5 6
  ```

  **이렇게 출력된다. 즉, 첫번째 인자로 넣은 것을 this에 바인딩 하는 것이다.**

- **apply 메소드**
  call 메소드는 첫번째 인자를 제외한 나머지 인자들을 호출한 함수의 매개변수로 사용한 반면, apply는 두번째 인자를 배열로 받아 그 배열들의 요소들을 호출할 함수의 매개변수로 사용하는 점에서만 차이점이 있다.

  ```jsx
  var func = function (a, b, c) {
    console.log(this, a, b, c)
  }

  func.call({ x: 1 }, [4, 5, 6])
  ```

  출력은 똑같다.

- **생성자 내부에서 다른 생성자를 호출**
  생성자 내부에서 다른 생성자와 공통된 내용이 있을 경우 call, apply 를 사용하여 다른 생성자를 호출하면 반복을 줄이 수 있다. → Java의 상속처럼 동작할 수 있음.

  ```jsx
  function Person(name, gender) {
    this.name = name
    this.gender = gender
  }

  function Student(name, gender, school) {
    Person.call(this, name, gender)
    this.school = school
  }

  function Employee(name, gender, company) {
    Person.apply(this, [name, gender])
    this.company = company
  }
  ```

  자바로 표현하면

  ```java
  class Person {
      String name;
      String gender;

      Person(String name, String gender) {
          this.name = name;
          this.gender = gender;
      }
  }

  class Student extends Person {
      String school;

      Student(String name, String gender, String school) {
          super(name, gender);   // Person.call(this, name, gender)
          this.school = school;
      }
  }

  class Employee extends Person {
      String company;

      Employee(String name, String gender, String company) {
          super(name, gender);   // Person.apply(this, [name, gender])
          this.company = company;
      }
  }
  ```

  이렇게 표현될 수 있다.

- **bind 메소드**
  call과 비슷하지만, 즉시 호출하지 않고 넘겨받은 this 및 인수들을 바탕으로 새로운 함수를 반환하기만 하는 메소드
  bind 메소드는 함수에 this를 미리 적용시키는 것과 부분 적용 함수를 구현하는 두가지 목적을 가진다.

  ```jsx
  var func = function (a, b, c, d) {
    console.log(this, a, b, c, d)
  }
  func(1, 2, 3, 4) // window{...} 1 2 3 4

  var bindFunc1 = func.bind({ x: 1 })
  bindFunc1(5, 6, 7, 8) // {x:1} 5 6 7 8

  var bindFunc2 = func.bind({ x: 1 }, 4, 5)
  bindFunc2(6, 7) // {x:1} 4 5 6 7
  bindFunc2(8, 9) // {x:1} 4 5 8 9
  ```

  이처럼 `bindFunc1` 에 `func` 에 this를 지정한 새로운 함수가 담기게 된다.
  그리고 `bindFunc1` 을 호출하면 this가 지정된 것을 알 수 있다.
  다음으로 `bindFun2` 는 `func` 에 this를 지정하고, 부분 적용 함수를 구현한 것을 볼 수 있다.
  this와 파라미터로 넘길 값 두개를 적용한 것이다.

  > **bind 메소드를 적용해 만든 함수는 name 프로퍼티에 ‘bound’ 라는 접두어가 붙게 된다.
  > `func` 에 bind를 사용한 `bindFunc` 의 name 프로퍼티 → `bound func` 이 되게 된다.**

- **화살표 함수의 예외**
  화살표 함수는 실행 컨텍스트 생성시 this를 바인딩 하는 과정이 제외되었다.
  따라서, this가 존재하지 않으며 this에 접근하려 하면 스코프체인에서 가장 가까운 this에 접근하게 된다.
  내부함수를 화살표 함수로 활용하게 되면 복잡하게 this를 조작하기 위한 노력이 필요없을 것이다.
- **별도의 인자로 this를 받는 경우 (콜백 함수 내에서의 this)**
  참고로, 콜백 함수에 대해서는 다음 장에서 자세히 다룰 예정임.
  콜백 함수를 인자로 받는 메소드 중 일부는 추가로 this로 지정할 객체(thisArgs)를 인자로 지정할 수 있는 경우가 있다.
  주로, 배열 메소드에 많이 존재한다. → Set, Map 메소드에도 존재함

  ```jsx
  var report = {
    sum: 0,
    count: 0,
    add: function () {
      var args = Array.prototype.slice.call(arguments)
      // arguments는 예약어처럼 유사 배열 변수로 자동 선언된다고 함.
      // 다만 이제는 잘 쓰지 않고, ...args처럼 명시적인 형태로 받아서 사용하는 듯
      // 근데 arguments가 자동으로 들어가지는 것 보다
      // add에 ...args처럼 뭔가 받고 처리하는게 더 명시적인듯,,
      args.forEach(function (entry) {
        this.sum += entry
        ++this.count
      }, this)
      // 두번째 파라미터로 this를 넘겨주며, report가 this가 됨
    },
    average: function () {
      return this.sum / this.count
    },
  }
  report.add(60, 85, 95)

  // sum : 240 count : 3 average : 80
  ```

  → 이제는 화살표 함수를 주로 사용하게 되면서 `...rest` 문법을 더 권장하고 있다고 함.

  ```jsx
  const report = {
    sum: 0,
    count: 0,

    // 메서드 축약 문법 + ...args
    add(...args) {
      args.forEach((entry) => {
        this.sum += entry
        this.count++
      })
    },

    average() {
      return this.sum / this.count
    },
  }

  report.add(60, 85, 95)
  ```

### 정리

다음 규칙은 명시적 this 바인딩이 없는 한 늘 성립한다.

1. **전역공간에서 this는 전역객체를 참조한다.**
2. **어떤 함수를 메소드로서 호출한 경우 this는 메소드 호출 주체(메소드 앞의 객체)를 참조 `report.add()` 와 같이 호출**
3. **어떤 함수를 함수로서 호출한 경우 this는 전역객체를 참조 `add()` 와 같이 호출**
4. **콜백 함수 내부에서의 this는 해당 콜백 함수의 제어권을 넘겨받은 함수가 정의한 바에 따르며, 정의하지 않은 경우 전역객체를 참조**
5. **생성자 함수에서의 this는 생성될 인스턴스를 참조**

명시적 this 바인딩은 아래의 내용을 바탕으로 예측할 수 있다.

1. **call, apply 메소드는 this를 명시적으로 지정하면서 함수 또는 메소드를 호출**
2. **bind 메소드는 this 및 함수에 넘길 파라미터를 일부 지정해서 새로운 함수를 생성**
3. **요소를 순회하면서 콜백 함수를 반복 호출 하는 내용의 일부 메소드는 별도의 인자로 this를 받기도 함**

   ```jsx
   args.forEach(function (entry) {
     this.sum += entry
     ++this.count
   }, this)
   ```

   **위의 forEach는 호출하는 곳의 this를 사용하라고 2번째 파라미터로 넘겨주는 것을 볼 수 있음**

## \*참고) 펼치기 연산자(`…`)

apply를 활용해서 여러 인수를 하나의 배열로 전달할 수 있었지만, ES6부터 더 편한 방법을 제공하게 되었다.

펼치기 연산자 (spread operator)를 이용하면 더욱 간단하게 작성할 수 있다.

```jsx
const numbers = [10, 20, 3, 16]
const max = Math.max(...numbers)
const min = Math.min(...numbers)
console.log(max, min)
```

이 경우 numbers 배열 중 가장 큰 값과 작은 값을 찾아서 가져올 수 있다.
