---
title: Git & GitHub
date: '2023-01-01'
tags: ['Git', '기술']
draft: false
summary: Github를 통한 협업을 할 때 참고할 수 있는 내용에 대해서 알아보자.
---

## Git Flow

### 코드 생명 주기

### 개발 시작 전

(1) 정통마켓 Repository를 포크하고 아래와 같이 Local에 Remote 지정하기

upstream : [https://github.com/ICE-Market/ICE-Market-Backend.git](https://github.com/ICE-Market/ICE-Market-Backend.git)

origin : [https://github.com/MingyeomKim/ICE-Market-Backend.git](https://github.com/MingyeomKim/ICE-Market-Backend.git)

(2) 추가할 기능에 대한 Issue 작성 후 라벨 달기

ex) Member Domain 클래스 생성

(3) 기능의 성격에 따라 아래 태그 중에서 하나를 선택해 Local에서 아래와 같이 Branch Naming 후 Branch 생성하여 체크아웃하기

**: 태그/#이슈번호**

- `feature` : 신규 기능 ex) feature/#6
- `bugfix` : 버그 수정 ex) bugfix/#10
- `hotfix` : 정말 간단한 수정 ex) hotfix/#9
- `refactor` : 코드 최적화 ex) refactor/#18
- `!config!` : 설정 변경 ex) !config!/#39

### 개발 중

(1) 매번 개발을 시작하기 전 Upstream의 업데이트 사항을 Pull 받은 후 작업하기

(2) 변경사항을 아래 Commit 컨벤션에 맞추어 작업한 기능 단위로 Commit 할 것.

- header : [기능 특성] + title
- body : 추가한 기능 설명
- footer : 해결된 이슈 번호 혹은 참고할 이슈 번호

```jsx
[feature] 대댓글 UI 추가 // header

- 대댓글 컴포넌트 생성 // body
- 댓글 컴포넌트에 대댓글 컴포넌트 달 수 있게 변경

resolves : #47 // footer
see also : #56, #49
```

### 개발 마무리

(1) 여러 번 커밋을 거치고 해당 Branch의 목적이 달성되었다면 (ex : feature/#12 브랜치에서 12번 이슈가 구현되었다면) 아래 양식에 맞추어 제목을 지정, Pull Request를 올려 팀원의 코드 리뷰를 받는다. 이때 `origin`의 `feature/#102` 브랜치에서 `upstream` 의 `dev` 브랜치로 올린다.

**기능특성/이슈번호 : 추가한 기능에 대한 간략한 설명**

ex) [Feature/#102] 소셜로그인 호환성 작업

(2) 코드 리뷰를 거쳐 코드 리팩토링 이후 완성본을 Dev에 Merge한다. 경우에 따라 깔끔한 커밋 그래프를 가져가기 위해 Rebase를 한다.

- 참고자료
  - rebase 관련 참고 링크 1 [https://git-scm.com/book/ko/v2/Git-브랜치-Rebase-하기](https://git-scm.com/book/ko/v2/Git-%EB%B8%8C%EB%9E%9C%EC%B9%98-Rebase-%ED%95%98%EA%B8%B0)
  - rebase 관련 참고 링크 2 [https://velog.io/@pock11/git-rebase-하는-법](https://velog.io/@pock11/git-rebase-%ED%95%98%EB%8A%94-%EB%B2%95)
  - PR Merge 시 rebase와 sqaush와 commit의 차이 [https://velog.io/@code-bebop/Github-merge-squash-merge-rebase-merge](https://velog.io/@code-bebop/Github-merge-squash-merge-rebase-merge)

## Pull Request 가이드

백엔드 기준 작성 By @Seungjae Park

## PR 올리는 법

![Untitled](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/37134ac1-6a12-4de8-81c7-376301d16d67/Untitled.png)

Reviews에 backend 팀 설정, Assignees에 본인 설정

## PR 받는 법

![Untitled](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/2155df9a-b2a4-48af-aad9-689fec39c0ad/Untitled.png)

Files changed 탭에 가서 모든 Viewd 체크박스 확인하기

![Untitled](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/55c9bf74-2107-4f9e-b05c-0a349e92cd6e/Untitled.png)

Reviews changes에서 2번째 Approve 누르고 제출

- Comment: PR이 이해 안 될 때 질문하는 용도
- Request changes: PR이 맘에 안 들어서 수정 요청하는 용도

**+리뷰 없이 PR Merge 불가!**

![Untitled](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/6bbac32a-e7a4-4496-9d19-4073cf4ec26b/Untitled.png)

Merge 할 때는 Squash and merge로 선택(이렇게 해야 master 브랜치가 간결해짐)

- Create a merge commit: 일반적인 merge
- Squash and merge: PR 안의 커밋들을 커밋 하나로 뭉쳐서 master에 병합
- Rebase and merge: PR된 브랜치를 master 기준으로 Rebase하고 병합

### Rebase란?

![Untitled](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/7c36ef2e-e6d3-46c7-8668-c677ba3a112b/Untitled.png)

![Untitled](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/0e4a1c65-caf0-4209-b045-3e45592d3bc9/Untitled.png)

브랜치의 시작점을 가장 최근으로 당겨줌
