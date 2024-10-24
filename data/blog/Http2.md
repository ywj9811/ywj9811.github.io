---
title: HTTP/2.0 프로토콜 적용하기
date: '2024-10-25'
tags: ['HTTP', '기술']
draft: false
summary: HTTP/2.0 프로토콜 적용하기
---

## HTTP/1.0 와 HTTP/1.1 그리고 HTTP/2.0

### HTTP/1.0

HTTP/1.0은 가장 초기의 HTTP 프로토콜이다. (HTTP/0.9 도 있는 것으로 알지만, 너무나 제한적인 기능만을 제공하기 때문에 제외한다)

HTTP는 TCP 기반으로 사용되게 되는데, 따라서 HTTP 통신을 위해서는 TCP 연결이 필요하다.

네트워크를 공부하면 TCP 연결은 3-way-handshaking 작업을 필요로 한다는 것을 알 수 있을 것이다.

HTTP는 위와같은 특징을 가지는 TCP를 사용하기 때문에 HTTP 통신을 위해서 TCP의 연결을 하는 작업을 가지게 된다.

**이렇게 HTTP 1개당 TCP 연결 1번을 수행하는 것이 HTTP/1.0의 특징이라고 할 수 있다.**

즉, 한계점은 다음과 같다.

1. HTTP 통신을 위해서 매 요청마다 새로운 TCP 연결이 필요하며, 이로 인해 오버헤드가 커지게 된다.
2. TCP 연결 한번에 하나의 요청만 처리 가능하며 여러 요청을 처리하기 위해서는 여러개의 TCP 연결이 필요하게 된다. (1번으로 연결)

### HTTP/1.1

HTTP/1.1 은 HTTP/1.0 의 한계였던 HTTP 와 TCP가 1:1 관계로 작동한다는 것을 해결했으며, 현재도 가장 많이 사용되는 프로토콜 버전으로 알려져있다.

바로, Keep-Alive 를 기본으로 활성화하기 때문이다.

Keep-Alive란, 하나의 TCP 연결을 재사용하여 여러 요청을 처리하는 것이다.

이 외에도, 파이프라이닝 기법을 통해 응답을 기다리지 않고 여러 요청을 연속적으로 보낼 수 있다는 것과 캐싱 메커니즘의 강화와 청크 단위로 데이터를 여러 조각으로 전송하는 등 다양한 방면에서 수정이 이루어졌다.

![image.png](/static/images/http2/http1.png)

하지만, 이러한 HTTP/1.1 에도 한계점이 존재한다.

1. **Head of Line Blocking(HOL Blocking) 이 발생한다.**
    
    1개의 TCP 연결에서 HTTP 요청을 여러개 보내는 경우, 앞의 요청이 응답되지 않으면 뒤의 요청이 불가능해진다는 문제이다.
    
2. **파이프라이닝의 응답 순서 보장 문제**
    
    위의 HOL Blocking을 파이프라이닝을 통해 해결할 수 있을 것 같다고 보이기도 한다.
    
    물론, 위에서 언급한 파이프라이닝 기법을 통해 앞선 요청의 응답이 오지 않아도 뒤의 요청을 할 수 있도록 개선할 수 있지만, 앞선 응답이 오지 않는다면 뒤의 요청에 대한 응답은 처리할 수 없다는 한계점이 여전히 존재한다.
    
    **또한, 파이프라이닝의 지원이 완벽하지 않았고, 기대하는 만큼 성능 개선이 되지 않기 때문에 널리 사용되지 않았고 HOL Blocking은 여전히 존재하게 된 것이다.**
    

### HTTP/2.0

HTTP/2.0 은 2015년 IETF에서 공식적으로 발표된 HTTP/1.1의 차기 버전이다.

이는 1.1 버전의 내부적인 통신 구조를 다른 개념으로 송두리째 바꿔버려, 웹 응답 속도가 HTTP/1.1 보다 15~50% 향상되었다고 한다.

위에서 살펴본 것과 같이 HTTP/1.1 의 경우 한번에 하나의 파일만 전송이 가능했다. 물론, 파이프라이닝 기법이 있었지만 HOL Blocking 문제가 있었고, 널리 사용되지도 않았다.

**하지만, HTTP/2.0 은 여러 파일을 한번에 병렬로 전송이 가능하다.**

![image.png](/static/images/http2/http2.png)

HTTP/2.0 의 개선점을 살펴보자.

- **Binary Framing Layer**
    
    HTTP/1.1 에서는 HTTP 메시지가 text로 전송되었지만, HTTP/2.0 에서는 binary frame으로 인코딩 되어서 전송된다.
    
    그리고, HTTP 헤더와 바디의 구분도 개행 문자로 구분되는 것이 아닌, layer로 구분된다.
    
    이러한 점은 데이터 파싱 및 전송 속도를 증가시켜주었고, 오류 발생 가능성 또한 낮춰주었다.
    
    ![image.png](/static/images/http2/http3.png)
    
