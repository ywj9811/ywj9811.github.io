---
title: Mockito와 BDDMockito
date: '2023-08-05'
tags: ['Spring boot', '기술']
draft: false
summary: Mockito와 BDDMockito 그리고 사용법
---
# Mockito와 BDDMockito

## Mockito?

Spring은 DI를 지원하는데, 이는 객체간의 의존성을 Spring이 관리해주는 것이다.

하지만, 이러한 편한 기능이 테스트를 하는 시점에서는 문제가 될 수 있는데 단위 테스트를 작성할 때 해당 객체에 대한 기능만을 테스트하고 싶은데 의존성을 가지는 다른 객체에 의해 테스트 결과가 영향을 받을 수 있기 때문이다.

**이때 의존을 가지는 객체가 우리가 원하는 동작만을 하도록 만드는 것이 Mock 객체이다.**

그리고 이런 Mock객체를 쉽게 사용할 수 있도록 지원해주는 것이 **Mockito**이다.

### 어노테이션은 무엇을 사용할까

- `@ExtendWith(MockitoExtention.class)` : 테스트 클래스 상단에 지정하여 Mockito를 사용하도록 정의
- `@Mock` : Mock 객체를 만들어 반환해주는 어노테이션
- `@Spy` : Stub 하지 않은 메소드들은 원본 메소드 그대로 사용하는 어노테이션
- `@InjectMocks` : `@Mock` , `@Spy` 로 생성된 가짜 객체들을 이 어노테이션이 달린 클래스에 주입을 시켜준다.

<aside>
📌 즉, `UserService` 에 대한 단위 테스트를 하기 위해 `UserRepository` 를 주입해야 한다면?

- `UserRepository` → `@Mock`
- `UserService` → `@InjectMocks`
</aside>

<aside>
📌 **Stub은 무엇일까?**

- 의존성이 있는 객체는 가짜 객체 (Mock 객체) 를 주입하여 정해진 답변을 하도록 하는 것이다.
</aside>

## BDD?

Behavior-Driven Development의 약자로 **행위 주도 개발**을 의미한다.

테스트 대상의 상태 변화를 테스트 하는 것이고, 시나리오 기반으로 테스트하는 패턴을 권장한다.

여기서 권장하는 기본 패턴은 아래와 같다.

1. Given
    
    테스트 대상이 A상태에서 출발
    
2. When
    
    어떤 상태 변화를 가했을 때
    
3. Then
    
    어떤 상태로 완료되어야 한다.
    

그렇다면 Mockito를 사용하는 테스트 코드는 BDD의 기본패턴으로 나타내면 어떻게 될까.

```java
@Test
void hasSkill_AlwaysTrue() {
    // given
    when(skills.hasSkill()).thenReturn(true);

    // when
    boolean actual = person.hasSkill();

    // then
    assertThat(actual).isTrue();
}
```

근데 이 경우 given인데 `when()`이 나오고 있다.

이러한 부분을 해결하는 것이 **BBDMockito**이다.

## BDDMockito

이 클래스는 `Mockito` 를 상속하는 클래스로 동작이나 사용법은 크게 차이가 나지 않는다.

```java
@Test
void hasSkill_AlwaysTrue() {
    // given
    given(skills.hasSkill()).willReturn(true);

    // when
    boolean actual = person.hasSkill();

    // then
    assertThat(actual).isTrue();
}
```

**BDDMockito**를 사용하면 위와 같이 시나리오에 맞는 메소드를 사용할 수 있다.

BDD 기본 패턴의 given에 해당하는 위치에 이전에 사용한 Mockito의 `when()` 메서드가 아닌 `given()` 메서드가 사용되며 BDD 기본 패턴의 then에서 사용되는 Mockito에서 제공하는 `verify()` 도 `then().should()` 로 대체될 수 있다.

---

## 예시

