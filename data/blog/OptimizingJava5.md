---
title: Optimizing Java Chap5
date: '2023-08-04'
tags: ['JAVA', '스터디', '기술서적']
draft: false
summary: Optimizing Java 5장 마이크로벤치마킹과 통계
---
## 들어가며

이 장에서는 자바 성능 수치를 직접 측정하는 내용을 자세히 살펴본다.

JVM은 자유분방한 특성 탓에 수치를 다루기가 만만치 않기에 정확하지 않은, 오해를 일으키기 쉬운 이상한 성능 수치가 인터넷에 떠도는 등 잠재적 위험을 이해하고 기준으로 삼을 수 있는 성능 수치만 산출하도록 안내하는 장이다.

## 자바 성능 측정 기초

성능 분석이 기초 실험과학 분야로 귀결된 다양한 기술 측면을 종합한 것이라고 이전에 설명했다.

즉, 벤치마크를 하나의 과학 실험처럼 바라보면 좋은 (마이크로)벤치마크를 작성하는데 큰 도움이 될 것이다.

```
📌 벤치마크(컴퓨팅): 컴퓨터의 부품 등의 성능을 프로그램을 이용하여 비교, 평가하여 점수를 내는 결과
```

우리는 벤치마크로 공정한 테스트를 하고자 한다. 즉, 가급적 시스템의 어느 한 곳만 변경하고 다른 외부 요인은 벤치마크 안에 두고 통제하면 좋겠다.

하지만 자바 플랫폼의 경우 벤치마크할 때 자바 런타임의 정교함이 가장 큰 문제이다.

따라서 어플리케이션 코드가 정말 정확히 투영된 성능 모델은 생성하기도 어렵고 적용 범위가 한정적이다.

즉, 자바 코드 실행은 JIT 컴파일러, 메모리 관리 그밖의 자바 런타임이 제공하는 서브 시스템과 완전히 떼어놓고 생각할 수 없으며 테스트 실행 당시의 OS, 하드웨어, 런타임 조건의 작용 또한 무시할 수 없다.

이와 같은 여러가지 작용은 보다 큰 단위 (전체 혹은 서브 시스템)으로 처리하여 상쇄시킬 수 있다.

반대로, 작은 규모로, 마이크로벤치마크를 할 때는 물밑에서 작동하는 런타임과 어플리케이션 코드를 확실히 떼어놓기가 힘든데, 이것이 마이크로벤치마킹이 어려운 이유이다.

```java
public class ClassicSort {
	private static final int N = 1_000;
	private static final int I = 150_000;
	private static final List<Integer> testData = new ArrayList<>();

	public static void main() {
		Random randomGenerator = new Random();
		for (int i = 0; i < N; i++) {
			testData.add(randomGenerator.nextInt(Integer.MAX_VALUE));
		}
		
		System.out.println("정렬 알고리즘 테스트");
		double startTime = System.nanoTime();

		for (int i = 0; i < I; i++) {
			List<Integer> copy = new ArrayList<>(testData);
			Collections.sort(copy);
		}

		double endTime = System.nanoTime();
		double timePerOperation = ((endTime - startTime) / (1_000_000_000L * I));
		System.out.println("결과 : " + (1/timePerOperation) + " op/s");
	}
}
```

이런 단순한 정렬에 대한 벤치마크를 살펴보자.

1. **이 경우 첫번째 문제는 JVM 웜업을 전혀 고려하지 않은 채 그냥 코드를 테스트 했다는 것이다.**
    
    운영계 서버 어플리케이션에서 이렇게 정렬을 실행하면 몇 시간, 심지어 며칠까지 걸릴 수 있지만, JIT컴파일러가 JVM에 내장된 덕분에 인터프리티드 바이트코드는 고도로 최적화된 기계어로 변환된다. JIT컴파일러는 메소드를 몇 번 실행한 후 곧바로 임무를 개시한다.
    
    따라서 이 테스트로는 운영계에서 어떻게 작동할지 모른다. 벤치마크 도중에 JVM이 메소드 호출을 최적화하느라 시간을 보낼테니 말이다.
    
2. **두번째 문제는 가비지 수집이다.**
    
    GC는 불확정적인 특성이 있어서 사람 마음대로 어떻게 할 수 없다.
    
    물론, GC를 요청하고 잠시 대기하고 실행하는 방법도 있겠지만, 시스템이 이 요청을 무조건 받아들인다는 확신도 없다.
    

