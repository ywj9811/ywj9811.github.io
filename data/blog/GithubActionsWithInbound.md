---
title: 인바운드 제한 설정 상태에서 GithubActions 설정하기
date: '2024-02-24'
tags: ['AWS', 'SERVER', '기술']
draft: false
summary: 인바운드 제한 설정 상태에서 GithubActions 설정하기
---
## 방화벽 인바운드, 아웃바운드 규칙이란

우선, 방화벽의 인바운드 규칙과 아웃바운드 규칙에 대해서 간단하게 이해하고 들어가도록 하자.

방화벽은 전달되는 패킷의 정보 (프로토콜, 포트, IP)를 바탕으로 전송을 허용하거나 거부하는 시스템으로, 이때 외부에서 내부로 전달되는 것을 인바운드 트래픽, 내부에서 외부로 전달하는 것을 아웃바운드 트래픽이라고 한다.

따라서 인바운드 규칙과 아웃바운드 규칙이란 위의 패킷 정보를 기반으로 트래픽을 허용하거나 거부하는 규칙을 의미한다.

## 상황

AWS를 사용하는 환경에서 EC2와 RDS의 인바운드 규칙을 특정 IP만 허용하고 그외의 IP는 허용하지 않는 경우를 가정해보자.

그렇다면 CI/CD를 의한 github actions에서 어떻게 우리의 EC2와 RDS에 접근할 수 있을까.

![Untitled](/static/images/action.png)

우리의 CI/CD 에 대해서 간략하게 그려보면 위와 같다.

우선, PR이 발생하면 CI에서 빌드와 테스트를 진행하고, 완료 후 푸시 혹은 머지를 하면 CD를 진행하여 EC2에 올라가게 된다.

좀 자세히 설명을 해보자면, CI(지속적 통합)에서는 빌드 후 테스트를 진행하여 올바르게 통합되고 있는지 체크를 진행하며 CD(지속적 배포)에서는 빌드를 하여 EC2에 이미지를 올리고 EC2에서 해당 이미지를 Pull해서 사용하는 방식으로 진행된다고 보면 된다.

따라서 우리는 EC2와 RDS에 접근하는 순간이 있다.

1. CI에서 빌드와 테스트를 진행하기 때문에 RDS에 연결을 시도해야 한다.
2. CD에서 빌드 후 EC2에 올리기 때문에 EC2와 RDS에 모두 연결을 시도해야 한다.

### IAM 발급

AWS의 EC2와 RDS에 대한 인바운드 규칙에 GithubActions의 IP를 추가해야 하는데, 그것을 자동화 하기 위해 권한을 가지고 있는 IAM을 발급 받아야 한다.

IAM에서 사용자 추가를 하여 `AmazonEC2FullAccess` 와 같은 EC2에 대한 권한을 가지는 정책을 선택 후 엑세스 키를 발급 받도록 하자.

<aside>
🔒 주의할 점은 이때 받은 엑세스 키와 시크릿 키는 안전한 곳에 저장하여 유출되지 않도록 보관하도록 하자.

</aside>

### CI 워크플로우 작성

우선 기존의 인바운드 규칙에서 외부 IP를 허용 했을 경우 워크플로우를 살펴보면 아래와 같다.

```yaml
name: Java CI with Gradle

on:
  pull_request:
    branches: [ "develop" ]

permissions:
  contents: read

jobs:
  build:

    runs-on: ubuntu-latest
    env :
      working-directory: ./
      APPLICATION: ${{ secrets.APPLICATION }}

    steps:
      - uses: actions/checkout@v2
      - name: Set up JDK 17
        uses: actions/setup-java@v2
        with:
          java-version: '17'
          distribution: 'adopt'

      - name: Cache Gradle packages
        uses: actions/cache@v2
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
          restore-keys: |
            ${{ runner.os }}-gradle-

      - name: Create application.yml
        run: |
          echo "${{env.APPLICATION}}" > ./src/main/resources/application.yml

      - name: Grant execute permission for gradlew
        run: chmod +x gradlew
        working-directory: ${{ env.working-directory }}

      - name: Build with Gradle
        run: ./gradlew build
        working-directory: ${{ env.working-directory }}

      - name: Cleanup Gradle Cache
        if: ${{ always() }}
        run: |
          rm -f ~/.gradle/caches/modules-2/modules-2.lock
          rm -f ~/.gradle/caches/modules-2/gc.properties
```

