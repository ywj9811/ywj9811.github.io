---
title: Java에서 PriorityQueue(우선순위 큐)란 무엇이며 어떻게 사용하는 것일까
date: '2023-03-02'
tags: ['Java', '기술']
draft: false
summary: PriorityQueue에 대해서 알아보도록 하자
---

## Priority Queue(우선순위 큐)란 무엇일까?

일반적인 큐는 데이터를 일시적으로 쌓아두기 위한 자료구조로 **선입 선출(FIFO) 방식을 사용하는 자료 구조**이다.

하지만 우선순위 큐는 이와 약간 다르게 작동한다.
바로, **데이터의 우선순위를 정해서 우선순위가 높은 순서대로 나가는 방식의 자료구조인 것**이다.

이러한 우선순위 큐는 힙을 이용하여 구현하는 것이 일반적인 것으로 데이터를 삽입할 때 우선순위를 기준으로 최대 힙 혹은 최소 힙을 구성하고 데이터를 꺼낼 때 루트 노드를 얻어낸 뒤 루트 노드를 삭제할 때는 빈 루트 노드 위치에 맨 마지막 노드를 삽입한 후 아래로 내려가면서 다시 한번 정렬을 진행한다.

> **최대 값이 우선순위인 큐 = 최대 힙, 최소 값이 우선순위인 큐 = 최소 힙**

### 그렇다면 Priority Queue는 어떠한 특징을 가지고 있을까?

1. **높은 우선순위의 요소를 먼저 꺼내서 처리하는 구조이다. (큐에 들어가는 원소는 비교가 가능한 기준이 있어야 한다.)**
2. **내부 요소는 힙으로 구성되어 이진트리 구조로 이루어져 있다.**
3. **내부구조가 힙으로 구성되어 있기에 시간 복잡도는 O(NLogN) 이다.**
4. **우선순위를 중요시해야 하는 상황에서 쓰일 수 있다.**

### Priority Queue 선언하기

```java
//import
import java.util.PriorityQueue;

//int형 priorityQueue 선언 (우선순위가 낮은 숫자 순)
PriorityQueue<Integer> priorityQueue = new PriorityQueue<>();

//int형 priorityQueue 선언 (우선순위가 높은 숫자 순)
PriorityQueue<Integer> priorityQueue = new PriorityQueue<>(Collections.reverseOrder());

//String형 priorityQueue 선언 (우선순위가 낮은 숫자 순)
PriorityQueue<String> priorityQueue = new PriorityQueue<>();

//String형 priorityQueue 선언 (우선순위가 높은 숫자 순)
PriorityQueue<String> priorityQueue = new PriorityQueue<>(Collections.reverseOrder());
```

위와 같이 `PriorityQueue<Element> 이름 = new PriorityQueue<>();` 를 통해서 선언할 수 있다.

이때 기본으로 작은 값을 기준으로 우선순위가 부여되고 **만약 큰 값을 기준으로 우선순위를 가지고 싶다면 `Collections.reversOrder()` 메소드를 추가로 넣어주면 된다.**

### Priority Queue에 값 추가

```java
priorityQueue.add(1);
priorityQueue.add(2);
priorityQueue.offer(3);
```

위와 같이 큐에 **값을 추가하기 위해서는 `add(value)` 혹은 `offer(value)` 를 사용**하면 된다.
이 때 만약 값을 추가하는데 **성공하면 true를 반환**하고 큐에 여유 공간이 없어 삽입에 **실패한다면 IllegalStateException을 반환**하게 된다.

![Queue](/static/images/Queue/que1.png)

**만약 7이 들어온 경우 위와 같이 마지막에 우선 들어가게 된다.**

![Queue](/static/images/Queue/que2.png)

**그리고 부모와 비교해서 작다면 교환한다.**

![Queue](/static/images/Queue/que3.png)

**반복해서 부모와 비교 후 작지 않다면 교환을 멈춘다.**

이렇게 위와 같은 과정을 거쳐서 정렬되게 된다.

### Priority Queue의 값 삭제

```java
priorityQueue.poll()
//priorityQueue의 첫번째 값 반환 후 제거 만약 비어있다면 null반환
priorityQueue.remove()
//priorityQueue의 첫번째 값 제거
priorityQueue.clear()
//priorityQueue 초기화
```

우선순위 큐에서 **값을 제거하고 싶다면 `poll()` 혹은 `remove()` 메소드를 사용**하면 된다.

`clear()` 메소드 사용시 모든 요소가 제거되게 된다.

![Queue](/static/images/Queue/que4.png)

**루트와 마지막 노드를 스왑하고 기존의 루트를 뺀다.**

![Queue](/static/images/Queue/que5.png)

**삭제 후 자식 노드 두개를 비교**

![Queue](/static/images/Queue/que6.png)

**(최소 노드 기준) 최소 힙이기 때문에 더 작은 7을 부모와 비교**

![Queue](/static/images/Queue/que7.png)

**7이 더 작기 때문에 스왑**

![Queue](/static/images/Queue/que8.png)

**스왑 이후 자식을 기준점으로 다시 비교 -> 기준보다 자식이 더 크니 변경 X**

이러한 과정으로 삭제를 진행하며 삭제 이후 다시 정렬이 된다.

### Priority Queue에서 우선순위가 가장 높은 값 반환

```java
PriorityQueue<Integer> priorityQueue = new PriorityQueue<>();
//int형 priorityQueue 선언
priorityQueue.offer(2);
// priorityQueue에 값 2 추가
priorityQueue.offer(1);
// priorityQueue에 값 1 추가
priorityQueue.offer(3);
// priorityQueue에 값 3 추가
priorityQueue.peek();
// priorityQueue에 첫번째 값 반환 = 1
```

Priority Queue에서 **우선순위가 가장 높은 값을 반환하고 싶다면 `peek()` 메소드를 사용**하면 된다.

위의 경우에는 1, 2, 3중 우선순위가 가장 높은 1이 반환되게 된다.

### 만약 본인의 클래스 객체를 우선순위 큐에 담고 싶다면?

> **자신의 클래스를 생성할 때 `Comparable Interface`를 implement하며 `comareTo` 메소드를 우선순위에 맞게 구현해야 한다.**

**예시**

```java
class People implement Comparable<People> {
    String name;
    int age;

    public People(String name, String age) {
        this.name = name;
        this.age = age;
    }

    @Override
    public int compareTo(People people) {
        if (this.age > people.age>)
            return 1;
        else if (this. age < people.age)
            return -1;
        return 0;
    }
}

----------------------------------------------------------------------------------

public class Main {
    public static void main(String[] args) {
        PriorityQueue<People> priorityQueue = new PriorityQueue<>();

        priorityQueue.add(new Student("김철수", 20));
        priorityQueue.add(new Student("김영희", 100));
        priorityQueue.add(new Student("한택희", 66));
        priorityQueue.offer(new Student("이나영", 7));
        priorityQueue.offer(new Student("이혁", 43));
        priorityQueue.offer(new Student("안영희", 100));
    }
}
```

이렇게 되면 이나영, 김철수, 이혁, 한택희, 안영희, 김영희 순서로 객체가 정렬되어 들어가게 될 것이다.
