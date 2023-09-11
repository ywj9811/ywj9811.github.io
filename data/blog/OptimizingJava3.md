---
title: Optimizing Java Chap3
date: '2023-07-20'
tags: ['JAVA', '스터디', '기술서적', Optimizing_Java]
draft: false
summary: Optimizing Java 3장 하드웨어와 운영체제
---
## 들어가며

자바 개발자가 왜 하드웨어에 관심을 가져야 할까

> 대량 생산한 칩상의 트랜지스터 수는 약 18개월마다 2배씩 증가한다. ‘무어의 법칙’
> 

위의 ‘무어의 법칙’에 따라 하드웨어가 발전해 나갔고, 이에 맞춰 소프트웨어 역시 복잡해졌다.

따라서 이러한 소프트웨어를 잘 활용하기 위해서 이해를 해야할 필요가 있다.

## 메모리

무어의 법칙에 따라 개수가 급증한 트랜지스터는 clock speed(클록 속도)를 높이는데 사용되었다.

하지만, 어느새 clock speed가 증가하자 프로세서 코어의 데이터 수요를 메모리가 맞추기 어려워졌다.

![image](https://github.com/JSON-loading-and-unloading/Optimizing-Java/assets/97458548/b21ee01d-6510-4729-ba9e-f844ac9534dd)

결국 clock speed가 증가해도 데이터가 도착할 때까지 CPU는 놀아야 하니 아무 소용이 없었다.

### 메모리 캐시

그래서 CPU 캐시가 고안되었다.

이는 CPU에 있는 메모리 영역으로 레지스터 보다는 느리고 메인 메모리 보다는 훨씬 빠르다.

즉, CPU가 메인 메모리를 재참조 하지 않을 수 있도록 사본을 떠서 CPU 캐시에 보관하자는 아이디어이다.

> 액세스 빈도가 높은 캐시일수록 프로세서 코어와 더 가까이 위치하는 식으로 여러 계층이 있다.
> 
- L1
- L2
- L3

L1, L2는 CPU 코어에 각각 전용으로 존재하고, 모든 코어가 공유하는 L3가 있는 것이다.

![image](https://github.com/JSON-loading-and-unloading/Optimizing-Java/assets/97458548/c72cac39-2b1a-473c-bc7e-f3abcfe327e0)

이러한 캐시 아키텍처를 통해 프로세서 처리율은 현저히 개선되었다.

하지만 메모리에 있는 데이터를 어떻게 캐시로 가져오고 캐시한 데이터를 어떻게 메모리에 다시 써야 하는지에 대한 문제가 있었고 이를 위해 **캐시 일관성 프로토콜(cache consistently protocol)** 이라는 방법으로 해결한다.

프로세서의 가장 저수준에서 MESI 프로토콜이 자주 눈에 띄는데 이는 캐시 라인 상태를 4가지로 정의한다.

- Modified(수정) : 데이터가 수정된 상태
- Exclusive(배타) : 이 캐시에만 존재하고 메인 메모리 내용과 동일한 상태
- Shared(공유) : 둘 이상의 캐시에 데이터가 들어 있고, 메모리 내용과 동일한 상태
- Invalid(무효) : 다른 프로세스가 데이터를 수정하여 무효한 상태

이는 멀티 프로세서가 동시에 공유 상태에 있을 수 있다는 말이기도 합니다.

하지만, 어느 한 프로세서가 베타나 수정 상태로 바뀌면 다른 프로세서는 모두 강제로 무효 상태가 됩니다.

![image](https://github.com/JSON-loading-and-unloading/Optimizing-Java/assets/97458548/29e75a1e-3dfe-45b3-bf91-01d176dfee91)

프로세서가 처음 나온 초창기에는 매번 캐시 연산 결과를 바로 메모리에 기록하는 **동시 기록(write through) 방식**을 사용했는데 이는 메모리 대역폭을 너무 많이 소모하는 등 효율이 낮아 이제는 사용하지 않는다.

이후 출시된 프로세서는 **후기록(write back) 방식**을 사용하는데 이는 캐시 블록을 교체해도 프로세서가 변경된 캐시 블록만 메모리에 수정하는 방식으로 메인 메모리로 되돌아가는 트래픽이 현저히 떨어지게 된다.

이론적으로 가능한 최대 전송률(burst rate)은 다음 인자에 따라서 결정이 된다.

- 메모리 클록 주파수
- 메모리 버스 폭(보통 64비트)
- 인터페이스 개수(요즘은 대부분 2개)

캐시 하드웨어의 작동원리를 나타낸 간단한 코드를 살펴보면 다음과 같다.

```java
public class Caching {

    private static final int ARR_SIZE = 2 * 1024 * 1024;
    private static final int[] testData = new int[ARR_SIZE];

    private void run() {
        System.err.println("Start: " + System.currentTimeMillis());
        
        for (int i = 0; i < 15_000; i++) {
            touchEveryLine();
            touchEveryItem();
        }
        System.err.println("Warmup finished: " + System.currentTimeMillis());
        System.err.println("Item Line");

        for (int i = 0; i < 100; i++) {
            long t0 = System.nanoTime();
            touchEveryLine();
            long t1 = System.nanoTime();
            touchEveryItem();
            long t2 = System.nanoTime();
            long elItem = t2 - t1;
            long elLine = t1 - t0;
            double diff = elItem - elLine;
            System.err.println(elItem + " " + elLine + " " + (100 * diff / elLine));
        }
    }

    private void touchEveryItem() {
        for (int i = 0; i < testData.length; i++) {
            testData[i]++;
        }
    }
		// 한번에 i가 16씩 뛴다. 2^22 까지
    private void touchEveryLine() {
        for (int i = 0; i < testData.length; i += 16) {
            testData[i]++;
        }
    }

    public static void main(String[] args) {
        Caching c = new Caching();
        c.run();
    }

}
```

위의 코드만 보면 `touchEveryItem()` 이 `touchEveryLine()` 메소드보다 16배 더 많이 일을 할 것이라 추측할 수 있다.

하지만 이와 같이 섣부른 직감으로는 JVM성능 문제를 잘못 판단할 수 있다.

![image](https://github.com/JSON-loading-and-unloading/Optimizing-Java/assets/97458548/798ab00e-0dbc-4418-aaac-e728de446f5a)

위의 그래프는 각 함수를 100회 실행한 결과로 ‘16배 더 일을 많이 할 것’ 이라는 추측은 틀린 것을 확인할 수 있다.

오히려 지배적인 영향을 미치는 곳은 **메모리 버스를 예열시키는 부분**으로 `touchEveryItem()` 과 `touchEveryLine()` 두 메소드를 이용해 배열 콘텐츠를 메인 메모리에서 캐시로 퍼 나르는 코드이다.

여기서는 이렇게 단순한 직감으로는 JVM 성능 문제를 판단해서는 안된다는 것까지만 알아보도록 하자.

## 최신 프로세서의 특징

### 변환 색인 버퍼(TLB)

변환 색인 버퍼(TLB)는 여러 캐시에서 아주 긴요하게 쓰이는 장치로 가상 메모리 주소를 물리 메모리 주소에 매핑하는 페이지 테이블의 캐시 역할을 한다.

### 분기 예측과 추측 실행

분기 예측(branch prediction)은 최신 프로세서의 고급 기법 중 하나로 프로세서가 조건 분기하는 기준값을 평가하느라 대기하는 현상을 방지하는 것이다.

최신 프로세서는 다단계 명령 파이프라인을 이용해 CPU 1사이클도 여러 개별 단계로 나누어 실행하므로 여러 명령이 동시 실행중일 수 있다.

이런 모델에서 조건문을 다 평가하기 전까지 분기 이후 다음 명령을 알 수 없는게 문제이다.

그러면 분기문 뒤에 나오는 다단계 파이프라인을 비우는 동안 프로세서는 여러 사이클동안 멎게 된다.

이러한 일을 방지하기 위해서 프로세서는 트랜지스터를 아낌없이 활용하여 가장 발생 가능성이 큰 브랜치를 미리 결정하는 휴리스틱을 형성하는데, 이는 마치 도박이라도 하듯 미리 추측한 결과를 바탕으로 파이프라인을 채우는 것이다.

물론 운 좋게 추측이 맞다면 CPU는 다음 작업을 진행할 수 있지만, 추측이 틀리면 부분적으로 실행한 명령을 모두 폐기하고 파이프라인을 비우는 대가를 치루긴 한다.

### 하드웨어 메모리 모델

“어떻게 하면 서로 다른 여러 CPU가 일관되게 동일한 메모리 주소를 액세서 할 수 있을까?” 이는 멀티코어 시스템에서 메모리에 관한 가장 근본적인 질문이다.

이에 대한 해답은 하드웨어에 따라 다르겠지만, JIT컴파일러인 javac와 CPU는 일반적으로 코드 실행 순서를 바꿀 수 있다.

물론 이 경우 실행 순서를 바꿔도 현재 스레드가 바라보는 결과는 아무런 영향이 없다는 전제가 필요하다.

```java
myInt = otherInt;
intChange = true;
```

위와 같은 경우 바껴도 스레드 입장에서는 상관이 없을 것이다.

하지만, 다른 스레드의 입장에서 바라보면 실행 순서가 변하게 되면 intChange는 true로 하지만 myInt는 이전 값을 바라볼 수 있다.

이런 종류의 순서 바꾸기 방식은 CPU아키텍처에 따라 조금씩 차이가 있다.

![image](https://github.com/JSON-loading-and-unloading/Optimizing-Java/assets/97458548/b5397de7-01c7-4555-aace-d59ab07415ed)

JMM은 프로세서 타입별로 상이한 메모리 액세스 일관성을 고려하여 명시적으로 약한 모델로 설계되었다.

따라서 멀티스레드 코드가 제대로 작동하게 하려면 Lock과 volatile을 정확히 알고 사용해야 한다.

이에 따라 최근 소프트웨어 개발자는 더 나은 성능을 얻기 위해 하드웨어 작동 원리를 깊이 이해하려고 노력하는 편인데 이를 마틴 톰슨은 **기계공감** 이라고 표현한다.

## 운영체제

OS는 여러 실행 프로세스가 공유하는 리소스 액세서를 관장하는 일을 주 임무로 다루고 있다.

메모리 관리 유닛(MMU)을 통한 virtual addressing 방식과 페이지 테이블(page table)은 메모리 액세스 제어의 핵심으로 한 프로세스가 소유한 메모리 영역을 다른 프로세스가 함부로 훼손하지 못하게 한다.

앞에 나온 TLB는 물리 메모리 주소 룩업 시간을 줄이는 하드웨어 기능이다.

물론 이러한 MMU는 개발자가 세부를 파악해서 직접 손대기에는 너무 저수준 영역이기 때문에 OS액세스 스케줄러를 자세히 살펴보겠다.

### 스케줄러

프로세스 스케줄러는 CPU 액세스를 통제한다.

이때 실행 큐라는 큐를 이용하는데, 최신 시스템은 거의 항상 가능한 수준보다 더 많은 스레드/프로세스로 가득하기 때문에 CPU 경합을 해소할 장치가 필요하다.

스케줄러는 인터럽트에 응답하고 CPU 코어 액세스를 관리한다.

![image](https://github.com/JSON-loading-and-unloading/Optimizing-Java/assets/97458548/5e6577fc-a9ea-4cbb-b02e-aaf3e781c943)

이는 Java의 생명주기를 나타내는 그림으로 OS스케줄러는 스레드를 시스템 단일 코어로 분주히 나르고 있다.

스케줄러는 할당 시간 끝 무렵에 실행 큐로 스레드를 되돌려서 큐의 맨 앞으로가 다시 실행될 때까지 대기시킨다.

스레드는 자신이 할당받은 시간을 자발적으로 포기할 수 있는데, `sleep()` 혹은 `wait()` 을 사용하여 대기 조건을 명시하면 된다.

OS는 그 특성상 CPU에서 코드가 실행되지 않는 시간을 유발하는데, 쉽게 간과하기 쉬운 OS의 특징이다.

자신의 할당 시간을 다 쓴 프로세스는 실행 큐 맨 앞으로 갈 때까지 CPU로 복귀하지 않는다.

CPU는 아껴 써야 하는 리소스임을 감안하면 좋지 않은 내용이다.

즉, 실제로 관측한 프로세스에서 나온 통계치는 시스템에 있는 다른 프로세스의 동작에도 영향을 받는다.

이런 jitter(원하는 신호와 실제 발생 신호간에 발생하는 차이)와 스케줄링 오버헤드는 측정 결과에 노이즈를 끼게 만든다.

스케줄러의 움직임을 확인하는 가장 쉬운 방법은 OS가 스케줄링 과정에서 발생시킨 오버헤드를 관측하는 것으로 아래 코드를 예시로 확인해보자.

```java
long start = System.currentTimeMillis();
for (int i = 0; i < 1_000; i++) {
    Thread.sleep(1);
}

long end = System.currentTimeMillis();
System.out.println("Millies elasped: " + (end - start) / 4000.);
```

위 코드는 1밀리초씩 총 1000회 스레드를 재운다.

스레드는 한번 잠들 때마다 실행 큐 맨 뒤로 이동하고 새로 시간을 할당 받을때까지 기다리므로 이 코드의 총 실행시간을 보면 스케줄링 오버헤드가 얼마나 될지 짐작할 수 있다.

물론 OS마다 결과는 천차만별이다. (유닉스는 대략 10~20%)

타이밍(timing)은 성능 측정, 프로세스 스케줄링, 기타 애플리케이션 스택의 다양한 파트에서 아주 중요하다.

그렇다면 자바 플랫폼은 타이밍을 어떻게 처리하는지 간략히 알아보도록 하자.

### 시간 문제

POSIX같은 업계 표준이 있어도 OS는 저마다 다르게 동작한다.

java의 OpenJDK에서는  `os::javaTimeMillis()` 를 사용하여 실제로 작업을 수행하고 java의 `System.currentTimeMillis()` 의 반환값을 공급하는 OS에 특정한 호출이 있다.

하지만 OS마다 위의 결과가 다른데, 이는 윈도우와 유닉스는 서로 다른 구조체를 사용하여 시간 경과를 다르게 기록하기 때문이다.

OS마다 상이한 것은 타이밍 뿐이 아니다.

### 컨텍스트 교환

OS 스케줄러가 현재 실행 중인 스레드/태스크를 없애고 대기중인 다른 스레드/태스크로 대체하는 프로세스인 컨텍스트 교환은 스레드 실행 명령과 스택 상태를 교체하는 모든 일에 연관이 되어 있다.

유저 스레드 사이 혹은 유저 모드에서 커널 모드로 변경되면서 일어나든 컨텍스트 교환 작업은 굉장히 비싼 작업이다.

특히 후자인 유저 모드에서 커널 모드로 변경이 되면서 발생하는 경우가 굉장히 큰 비용을 지불해야 한다.

왜냐하면 명령어와 다른 캐시를 모두 강제로 비워야 하기 때문이다.

커널 모드로 컨텍스트 교환이 이루어지게 되면 TLB를 비롯한 다른 캐시까지 모두 무효화 된다.

따라서 이 경우 커널 모드 교환의 여파는 유저 공간으로 다시 제어권이 넘어간 이후에도 지속된다.

![image](https://github.com/JSON-loading-and-unloading/Optimizing-Java/assets/97458548/5cdbfe29-28ea-4007-b1e9-8d492947f8c6)

위의 그림을 보면 얼마나 큰 비용이 지불되는지 알 수 있을 것이다.

리눅스는 이를 최대한 만회하기 위해 **가상 동적 공유 객체(virtual Dynamically Shared Object)** 라는 장치를 제공한다.

이는 굳이 특권모드가 필요 없는 시스템 콜의 속도를 높이기 위해 사용하는 유저 공간의 메모리 영역이다.

이를 통해 커널 모드로 컨텍스트 교환이 일어나지 않기 때문에 속도가 빠르다.

예를 들어 `gettimeofday()` 라는 유닉스 시스템에서 아주 흔히 쓰이는 시스템 콜이 있는데, OS가 인지한 ‘벽시계 시간’을 반환한다.

이는 커널 자료 구조를 읽어 시스템 클록 시간을 얻는데 이는 side effect를 일으키지 않기 때문에 실제로 privilleged access가 필요하지 않다.

이러한 경우 vDSO로 유저 프로세스의 주소 공간에 매핑시킬 수 있다면 커널 모드로 바꿀 필요가 전혀 없다.

비록 리눅스에서만 사용할 수 있지만 vDSO는 유용한 기법이다.

## 단순 시스템 모델

이번에는 단순한 시스템 모델을 예로 성능 문제를 일으키는 근원을 알아보도록 하자.

이 모델은 근본 서브시스템 OS측정값으로 나타낼 수 있고, 표준 유닉스 명령줄 툴의 출력 결과와 직접 연고나 지을 수 있다.

이 시스템 모델의 근본은 유닉스 계열 OS에서 동작하는 자바 어플리케이션의 단순한 개념으로 아래와 같은 컴포넌트로 구성된다.

- 어플리케이션이 실행되는 하드웨어와 OS
- 어플리케이션이 실행되는 JVM/컨테이너
- 어플리케이션 코드
- 어플리케이션이 호출하는 외부 시스템
- 어플리케이션으로 유입되는 트래픽

![image](https://github.com/JSON-loading-and-unloading/Optimizing-Java/assets/97458548/256e619d-bd3d-48f0-8351-e5baf99c5162)

이러한 구성으로 이루어진 어플리케이션에서, 어떤 구성품이라도 성능 문제를 일으킬 수 있다.

### 기본 감지 전략

어플리케이션이 잘 돌아가는 건 CPU사용량, 메모리, 네트워크, I/O 대역폭 등 시스템 리소스를 효율적으로 잘 이용하고 있다는 뜻이다.

따라서 성능 진단의 첫 단추는 어느 리소스가 한계에 다다랐는지 밝히는 것이다.

### CPU 사용률

CPU사용률은 어플리케이션 성능을 나타내는 핵심 지표이다.

CPU 사이클은 어플리케이션이 가장 갈증을 느끼는 리소스라 CPU의 효율적 사용은 성능 향상의 지름길이다.

또 부하가 집중되는 도중에는 사용률이 가능한 한 100%에 가까워야 한다.

> 어플리케이션의 성능을 분석할 때에는 시스템에 충분한 부하를 가해야 한다!
> 
- `vmstat`
- `iostat`

이 두가지는 기본적인 성능 측정을 위해 사용할줄 알아야할 필요가 있다.

![image](https://github.com/JSON-loading-and-unloading/Optimizing-Java/assets/97458548/fb89bf8a-4e6f-4258-b222-bceeda04d8a9)

위의 경우 `vmstat 1` 을 사용한 결과로 1초마다 한번씩 찍어 다음 줄에 결과를 표시하는 것이다.

이를 통해 성능 테스트를 수행하는 동시에 결과가 화면에 출력되는 모습을 확인할 수 있다.

1. proc: 실행 가능한(r) 프로세스, 블록킹된(b) 프로세스 개수
2. memory: swap memory, 미사용(free) 메모리, 버퍼로 사용한 메모리 (buff), cache memory가 표시된다.
3. swap: 디스크로 교체되어 들어간(swap-in) 메모리(si), disk에서 교체되어 빠져나온 메모리(swap-out) so 정보이다. 최신 머신은 스왑이 많이 일어나지 않는다.
4. io: block-in(bi), block-out(bo) 개수는 각각 블록(I/O) 장치에서 받은 512 bytes 블록, 블록 장치로 보낸 512 bytes 블록 개수이다.
5. system: 인터럽트(in), 초당 context switch 횟수(cs)
6. cpu: cpu 직접 연관된 지표를 CPU 사용률 %로 표시한다.
    
    us: 유저 시간
    
    sy: 커널 시간(system time)
    
    id: 유휴 시간
    
    wa: 대기 시간
    
    st: 도둑맞은 시간(vm에 할애된 시간)
    

---

리소스 워크로드는 CPU 사용률을 100%에 가깝게 유지하는 것이 목표이다.

즉, CPU 사용률이 측정 결과 100%에 근접하지 않았다면 왜 그런지 따져봐야 한다.

의도치 않은 컨텍스트 교환 혹은 I/O 경합이 일어나 블로킹이 발생했는지 알아봐야 한다.

하지만 `vmstat` 은 컨텍스트 교환 발생 횟수를 나타내기에 I/O 에서 블로킹이 일어났거나, 스레드 락 경합이 벌어졌을 가능성이 크다.

물론 `vmstat` 만으로 여러가지 경우의 수를 분간하기 어렵기 때문에 VisualVM과 같은 툴을 주로 사용하기도 한다.

### 가비지 수집

핫스팟 JVM은 시작 시 메모리를 유저 공간에 할당하고 관리하기 때문에 메모리를 할당하느라 시스템 콜을 할 필요가 없다.

따라서 GC를 위해 커널 교환을 할 일은 거의 없다.

따라서 어떤 시스템에서 CPU 사용률이 높게 나타난다면, GC는 주범이 아닐 확률이 높지만 어떤 JVM 프로세스가 유저 공간에서 CPU를 100% 가까이 사용하고 있다면 GC를 의심할 필요가 있다.

따라서 성능 분석 시 단순 툴에서 CPU 사용률이 100%로 일정하지만 모든 사이클이 유저 공간에서 소비되고 있다면 이것이 유저 코드일지 GC인지 확인해봐야 한다.

GC의 경우 로그를 확인하고 새 항목이 추가되는 빈도를 확인하는 것이 좋다.

JVM에서 GC로깅은 거의 공짜와 같기 때문에 분석용 데이터의 원천으로서도 가치가 높은 GC로그는 JVM프로세스에서 예외 없이 모두 기록해두는 것이 좋다.

### 입출력

파일 I/O는 예로부터 전체 시스템 성능에 암적인 존재였다.

하지만 다행히 자바는 단순한 I/O 만 처리한다.
또한 CPU, 메모리 어느 한쪽과 I/O를 동시에 고갈시키는 어플리케이션 은 거의 없다.

따라서 성능을 분석한다면 어플리케이션 에서 I/O가 어떻게 일어나는지 인지하는 것만으로도 충분하다.

### 커널 바이패스 I/O

이는 커널 을 이용해 데이터를 복사해 유저 공간에 넣는 작업이 비싼 고성능 작업인데, 그러다 보니 커널 대신 직접 네트워크 카드에서 유저가 접근 가능한 영역을 데이터를 매핑하는 전용 하드웨어/소프트웨어를 사용한다.

![image](https://github.com/JSON-loading-and-unloading/Optimizing-Java/assets/97458548/87605afb-de55-45d8-b847-be7aa0d1fab4)

이렇게 하면 커널 공간과 유저 공간 사이를 넘다드는 행위 "이중 복사"를 막을 수 있다.

그러나 자바는 이러한 구현체를 제공하지 않으므로 필요한 기능을 구현하려면 커스텀 라이브러리를 써야 한다.

유용한 기능이기 때문에 고성능 I/O가 필요한 시스템에서 일반적으로 구현한다.

지금까지는 베어 메탈(bare metal) 위에서 동작하는 OS를 다루었지만 요즘은 점점 시스템을 가상 환경에서 운용하는 사례가 늘어나고 있다.

따라서 가상화 기술의 등장으로 자바 어플리케이션 성능을 바라보는 엔지니어의 시각이 어떻게 근본적으로 달라질 수 있는지 보도록 한다.

### 기계 공감

기계 공감은 성능을 조금이라도 쥐어짜내야 하는 상황에서 하드웨어를 폭넓게 이해하고 공감할 수 있는 능력이 무엇보다 중요하다는 개념이다.

이는 발생할 수 있는 문제를 미리 이해하고 해결 방법을 찾는 능력이 있어야 하는 것이다.

## 가상화

가상화는 다양한 종류가 있지만 이미 실행 중인 OS위에 다른 OS사본을 하나의 프로세스로 실행시키는 모양새가 보통이다.

가상화 환경이 베어 메탈에서 실행되는 실제 OS 안에서 일개 프로세스로 작동하는 것이다.

![image](https://github.com/JSON-loading-and-unloading/Optimizing-Java/assets/97458548/02c875ca-9e7b-47b3-80a7-6c08ace106a3)

가상화의 특징은 아래 3가지로 요약할 수 있다.

1. 가상화 OS에서 실행되는 프로그램은 베어 메탈(실제 OS)에서 실행할 때와 동일하게 작동해야 한다.
2. 하이퍼바이저는 모든 하드웨어 리소스 액세스를 조정해야 한다.
3. 가상화 오버헤드는 가급적 작아야 하며 실행 시간의 상당 부분을 차지해서는 안된다.

추가로 몇가지 특징이 더 있는데, 실제 OS에서는 특권 모드로 동작하기에 하드웨어에 직접 접근할 수 있지만 가상화 시스템에서는 하드웨어에 직접 접근할 수 없다.

즉, 특권 모드가 아니기 때문에 대부분의 특권 모드의 명령어를 비특권 모드의 명령어로 고쳐서 사용한다.

이는 가상 환경 내에서 프로그램을 실행하는 것 자체가 성능 분석 및 튜닝을 한층 더 복잡하게 만드는 이유이다.

## JVM과 운영체제

JVM은 자바 코드에 공용 인터페이스를 제공하여 OS에 독립적인 휴대용 실행 환경을 제공한다.

하지만 스레드 스케줄링같은 아주 기본적인 서비스조차 하부OS에 반드시 액세스 해야 한다.

이런 기능은 native 키워드를 붙인 네이티브 메소드로 구현하는데 이러한 메소드는 C언어로 작성하지만 자바 메소드처럼 액세스할 수 있다.

이러한 작업을 대행하는 공통 인터페이스를 **Java Native Interface(JNI)** 라고 한다.

```java
public final native Class<?> getClass();
public native int hashCode();
protected native Object clone() throws CloneNotSupportedException;
public final native void notify();
public final native void notifyAll();
public final native void wait(long timeoutMillis) throws InterruptedException;
```

위와 같은 비교적 저수준의 플랫폼 관심사를 처리하는 메소드가 있을 때 시스템 시간을 조회하는 예시를 보도록 하자.

`os::javaTimeMillis()` 함수는 자바 정적 메소드 `System.currentTimeMillis()` 에 구현된 로직을 처리한다.

실제 코드는 C++로 작성되었지만 자바에서 C코드 bridge를 통해 액세스 할 수 있다.

그렇다면 핫스팟에서 이 코드는 실제로 어덯게 호출될까?

`System.currentTimeMillis()` 는 `JVM_CurrentTimesMillis()` 라는 JVM 엔트리 포인트 메소드에 매핑된다.

![image](https://github.com/JSON-loading-and-unloading/Optimizing-Java/assets/97458548/5217c79e-55ce-47f8-bc06-2acfd111cd2f)

위와 같은 방식으로 동작하게 되는 것이다.

---

## 실제 사용되는 캐시 (추가 공부)

### 캐시의 사전적 정의는 무엇일까

> 캐시(cache)는 컴퓨터 과학에서 데이터나 값을 미리 복사해 놓는 임시 장소를 가리키는 것이다. 캐시는 캐시의 접근 시간에 비해 원래 데이터를 접근하는 시간이 오래걸리는 경우 혹은 값을 다시 계산하는 시간을 절약하고 싶은 경우에 사용한다.
> 

**캐싱은** 이러한 캐시 작업을 하는 행위를 말한다.

그렇다면 반복적으로 사용되는 인스턴스 캐싱같은 경우는 어떤 경우에 사용할 수 있을까

→ **Java Wrapper Class**의 캐싱을 예시로 살펴보도록 하자.

### Java Wrapper Class

Java에서는 Primitive Type을 Reference Type으로 사용하기 위한 Wrapper Class가 있다.

근데 Wrapper Class를 왜 사용하는 것일까. (다시 한번 떠올리고 가자)

Primitive Type이 존재하는데 왜 사용하는 것일까?

코드를 작성하다 보면 다양한 라이브러리를 사용하는데, Java에서 제공하는 라이브러리 중 사용하기 위해 객체 타입이 필요한 경우가 종종 있다.

대표적으로 자바의 Collection 이 있다.

Collection의 List를 예시로 생각하면

```java
List<int> intList = new ArrayList<int>(); -> error
List<Integer> integerList = new ArrayList<Integer>(); -> ok
```

이렇게 List의 경우 타입을 명시해주기 위해 Generic을 사용하는데 Generic 안에 들어가는 값으로는 객체만 가능하다.

따라서 int와 같은 Primitive Type을 사용하게 되면 error가 발생하게 된다.

이러한 경우 int를 사용하기 위해 이를 감싼 Wrapper Class인 Integer를 사용할 수 있다.

이렇게 Primitive Type을 감싼 Wrapper Class를 통해 활용할 수 있는 것이다.

뿐만 아니라 Wrapper Class는 객체이기 때문에 null값을 받을 수 있다.

### Wrapper Class에서의 값 비교

인스턴스들은 각각의 주소를 가진다.

그렇다면 Wrapper Class로 생성한 값은 인스턴스이니 서로 다른 주소 값을 가지게 될 것이라고 추측할 수 있다.

그러면 Wrapper Class로 생성한 값을 비교하기 위해서는 `equals()` 를 사용해야 할까?

```java
public class test {
    public static void main(String[] args) {
        Integer i1 = 10;
        Integer i2 = 10;

        if (i1.equals(i2))
            System.out.println(true);
        else
            System.out.println(false);

       if (i1 == i2)
            System.out.println(true);
        else
            System.out.println(false);
    }
}
```

그렇다면 이 결과 `true` 그리고 `false` 이렇게 순서대로 나와야 맞을 것이다.

하지만 결과를 확인하면

```java
true
true
```

이렇게 나오는 것을 확인할 수 있다.

이전에 생각한 대로 되려면 Integer는 Wrapper Class 인스턴스이니 서로 다른 주소를 가져야 하는데, 동일한 주소를 가지고 있는 것이다.

### **이러한 일이 가능한 이유는 바로 캐싱이 있었기 때문이다.**

### Integer의 캐싱

`java.lang` 패키지의 Integer 소스를 확인해보면 신기한 소스가 있다.

```java
/**
 * Cache to support the object identity semantics of autoboxing for values between
 * -128 and 127 (inclusive) as required by JLS.
 *
 * The cache is initialized on first usage.  The size of the cache
 * may be controlled by the {@code -XX:AutoBoxCacheMax=<size>} option.
 * During VM initialization, java.lang.Integer.IntegerCache.high property
 * may be set and saved in the private system properties in the
 * jdk.internal.misc.VM class.
 */

private static class IntegerCache {
	static final int low = -128;
	static final int high;
	static final Integer[] cache;
	static Integer[] archivedCache;
	
	static {
		// high value may be configured by property
		int h = 127;
		String integerCacheHighPropValue =
		VM.getSavedProperty("java.lang.Integer.IntegerCache.high");
		if (integerCacheHighPropValue != null) {
			try {
					int i = parseInt(integerCacheHighPropValue);
					i = Math.max(i, 127);
					// Maximum array size is Integer.MAX_VALUE
					h = Math.min(i, Integer.MAX_VALUE - (-low) -1);
				} catch( NumberFormatException nfe) {
			// If the property cannot be parsed into an int, ignore it.
			}
		}
		high = h;
	
		// Load IntegerCache.archivedCache from archive, if possible
		VM.initializeFromArchive(IntegerCache.class);
		int size = (high - low) + 1;
	
		// Use the archived cache if it exists and is large enough
		if (archivedCache == null || size > archivedCache.length) {
			Integer[] c = new Integer[size];
			int j = low;
			for(int k = 0; k < c.length; k++)
				c[k] = new Integer(j++);
			archivedCache = c;
		}
		cache = archivedCache;
		// range [-128, 127] must be interned (JLS7 5.1.7)
		assert IntegerCache.high >= 127;
	}

	private IntegerCache() {}
}
```

위 코드와 주석을 확인하면 AutoBoxing을 서포팅해주는 캐시를 가지고 있다는 것을 알 수 있다.

<aside>
💡 참고로 AutoBoxing/AutoUnBoxing은

```java
Integer n1 = 1;
Integer n1 = new Integer(1);
int n2 = n1;
int n2 = n1.intValue();
```

위와 같은 작업을 자동으로 수행해주는 것이다.

</aside>

이어서 코드를 보면 low ~ high(기본값 -128 ~ 127) 사이의 value를 가지는 Integer 인스턴스를 미리 생성하고 있다는 것을 알 수 있다.

그리고 위의 `IntegerCache` 클래스를 사용하는 `valueOf()` 메소드는 다음과 같다.

```java
/**
 * Returns an {@code Integer} instance representing the specified
 * {@code int} value.  If a new {@code Integer} instance is not
 * required, this method should generally be used in preference to
 * the constructor {@link #Integer(int)}, as this method is likely
 * to yield significantly better space and time performance by
 * caching frequently requested values.
 *
 * This method will always cache values in the range -128 to 127,
 * inclusive, and may cache other values outside of this range.
 * 
 * @param  i an {@code int} value.
 * @return an {@code Integer} instance representing {@code i}.
 * @since  1.5
*/
@HotSpotIntrinsicCandidate
public static Integer valueOf(int i) {
	if (i >= IntegerCache.low && i <= IntegerCache.high)
		return IntegerCache.cache[i + (-IntegerCache.low)];
	return new Integer(i);
}
```

위 코드를 보면 만약 low와 high 사이의 값이 들어오면 새롭게 Integer를 생성하는 것이 아닌 기존에 캐싱해둔 인스턴스를 반환하는 것을 확인할 수 있다.

그럼 다시 한번 확인해 보도록 하자.

기본 값은 -128 ~ 127 이라고 하였으니 그 사이의 값이 Integer 인스턴스로 생성된다면 서로 다른 인스턴스라도 `==` 로 동작해야 하고 그 외의 값은 `==` 에 동작하지 말아야 한다.

```java
public class test {
    public static void main(String[] args) {
        Integer i1 = 1000;
        Integer i2 = 1000;

        if (i1 == i2)
            System.out.println(true);
        else
            System.out.println(false);

        Integer i3 = 10;
        Integer i4 = 10;

        if (i3 == i4)
            System.out.println(true);
        else
            System.out.println(false);
    }
}
```

위의 코드를 동작시키게 되면

```java
false
true
```

이러한 결과를 확인할 수 있다.

즉, 1000은 범위를 벗어낫기 때문에 새로운 인스턴스를 만들어 반환하였기 때문이고 10은 범위에 들어가기 때문에 캐싱해둔 값을 사용하기 때문이다.

이는 `valueOf(int i)` 를 사용하는 것을 알 수 있다.

> 물론 `new`를 통해 직접 생성하게 되면 `==` 를 사용하면 `false` 가 나온다.
> 

## 자바에서 반복적인 인스턴스에 캐싱하기

로또 번호를 만드는 코드를 짠다고 가정하자.

```java
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class LottoNumber {
    public static final int LOTTO_NUMBER_LOWER_BOUND = 1;
    public static final int LOTTO_NUMBER_UPPER_BOUND = 45;

    private final int number;

    public LottoNumber(final int number) {
        validate(number);
        this.number = number;
    }

    private void validate(final int number) {
        if (number < LOTTO_NUMBER_LOWER_BOUND || number > LOTTO_NUMBER_UPPER_BOUND) {
            throw new IllegalArgumentException("LottoNumber가 유효하지 않습니다.");
        }
    }
}
```

```java
import static lotto.domain.LottoNumber.*;

import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

public class LottoNumberGenerator {
    private static final int VALID_SIZE = 6;

    public static List<LottoNumber> generate() {
        return new Random().ints(LOTTO_NUMBER_LOWER_BOUND, LOTTO_NUMBER_UPPER_BOUND + 1)
                           .distinct()
                           .limit(VALID_SIZE)
                           .mapToObj(LottoNumber::new)
                           .collect(Collectors.toList());
    }
}
```

위의 코드를 보면 `LottoNumber`라는 Primtive Type의 포장 객체를 사용하고 있다.

그리고 `LottoNumber`를 총 6개씩 새로 만들어 로또 번호를 나타내는 `List`를 만들고 있는데, 이 경우 만약 1000명이 100장의 로또를 사게 되면 100,000장의 로또가 생성되어야 하며 결국 `LottoNumber` 인스턴스가 총 600,000개 생성되는 일이 발생한다.

이때 위와 같은 문제를 캐싱을 적용하여 해결할 수 있다.

```java
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class LottoNumber {
    public static final int LOTTO_NUMBER_LOWER_BOUND = 1;
    public static final int LOTTO_NUMBER_UPPER_BOUND = 45;
    private static final List<LottoNumber> CACHE = new ArrayList<>();

    static {
        for (int i = LOTTO_NUMBER_LOWER_BOUND; i <= LOTTO_NUMBER_UPPER_BOUND; i++) {
            CACHE.add(new LottoNumber(i));
        }
    }

    private final int number;

    public LottoNumber(final int number) {
        validate(number);
        this.number = number;
    }

    public static LottoNumber valueOf(final int number) {
        LottoNumber lottoNumber = CACHE.get(number-1);

        if (Objects.isNull(lottoNumber)) {
            lottoNumber = new LottoNumber(number);
        }
        return lottoNumber;
    }

    private void validate(final int number) {
        if (number < LOTTO_NUMBER_LOWER_BOUND || number > LOTTO_NUMBER_UPPER_BOUND) {
            throw new IllegalArgumentException("LottoNumber가 유효하지 않습니다.");
        }
    }
}
```

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class LottoNumberGenerator {
    private static final int VALID_SIZE = 6;

    public static List<LottoNumber> generate() {
        List<LottoNumber> lottoNumbers = new ArrayList<>(LottoNumber.values());
        Collections.shuffle(lottoNumbers);

        return lottoNumbers.subList(0, VALID_SIZE);
    }
}
```

이렇게 수정해주게 되면 LottoNumber의 범위 내에는 동일한 인스턴스를 반환하게 된다.

즉, 이전과 다르게 캐싱을 사용하여 수십만개의 LottoNumber를 생성하지 않고 45개만 사용할 수 있다.

참고

https://tecoble.techcourse.co.kr/post/2020-06-24-caching-instance/

https://feco.tistory.com/112