이제 인바운드 규칙을 수정한 이후 CI 워크 플로우를 살펴보자.

```yaml
name: Java CI with Gradle

on:
  pull_request:
    branches: [ "main" ]

permissions:
  contents: read

jobs:
  build:

    runs-on: ubuntu-latest
    env :
      working-directory: ./
      APPLICATION: ${{ secrets.APPLICATION_PROD }}

    steps:
      # GET GitHub IP
      - name: get Github IP
        id: ip
        uses: haythem/public-ip@v1.2

      # Configure AWS Credentials
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2

        # Add github ip to AWS SecurityGroup
      - name: Add GitHub IP to AWS RDS
        run: |
          aws ec2 authorize-security-group-ingress --group-id ${{ secrets.AWS_RDS_SG_ID }} --protocol tcp --port 3306 --cidr ${{ steps.ip.outputs.ipv4 }}/32

      - uses: actions/checkout@v2
      - name: Set up JDK 17
        uses: actions/setup-java@v2
        with:
          java-version: '17'
          distribution: 'adopt'

      - name: Cache Gradle packages
        uses: actions/cache@v2
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
          restore-keys: |
            ${{ runner.os }}-gradle-

      - name: Create application.yml
        run: |
          echo "${{env.APPLICATION}}" > ./src/main/resources/application.yml

      - name: Grant execute permission for gradlew
        run: chmod +x gradlew
        working-directory: ${{ env.working-directory }}

      - name: Build with Gradle
        run: ./gradlew build
        working-directory: ${{ env.working-directory }}

      - name: Cleanup Gradle Cache
        if: ${{ always() }}
        run: |
          rm -f ~/.gradle/caches/modules-2/modules-2.lock
          rm -f ~/.gradle/caches/modules-2/gc.properties

      - name: Remove IP FROM security group RDS
        if: ${{ always() }}
        run: |
          aws ec2 revoke-security-group-ingress --group-id ${{ secrets.AWS_RDS_SG_ID }} --protocol tcp --port 3306 --cidr ${{ steps.ip.outputs.ipv4 }}/32
```

우선, 대부분의 내용은 일치한다.

`${{ secrets.APPLICATION_PROD }}` 를 통해서 secret에 작성되어 있는 application.yml 파일을 넣어주고, 해당 파일을 사용하며 빌드하고 테스트 한다는 내용이다.

하지만, RDS에 대한 접근이 필요하기 때문에 GithubActions의 IP를 인바운드 규칙에서 허용해주도록 하고, 마지막에 다시 삭제해주는 부분이 포함된 것이다.

이를 위해서 준비할 부분이 몇가지 있으므로, 이와 함께 설명하도록 하겠다.

---

**우선, 시크릿 키에 몇가지 추가를 해야한다.**

`AWS_ACCESS_KEY_ID` : IAM에서 발급받았던 ACCESS KEY

`AWS_SECRET_ACCESS_KEY` : IAM에서 발급받은 SECRET KEY

`AWS_RDS_SG_ID` : RDS의 인바운드 규칙의 ID

---

```yaml
# GET GitHub IP
- name: get Github IP
    id: ip
    uses: haythem/public-ip@v1.2  
    # Configure AWS Credentials
- name: Configure AWS Credentials
    uses: aws-actions/configure-aws-credentials@v1
    with:
      aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
      aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      aws-region: ap-northeast-2

# Add github ip to AWS SecurityGroup
- name: Add GitHub IP to AWS RDS
    run: |
      aws ec2 authorize-security-group-ingress --group-id ${{ secrets.AWS_RDS_SG_ID }} --protocol tcp --port 3306 --cidr ${{ steps.ip.outputs.ipv4 }}/32
```

