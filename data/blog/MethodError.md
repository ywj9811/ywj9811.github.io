---
title: Request method 'METHOD명' not supported
date: '2023-01-18'
tags: ['Spring boot', 'ERROR']
draft: false
summary: RESTful API를 작성하려다 ERROR를 만났다.
---

**RESTful**한 API를 작성하기 위해서 **DELETE, PUT** 을 사용하면 갑자기 SpringBoot가 거절하는 것을 겪을 수 있다.

```java
DefaultHandlerExceptionResolver : Resolved [org.springframework.web.HttpRequestMethodNotSupportedException: Request method 'DELETE' not supported]
```

이러한 에러가 뜬다.

이 경우 **application.properties**에 다음을 추가해주면 된다.

```java
//PUT, DELETE 허락
spring.mvc.hiddenmethod.filter.enabled=true
```
