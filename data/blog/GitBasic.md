---
title: Git & GitHub
date: '2022-06-09'
tags: ['Git', '기술']
draft: false
summary: Git 최초 설정 Git 전역으로 사용자 이르므과 이메일 주소를 설정 GitHub 계정과는 별개 터미널 프로그램 (Git Bash, iTerm2) 에서 아래 명령어 실행
---

## **1. Git 최초 설정**

### **Git 전역으로 사용자 이름과 이메일 주소를 설정**

- **GitHub 계정과는 별개**

**터미널 프로그램 (Git Bash, iTerm2)에서 아래 명령어 실행**

```bash
git config --global user.name "(본인 이름)"
```

```bash
git config --global user.email "(본인 이메일)"
```

**본인 이름과 본인 이메일을 설정해준다.**

---

**아래의 명령어로 나의 이름과 이메일을 확인할 수 있다.**

```bash
git config --global user.name
```

```bash
git config --global user.email
```

---

```bash
git config --global init.defaultBranch main
```

**master와 main등이 있는데 최근의 추세로 master대신에 main으로 변경하고 있다.**

---

```bash
git init
```

**이 코드를 통해서 해당 프로젝트를 git관리 시작할 수 있다.**

**이후에 폴더에 숨김폴더를 확인한다면 `.git` 폴더가 존재함을 확인할 수 있다.**

**파일들을 작업하고 모두 저장한 이후에**

```bash
git status
```

**라는 코드를 작성하게 되면 git의 관점에서 볼 수 있다.**

**`이클립스에서 터미널 사용할때` git-bash를 사용할 수 있으나, 명령어를 통해 해당 프로젝트로 이동하도록 하자.**

---

## **주의할점(Git의 관리에서 배제해야 할 경우)**

### **a. 포함할 필요가 없을 때**

- **자동으로 생성 또는 다운로드되는 파일들 (빌드 결과물, 라이브러리)**

### **b. 포함하지 말아야 할 때**

- **보안상 민감한 정보를 담은 파일**

**.gitignore 파일을 사용해서 배제할 요소들을 지정할 수 있습니다.**

**`.gitignore`파일 생성**

**해당 파일 내부에 무시해야할 파일이름을 입력한다.**

```bash
# 이렇게 #를 사용해서 주석

# 모든 file.c
file.c

# 최상위 폴더의 file.c
/file.c

# 모든 .c 확장자 파일
*.c

# .c 확장자지만 무시하지 않을 파일
!not_ignore_this.c

# logs란 이름의 파일 또는 폴더와 그 내용들
logs

# logs란 이름의 폴더와 그 내용들
logs/

# logs 폴더 바로 안의 debug.log와 .c 파일들
logs/debug.log
logs/*.c

# logs 폴더 바로 안, 또는 그 안의 다른 폴더(들) 안의 debug.log
logs/**/debug.log
```

---

## **2. 시간 여행하기**

**`git status` 를 사용하면**

**untracked파일 : git관리에 들어간 적 없는 파일이 나온다.**

**이때 원하는 파일을 담을 수 있는데,**

**이것은**

```bash
git add 파일이름
```

**혹은**

```bash
git add.
```

**를 통해서 모든 파일을 담을 수 있다.**

```bash
git commit -m "커밋할때 쓸 내용"
```

**을 통해 commit을 할 수 있다.**

**그리고**

```bash
git log
```

**이것을 통해서 커밋된 내용을 확인할 수 있다.**

---

**변경사항을 만들고 확인하기**

- **`git status`로 확인**
  - **파일의 추가, 변경, 삭제 모두 내역으로 저장할 대상**
- **`git diff`로 확인**

| 작업 내용     | 명령어 | 상세                                      |
| ------------- | ------ | ----------------------------------------- |
| 위로 스크롤   | `k`    | `git log` 등에서 내역이 길 때 사용        |
| 아래로 스크롤 | `j`    | `git log` 등에서 내역이 길 때 사용        |
| 끄기          | `:q`   | `:` 가 입력되어 있으므로 `q` 만 눌러도 됨 |

```bash
git commit -am "메시지"
```

**를 통해 add와 commit을 한번에 할 수 있다.**

**git bash만 이용하는것 보다는 gui기능이 있는 source tree등을 사용하며 변경사항을 사용하는것이 좋다.**

---

## **git에서 과거로 돌아가기!**

