---
title: CKAD-기본기 다지기 1편
date: '2026-05-26'
tags: ['기술', 'CKAD', 'kubernetes']
draft: false
summary: CKAD 준비를 위한 기본기 1편
---
## 오케스트레이션

![image.png](/static/images/kube/kube1.png)

Kubernetes를 이해하기 위해서 오케스트레이션 개념을 확실하게 확인하고 넘어가면 좋을 것 같다.

오케스트레이션

→ 여러 작업 요소들을 정해진 목표 상태에 맞게 자동으로 배치하고, 실행하고, 조율하고, 복구하는 것

→ 음악의 오케스트라 와 비슷한데, 적절한 타이밍에 어떤 악기가 들어오고 어디서 쉬고 어떻게 진행하는지 조율하는 것

```bash
백엔드 서버 컨테이너 3개
프론트엔드 컨테이너 2개
Redis 컨테이너 1개
MySQL 컨테이너 1개
로그 수집 컨테이너
모니터링 컨테이너
```

만약 위와 같이 다양한 컨테이너로 구성되어 있다면

→ 백엔드를 어디에 띄울지, 컨테이너가 죽으면 누가 살릴지, 트래픽이 많아지면 어떻게 할지 등등 고려해야 함

이러한 조절을 자동으로 해주는 것이 **컨테이너 오케스트레이션** 이다.

> 여러 컨테이너를 여러 서버 위에서 안정적으로 실행하도록 배치, 관리, 확장, 복구, 네트워킹, 배포 까지 자동으로 조율하는 것
> 

**이때 Kubernetes 는 오케스트레이션의 대표적인 도구**

즉 Kubernetes는 현재 상태를 감시하면서, 사용자가 선언한 목표 상태와 실제 상태가 일치하도록 계속 조정한다.

정리하면,

Docker는 컨테이너 이미지를 만들고 컨테이너를 실행하는 도구이고, Kubernetes는 여러 컨테이너를 운영 환경에서 안정적으로 실행되도록 관리하는 오케스트레이션 도구이다.

따라서 Kubernetes는 Docker 자체를 관리하는 도구라기보다는, Docker 등으로 만든 컨테이너 이미지를 여러 서버 위에서 배치, 실행, 복구, 확장, 배포하는 플랫폼이라고 이해하면 된다.

## Nodes

노드란, 물리적 또는 가상의 머신으로, 쿠버네티스가 설치됨

→ 워커 머신으로, 쿠버네티스에서 컨테이너가 시작되는 곳

→ 만약 장애가 발생된다면? 어플리케이션이 다운되니 2개 이상의 노드가 있어야 안전할 것

## Cluster

이렇게 노드가 2개 이상 있는 모음을 클러스터라고 함

그렇다면, 클러스터의 구성원에 대한 정보가 저장되고 모니터링 되고 관리될 곳은?

## Master

마스터는 클러스터의 노드를 관리하고 모니터링 하는 노드

즉, 쿠버니티스가 설치된 다른 노드

마스터는 클러스터의 노드를 감시하고 워커 노드에서 컨테이너의 실제 오케스트레이션을 관리함

## Master vs Worker Nodes

어떻게 어떤건 Master가 되고 나머지는 Slave가 될까

워커 노드는 컨테이너가 호스팅되는 곳

**Worker Node**

→ Container Runtime - 런타임 엔진 (Docker)

→ Kubelet 에이전트 - 워커 노드에서 요청한 작업을 수행하는 역할을 담당

**Master**

→ Kube-apiServer - Kubelet 과 상호작용

→ etcd - 수집된 모든 정보 저장하는 마스터의 키 값 저장소

→ controller - 제어 관리자

→ scheduler  - 스케줄러

![image.png](/static/images/kube/kube2.png)

## Components

![image.png](/static/images/kube/kube3.png)

- API Server
    
    쿠버네티스의 프론트엔드 역할
    
    사용자 관리 장치, 명령줄 인터페이스는 모두 API Server와 통신하며 쿠버네티스 클러스터와 상호작용 함
    
- etcd
    
    Etcd는 클러스터 관리에 사용되는 모든 데이터를 저장하는 데 사용되는 분산되고 신뢰할 수 있는 키 값 저장소
    
    클러스터의에 여러 노드와 여러 마스터가 있는 경우, etcd는 클러스터의 모든 노드에 분산된 방식으로 모든 정보를 저장
    
    마스터 간의 충돌이 발생하지 않도록 클러스터 내에서 잠금을 구현
    
- Scheduler
    
    여러 노드에 작업 또는 컨테이너를 배포하는 역할
    
    새로 생성된 컨테이너를 찾아 노드에 할당
    
