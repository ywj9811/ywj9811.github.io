---
title: AWS S3 pre-signed URL
date: '2023-11-13'
tags: ['AWS', '기술']
draft: false
summary: AWS S3의 pre-signed URL이란 무엇이고, 어떻게 사용하는 것일까
---
## S3 (Simple Storage Service)란?

기본적으로 AWS S3에 대해서 알고는 있을 것이다.

간단하게 살펴보고 지나가자면, 

확장성과 데이터 가용성 및 보안과 성능을 제공하는 온라인 오브젝트 스토리지 서비스라고 한다.

그리고 S 앞글자가 3개라서 S3라고 한다.

---

## pre-signed URL이란?

이는 말 그대로 AWS 자원에 대한 접근 권한을 제공하기 위해서 사용되는 이름 그대로 사전에 적절한 권한을 가진 자격증명에 의하여 Signed 된 URL을 의미한다.

AWS에서는 이러한 pre-signed URl을 S3에서 사용할 수 있게 제공하고 있다.

## 왜 사용하는가?

1. **네트워크 대역폭 증가에 의한 퍼포먼스에 대한 비용 감소**
    
    JSON을 주고 받는 일반  API에 비해서 이미지를 업로드 하는 작업은 부하가 매우 크다. 따라서 이미지 업로드가 백엔드 서버를 거쳐서 이루어지게 되면 백엔드 서버에 부하가 크게 가해질 것이다.
    
    하지만, 프론트에서 바로 S3에 업로드를 진행하게 된다면 위와 같은 문제가 발생하지 않아서 퍼포먼스 감소를 예방할 수 있다.
    
2. **보안**
    
    하지만 프론트에서 바로 S3에 마음대로 올릴 수 있게 해준다면 당연히 보안 문제가 발생할 수 있을 것이다.
    
    아무나 이미지를 업로드하거나 삭제하면 곤란할 수 있다는건 당연한 것이다.
    
    따라서 정해진 규칙 안에서 관리될 수 있도록 해야 하는데, 이때 pre-signed URL이 활용될 수 있다.
    

즉, 백엔드는 pre-signed URl을 생성하는 보안절차 작업만 수행하여 백엔드 서버에 부하가 발생하지 않고, 이러한 절차를 통해 정해진 규칙 안에서만 관리될 수 있도록 하여 보안 또한 챙길 수 있다.

---

## 사용 설정 및 구현

1. 우선, S3 Bucket의 정책에 PutObject와 GetObject를 퍼블릭 액세스로 설정해준다.
2. S3에 대한 접근 권한을 가지는 IAM을 만들어주고, 인증키를 받아둔다.
3. SpringBoot의 `application.yml` 에 본인의 인증키를 추가한다.
    
    ```yaml
    cloud:
      aws:
        s3:
          bucket: post-graduate
          prefix-profile: post-graduate-profile
          prefix-certification: post-graduate-certification
        credentials:
          instance-profile: false
          access-key: (본인의 access-key)
          secret-key: (본인의 secret-key)
        region:
          auto: false
          static: ap-northeast-2
        stack:
          auto: false
    ```
    
4.  S3 관련 설정을 해주는 `S3Config` 클래스 작성
    
    ```java
    @Configuration
    public class S3Config {
    
        @Value("${cloud.aws.credentials.access-key}")
        public String accessKey;
        @Value("${cloud.aws.credentials.secret-key}")
        public String secretKey;
        @Value("${cloud.aws.region.static}")
        public String region;
    
        @Bean
        public AmazonS3Client amazonS3Client() {
            AWSCredentials credentials = new BasicAWSCredentials(accessKey, secretKey);
            return (AmazonS3Client)
                    AmazonS3ClientBuilder.standard()
                            .withCredentials(new AWSStaticCredentialsProvider(credentials))
                            .withRegion(region)
                            .build();
        }
    }
    ```
    
5. S3의 pre-signed URL을 발급받는 작업을 하는 `S3Service` 클래스 작성
    
    ```java
    @Service
    @RequiredArgsConstructor
    @Slf4j
    public class S3Service {
        private final AmazonS3Client amazonS3;
        @Value("${cloud.aws.s3.bucket}")
        private String bucket;
        @Value("${cloud.aws.s3.prefix-profile}")
        private String prefixProfile;
        @Value("${cloud.aws.s3.prefix-certification}")
        private String prefixCertification;
    
        /**
         * @param fileName : 어떤 파일을 저장할 것인가 (파일명)
         * @return
         */
        public String getProfilePreSignedUrl(String fileName) {
            fileName = prefixProfile + "/" + fileName;
            GeneratePresignedUrlRequest generatePresignedUrlRequest = getGeneratePreSignedUrlRequest(bucket, fileName);
            URL url = amazonS3.generatePresignedUrl(generatePresignedUrlRequest);
            return url.toString();
        }
    
        public String getCertificationPreSignedUrl(String fileName) {
            fileName = prefixCertification + "/" + fileName;
            GeneratePresignedUrlRequest generatePresignedUrlRequest = getGeneratePreSignedUrlRequest(bucket, fileName);
            URL url = amazonS3.generatePresignedUrl(generatePresignedUrlRequest);
            return url.toString();
        }
    
        private GeneratePresignedUrlRequest getGeneratePreSignedUrlRequest(String bucket, String fileName) {
            GeneratePresignedUrlRequest generatePresignedUrlRequest =
                    new GeneratePresignedUrlRequest(bucket, fileName)
                            .withMethod(PUT)
                            .withExpiration(getPreSignedUrlExpiration());
            generatePresignedUrlRequest.addRequestParameter(
                    Headers.S3_CANNED_ACL,
                    CannedAccessControlList.PublicRead.toString());
            return generatePresignedUrlRequest;
        }
    
        private Date getPreSignedUrlExpiration() {
            Date expiration = new Date();
            long expTimeMillis = expiration.getTime();
            expTimeMillis += 1000 * 60 * 2; // 2분동안 가능하도록
            expiration.setTime(expTimeMillis);
            log.info(expiration.toString());
            return expiration;
        }
    }
    ```
    
    - bucket: 버킷 이름
    - prefix~~: 버킷 내 디렉토리 이름
    - fileName: 업로드 하고자 하는 파일명
    
    이렇게 변수들을 가지고 진행을 하는데, 위의 경우 
    
    `getGeneratePreSignedUrlRequest` 는 `getPreSignedUrlExpiration` 을 통해 원하는 버킷에, 원하는 디렉토리에 대해 **일정 시간(**`.withExpiration()`**)**파일을 **올릴 수 있는(**`.withMethod(PUT)`**)** 권한을 가지는 pre-signed URL을 생성해주는 메소드이다.
    
    따라서 fileName을 가지고 `getProfilePreSignedUrl` 혹은 `getCertificationPreSignedUrl` 을 호출하면 해당 경로에 해당 파일을 올릴 수 있는 pre-signed URL을 생성해준다.
    
    이를 컨트롤러, 서비스 등등을 이용하여 특정 호출에 맞춰서 제공해주면 된다.