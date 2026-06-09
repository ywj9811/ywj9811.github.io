---
title: CKAD-Pod & Deployment 수정 Tip
date: '2026-06-10'
tags: ['기술', 'CKAD', 'kubernetes']
draft: false
summary: CKAD Pod & Deployment 수정 Tip
---
## Pod와 Deployment 수정 방법 정리

### 핵심 개념

Kubernetes에서 이미 생성된 **Pod는 대부분의 설정을 직접 수정할 수 없다.**

반면 **Deployment는 Pod template을 수정할 수 있고**, 수정하면 Deployment가 자동으로 기존 Pod를 삭제하고 새 Pod를 생성한다.

즉, 운영 관점에서는 다음처럼 이해하면 된다.

```
Pod 직접 수정
→ 대부분 불가능

Deployment 수정
→ 가능
→ 새로운 Pod 자동 생성
```

---

### 기존 Pod에서 수정 가능한 필드

실행 중인 Pod는 대부분의 `spec`을 수정할 수 없다.

수정 가능한 대표 필드는 아래 정도이다.

| 수정 가능한 필드 | 의미 |
| --- | --- |
| `spec.containers[*].image` | 일반 컨테이너 이미지 |
| `spec.initContainers[*].image` | init container 이미지 |
| `spec.activeDeadlineSeconds` | Pod 실행 제한 시간 |
| `spec.tolerations` | toleration 설정 |

예를 들어 컨테이너 이미지는 수정할 수 있다.

```bash
kubectl edit pod webapp
```

또는 더 간단히:

```bash
kubectlset image pod/webappnginx=nginx:1.25
```

하지만 다음과 같은 값들은 기존 Pod에서 직접 수정할 수 없다.

```
환경변수
ServiceAccount
Resource limits
Resource requests
Command
Args
Volume
VolumeMounts
Container port
SecurityContext
```

이런 항목을 수정하려고 하면 저장 시 거부된다.

---

## Pod를 직접 수정하려고 하면 어떻게 될까?

예를 들어 다음 명령으로 Pod를 수정한다고 하자.

```bash
kubectl edit pod webapp
```

그러면 vi 에디터가 열리고 Pod YAML을 수정할 수 있다.

하지만 수정 불가능한 필드를 바꾸고 저장하면 Kubernetes가 거부한다.

예를 들어 환경변수, command, args, resource limits 등을 바꾸면 다음과 같은 상황이 발생한다.

```
수정 시도
↓
저장
↓
수정 불가능한 필드라서 거부됨
↓
변경 내용이 임시 파일에 저장됨
```

이때 Kubernetes는 수정한 내용을 임시 파일로 저장해준다.

예:

```
/tmp/kubectl-edit-ccvrq.yaml
```

그러면 기존 Pod를 삭제하고, 임시 파일로 새 Pod를 생성해야 한다.

```bash
kubectl delete pod webapp
kubectl create-f /tmp/kubectl-edit-ccvrq.yaml
```

---

## Pod 수정 방법 1: `kubectl edit pod` 후 재생성

### 절차

```bash
kubectl edit pod webapp
```

수정 후 저장하면, 수정 불가능한 필드의 경우 에러가 발생한다.

하지만 변경 내용이 임시 파일에 저장된다.

그 다음 기존 Pod를 삭제한다.

```bash
kubectl delete pod webapp
```

그리고 임시 파일로 새 Pod를 생성한다.

```bash
kubectl create-f /tmp/kubectl-edit-ccvrq.yaml
```

### 흐름

```
kubectl edit pod webapp
↓
수정
↓
저장 시도
↓
수정 불가능 필드라서 거부
↓
변경 내용이 /tmp/...yaml에 저장됨
↓
기존 Pod 삭제
↓
임시 파일로 새 Pod 생성
```

이 방식은 시험에서 빠르게 수정하다가 저장이 거부되었을 때 사용할 수 있다.

---

## Pod 수정 방법 2: YAML로 추출 후 수정

두 번째 방법은 기존 Pod 정의를 YAML 파일로 뽑아서 수정하는 것이다.

### 1단계: 기존 Pod YAML 추출

```bash
kubectl get pod webapp -o yaml > my-new-pod.yaml
```