이와 같이 단순한 정렬 알고리즘을 벤치마크 하는 경우도 자칫 벤치마킹 자체를 걷잡을 수 없는 방향으로 흘러가게 만드는데, 복잡도가 높아지면 상황은 더욱 안좋아질 것이다.

벤치마크 코드를 바로잡는 일은 대단히 복잡하고, 여러가지 요인을 고려해야 하는데 이에 대한 해결방안은 두가지가 있다.

1. **시스템 전체를 벤치마크 한다.**
    
    저수준 수치는 수집하지 않거나 그냥 무시하는 것이다. 수많은 개별 작용의 전체 결과는 평균을 내어 더 큰 규모에서 유의미한 결과를 얻는 것이다. 대부분 상황에서, 대부분의 개발자에게 필요한 접근 방식이다.
    
2. **앞서 언급한 많은 문제를 공통 프레임 워크를 통해 처리한다.**
    
    이렇게 하여 연관된 저수준의 결과를 의미있게 비교할 수 있다.
    
    이러한 툴에는 **JMH** 가 있다.
    

이제 **JMH**에 대해서 한번 살펴보도록 하자.

## JMH 소개

우선 순진하게 접근하면 마이크로벤치마킹이 얼마나 잘못되기 쉬운지, 그 이유는 무엇인지 한번 확인해보도록 하고 마이크로벤치마킹 대상으로 적합한 유스케이스를 분별하는 휴리스틱을 알아보도록 하자.

사실 대부분의 어플리케이션에 마이크로벤치마킹은 그다지 유용하지 않은 기술로 밝혀지는 경우가 많다.

책의 필자가 이전에 회사에서 경험한 일화를 소개해 주는데, 그 일화를 우선 보도록 하자.

- 책의 필자가 다니던 회사의 여직원이 며칠동안 같은 메소드를 바라보며 고민하고 있었다.
    
    그것을 바라보던 필자가 알아보니 그녀가 당시 새로 단장하고 있던 어플리케이션은 성능 문제가 곧 잘 터지곤 하여 많이 쓰는 라이브러리의 최신 버전을 이용해 차기 버전을 개발했지만 여전히 성능이 달라지지 않았던 것이다.
    
    그래서 그녀는 문제의 원인을 밝혀내고자 코드 일부를 들어내고 소규모 벤치마크를 작성하느라 시간을 보내고 있던 것이었다.
    
    하지만 그러한 ‘건초 더미에서 바늘 찾는 방식’ 은 아닌 것 같아 필자가 도와 그녀와 함께 접근 방식을 다르게 하였고 10분 동안 어플리케이션을 프로파일링 해보니 어플리케이션의 CPU 사용률이 정점을 찍고 있다는 사실을 알았으며 그 원인은 팀에 새로 들여온 인프라 라이브러리였던 것이다.
    
    **즉, 어플리케이션 코드는 전혀 문제가 없었던 것이다.**
    
    **이는 자바 성능 문제를 어떻게 다루어야 하는지 잘 보여준 무용담으로, 개발자는 큰 그림을 못 보고 자기 코드가 성능을 떨어뜨렸을 것이라는 강박관념에 사로잡혀 있는 문제를 보여준다.**
    

### 그렇다면 마이크로벤치마킹은 언제할까?

3가지의 주요 유스케이스를 제시해줄 수 있을 것 같다.

- **사용 범위가 넓은 범용 라이브러리 코드를 개발한다.**
    - 이 경우는 원래 적용 범위가 넓기 때문에 전통적인 성능/용량 테스트 기법 대신 마이크로벤치마킹을 쓸 수 밖에 없는 경우가 있다.
- **OpenJDK 또는 다른 자바 플랫폼 구현체를 개발한다.**
    - 플랫폼 개발자는 마이크로벤치마크의 핵심 사용 커뮤니티를 형성하는 사람들이다.
        
        💡JMH도 원래 OpenJDK 개발팀 본인들이 사용하려고 개발한 툴이었다.
        
- **지연에 극도로 민감한 코드를 개발한다. (저지연 거래)**
    - 자신이 개발한 어플리케이션과 극단적 유스케이스에 가장 잘 맞는 알고리즘/기법을 선택하기 위해 마이크로벤치마크를 활용하는 경우가 있을 수 있다.

사실 여기까지 종합하면 마이크로벤치마킹은 거의 쓸 일이 없는 고급 기법이다.

하지만 마이크로벤치마킹의 일부 기본 이론과 복잡성은 잘 알아두는게 좋다. 

### JMH 프레임워크

이제 JMH프레임워크에 대해서 알아보자.

이는 앞서 거론한 이슈들을 해소하고자 개발된 프레임워크다.

