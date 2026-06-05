---
title: CKAD-기본기 다지기 2편
date: '2026-05-28'
tags: ['기술', 'CKAD', 'kubernetes']
draft: false
summary: CKAD 준비를 위한 기본기 2편
---
## Controller

### Replication Controller

- 왜 필요할까?
    
    **1. 고가용성 보장**
    
    if) 단일pod으로 구성된 경우 어떠한 이유에 의해 사용자가 애플리케이션에 대한 액세스 권한을 잃는 것을 방지하기 위해서 둘 이상의 인스턴스 또는 pod을 동시에 실행하려고 함
    
    그렇게 되면 한쪽이 실패하더라도 다른 쪽에서 계속해서 실행할 수 있음
    
    Replication Controller는 쿠버네티스 클러스터에서 단일 Pod의 여러 인스턴스를 실행하는 것에 도움을 주며 이를 통해 고가용성을 제공함
    
    → 그렇다면 단일 Pod에서는 사용할 수 없나?
    
    **아님. 만약 고장나면 Replication Controller는 기존 Pod의 장애 발생시 자동으로 새로 생성하여 도움을 줄 수 있음**
    
    **2. 로드밸런싱 및 스케일링**
    
    사용자가 증가하면, 추가 Pod을 배포하여 두 Pod 간의 부하를 분산시킬 수 있다.
    
    만약, 추가로 사용자가 더 증가해 첫번째 노드의 리소스가 부족해진다면 다른 노드에 추가로 Pod을 배포하여 여러 노드를 걸쳐 부하를 분산시키며 확장할 수 있다.
    

### Replication Controller vs ReplicationSet

같은 목적을 가지고 있지만 같은 것은 아니다.

**다만, Replication Controller는 ReplicaSet 으로 대체될 수 있다.**

### Replication Container 만들기

```yaml
apiVersion: v1
# Replication Controller는 v1만 지원이 된다.
kind: Replication Controller
metadata:
	name: myapp-rc
	labels:
		app: myapp
		type: back-end
# 여기까지는 Pod 생성이랑 유사하다.

# spec 작성이 가장 중요하다.
# 객체 내부의 내용을 정리하는 부분이다.
spec: 
	template: # 복제본을 만들 때 사용할 Pod 템플릿을 제공해야 한다.
	# apiVersion과 kind를 제공한 내용이 들어가야 한다.
		metadata:
			name: myapp-pod
			labels:
				app: myapp
				type: back-end
		spec:
			containers:
				- name: nginx-container
					image: nginx
	# 어떤 Pod을 올릴지는 작성했지만, 얼마나 많은 복제본이 필요한지 적지 않음
	replicas: 3
```

```bash
kubectl create -f myapp-rc
# Replication Controller를 통해 3개의 Pod 생성

kubectl get replicationcontroller
# 어떤 ReplicationController가 실행 중인지
# 원하는 Replica 혹은 Pod의 수
# 현재 Replica 수
# 준비된 Replica 수

kubectl get pod
# 이때 3개가 나오는데, 모두 myapp-rc 로 시작하는 것을 확인할 수 있음
```

## ReplicaSet

**사실 이제는 Replication Controller가 아닌 ReplicaSet을 사용할 것이다.**

![image.png](/static/images/kube/kube7.png)

### ReplicaSet 만들기

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
	name: myapp-replicaset
	labels:
		app: myapp
		type: back-end

spec: 
	template: 
		metadata:
			name: myapp-pod
			labels:
				app: myapp
				type: back-end
		spec:
			containers:
				- name: nginx-container
					image: nginx
	replicas: 3
	# replcaSet에서는 selector라는 섹션이 필요함
	selector: 
		matchLabels:
			type: back-end
	# selector에서는 아래에 지정된 레이블을 Pod의 레이블과 일치시키기만 하면 된다.
	# 이를 통해서 중요한 기능을 사용할 수 있다. -> 아래 설명
```

```yaml
kubectl create -f replicaset-definition.yml
# 마찬가지

kubectl get replicaset
# 마찬가지

