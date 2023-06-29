---
title: 중복 로그인 방지 작업
date: '2023-06-29'
tags: ['spring boot', '기술']
draft: false
summary: 하나의 아이디로 여러 컴퓨터에서 동시에 로그인을 하는 것을 어떻게 막을까
---
사용자가 하나의 아이디로 여러 곳에서 중복 로그인 하는 것을 당연히 허락하면 안된다.

물론 예외의 경우도 있겠지만, 현재의 프로젝트에서는 중복 로그인을 허용하는 것 보다는 중복 로그인을 제외하는 것이 좋을 것 같다고 판단했다.

그렇다면 어떻게 구현할 것인가?

**Spring Security**에서 설정을 하여 **세션이 1개만 유지되도록** 구현할 수 있다고 한다.

하지만 나는 JWT를 사용하기 위해 세션을 사용하지 않도록 설정했다.

나의 상황에 맞춰서 방법을 생각해야 했는데, 직관적인 방식을 선택했다.

기존에 Redis에 RefreshToken을 저장하여 재발급 할 때 이전의 RefreshToken을 사용하지 못하도록 구현하였었는데 이 로직을 비슷하게 이용하여 AccessToken을 Redis에 적당한 키값으로 저장을 하고 요청이 왔을 때 Redis에 저장된 AccessToken과 요청이 들어온 AccessToken을 비교할 것이다.

그렇게 되면 사용자가 A에서 로그인 하여 사용하던 AccessToken과 B에서 새롭게 로그인하여 받은 AccessToken과 다르기 때문에 A에서는 권한이 사라져 로그인이 풀리게 하는 것이다.

> **그러면 JWT의 장점이 퇴색되지 않을까?**
> 

로직을 생각하며 JWT의 장점을 너무 퇴색시키는 것이 아닐까? 하는 고민을 많이 하였지만 DB의 도움 없이는 JWT의 중복 로그인을 막을 방법을 찾지 못했다…

그래서 DB를 사용하더라도 최대한 성능에 저하가 오지 않도록 Redis를 사용하는 방법을 고려했다.

그리고 현재 서버를 한개만 사용하는 상황에서는 크게 퇴색되지 않는다는 부분도 있고 이후에 서버가 증설된다면 Redis의 저장 정보를 공유하는 방법을 찾아 구현하거나 RDS에 저장해서 사용하는 방법을 알아봐야 할 듯 하다.

그렇다면 구현을 어떻게 했는지 살펴보자.

```java
private String createAccessToken(String authorities, Date current, Long userIdx) {
    Date accessTokenValidity = new Date(current.getTime() + this.accessTokenValidityTime);
	
		String accessToken = Jwts.builder()
            .setSubject(ACCESS)
            .claim(AUTHORITIES_KEY, authorities)
            .claim(USER_IDX, userIdx)
            .setIssuedAt(current)
            .signWith(key, SignatureAlgorithm.HS512)
            .setExpiration(accessTokenValidity)
            .compact();

    log.info("accessToken 저장");
    redisRepository.setValues(ACCESS + userIdx.toString(), accessToken, Duration.ofSeconds(accessTokenValidityTime));
    return accessToken;
}
```

위와 같이 AccessToken 을 생성할 때 Redis에 저장을 한다.

```java
public void checkMultiLogin(String token) {
    Claims claims = parseClaims(token);
    String userIdx = claims.get(USER_IDX).toString();
    log.info("checkMultiple Login");

    if (!redisRepository.getValues(ACCESS + userIdx)
            .orElseThrow()
            .equals(token))
        throw new RemovedAccessTokenException();
}
```

그리고 위와 같이 헤더에 담아서 온 AccessToken을 현재 Redis에 들어있는 AccessToken과 비교하여 이전에 사용하던 로그인과 같은지 확인한다.

그리고 만약 일치하지 않는다면 예외를 던져서 처리하는 방식이다.

![Untitled](/static/images/duplogin.png)

만약 **다른 컴퓨터 혹은 브라우저에서 새롭게 로그인을 하였을 때 기존의 토큰을 사용하려 하면** 위와 같이 에러코드와 메시지가 반환되게 된다.