- **Stream과 Frame 단위**
    
    HTTP/1.1 은 HTTP 요청과 응답이 text 메시지 단위로 구성되어 있었다.
    
    HTTP/2.0 은 메시지라는 단위 외에 Frame, Stream이라는 단위가 추가되었다.
    
    1. Frame : 통신의 최소 단위이며, Header 혹은 Data가 들어있다.
    2. Message : HTTP/1.1 과 마찬가지로 요청 혹은 응답의 단위이며 다수의 Frame으로 이루어진 배열 라인이다.
    3. Stream : 연결된 Connection 내에서 양방향으로 Message를 주고 받는 하나의 흐름이다.
    
    HTTP/2.0 은 HTTP 요청을 여러개의 Frame으로 나누고, 이 Frame들이 모여 요청/응답 Message가 되고, Message는 특정 Stream에 속하며, 여러개의 Stream은 하나의 Connection에 속하는 구조가 된다.
    
    **이러한 모든 Stream은 단일 TCP Connection 내에서 다중화되어 병렬 처리된다. (Multiplexing)**
    
    ![image.png](/static/images/http2/http4.png)
    
- **MultiPlexing**
    
    HTTP/1.1 까지는 요청/응답을 순서대로 처리해야 한다는 문제가 있었고, 이로 인해 병렬 처리를 할 수 없었다.
    
    **하지만 HTTP/2.0은 위에서 살펴본 것과 같이 여러개의 Stream을 하나의 TCP Connection 내에서 병렬 처리하는 기법인 Multiplexing 기법을 도입했다.**
    
    ![image.png](/static/images/http2/http5.png)
    
- **Sever Push**
    
    HTTP/2.0에서는 클라이언트의 요청에 대해 미래에 필요할 것 같은 리소스를 미리 보낼 수 있다.
    
- **Stream Prioritization**
    
    HTTP/1.1 은 HOL Blocking 문제가 있다고 했었다.
    
    이는 순서가 중요한데 이를 해결할 방법이 없기 때문에 발생한 문제였는데, HTTP/2.0 에서 또한 위에서 살펴본 것과 같이 Multiplexing을 이용하면 요청과 응답이 뒤섞여 패킷 순서가 엉망이 될 수 있다.
    
    HTTP/2.0은 Stream들에 우선순위를 지정하여 문제를 해결할 수 있다.
    
- **HTTP Header Data Compression**
    
    HTTP/1.1 에서 헤더는 아무런 압축 없이 그대로 전송되었으며, 연속적으로 요청되는 HTTP 메소드들에게서 헤더 값이 중복되는 부분이 많아 메모리가 낭비되기도 하였다.
    
    HTTP/2.0 은 헤더를 압축하여 전송하며, 이전 Message의 헤더 중 중복되는 필드를 재전송하지 않도록 하여 낭비를 줄일 수 있다.
    

이러한 HTTP/2.0 또한 해결하지 못한 문제가 있다.

바로, TCP 자체에서 발생하는 HOL Blocking 문제이다.

L4 계층인 HTTP에서 HOL Blocking 문제를 해결해도, L3 계층인 TCP에서 발생하는 HOL Blocking 문제는 해결하지 못하기 때문이다.

이는 HTTP/2.0 또한 TCP를 기반으로 통신을 하기 때문이다.

![image.png](/static/images/http2/http6.png)

### 추가 : HTTP/3.0

HTTP/2.0에서 여전히 문제가 발생하는 것은 TCP 기반의 통신이기 때문이다.

2022년 IETF에서 공식적으로 발표된 버전으로, 아예 UDP 기반 통신을 채택한 방식이다.

정확히는 UDP를 개조한 QUIC라는 프로토콜을 사용한다고 한다.

이러한 QUIC는 보안 세션을 설정하기 위해 한번의 핸드쉐이크만 필요하다고 한다.

![image.png](/static/images/http2/http7.png)

이러한 HTTP/3.0은 다음과 같은 개선점을 가지고 있다.

- **TCP의 HOL Blocking 문제 해결**
    
    HTTP/2.0 또한 HTTP에서 발생하는 HOL Blocking 문제를 해결했었다. 하지만, TCP 자체에서 발생하는 문제는 해결하지 못했었다.
    
    HTTP/3.0 은 TCP 기반이 아닌 QUIC (UDP 기반)을 채택하여 HOL Blocking을 근본적으로 해결하게 되었다.
    
- **TLS 1.3 기본 포함**
    
    HTTP/3.0 에서는 암호화가 기본으로 내장되어 빠르고 안전한 연결이 가능하도록 했다.
    

하지만, 활성화된지 아직 많이 지나지 않음 프로토콜이기 때문에 네트워크 장비의 지원 문제가 발생할 수 있고, 모든 브라우저와 서버에서 아직 지원되지 않을 가능성이 존재하기도 한다.

따라서 HTTP/2.0 으로 충분한 상황이라면 장기적으로 HTTP/3.0 도입을 고려하며 진행하는 것이 좋을 것 같다.

---

## HTTP/2.0 적용하기

크롬을 사용한다면, 개발자 모드에서 네트워크의 프로토콜 옵션을 켜서 확인할 수 있다.

