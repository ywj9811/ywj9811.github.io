---
title: Swagger3.0 버전과 SpringBoot 2.6+ 버전의 오류
date: '2023-04-15'
tags: ['SPRING-BOOT', 'ERROR']
draft: false
summary: Boot 2.6버전 이상부터 Swagger3.0 버전에 대해 오류가 발생한다.
---

## 오류 메시지

```text
Failed to start bean 'documentationPluginsBootstrapper';nested exception is java.lang
.NullPointerException: Cannot invoke "org.springframework.web.servlet.mvc.condition
.PatternsRequestCondition.getPatterns()" because "this.condition" is null
```

## 원인

이게 무슨일이지 하고 찾아보니, **Spring Boot 2.6.0 버전**부터 기존의 요청 경로를 ControllerHandler에 매칭시키기 위해 **기존의 기본값이었던 ant_path_matcher 전략**을 사용하지 않고 **path_pattern_parser 전략으로 변경**되었기 때문이라고 한다.

## 해결 방안

1. **첫번째 해결 방안**은 아래의 내용을 application.yml에 추가하는 것이다.

```yaml
spring:
  mvc:
    pathmatch:
      matching-strategy: ant_path_matcher
```

2. **두번째 해결 방안**은 아래의 내용을 **Bean으로 등록**해주는 것이다.

```java
@Bean
public WebMvcEndpointHandlerMapping webEndpointServletHandlerMapping(
                WebEndpointsSupplier webEndpointsSupplier,
                ServletEndpointsSupplier servletEndpointsSupplier,
                ControllerEndpointsSupplier controllerEndpointsSupplier,
                EndpointMediaTypes endpointMediaTypes,
                CorsEndpointProperties corsProperties,
                WebEndpointProperties webEndpointProperties,
                Environment environment) {
    List<ExposableEndpoint<?>> allEndpoints = new ArrayList();
    Collection<ExposableWebEndpoint> webEndpoints = webEndpointsSupplier.getEndpoints();
    allEndpoints.addAll(webEndpoints);
    allEndpoints.addAll(servletEndpointsSupplier.getEndpoints());
    allEndpoints.addAll(controllerEndpointsSupplier.getEndpoints());
    String basePath = webEndpointProperties.getBasePath();
    EndpointMapping endpointMapping = new EndpointMapping(basePath);
    boolean shouldRegisterLinksMapping = this.shouldRegisterLinksMapping(
                webEndpointProperties, environment, basePath);
    return new WebMvcEndpointHandlerMapping(endpointMapping, webEndpoints,
                endpointMediaTypes, corsProperties.toCorsConfiguration(),
                new EndpointLinksResolver(allEndpoints, basePath),
                shouldRegisterLinksMapping, null);
}

private boolean shouldRegisterLinksMapping(WebEndpointProperties webEndpointProperties,
                                           Environment environment, String basePath) {
    return webEndpointProperties.getDiscovery().isEnabled() &&
                (StringUtils.hasText(basePath) ||
                ManagementPortType.get(environment).equals(ManagementPortType.DIFFERENT));
}
```

3. **세번째 해결 방안**은 Boot의 버전을 2.5.xx로 낮추는 것이다.

물론 나는 이중에서 첫번째 해결 방안을 통해 해결했다.

> 참고 : https://stackoverflow.com/questions/70036953/spring-boot-2-6-0-spring-fox-3-failed-to-start-bean-documentationpluginsboo