위의 부분은 순서대로, GithubActions에서 사용하는 IP를 얻어오고 AWS에 접근 권한을 얻은 이후 RDS의 인바운드 규칙에 얻어온 IP를 추가하는 것이다.

```yaml
- name: Remove IP FROM security group RDS
    if: ${{ always() }}
		run: |
			aws ec2 revoke-security-group-ingress --group-id ${{ secrets.AWS_RDS_SG_ID }} --protocol tcp --port 3306 --cidr ${{ steps.ip.outputs.ipv4 }}/32
```

이 마지막 부분은 RDS의 인바운드 규칙에 얻어온 IP를 추가한 것을 다시 삭제하는 부분이다.

이를 통해서 이 순간에만 해당 IP를 허용하여 빌드에서 문제가 발생하지 않도록 해주는 것이다.

### CD 워크플로우 작성

마찬가지로 기존의 워크플로우를 확인하면 다음과 같다.

```yaml
name: Java CD with Gradle

on:
  push:
    branches: [ "develop" ]

permissions:
  contents: read

jobs:
  build:

    runs-on: ubuntu-latest
    env :
      working-directory: ./
      APPLICATION: ${{ secrets.APPLICATION }}

    steps:
    - uses: actions/checkout@v2
    - name: Set up JDK 17
      uses: actions/setup-java@v2
      with:
        java-version: '17'
        distribution: 'adopt'
        
    - name: Cache Gradle packages
      uses: actions/cache@v2
      with:
        path: |
          ~/.gradle/caches
          ~/.gradle/wrapper
        key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
        restore-keys: |
          ${{ runner.os }}-gradle-

    - name: Create application.yml
      run: |
        echo "${{env.APPLICATION}}" > ./src/main/resources/application.yml
        
    - name: Grant execute permission for gradlew
      run: chmod +x gradlew
      working-directory: ${{ env.working-directory }}
      
    - name: Build with Gradle
      run: ./gradlew build
      working-directory: ${{ env.working-directory }}
      
    - name: Cleanup Gradle Cache
      if: ${{ always() }}
      run: |
          rm -f ~/.gradle/caches/modules-2/modules-2.lock
          rm -f ~/.gradle/caches/modules-2/gc.properties

    - name: Login to DockerHub
      uses: docker/login-action@v1
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
        
    - name: Build and Push Docker image
      run: |
        docker build -t ywj9811/postgraduate_develop:latest .
        docker push ywj9811/postgraduate_develop:latest

    - name: Deploy
      uses: appleboy/ssh-action@master
      with:
          host: ${{ secrets.EC2_SERVER_HOST }}
          username: ${{ secrets.EC2_SERVER_USERNAME }}
          key: ${{ secrets.PRIVATE_KEY }}
          envs: GITHUB_SHA
          script: |
            docker-compose -f /home/ec2-user/config/docker-compose.yml down
            docker-compose -f /home/ec2-user/config/docker-compose.yml pull
            docker-compose -f /home/ec2-user/config/docker-compose.yml up -d --force-recreate --build
```

마찬가지로 이제 인바운드 규칙을 수정한 이후의 CD를 살펴보자.