- **reset : 원하는 시점으로 돌아간 뒤 이후 내역들을 지운다.**
- **revert : 되돌리기 원하는 시점의 커밋을 거꾸로 실행한다.(중간 단계만 변경!)**

**→reset을 하게되면 지워지는 큰 위험이 있기 때문에 revert를 사용해서 많이 되돌린다.**

### **reset을 사용해서 과거로 돌아가기**

**아래 명령어로 커밋 내역 확인**

**→`git log`**

- **되돌아갈 시점의 커밋 해시 복사**
- **`:q`로 빠져나가기**

`git reset --hard (돌아갈 커밋 해시)`

**→커밋 해시란 log를 통해 확인해보면 옆에 commit 209bb434005…이렇게 나와있는 숫자와 알파벳을 의미한다.**

### **revert를 사용해서 과거의 커밋 되돌리기**

**아래 명령어로 revert**

`git revert (되돌릴 커밋 해시)`

- **`:wq`로 커밋 메시지 저장**

**이때 커밋을 되돌리다 보면 삭제되지 않고 남아 충돌되는 경우가 있다. 이 경우 reverting이라는 뭔가 오류메시지가 나오고 있는데,**

**`git rm` 을 통해서 해당 파일을 삭제해주어야 한다.**

**이 후 `git revert --continue` 로 마무리를 해주고 마찬가지로 `:wq` 로 저장**

### **커밋없이 revert하기**

```bash
git revert --no-commit (되돌릿 커밋 해시)
```

**이후 원하는 다른 작업을 추가한 다음에 함께 커밋하는 것이다.**

**“만약 취소하고 싶다” 그러면**

**`git reset --hard` 를 통해서 돌아갈 수 있다.**

---

## **3. 여러 branch만들어보기**

- **branch란? → 분기된 가지(다른 차원)**

**→프로젝트를 하나 이상의 모습으로 관리해야 할때**

**예) 실배포용, 테스트서버용, 새로운 시도용**

**→여러 작업들이 각각 독립되어 진행될 때**

**예) 신기능 1, 신기능 2, 코드개선, 긴급수정...**

**예)각각의 차원에서 작업한 뒤 확정된 것을 메인 차원에 통합**

### **브랜치 생성 / 이동 / 삭제하기**

**`add-coach`란 이름의 브랜치 생성**

`git branch add-coach`

**브랜치 목록 확인**

**→`git branch`**

**브랜치로 이동**

**→`git switch add-coach`**

**`checkout` 명령어가 Git 2.23 버전부터 `switch`, `restore`로 분리 → 즉 `checkout` 을 사용하지 않고 switch, restore로 사용**

---

**`git branch -d (삭제할 브랜치명)` 을 이용하여 삭제할 수 있다. 강제로 삭제하는 경우에는 -D를 사용(지워질 브랜치에만 있는 내용의 커밋이 있을 경우 강제로 삭제해야함)**

**`git branch -m (기존 브랜치명) (새 브랜치명)` 을 통해서 브랜치의 이름을 바꿀 수 있다.**

### **서로 다른 브랜치를 합치는 두 방식**

- **merge : 두 브랜치를 한 커밋에 이어붙입니다.**
  - **브랜치 사용내역을 남길 필요가 있을 때 적합한 방식입니다.**
  - **다른 형태의 merge에 대해서도 이후 다루게 될 것입니다.**

**→예를 들어 b라는 브랜치를 a라는 브랜치로 merge 하는 경우**

```bash
git switch a
git merge b
```

**이렇게 a로 이동하고 merge b를 통해서 b를 a에 합친다.**

- **rebase : 브랜치를 다른 브랜치에 이어붙입니다.**
  - **한 줄로 깔끔히 정리된 내역을 유지하기 원할 때 적합합니다.**
  - **이미 팀원과 공유된 커밋들에 대해서는 사용하지 않는 것이 좋습니다.**
  **→마찬가지로 b를 a라는 브랜치로 rebase하는 경우**
  ```bash
  git rebase a
  ```
  **이렇게 b에서 바로 rebase a를 하게되면 a로 합쳐지게 된다.**
  **→ 둘 다 마찬가지로 병합을 하고 사용이 끝난 브랜치는 삭제해주도록 하자.**

## **4. GitHub!**

**git으로 관리되는 프로젝트의 원격 저장소이다.**

[IntelliJ GitHub 연동](https://brunch.co.kr/@mystoryg/168)
