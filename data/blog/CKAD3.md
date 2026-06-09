---
title: CKAD-시험 Tip
date: '2026-06-06'
tags: ['기술', 'CKAD', 'kubernetes']
draft: false
summary: CKAD 시험 Tip
---
## Imperative Commands

### CKAD 시험에서 YAML파일을 처음부터 다 쓰지 말고, 명령어로 빠르게 뼈대를 만든 뒤 수정하는 것이 유용하다

### `--dry-run` : 명령어를 실행하면 리소스가 즉시 생성된다.

### `--dry-run=client` 옵션을 이용하게 되면, 실제로 리소스는 생성되지 않고, 리소스 생성 가능 여부와 명령어의 정확성만 표시된다.

### `-o yaml` : 이렇게 하면 리소스의 정의가 YAML 형식으로 화면에 출력된다.

---

위 두가지 방법을 이용하면 리소스 정의 파일을 신속하게 생성할 수 있다.

이렇게 생성된 파일을 수정하여 필요에 따라 리소스를 생성할 수 있고, 파일을 처음부터 새롭게 생성할 필요가 없다.

```bash
kubectl run nginx --image-nginx --dry-run=client -o yaml > nginx-pod.yaml
```

이를 통해 nginx 이미지를 이용하는 nginx를 nginx-pod.yaml 이라는 정의 파일을 통해 만들 수 있다.

`--dry-run=client` 를 이용하였기 때문에 바로 실행하지 않고 파일을 만들어준다.

---

## POD

NGINX Pod 생성

```bash
kubectl run nginx --image=nginx
```

```bash
kubectl run nginx --image=nginx --dry-run=client -o yaml > nginx-pod.yaml
```

Pod 정의 YAML 파일 생성 but Pod을 생성하지는 않기

---

## Deployment

Deployment 생성

```bash
kubectl create deployment nginx --image=nginx
```

```bash
kubectl create deployment nginx --image=nginx --dry-run=client -o yaml
```

이를 통해서 마찬가지로 nginx Deployment를 생성하지 않고 정의 파일을 생성하여 수정 후 올릴 수 있다.

### Replica 4개까지 Deployment 생성

```bash
kubectl create deployment nginx --image=nginx --replicas=4
```

```bash
kubectl create deployment nginx --image=nginx --dry-run=client -o yaml > nginx-deployment.yaml
```

이후 yaml 내부에서 replicas, ports, env, resources 등을 직접 수정할 수 있다.

### 기존 Deployment scale 조정

```bash
kubectl scale deployment nginx --replicas=4
```

---

## NameSpace

```bash
kubectl create namespace dev
```

혹은

```bash
kubectl create namespace dev --dry-run=client -o yaml > ns.yaml
```

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: dev
```

---

## Service

### ClusterIP Service 생성

> redis Pod을 port 6379 로 노출하는 `redis-service` 생성
> 

```bash
kubectl expose pod redis --port=6379 --name=redis-service --dry-run=client -o yaml
```

이러한 방식은 Pod의 label을 자동으로 selector 에 전달해준다.

예를 들어 redis Pod의 label이

```yaml
labels:
	run: redis
```

이렇게 되어있었다면,

```yaml
selector:
	run: redis
```

이렇게 자동으로 들어가게 된다.

하지만, `kubectl create service clusterip` 를 직접 이용하게 되면

```bash
kubectl create service clusterip redis --tcp=6379:6379 --dry-run=client -o yaml
```

이 방식은 selector 를 직접 지정할 수 없다.

**보통 기본 selector가 지정되게 되며, YAML생성 후 selector 를 직접 수정해줘야 한다.**

### NodePort Service

> nginx Pod의 80번 포트를 NodePort 30080 으로 노출
> 

```bash
kubectl expose pod nginx --port=80 --name=nginx-service --type=NodePort --dry-run=client -o yaml
```

`kukbectl expose` 방식은 Pod의 label을 selector에 자동으로 넣어주지만, `nodePort: 30080` 은 YAML에서 직접 수정해야 한다.

```yaml
spec:
  type: NodePort
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30080
```

```bash
kubectl create service nodeport nginx --tcp=80:80 --node-port=30080 --dry-run=client -o yaml
```

`kubectl create service nodeport` 방식은 `--node-port=30080` 을 바로 지정할 수 있다.

하지만, Pod label이 자동으로 선택되지 않아 selector를 직접 지정해줘야 한다.

---

## 정리 (시험용 추천 방식)

### Pod

```bash
kubectl run nginx --image=nginx --dry-run=client -o yaml > pod.yaml
```

### Deployment

```bash
kubectl create deployment nginx --image=nginx --dry-run=client -o yaml > deploy.yaml
```

### Service - ClusterIP

```bash
kubectl expose pod redis --port=6379 --name=redis-service --dry-run=client -o yaml > svc.yaml
```

### Service - NodePort

```bash
kubectl expose pod nginx --port=80 --name=nginx-service --type=NodePort --dry-run=client -o yaml > svc.yaml
```

그리고 yaml 파일 내부에서 아래처럼 수정

```bash
nodePort: 30080
```

---

## 참고

`-o` 뒤에 아웃풋 스타일을 작성하면 원하는 대로 나올 수 있다.

- `-o yaml`
- `-o wide`
- `-o name`
- `-o json`

이 중 yaml은 정의 파일에서, wide는 정보를 조회할 때 유용하게 사용할 수 있다.

name은 이름만 조회하기 때문에 필요시 사용할 수 있다.