kubectl get pods
```

**ReplicaSet에서 selector와 label**

ReplicaSet은 Pod의 목록에서, 원하는 Pod이 원하는 개수만큼 항상 유지되도록 도와준다.

즉, 3개의 Pod을 생성한다면 언제나 3개의 Pod이 존재할 수 있도록 구성하는 것으로 Selector에 일치하는 이미 생성된 기존 Pod가 있는 경우에도 함께 모니터링 할 수 있다.

```yaml
replicas: 3
selector: type=back-end

현재 클러스터에서 type=back-end 라벨을 가진 Pod 개수를 확인한다.

0개라면 → template을 기준으로 Pod 3개 생성
1개라면 → template을 기준으로 Pod 2개 생성
3개라면 → 아무것도 안 함
4개라면 → 1개 삭제해서 3개로 맞춤
```

다만 type 하나만으로 확인하기 때문에 조금 더 구체적으로 사용하는게 좋다.

```yaml
selector:
  matchLabels:
    app: myapp
    type: back-end
```

### ReplicaSet관련 명령어

```yaml
kubectl create -f file.yml
# 없던 리소스를 새로 생성 

kubectl replace -f file.yml
# 이미 있는 리소스를 파일 내용으로 수정 (이전 vi를 통해 수정한 경우)
# 3 -> 6 으로 바꾸면 6개의 Pod으로 설정이 바뀐다.

kubectl apply -f file.yml
# 없으면 생성, 있으면 변경사항 적용
# 3 -> 6 으로 바꾸면 6개의 Pod으로 설정

kubectl scale --replicas=6 -f replicaset-definition.yml
# 파일 이름을 통해 수정할 수 있는데, 이 경우 파일의 내용은 변하지 않는다.
# 3이 유지되기 때문에 replace, apply 사용시 다시 3으로 된다는 것을 유의해야 한다.
```

## Deployment

![image.png](/static/images/kube/kube8.png)

배포를 할 때 여러개의 Pod이 인스턴스들을 가지고 존재할 것이고, 해당 Pod들은 ReplicaSet에 존재할 것이다.

그리고, Deployment는 ReplcaSet 를 두르고 존재한다.

즉, Deployment > ReplicatSet > Pod > Instance

이러한 Deployment 를 통해 RollinigUpdate를 진행하기도 하고, 롤백시키기도 하고, 필요에 따라 변경 사항을 모아서 한번에 시작할 수 있다.

```yaml
apiVersion: apps/v1
kind: Deployment
# kind를 제외하고는 ReplicaSet과 거의 유사하다.
metadata:
	name: myapp-deployment
	labels:
		app: myapp
		type: back-end

spec: 
	template: 
		metadata:
			name: myapp-pod
			labels:
				app: myapp
				type: back-end
		spec:
			containers:
				- name: nginx-container
					image: nginx
	replicas: 3
	selector: 
		matchLabels:
			type: back-end
```

```yaml
kubectl create -f deployment-definition.yml
# deployment 생성

kubectl get deployments
# deployment 확인

kubectl get replicaset
# deployment 이름으로 시작하는 ReplicaSet 확인 가능