- Controller
    
    오케스트레이션의 두뇌 역할
    
    노드, 컨테이너 또는 엔드포인트가 다운되면 이를 인지하고 대응
    
    새로운 컨테이너를 불러오기 위한 결정
    
- Container Runtime
    
    컨테이너를 실행하기 위해 사용되는 기본 소프트웨어 → Ex) Docker
    
- Kubelet
    
    각 노드에서 실행되는 에이전트로, 컨테이너가 노드에서 예상대로 실행되고 있는지 확인할 책임
    

## Kubectl

![image.png](/static/images/kube/kube4.png)

Kube 명령줄 도구 혹은 kubectl / kubecontrol 이라고 불리는 명령줄 유틸리티

```bash
kubectl run hello-minikube
# 클러스터에 어플리케이션을 배포

kubectl cluster-info
# 현재 kubectl이 연결된 Kubernetes 클러스터 정보를 확인

kubectl get nodes
# 클러스터의 노드 리스트 확인
```

---

## Pod

![image.png](/static/images/kube/kube5.png)

컨테이너는 Pod이라는 쿠버네티스 오브젝트로 캡슐화된다.

이 Pod은 애플리케이션의 단일 인스턴스로, 쿠버네티스에서 생성할 수 있는 가장 작은 오브젝트이다.

- 만약 인스턴스가 Pod에 캡슐화된 단일 Docker 컨테이너에서 실행되고 있는 경우
    - 액세스하는 사용자가 많이지는 경우 어떻게 할까
        
        → 동일한 어플리케이션의 새 인스턴스와 함께 새로운 Pod을 추가한다.
        
        → 이를 통해 필요한 경우 클러스터의 물리적인 용량을 확장하기 위해 새로운 Node와 그 위에 Pod이 추가된다.
        

즉, 일반적으로 Pod 1개는 어플리케이션을 실행하는 컨테이너와 1대 1 관계를 갖는다. 

스케일 업/다운 → Pod 생성/삭제

다만, 무조건 Pod 1개에는 1개의 컨테이너가 있는 것은 아니지만 일반적으로 그렇다.

```bash
kubectl run nginx --image nginx
# 위처럼 Docker hub에서 nginx 이미지를 가져와서 Pod를 생성한다.

kukbectl get pods
# 클러스터의 Pod 목록을 확인한다. 이를 통해 상태를 확인할 수 있음
```

### Pod with Yaml

![image.png](/static/images/kube/kube6.png)

쿠버네티스 정의 파일에는 항상 apiVersion, kind, metadata, spec 이렇게 4가지의 필드가 포함되어있다.

이는 최상위 수준 혹은 루트 수준 속성임

- apiVersion : 오브젝트를 생성하는데 사용하는 쿠버네티스 API 버전
    - Pod : v1
    - Service : v1
    - ReplicaSet : apps/v1
    - Deployment : apps/v1
- kind : 생성하려는 객체의 유형
    - Pod, Service … 등등
- metadata : name, labels 등등
    - name은 그냥 이름이고, labels을 지정해서 수많은 Pod이 생겼을 때 labels을 기준으로 Pod을 필터링할 수 있다.
    - metadata 바로 하위에는 지정된 것들만 가능함 Ex) name, labels 등등
        
        **하지만, labels 하위에는 원하는 모든 종류의 키와 값을 설정할 수 있다.**
        
- spec : 사양을 작성하는 곳으로, 만들려는 객체마다 다르다.
    - 어떤 컨테이너가 들어가는지 속성을 작성해주면 된다.
        
        → containers 속성은 List/Array 형식으로 작성해주면 된다.
        

```yaml
apiVersion: v1
kind: Pod
metadata:
	name: myapp-pod
	labels:
		app: myapp
		type: back-end
spec:
	containers:
		- name: nginx-container # 첫번째 컨테이너
			image: nginx # 도커의 nginx이미지를 가지고 nginx-container 이름으로 띄울 것
```

```bash
kubectl create -f pod-definition.yml
# 위에서 정의한 yaml을 통해 Pod 생성

kubectl get pods
# 실행중인 pods 확인
# myapp-pod 이라는 pod을 확인할 수 있을 것

kubectl describe pod myapp-pod
# 해당 pod과 관련된 이벤트 세부 정보를 얻을 수 있음

kubectl delete pod 이름
# 해당 pod 삭제
```