JMH는 JVM이 계속해서 새로운 최적화 기법을 통해 진화하는 것에 맞춰 버전별로 숨겨진 함정과 최적화 베어 트랩을 피할 수 있게 해준다.

따라서 개발자는 JMH 툴 사용법을 익히고 벤치마크 코드에만 전념하게 될 수 있다.

간단하게 살펴보면 JMH는 벤치마크 실행 경로에 복잡한 JVM 서브 시스템이 하나 더 끼어든다는 점을 해결하기 위해 벤치마크 코드에 어노테이션을 붙여 자바 소스를 추가 생성하는 식으로 작동한다.

그리고 벤치마크 프레임워크가 유저 코드를 엄청나게 반복 호출할 경우 루프 최적화를 수행할 경우를 대비하여 적절하게 반복 횟수를 설정한 루프 안에 감싸 넣는 방식으로 작동한다.

### 벤치마크 실행

우선 간단하게 단순 벤치마크를 설정하고 실행하는 단계를 살펴보자.

설정하고 실행하는 부분은 maven으로 작성이 되어있길래 아래에 gradle 버전으로 작성하고자 한다.

그럼 JMH가 작동하며 어떤 일을 해주는지 간략하게 보자.

일반적으로 JVM은 메소드 내에서 실행된 코드가 side effect를 일으키지 않는다면 그 결과를 사용하지 않을 경우 해당 메소드를 삭제 대상으로 삼는다.

이때 JMH는 이런 일이 없도록 벤치마크 메소드가 반환한 단일 결과 값을 암묵적으로 **블랙홀** (무시해도 좋을 정도로 성능 오버헤드를 낮추려고 JMH 프레임워크 제작자가 개발한 것)에 할당한다.

계산량이 많은 벤치마크는 메소드에서 결과를 조합해 반환하는 비용이 많이 드는데, 이럴 때 블랙홀을 매개변수로 받는 벤치마크를 작성하여 명시적으로 블랙홀을 벤치마크 안에 주입하면 된다.

이 블랙홀은 네가지 장치를 이용해 벤치마크에 영향을 줄 수 있는 최적화로 부터 보호한다.

1. **런타임에 죽은 코드를 제거하는 최적화를 못하게 한다.**
2. 반복되는 계산을 **상수 폴딩 (컴파일러가 컴파일 타임에 미리 계산 가능한 표현식을 상수로 바꾸어 처리하는 최적화 과정)**을 하지 않게 만든다.
3. **값을 읽거나 쓰는 행위가 현재 캐시 라인에 영향을 끼치는 잘못된 공유 현상을 방지한다.**
4. **쓰기 장벽으로 부터 보호한다.**

물론 이는 평상시 시스템 실행 중에는 일어나지 않는다.

```
📌 성능 분야에서 장벽이란

  일반적으로 리소스가 포화돼서 사실상 어플리케이션에 병목을 초래하는 지점을 가리킨다.

  쓰기 장벽에 이르면 캐시에 영향을 미치고 쓰기 전용 버퍼가 오염될 수 있을 것이다.
```

그래도 벤치마크가 최적화를 피해갈 수 있게 이런 보호 장치를 제공하려면 작성자 스스로가 JIT 컴파일러를 자세히 알고 있어야 한다.

## JVM 성능 통계

성능 분석은 진정한 실험과학이므로 결과 데이터 분포를 다루는 일은 필수이다.

성능 측정 또한 마찬가지로 어느 정도의 오차를 수반하는데, 어떤 오차의 유형이 있는지 알아보자.

### 랜덤 오차 (random error)

측정 오차 또는 무관계 요인이 어떤 **상관관계 없이** 결과에 영향을 미치는 것이다.

### 계통 오차 (systemic error)

원인을 알 수 없는 요인이 **상관관계 있는 형태**로 측정에 영향을 미친다.

**정확도**는 **계통 오차의 수준**을 나타내는 용어로, 계통 오차와 서로 반비례 한다.

**정밀도**는 **랜덤 오차의 수준**을 나타내는 용어로, 랜덤 오차와 서로 반비례 한다.


- **결과가 예측한 결과 값에 모두 모여서 나온다면 → 정확도와 정밀도가 모두 높은 것**

- **결과가 예측한 결과 값에서 벗어나지만 모두 모인다면 → 정확도는 낮으나 정밀도는 높은 것**

- **결과가 예측한 결과 값 주변이지만 흩어져 있다면 → 정확도는 높지만 정밀도는 낮은 것**