kubectl get pods
# deployment 이름으로 시작하는 Pod 확인 가능
```

```yaml
kubectl get all
# 생성된 모든 오브젝트를 한번에 확인하는 방법
```

## Namespaces

**Namespace는 클러스터 안의 리소스를 논리적으로 나누는 공간(단위)이다.**

우선, 쿠버네티스가 기본적으로 제공하는 몇가지 Namespace가 있다.

![image.png](/static/images/kube/kube9.png)

### default

사용자가 namespace를 따로 지정하지 않았을 때 리소스가 생성되는 기본 공간

```yaml
kubectl run nginx --image=nginx
```

이런식으로 별도의 공간을 지정하지 않으면 namespaced에 Pod이 생성된다.

```yaml
kubectl get pods
# 이는 사실상 아래와 같다
kubectl get pods -n default
```

### kube-system

쿠버네티스 시스템 컴포넌트들이 들어가는 Namespace이다.

```yaml
coredns
kube-proxy
metrics-server
kube-apiserver
kube-controller-manager
kube-scheduler
```

이런 것들이 들어있을 수 있으며, 쿠버네티스 자체의 동작을 위한 리소스들이 있는 것으로 함부로 건들이면 안되는 공간이다.

### kube-public

클러스터 전체에서 공개적으로 읽을 수 있는 리소스를 두기 위한 namespace이다.

일반적인 애플리케이션을 여기에 두는 경우는 많지 않다.

### 활용

소규모 클러스터로 작업하는 경우에는 Namespace를 고려하지 않아도 된다. default를 이용하면 충분하니까.

다만, 엔터프라이즈 또는 운영 목적으로 쿠버네티스 클러스터를 확장하여 사용하는 경우에는 네임스페이스 사용을 고려할 수 있다.

예를 들어 개발 환경과 운영 환경 모두에 동일한 클러스터를 사용하면서 동시에 두 환경간에 리소스를 분리하려는 경우에는 각각 다른 namespace를 만들어 사용할 수 있다.

- dev
- prod

![image.png](/static/images/kube/kube10.png)

이렇게 두가지의 namespace를 만들어 둔다면 개발 환경에서 작업하는 동안 prod환경에서 실수로 리소스를 수정하는 일이 없다.

또한 각각의 namespace는 리소스 할당량을 정할 수 있으며, 이를 통해 일정량을 보장받고 허용된 한도를 초과해서 사용하지 않는다.


---

namespace 는 같은 공간에서는 서로의 리소스 이름만으로 사용할 수 있다.

만약 default의 web-pod, web-deployment, db-service 는 서로를 바로 사용할 수 있지만,

dev 의 리소스를 호출하기 위해서는 구체적으로 사용해야 한다.

![image.png](/static/images/kube/kube11.png)

```yaml
mysql.connect("db-service.dev.svc.cluster.local")
```

```yaml
db-service . dev . svc . cluster.local
   │        │     │        │
   │        │     │        └─ 클러스터 내부 기본 도메인
   │        │     └─ Service 리소스라는 뜻
   │        └─ namespace 이름
   └─ Service 이름
```

이렇게 사용해야한다.

만약 특정 namespace를 확인하거나 만들기 위해서는,

```yaml
kubectl create -f pod-definition.yml
# 기본 namespace 이용

kubectl create -f pod-definition.yml -n dev
# dev namespace 이용

kubectl get pods -A
kubectl get pods --all-namespaces
# 모든 namespace 의 Pod 확인
```

```yaml
apiVersion: v1
kind: Pod
	metadata:
		namespace: dev
		name: myapp-pod
		labels:
			app: myapp
			type: back-end
	spec:
		containers:
			- name: nginx-container
				image: nginx
				
# metadata에 namespace를 추가해 설정하는 것 또한 가능하다. (더 우선시된다.)
```

### Namespace 만들기

```yaml
apiVersion: v1
kind: Namespace
metadata:
	name: dev
```

```yaml
kubectl create -f namespace-dev.yml
# yaml파일을 이용해서 만들기

kubectl create namespace dev
# kubectl create namespace를 이용해 만들기
```

만약, 만들어진 Nampespace로 이동해서 동작하기 위해서는 어떻게 할까

```yaml
kubectl config set-context $(kubectl config current-context) -n 이름
```

이후 사용되는 명령어는 `dev` namespace에서 사용되는 것이다.

### Resource Quoata

![image.png](/static/images/kube/kube12.png)

Namespace에서 리소스를 제한하려면 ResourceQuota를 생성하여 할당량을 만들어야 한다.

이를 위해서 yaml 정의 파일을 만들어야 하며 사양을 설정해줄 수 있다.

```yaml
apiVersion: v1
kind: ResourceQuata
metadata:
	name: compute-quota
	namespace: dev
	
spec:
	hard:
# hard는 해당 namespace에서 절대 넘을 수 없는 최대 한도
		pods: "10"
		requests.cpu: "4"
		requests.memory: 5Gi
		limits.cpu: "10"
		limits.memory: 10Gi

# dev namespace 안에서 최대 Pod 개수, CPU 요청량, 메모리 요청량, CPU 제한량, 메모리 제한량 
# 일정 수준 이상 넘지 못하게 막겠다
```

```yaml
requests
→ Pod이 실행되기 위해 최소한 필요하다고 요청하는 자원
→ Scheduler가 Node에 배치할 때 참고