‘대학원 김선배’ 서비스의 개발 서버와 운영 서버 두가지를 확인해보았는데, Nginx를 사용하지 않는 개발 서버에서는 HTTP/2.0 을 기본으로 사용하고 있었지만, Nginx 에서 리버스 프록시를 수행하는 운영 서버는 HTTP/1.1 을 사용하고 있었다.

따라서 Nginx에서 HTTP/2.0 으로 프로토콜을 수정해서

클라언트 → Nginx 의 단계를 HTTP/2.0 으로 수정하고자 한다.

```prolog
events {
    worker_connections 1024;
}

http {

    upstream backend {
        server 도메인:8080;
    }
    access_log /var/log/nginx/access.log;
    client_max_body_size 10M;

    server {
        listen 80;
				server_name 도메인;
				server_tokens off;
			
				return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
				server_tokens off;
        server_name 도메인;

		# 인증서 설정
        ssl_certificate 인증서 경로;
        ssl_certificate_key 인증키 경로;

        location / {
            proxy_pass http://backend;
						proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
    	}
    }
}
```

기존의 `nginx.conf` 는 위와 같이 작성되어 있다.

80으로 요청이 들어오면, 443으로 리다이렉트를 하고, 443 요청은 Nginx에서 8080 포트로 보내버리는 방식이다.

이렇게 설정된 Nginx는 가장 안정적이고 오래된 프로토콜인 HTTP/1.1 을 기본으로 사용한다.

따라서 HTTP/2.0 을 사용하기 위해서는 명시적으로 활성화를 시켜줘야 한다.

방법은 간단하다.

> **우선, HTTP/2.0 의 경우 SSL/TLS 설정이 거의 필수이기 때문에 Nginx 에서도 SSL/TLS 설정이 필요하다.
나의 경우 기존에도 설정이 되어 있었기 때문에 그대로 진행할 수 있다.**
> 

```prolog
events {
    worker_connections 1024;
}

http {

    upstream backend {
        server 도메인:8080; # blue
    }
    access_log /var/log/nginx/access.log;
    client_max_body_size 10M;

    server {
        listen 80;
				server_name kimseonbae-api.com;
				server_tokens off;
		
				return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2; #HTTP/2 활성화
				server_tokens off;
        server_name 도메인;

				# 인증서 설정
        ssl_certificate 인증서 경로;
        ssl_certificate_key 인증키 경로;
        include /etc/letsencrypt/options-ssl-nginx.conf;

        location / {
            proxy_pass http://backend;
						proxy_http_version 1.1;
            proxy_set_header Connection "";
						proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
    	}
    }
}
```

위와 같이 설정을 변경해 주었는데,

`listen 443 ssl http2;` ****이 부분이 추가되면 되는 것이다.

### Nginx에서는 upstream에 HTTP/2.0 을 제공하지 않는다.

위의 설정을 살펴보면, upstream에는 HTTP/2.0 을 설정하지 않는다.

왜냐하면 Nginx는 upstream에 HTTP/2.0 을 제공하지 않는다고 한다.

Nginx는 클라이언트에 대해서만 HTTP/2.0 을 제공하고 있다.

![image.png](/static/images/http2/http8.png)

이러한 형태로 구성되어 있는 나의 경우 Nginx에서 Spring으로 보내는 상황에서는 내부적으로 HTTP/1.1을 사용해야 하는 것이다.

![image.png](/static/images/http2/http9.png)

이렇게 변경되는 것이다.

**그렇다면, HTTP/2.0 으로 둘 다 사용하는게 더 성능 향상에 도움이 되지 않을까? 하는 생각이 들게 된다.**

클라이언트와 Nginx 사이에는 HTTP/2.0를 사용하면 큰 효과를 기대할 수 있지만,

Nginx와 백엔드 서버 사이에는 HTTP/1.1 을 사용해도 충분히 빠를 수 있기에 Nginx에서는 upstream HTTP/2.0 을 제공하지 않는다고 한다.

https://stackoverflow.com/questions/77277958/does-nginx-support-http2-over-upstream-servers

---

## HTTP/2.0 도입과 HTTP/3.0 도입

기존에는 Nginx에서 별도의 설정을 추가하지 않아서 HTTP/1.1 이 사용되고 있었다.

HTTP/1.1 에서 HTTP/2.0 으로의 버전 업은 상당한 성능 개선을 기대할 수 있다고 하며, Nginx에 단순히 코드 몇줄을 추가하는 것으로 설정이 가능하다.

따라서, HTTP/2.0 으로 변경하는 것은 좋은 선택이라고 생각하였고, 바로 어렵지 않게 버전 업을 할 수 있었다.

하지만, HTTP/3.0 의 경우 현재 운영중인 서비스에서 HTTP/2.0 으로 충분히 기대하는 성능을 보여주고 있다는 점과, 인프라 구성에 대한 점검과 좀 더 많은 설정이 필요하지만 담당 인원이 1명이라는 점을 고려한다면 당장은 도입할 필요가 없다고 생각해서, 미루게 되었다.

어찌 되었든 이번에는 HTTP 버전별 특징을 다시 한번 살펴보고, 기존에 사용되던 HTTP/1.1 을 HTTP/2.0 으로 변경하는 과정을 살펴보았다.