### 2단계: 파일 수정

```bash
vi my-new-pod.yaml
```

필요한 설정을 수정한다.

예를 들어:

```
env
resources
command
args
serviceAccountName
```

등을 수정할 수 있다.

### 3단계: 기존 Pod 삭제

```bash
kubectl delete pod webapp
```

### 4단계: 수정한 YAML로 새 Pod 생성

```bash
kubectl create -f my-new-pod.yaml
```

### 흐름

```
기존 Pod YAML 추출
↓
YAML 파일 수정
↓
기존 Pod 삭제
↓
수정된 YAML로 새 Pod 생성
```

---

### 주의: 추출한 YAML에는 불필요한 필드가 많을 수 있음

`kubectl get pod webapp -o yaml`로 추출한 파일에는 Kubernetes가 자동으로 붙인 필드들이 포함될 수 있다.

예를 들어:

```yaml
status:
  phase: Running
```

또는:

```yaml
metadata:
  creationTimestamp:
  resourceVersion:
  uid:
```

같은 필드가 들어 있을 수 있다.

새로 생성할 때는 이런 자동 생성 필드 때문에 문제가 생길 수 있다.

시험에서는 보통 필요한 부분만 남기고 정리하는 것이 좋다.

특히 다음 필드는 삭제하는 습관이 좋다.

```
status
metadata.creationTimestamp
metadata.resourceVersion
metadata.uid
metadata.managedFields
```

최소한 Pod 생성에 필요한 구조는 다음이다.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: webapp
spec:
  containers:
  - name: webapp
    image: nginx
```

---

## Deployment 수정

Deployment는 Pod와 다르게 수정이 쉽다.

Deployment는 내부에 Pod template을 가지고 있다.

```
Deployment
  └── spec.template
        └── Pod template
```

Deployment의 Pod template을 수정하면 Kubernetes가 자동으로 새 ReplicaSet과 새 Pod를 만든다.

예를 들어:

```bash
kubectl edit deployment my-deployment
```

이 명령을 실행하면 Deployment YAML이 열린다.

여기서 다음과 같은 Pod 관련 설정을 수정할 수 있다.

```
image
env
resources
command
args
ports
volumeMounts
serviceAccountName
```

**저장하면 Deployment가 자동으로 기존 Pod를 교체한다.**

---

### Deployment를 수정하면 내부적으로 무슨 일이 일어날까?

예를 들어 Deployment의 이미지나 환경변수를 수정한다고 하자.

```
kubectl edit deployment my-deployment
```

수정 전:

```
Deployment
  └── ReplicaSet old
        ├── Pod old-1
        └── Pod old-2
```

수정 후:

```
Deployment
  ├── ReplicaSet old
  └── ReplicaSet new
        ├── Pod new-1
        └── Pod new-2
```

Deployment는 Pod template 변경을 감지하고 새 ReplicaSet을 만든다.

그리고 기존 Pod를 줄이고 새 Pod를 늘리는 방식으로 업데이트한다.

이것이 Rolling Update이다.

따라서 Deployment로 관리되는 Pod는 직접 Pod를 수정하지 말고 Deployment를 수정해야 한다.

---

## 시험에서의 판단 기준

### 단독 Pod를 수정하라고 하면

대부분 다음 흐름으로 간다.

```bash
kubectlget pod webapp -o yaml > webapp.yaml
vi webapp.yaml
kubectl delete pod webapp
kubectl create -f webapp.yaml
```

또는 `kubectl edit pod`로 수정한 뒤 저장이 거부되면 임시 파일을 사용한다.

```bash
kubectl delete pod webapp
kubectl create -f /tmp/kubectl-edit-xxxx.yaml
```

---

### Deployment가 관리하는 Pod를 수정하라고 하면

Pod를 직접 수정하지 않는다.

Deployment를 수정한다.

```bash
kubectl edit deployment my-deployment
```

또는 이미지 변경만이라면:

```bash
kubectl set image deployment/my-deploymentnginx=nginx:1.25
```

수정 후 확인:

```bash
kubectl rollout status deployment/my-deployment
# rollout은 수정 후 재실행이 되었는지 확인되는 명령어
kubectl get pods
```