- **결과가 예측한 결과 값과 상관없이 모두 흩어져 있다면 → 정확도와 정밀도 모두 낮은 것**


**계통 오차의 경우는 어떤 것이 있을까**

JSON을 주고 받는 벡엔드 자바 웹 서비스의 성능 테스트를 수행한다고 가정해보자.

1. 결과 데이터를 보았을 때 그래프에서 한정된 서버 리소스가 선형적으로 조금씩 소모되고 있다면?

→ 메모리 누수가 발생하거나, 어떤 스레드가 요청 처리 도중 다른 리소스를 점유하여 놔주지 않는 상황일 것이다.

→ **이는 계통 오차가 발생하는 경우중 한가지일 것이다.**

1. 어떤 서비스들이 대부분 180 밀리초 안팎의 일정한 응답 시간을 보일 때

→ 분명히 요청을 접수해 처리하는 작업량은 서비스마다 제각각일 텐데 어떻게 이렇게 결과가 일정하게 나올까?

→ 120 ~ 150 밀리초 범위의 지연 시간이 특이점을 제외한 절대 다수의 서비스 응답 시간을 차지한 경우이다.

→ 이는 실제 응답 시간의 차이가 뭍혀버린 경우로 이또한 **계통 오차의 한 경우이다.**

**랜덤 오차의 경우는 어떤 것이 있을까**

랜덤 오차는 원인을 알 수 없는, 또는 예기치 못한 환경상의 변화 때문에 일어난다.

→ **즉, 랜덤 오차의 근원은 오로지 운영 환경 뿐이다.**

또 한가지 조심해야할 점이 있는데, 그것은 바로 **허위 상관**이다.

> **비슷하게 움직인다고 해서 이들 사이에 연결고리가 있다고 볼 수 없다.**
> 

라는 것으로 JVM 성능 분석 영역에서는 그럴싸해 보이는 연결고리와 상관관계만 보고 측정값 간의 인과관계를 넘겨짚지 않도록 조심해야 한다.

### 비정규 통계학

자바의 메소드 시간 분포의 경우 정규분포가 아닌 비정규 분포를 나타낸다.

![image](https://github.com/JSON-loading-and-unloading/Optimizing-Java/assets/97458548/6192502f-a02d-4d27-917d-685bc8184db0)

이러한 분포 형태는 우리가 JVM에 대해 직관적으로 알고 있는 것, 즉 모든 관련 코드가 이미 JIT 컴파일 되어 GC사이클이 없는 핫 패스의 존재를 시사한다.

이러한 JVM이 생성한 Long-tail 비정규 분포를 다룰 때에는 백분위 수 개념을 조금 변용하여 사용하면 좋다.

아래는 결과에서 평균, 90% 백분위 수를 차례로 구한 후 이후부터는 대수적으로 쭉 샘플링한 결과이다.

```
50.0% level was 23ns
90.0% level was 30ns
99.0% level was 43ns
99.9% level was 164ns
99.99% level was 248ns
99.999% level was 3,458ns
99.9999% level was 17,463ns
```

→ 게터 메소드 하나를 실행하는데 평균 23ns 걸리고 그 이후 1,000개의 요청당 하나는 실행 시간이 10^1배 정도 나빠지며 100,000 요청당 하나는 실행 시간이 10^2배 정도 나빠진다.

## 통계치 해석

HTTP 요청-응답을 측정한 히스토그램의 예시를 봤을 때 복잡한 모양이 나온다.

하지만 어린 왕자의 화자가 말하듯, 조금만 상상의 나래를 펼치고 분석하면 실제로는 매우 간단한 그림 조각 몇 개로 구성되어 있다는 것을 알 수 있을 것이다.

![image](https://github.com/JSON-loading-and-unloading/Optimizing-Java/assets/97458548/5ba7e69f-5b57-432f-8393-046fc84ac5b3)

사실 하나의 그림을 이렇게 3개로 나눌 수 있는데, 각각을 확인해 보면

- 보라색 : 클라이언트 오류 (4xx)
- 파란색 : 서버 오류 (5xx)
- 주황색 : 성공 요청 (2xx)

이렇게 복잡해 보이는 측정 값을 유의미한 하위 구성 요소들로 분해하는 개념은 아주 유용하다.

### 추가 자료 조사

- JMH - Gradle에 적용하는 방법 참고 URL
    
    [Gradle로 JMH 사용해보기](https://shirohoo.github.io/backend/java/2021-09-06-jmh-gradle/)
    
    [[Java] gradle 환경에서 JMH를 사용하여 벤치마킹하기](https://mong9data.tistory.com/131)