limits
→ 컨테이너가 사용할 수 있는 최대 자원
→ limit을 넘으면 제한되거나 종료될 수 있음
```

```yaml
kubectl create -f compute-quota.yaml
```

만약 이러한 설정을 한 namespace에 Pod을 만들 때 resource 설정이 없다면 생성이 안될 수 있다.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  namespace: dev
spec:
  containers:
    - name: nginx
      image: nginx
      resources:
        requests:
          cpu: "500m"
          memory: "256Mi"
        limits:
          cpu: "1"
          memory: "512Mi"
```

따라서 위와 같이 resource 설정을 넣어주어야 한다.

### 정리

![image.png](/static/images/kube/kube13.png)

## Service

![image.png](/static/images/kube/kube14.png)

Service는 애플리케이션을 다른 애플리케이션 또는 사용자와 연결하는 데 도움이 된다.

예를 들어, 프론트엔드 그룹, 백엔드 그룹, 그리고 외부 데이터 소스 그룹이 있을 때 이러한 Pod 그룹 간의 연결을 가능하게 하는 것이 Service이다.

따라서 MicroService 간의 느슨한 결합을 가능하게 한다.

### Networking

![image.png](/static/images/kube/kube15.png)

Pod은 각각의 IP를 가지지만, Pod은 언제든 삭제되고 다시 생성될 수 있기에 IP 또한 바뀔 수 있다.

그렇기에 다른 애플리케이션이 직접 Pod IP 에 의존하는 것은 불안정하다.

Service는 이러한 문제를 해결해줄 수 있는데, Service는 Pod 앞에 고정된 접근 지점을 만들어주고, Pod이 재생성되어도 Service를 통해 계속 접근할 수 있게 해준다.

**이를 통해서 위의 MicroService 간의 느슨한 결합이 가능해지는 것이기도 하다.(IP를 직접 몰라도 가능)**

그리고, 쿠버네티스 안에는 여러 네트워크 범위가 있다.

```yaml
내 노트북 IP: 192.168.1.1
Kubernetes Node IP: 192.168.1.2
Pod IP: 10.244.0.2
```

이때 Pod IP는 클러스터 내부 네트워크 주소이기 때문에, 외부 노트북에서는 해당 IP로 바로 접근이 불가능하다.

이때 위에서 설명한 것과 마찬가지로 Service가 중간에 연결해주는 역할을 수행하게 된다.

```powershell
Pod IP: 10.244.0.2
Container Port: 80

# 쿠버네티스 노드
Node IP : 192.168.1.2

# 외부 사용자의 접근
192.168.1.2:30080
        ↓
      Service
        ↓
10.244.0.2:80
# 이러한 방식이 뒤에서 나오는 NodePort Service 방식
```

### Service 종류

![image.png](/static/images/kube/kube16.png)

### 1. NodePort

Node의 특정 포트를 열고, 그 포트로 들어온 요청을 Pod으로 전달

```powershell
외부 사용자
    ↓
NodeIP:NodePort
    ↓
Service
    ↓
Pod

# ex) 192.168.1.2:30080 → Service → Pod:80
```

이처럼 외부에서 간단히 애플리케이션 접근할 때 사용한다.

### 2. ClusterIP

클러스터 내부에서만 접근 가능한 Service이다.

이번에는 내부 프론트엔드 Pod에서 백엔드 Pod으로 접근할 때 사용할 수 있다.

이 경우 Service는 클러스터 내부에 가상 IP를 생성하여 통신을 가능하게 해준다.

이는 외부 사용자가 아닌, Pod 끼리 내부 통신할 때 사용한다.

```powershell
Frontend Pod
    ↓
backend-service
    ↓
Backend Pod
```

### 3. LoadBalancer

클라우드 환경에서 외부 Load Balancer를 만들어주는 Service이다.

```powershell
외부 사용자
    ↓
Cloud Load Balancer
    ↓
Service
    ↓
Pod
```

AWS, GCP, Azure 과 같은 환경에서 주로 사용한다.

### NodePort 자세히 알아보기

![image.png](/static/images/kube/kube17.png)

NodePort에는 중요한 포트가 3개 있다.

1. nodePort
    
    외부에서 Node IP와 함께 접근하는 포트 **nodePort**
    
2. port
    
    Service 자체가 사용하는 포트 **port**
    
3. targetPort
    
    실제 Pod/컨테이너가 열고 있는 포트 **targetPort**
    

```yaml
외부 사용자
    ↓
NodeIP:nodePort
    ↓
Service:port
    ↓
Pod:targetPort
```