```yaml
name: Java CD with Gradle

on:
  push:
    branches: [ "main" ]

permissions:
  contents: read

jobs:
  build:

    runs-on: ubuntu-latest
    env :
      working-directory: ./
      APPLICATION: ${{ secrets.APPLICATION_PROD }}

    steps:
    # GET GitHub IP
    - name: get Github IP
      id: ip
      uses: haythem/public-ip@v1.2

    # Configure AWS Credentials
    - name: Configure AWS Credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ap-northeast-2

      # Add github ip to AWS SecurityGruop
    - name: Add GitHub IP to AWS EC2
      run: |
        aws ec2 authorize-security-group-ingress --group-id ${{ secrets.AWS_EC2_SG_ID }} --protocol tcp --port 22 --cidr ${{ steps.ip.outputs.ipv4 }}/32

    - name: Add GitHub IP to AWS RDS
      run: |
        aws ec2 authorize-security-group-ingress --group-id ${{ secrets.AWS_RDS_SG_ID }} --protocol tcp --port 3306 --cidr ${{ steps.ip.outputs.ipv4 }}/32

    - uses: actions/checkout@v2
    - name: Set up JDK 17
      uses: actions/setup-java@v2
      with:
        java-version: '17'
        distribution: 'adopt'
        
    - name: Cache Gradle packages
      uses: actions/cache@v2
      with:
        path: |
          ~/.gradle/caches
          ~/.gradle/wrapper
        key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
        restore-keys: |
          ${{ runner.os }}-gradle-

    - name: Create application.yml
      run: |
        echo "${{env.APPLICATION}}" > ./src/main/resources/application.yml
        
    - name: Grant execute permission for gradlew
      run: chmod +x gradlew
      working-directory: ${{ env.working-directory }}
      
    - name: Build with Gradle
      run: ./gradlew build
      working-directory: ${{ env.working-directory }}
      
    - name: Cleanup Gradle Cache
      if: ${{ always() }}
      run: |
          rm -f ~/.gradle/caches/modules-2/modules-2.lock
          rm -f ~/.gradle/caches/modules-2/gc.properties

    - name: Login to DockerHub
      uses: docker/login-action@v1
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
        
    - name: Build and Push Docker image
      run: |
        docker build -t ywj9811/kimseonbae:latest .
        docker push ywj9811/kimseonbae:latest

    - name: Deploy
      uses: appleboy/ssh-action@master
      with:
          host: ${{ secrets.EC2_SERVER_HOST_PROD }}
          username: ${{ secrets.EC2_SERVER_USERNAME }}
          key: ${{ secrets.PRIVATE_KEY_PROD }}
          envs: GITHUB_SHA
          script: |
            chmod +x /home/ec2-user/config/deploy.sh
            /home/ec2-user/config/deploy.sh
          debug: true

      # REMOVE Github IP FROM security group
    - name: Remove IP FROM security group EC2
      if: ${{ always() }}
      run: |
        aws ec2 revoke-security-group-ingress --group-id ${{ secrets.AWS_EC2_SG_ID }} --protocol tcp --port 22 --cidr ${{ steps.ip.outputs.ipv4 }}/32

    - name: Remove IP FROM security group RDS
      if: ${{ always() }}
      run: |
        aws ec2 revoke-security-group-ingress --group-id ${{ secrets.AWS_RDS_SG_ID }} --protocol tcp --port 3306 --cidr ${{ steps.ip.outputs.ipv4 }}/32
```

이는 CI와 마찬가지로 변경이 된 것이다.

다만, CI에서와 달리 EC2에 올려야 하기 때문에 EC2의 인바운드 규칙을 수정하는 부분이 추가됐다.

(이외에 다른 부분은 서버의 인프라가 약간 다르게 되어있기 때문에 차이가 나는 것이다.)

`AWS_EC2_SG_ID` 이것이 추가된 것으로 이는 EC2의 인바운드 규칙의 ID를 의미하는 것이다.

## 정리

이렇게 인바운드 규칙에 의해 접근이 제한된 상태에서 GithubActions을 어떻게 작동시킬지에 대해 고민을 해보았고, 해결을 했다.

하지만 그럼에도 문제가 되는 부분이 남아있긴 하다.

이전에 포스팅한 내용중 RDS를 EC2를 통해서만 접근할 수 있게 하겠다는 부분과 충돌이 발생하는데, RDS를 EC2를 통해서만 접근할 수 있게 하기 위해 RDS의 퍼블릭 엑세스를 허용하지 않았고, 그렇게 된다면 같은 VPC외의 다른 인터넷을 통해서는 접근할 수 없다.

따라서 위의 방식으로도 접근이 막히게 된다. 즉, 위의 방식을 위해서는 퍼블릭 엑세스는 허용하고 인바운드 규칙을 통해 접근을 막는 것으로 약간의 찝찝함이 남게된다.

물론 각각의 장단점이 존재할 것이고 상황에 따라서 선택하는 것이 맞지만 어떤 방식을 통해서 퍼블릭 엑세스가 차단된 상황에서 작성할 수 있을 것인지에 대해서 알아볼 필요가 있을 것 같다.