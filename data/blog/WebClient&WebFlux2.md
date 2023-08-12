---
title: WebClient와 Spring Webflux (2)
date: '2023-08-13'
tags: ['Spring boot', '기술']
draft: false
summary: Spring WebFlux와 Reactor객체
---
## Spring WebFlux란

Spring 5 에서 새롭게 추가된 모듈이다.

이는 client, server에서 **reactive 스타일의 어플리케이션의 개발을 도와주는 스프링 모듈**이라고 한다.

![Untitled](/static/images/webflux1.png)

## Spring WebFlux를 사용하는 이유

- 비동기 - non-blocking 방식의 리액티브 개발에 사용된다.
- 서버 프로그램이 효율적으로 동작해서 cpu, thread, memory에 자원을 낭비하지 않고 효율적으로 동작하는 고성능 웹 어플리케이션을 개발하는 것을 목적으로 한다.
- 서비스간 호출이 많은 **msa**에 적합

**Spring WebFlux는 Reactor library와 Netty를 기반으로 동작한다.**

그렇다면 Netty와 Reactor library는 무엇일까?

## Netty란

- Netty는 프로토콜 서버 및 클라이언트와 같은 네트워크 응용 프로그램을 빠르고 쉽게 개발할 수 있는 NIO (Non-Blocking Input / Output) 클라이언트 서버 프레임워크이다.
- TCP 및 UDP 소켓 서버와 같은 네트워크 프로그래밍을 크게 단순화하고 간소화한다.

### Netty의 장점

1. NIO 네트워크 기반 Netty 는 비동기식 이벤트 기반 네트워킹을 지원한다.
2. Tomcat 서버가 10,000건의 커넥션을 처리한다면, Netty는 NIO 방식으로 이벤트를 처리하기에 자원이 스레드를 계속 점유하며 Block 상태를 유지하지 않는다.
    
    → 100,000건에서 1,000,000건의 커넥션을 처리할 수 있다.
    
3. Netty의 경우 이벤트 기반 방식으로 동작하기에 Tomcat과 달리 Thread Pool의 스레드 개수는 머신의 Core 개수의 두배이다.
    
    → 스레드가 적다, 즉 경합이 적게 발생한다.
    

![Untitled](/static/images/webflux2.png)

### Netty의 구조

**핵심 컴포넌트는 아래와 같다.**

- **Channel**
    
    하나 이상의 입출력 작업을 수행할 수 있는 하드웨어 장치, 파일, 네트워크 소켓이나 프로그램 컴포넌트와 같은 Open된 Connection을 의미한다.
    
- **CallBack**
    
    다른 메소드로 자신에 대한 참조를 제공하는 메소드.
    
    → 이벤트를 처리할 때 Netty 내부적으로 콜백을 이용하는데, 이때 ChannelHandler 인터페이스를 통해 이벤트를 처리한다.
    
- **Future**
    
    작업이 완료 될 경우 어플리케이션에 알린다.
    
    이 객체는 비동기 작업의 결과를 담는 Placeholder의 역할을 한다.
    
    이때 ChannelFuture 인터페이스를 통해 결과값을 활용한다.
    
- **Event, Handler**
    
    Netty는 작업 상태의 변화를 알리기 위해 Event를 이용하고, 발생한 Event를 기준으로 Handler를 통해 트리커한다.
    
- **Event Loop**
    
    유저가 입출력을 요구할 경우의 흐름
    
    ![Untitled](/static/images/webflux3.png)
    
- **Pipe Line**
    
    이벤트 루프에서 이벤트를 받아 핸들러에 전달하는 역할
    
    ![Untitled](/static/images/webflux4.png)
    
- **Netty 핵심 플로우**
    
    즉, Netty의 핵심 플로우는 아래와 같이 이루어 진다.
    
    ![Untitled](/static/images/webflux5.png)

## Reactor Library란

> **Kakao Tech**
> 
> 
> [Reactor](https://projectreactor.io/)는 [Pivotal](https://pivotal.io/)의 오픈소스 프로젝트로, JVM 위에서 동작하는 논블럭킹 애플리케이션을 만들기 위한 리액티브 라이브러리입니다. Reactor는 [RxJava 2](https://github.com/ReactiveX/RxJava/tree/2.x)와 함께 [Reactive Stream](http://www.reactive-streams.org/)의 구현체이기도 하고, Spring Framework 5부터 리액티브 프로그래밍을 위해 지원되는 라이브러리입니다.
> 

> **리액티브 프로그래밍이란? (Reactive Programming)**
> 
> 
> (링크 참고 : https://devocean.sk.com/blog/techBoardDetail.do?ID=165099&boardType=techBlog )
> 

### Mono 와 Flux

- 리액터는 리액티브 스트림을 구현하는 라이브러리로 Mono와 Flux 2가지 데이터 타입으로 스트림을 정의한다.

**즉, Spring WebFlux를 사용하여 비동기적인 데이터 스트림의 처리를 Reator Library가 제공하는 데이터 타입인 Mono와 Flux로 다뤄야 한다는 것이다.**

- **Mono**
    
    0~1 개의 결과만 처리하기 위한 Reactor의 객체
    
    ![Untitled](/static/images/webflux6.png)
    
    이렇게 0~1개의 데이터 항목과 에러를 가진다.
    
- **Flux**
    
    0~N 개의 여러개 결과를 처리하기 위한 Reator 객체
    
    ![Untitled](/static/images/webflux7.png)
    
    이렇게 0~N 개의 데이터 항목과 에러를 가진다.
    

이러한 Mono와 Flux 모두 `Reative Stream`의 `Publisher` 인터페이스를 구현하고 있으며, Reactor에서 제공하는 풍부한 Operators의 조합을 통해 스트림을 표현할 수 있다.

> **필요시 참고**
> 
> 
> https://spring.io/blog/2016/06/13/notes-on-reactive-programming-part-ii-writing-some-code
>