예를 들어

```powershell
Node IP: 192.168.1.2
nodePort: 30008
Service port: 80
Pod targetPort: 80
```

이렇게 정의되어 있다면, 외부 사용자는 아래와 같이 접근할 수 있다.

```powershell
http://192.168.1.2:30008

192.168.1.2:30008
    ↓
Service:80
    ↓
Pod:80
```

이때, nodePort에는 아무 숫자나 사용할 수 없고, 정해진 범위의 숫자를 사용해야 한다 → **30000 ~ 32767**

```yaml
apiVersion: v1
kind: Service
metadata:
	name: myapp-service
	# labels: 
	
# spec이 중요한 부분이다.
spec:
	type: NodePort
	ports:
		- targetPort: 80
			port: 80
			nodePort: 30008 #30000~32767
	selector: 
		app: myapp
		type: front-end
```

spec에서 작성하는 port는 사용할 Port들을 정의하는 부분이고, selector를 통해서 어떤 Pod을 이용할 것인지 결정하는 것이다.

```powershell
kubectl apply -f service-definition.yml
# 이를 통해서 마찬가지로 service 오브젝트를 생성

kubectl get services # 혹은 svc
# 이를 통해서 생성된 service 목록을 확인
```

**그렇다면, 만약 Pod이 여러개 있으면 어떻게 할까.**

Pod이 하나만 있어도 Service를 통해 동작하는 것이 가능하지만, 보통은 Pod을 여러개 두고 사용할 것이다.

Pod이 여러개 있으면 Service는 Selector와 일치하는 모든 Pod을 찾아서 연결한다.

```powershell
Service
  ↓
Pod 1
Pod 2
Pod 3
```

그러면, Service는 모든 Pod을 endpoint로 잡고, 외부 요청은 이 Pod중 하나로 전달된다.

즉, Service는 여러 Pod 앞에서 간단한 로드밸런서 처럼 동작하게 된다.

**그렇다면, 만약 Pod이 여러 Node에 분산되어 있으면 어떻게 할까.**

마찬가지로, Service 생성 방식은 동일하다.

```powershell
Node 1
  └─ Pod 1

Node 2
  └─ Pod 2

Node 3
  └─ Pod 3
```

NodePort Service를 만들면 쿠버네티스는 모든 Node에 동일한 nodePort를 열게된다.

```powershell
Node 1 IP:30008
Node 2 IP:30008
Node 3 IP:30008
```

이런식으로 Node의 IP에 해당 port를 붙여서 접근하면 Service가 적절한 Pod으로 요청을 전달한다.

### ClusterIP 자세히 알아보기

![image.png](/static/images/kube/kube18.png)

웹 애플리케이션은 보통 여러 계층으로 나뉘어있다.

```powershell
Frontend Pod들
Backend Pod들
Redis Pod들
MySQL Pod들
```

그리고, 이들은 서로 통신해야 한다.

하지만, Pod은 각각 IP를 가지지만, Pod IP는 고정되지 않는다.

이때 마찬가지로 Service가 그룹의 단일 진입점이 되어 동작하게 된다.

```powershell
Frontend Pod
     ↓
backend-service
     ↓
Backend Pod 1
Backend Pod 2
Backend Pod 3
```

**이때 ClusterIP를 사용하는 것은, 클러스터 내부에서만 접근이 가능한 Service 타입이기 때문이다.**

Service를 만들면 쿠버네티스가 Service에게 내부 IP를 하나 부여하게 되고, 클러스터 내부에서는 Service 이름으로 접근할 수 있다.

```powershell
backend-service
ClusterIP: 10.43.100.20

# 내부에서는 이름으로 접근
backend-service
# 혹은 DNS 전체 이름으로
backend-service.default.svc.cluster.local
# <service-name>.<namespace>.svc.cluster.local
```

마찬가지로 YAML 파일을 만들어서 사용할 수 있으며, type이 변하게 된다.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  type: ClusterIP # 작성하지 않으면 기본이 ClusterIP이다.
  ports:
    - port: 80
      targetPort: 80
      # 외부에 열지 않기 때문에 이렇게만 작성하면 된다.
  selector:
  app: backend
```

마찬가지로 백엔드 외에 접근할 계층에 대해 각각 서비스를 만들어주면 된다.