```bash
kubectl describe pod webapp
# webapp pod이 이상하다면 확인

Name:             webapp
Namespace:        default
Priority:         0
Service Account:  default
Node:             controlplane/10.244.225.77
Start Time:       Mon, 25 May 2026 19:27:40 +0000
Labels:           <none>
Annotations:      <none>
Status:           Pending
IP:               10.42.0.12
IPs:
  IP:  10.42.0.12
Containers:
  nginx:
    Container ID:   containerd://f8d410c6b749a78dde6e72f18e807c153e4ebdbc7b6fba132798df4fc00590bd
    Image:          nginx
    Image ID:       docker.io/library/nginx@sha256:5aca99593157f4ae539a5dec1092a0ad8762f8e2eb1789085a13a0f5622369f6
    Port:           <none>
    Host Port:      <none>
    State:          Running
      Started:      Mon, 25 May 2026 19:27:45 +0000
    Ready:          True
    Restart Count:  0
    Environment:    <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-jq8dc (ro)
  agentx:
    Container ID:   
    Image:          agentx
    Image ID:       
    Port:           <none>
    Host Port:      <none>
    State:          Waiting
      Reason:       ImagePullBackOff
    Ready:          False
    Restart Count:  0
    Environment:    <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-jq8dc (ro)
Conditions:
  Type                        Status
  PodReadyToStartContainers   True 
  Initialized                 True 
  Ready                       False 
  ContainersReady             False 
  PodScheduled                True 
Volumes:
  kube-api-access-jq8dc:
    Type:                    Projected (a volume that contains injected data from multiple sources)
    TokenExpirationSeconds:  3607
    ConfigMapName:           kube-root-ca.crt
    ConfigMapOptional:       <nil>
    DownwardAPI:             true
QoS Class:                   BestEffort
Node-Selectors:              <none>
Tolerations:                 node.kubernetes.io/not-ready:NoExecute op=Exists for 300s
                             node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type     Reason     Age                    From               Message
  ----     ------     ----                   ----               -------
  Normal   Scheduled  3m4s                   default-scheduler  Successfully assigned default/webapp to controlplane
  Normal   Pulling    3m4s                   kubelet            Pulling image "nginx"
  Normal   Pulled     3m1s                   kubelet            Successfully pulled image "nginx" in 3.722s (3.722s including waiting)
  Normal   Created    3m1s                   kubelet            Created container nginx
  Normal   Started    3m                     kubelet            Started container nginx
  Warning  Failed     2m21s (x3 over 2m59s)  kubelet            Error: ErrImagePull
  Normal   BackOff    102s (x5 over 2m59s)   kubelet            Back-off pulling image "agentx"
  Warning  Failed     102s (x5 over 2m59s)   kubelet            Error: ImagePullBackOff
  Normal   Pulling    91s (x4 over 3m)       kubelet            Pulling image "agentx"
  Warning  Failed     90s (x4 over 2m59s)    kubelet            Failed to pull image "agentx"
  : failed to pull and unpack image "docker.io/library/agentx:latest"
  : failed to resolve reference "docker.io/library/agentx:latest"
  : pull access denied, repository does not exist or may require authorization
  : server message: insufficient_scope: authorization failed
```

### 참고

```bash
kubectl run --help
# 도움말이 나옴!
```

```bash
kubectl run redis --image=redis123 --dry-run=client -o yaml
# 실제로 Pod을 생성하지 않고, 생성될 YAML 내용을 미리 확인한다.

kubectl run redis --image=redis123 --dry-run=client -o yaml > redis.yaml
# 생성될 YAML 내용을 redis.yaml 파일로 저장한다.

# 이후 vi로 YAML을 수정한 뒤 create/apply로 실제 리소스를 생성할 수 있다.
```

```bash
kubectl edit pod pod이름
# 현재 클러스터에 존재하는 Pod 리소스의 YAML을 기본 편집기로 열어 바로 수정할 수 있다.
# 기본 에디터가 vi로 설정되어 있다면 vi 모드로 열린다.
#
# 단, Pod은 생성 후 수정 가능한 필드가 많지 않다.
# 예를 들어 이미 생성된 Pod의 image, metadata.labels, metadata.annotations 등 일부 필드는 수정 가능하다.
#
# 반면 name, restartPolicy, volume, container port 등 많은 필드는 직접 수정할 수 없다.
#
# 수정할 수 없는 필드를 변경해야 한다면,
# 기존 Pod을 삭제한 뒤 수정된 YAML로 다시 생성하는 방식이 필요할 수 있다.
#
# 수정 결과는 필드에 따라 다르게 반영된다.
# labels 같은 메타데이터 변경은 컨테이너 재시작 없이 반영될 수 있고,
# image 변경은 컨테이너가 새 이미지로 교체되면서 재시작될 수 있다.
```