```java
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserMainService {
    private final UserRepository userRepository;
    private final CenterRepository centerRepository;
    private final RedisRepository redisRepository;
    private final SecurityUtils securityUtils;
    private final String USER_PLUS = "LearningInfo";
		
		...
		
    public UserGrade getGrade() {
        User user = securityUtils.getLoggedInUser().orElseThrow(() -> new ClassCastException("NotLogin"));
        UserGrade grade = UserGrade.from(user);
        return grade;
    }

    public UserFavRegion getFavCenter() {
        List<String> centers = new ArrayList<>();
        try {
            return getLoginRegion(centers);
        } catch (ClassCastException e) {
            return notLoginRegion(centers);
        }
    }

    public UserRegion getRegion() {
        User user = securityUtils.getLoggedInUser().orElseThrow(() -> new ClassCastException("NotLogin"));
        String region = user.getRegion();
        return UserRegion.builder()
                .region(region).build();
    }

		...
}
```

이러한 Service코드가 있을 때 이에 대한 테스트 코드를 어떻게 작성할 수 있을까

```java
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
@Slf4j
public class UserMainServiceTest {
    @Mock
    private CenterRepository centerRepository;
    @Mock
    private RedisRepository redisRepository;
    @Mock
    private SecurityUtils securityUtils;
    @InjectMocks
    private UserMainService userMainService;
    private User user = new MockUser().getUser();
    private List<Center> fourCenters = new MockCenter().fourCenters;

    @Test
    void getGradeTest() {
        given(securityUtils.getLoggedInUser()).willReturn(Optional.ofNullable(user));

        UserGrade grade = userMainService.getGrade();
        List<String> favField = grade.getFavField();
        String[] favFields = user.getFavField().split(",");

        assertThat(grade.getGrade()).isEqualTo(0);
        assertThat(grade.getProfile()).isEqualTo("default");
        assertThat(grade.getNickName()).isEqualTo("forTest");

        for (int i = 0; i < favField.size(); i++) {
            assertThat(favField.get(i)).isEqualTo(favFields[i]);
        }
    }
		
		@Test
    void getGradeFailTest() {
        given(securityUtils.getLoggedInUser()).willReturn(Optional.empty());

        assertThatThrownBy(() -> userMainService.getGrade())
                .isInstanceOf(ClassCastException.class);
    }

    @Test
    void getRegionTest() {
        given(securityUtils.getLoggedInUser()).willReturn(Optional.of(user));

        UserRegion region = userMainService.getRegion();

        assertThat(region.getRegion()).isEqualTo("강서구");
    }

    @Test
    void getOnlyFavRegionTest() {
        given(securityUtils.getLoggedInUser()).willReturn(Optional.of(user));

        UserFavRegion userFavRegion = userMainService.onlyFavRegion();
        List<String> regions = userFavRegion.getRegions();
        String[] favRegions = user.getFavRegion().split(",");

        for (int i = 0; i < regions.size(); i++) {
            assertThat(regions.get(i)).isEqualTo(favRegions[i]);
        }
    }

    @Test
    void notLoginFavCenterTest() {
        given(securityUtils.getLoggedInUser()).willThrow(ClassCastException.class);
        given(centerRepository.findTop4ByOrderByFavCountDesc()).willReturn(fourCenters);

        UserFavRegion favCenter = userMainService.getFavCenter();
        List<String> regions = favCenter.getRegions();

        for (int i = 0; i < fourCenters.size(); i++) {
            assertThat(regions.get(i)).isEqualTo(fourCenters.get(i).getRegion());
        }
    }
}
```

위와 같이 테스트 코드를 작성할 수 있을 것이다.

간단하게 살펴보면

```java
@Mock
private CenterRepository centerRepository;
@Mock
private RedisRepository redisRepository;
@Mock
private SecurityUtils securityUtils;
@InjectMocks
private UserMainService userMainService;
```

이렇게 `userMainService` 에 의존성 주입되어 사용되고 있는 `CenterRepository` 와 `RedisRepository`, `SecurityUtils` 을 Mock객체로 생성하여 주입시켜 준다.

그리고, 

```java
given(securityUtils.getLoggedInUser())
			.willReturn(Optional.of(user));
```

위와 같이 `sercurityUtils.getLoggedInUser()` 의 결과를 `Optional.of(user)` 로 지정하고 진행할 수 있다.

이런식으로 `UserMainService` 클래스가 진행하는 도중 의존성 주입을 통해 작동하는 메소드의 결과를 원하는 값으로 지정하여 성공 혹은 실패를 고의로 테스트 해볼 수 있다.