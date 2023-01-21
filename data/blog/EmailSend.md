---
title: SpringBoot에서 Email 전송
date: '2023-01-20'
tags: ['Spring boot', '기술']
draft: false
summary: 프로젝트 진행 도중 이메일 인증 코드를 만들어야 할 일 이 생겼다.
---

## 프로젝트 진행 도중 이메일 인증 코드를 만들어야 할 일이 생겼다.

기억을 더듬어보면 과거 프로젝트에서 이메일 인증을 만들어 사용했던 기억이 있는데 어떻게 했던 것인지 다시 한번 찾아보며 정리해보도록 해야겠다.

# 1. 의존성 추가 build.gradle

이메일 인증을 사용하기 위해서는 Gradle에 의존성을 추가해야 한다.

```java
//이메일 인증
implementation 'org.springframework.boot:spring-boot-starter-mail'
```

# 2. EmailConfig & application.properites

SpringBoot에서 메일 서버를 사용하기 위해서 메일 서버와 연결을 시켜줘야 한다.

이 게시글은 Gmail을 기준으로 작성했다.

**application.properties를 작성하자**

```java
//email
mail.smtp.auth=true
mail.smtp.starttls.required=true
mail.smtp.starttls.enable=true
mail.smtp.socketFactory.class=javax.net.ssl.SSLSocketFactory
mail.smtp.socketFactory.fallback=false
mail.smtp.port=465
mail.smtp.socketFactory.port=465

//구글 계정
AdminMail.id = 아이디
AdminMail.password = 앱 비밀번호
```

**💡참고로 앱 비밀번호는 구글의 계정의 보안에서 발급 받을 수 있다💡**

이제 **application.properties**를 기준으로 **EmailConfig**를 작성해보자 (주석에 설명)

```java
import java.util.Properties;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@Configuration
@PropertySource("classpath:application.properties")
public class EmailConfig {
    /**
     * port, socketPort, auth, starttls... 등등
     * application.properties에 작성해놓은 내용을 기반으로 지정되게 된다.
     * 그리고 해당 내용을 기반으로 아래 설정이 완료된다.
     */
    @Value("${mail.smtp.port}")
    private int port;
    @Value("${mail.smtp.socketFactory.port}")
    private int socketPort;
    @Value("${mail.smtp.auth}")
    private boolean auth;
    @Value("${mail.smtp.starttls.enable}")
    private boolean starttls;
    @Value("${mail.smtp.starttls.required}")
    private boolean startlls_required;
    @Value("${mail.smtp.socketFactory.fallback}")
    private boolean fallback;
    @Value("${AdminMail.id}")
    private String id;
    @Value("${AdminMail.password}")
    private String password;

    @Bean
    public JavaMailSender javaMailService() {
        JavaMailSenderImpl javaMailSender = new JavaMailSenderImpl();
        javaMailSender.setHost("smtp.gmail.com"); //smtp 서버 주소
        javaMailSender.setUsername(id); // 발신자 메일 아이디
        javaMailSender.setPassword(password); // 발신 메일 패스워드(구글 앱 비밀번호)(따로 설정해야함)
        javaMailSender.setPort(port); //smtp port 구글, 네이버 등등에서 해당 메일의 port 확인 가능
        javaMailSender.setJavaMailProperties(getMailProperties()); // 메일 인증서버 정보
        javaMailSender.setDefaultEncoding("UTF-8");
        return javaMailSender;
    }
    private Properties getMailProperties()
    {
        Properties pt = new Properties();
        pt.put("mail.smtp.socketFactory.port", socketPort); // smtp 포트 번호 넣어주는 것이다 (다른번호 사용시 설정 변경해야함)
        pt.put("mail.smtp.auth", auth); // stmp 권한 인증

        pt.put("mail.smtp.starttls.enable", starttls); //smtp starttls 사용
        pt.put("mail.smtp.starttls.required", startlls_required);
        //starttls -> 보안을 위한 사용(명시적 보안이라 함)
        pt.put("mail.smtp.socketFactory.fallback",fallback);
        pt.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
        return pt;
    }
}
```

# 3. EmailService

이제 메일에는 어떤 내용을 보낼 것인지, 누구에게 보낼 것인지 구현하는 클래스를 작성한다.

```java
import java.util.Random;

import javax.mail.Message.RecipientType;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

import com.demo.dto.response.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import static com.demo.domain.responseCode.ResponseCodeMessage.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService{
    private final JavaMailSender emailSender;

    public static final String ePw = createKey(); //인증번호 생성

    private MimeMessage createMessage(String to)throws Exception{
        log.info("보내는 대상 : {}", to);
        log.info("인증 번호 : " + ePw);
        MimeMessage  message = emailSender.createMimeMessage();

        message.addRecipients(RecipientType.TO, to);//보내는 대상 (@RequestParam으로 받는 email이 들어감)
        message.setSubject("TALER 회원가입 인증번호");//제목

        String msgg="";
        msgg+= "<div style='margin:20px;'>";
        msgg+= "<h1> TALER </h1>";
        msgg+= "<br>";
        msgg+= "<p>아래 코드를 복사해 입력해주세요<p>";
        msgg+= "<br>";
        msgg+= "<div align='center' style='border:1px solid black; font-family:verdana';>";
        msgg+= "<h3 style='color:blue;'>회원가입 인증 코드입니다.</h3>";
        msgg+= "<div style='font-size:130%'>";
        msgg+= "CODE : <strong>";
        msgg+= ePw+"</strong><div><br/> ";
        msgg+= "</div>";
        message.setText(msgg, "utf-8", "html");//내용
        message.setFrom(new InternetAddress("ywj9811@gmail.com","TALER"));
        //보내는 사람 메일 주소, 보여질 이름

        return message;
    }

    public static String createKey() { //지금은 A~Z, a~z, 0~9 혼용 -> 변경하고 싶으면 아래의 내용 변경
        StringBuffer key = new StringBuffer();
        Random rnd = new Random();

        for (int i = 0; i < 8; i++) { // 인증코드 8자리
            int index = rnd.nextInt(3); // 0~2 까지 랜덤

            switch (index) {
                case 0:
                    key.append((char) ((int) (rnd.nextInt(26)) + 97));
                    //  a~z  (ex. 1+97=98 => (char)98 = 'b')
                    break;
                case 1:
                    key.append((char) ((int) (rnd.nextInt(26)) + 65));
                    //  A~Z
                    break;
                case 2:
                    key.append((rnd.nextInt(10)));
                    // 0~9
                    break;
            }
        }
        return key.toString();
    }
    @Override
    public Response sendSimpleMessage(String to)throws Exception {
        // TODO Auto-generated method stub
        MimeMessage message = createMessage(to);
        try{//예외처리
            emailSender.send(message);
        }catch(MailException es){
            es.printStackTrace();
            throw new IllegalArgumentException();
        }
        return new Response(ePw, SUCCESSMESSAGE, SUCCESSCODE);
    }
}
```

주석을 참고하면 내용은 이해하기 쉬울 것이다.

**sendSimpleMessage(String to) 메소드는 실제 메일을 발송하는 메소드다.**

그리고 인증 코드가 담긴 ePw를 담아서 리턴하게 되는데 이를 통해서 사용자가 인증 코드를 올바르게 작성하였는지 확인할 수 있다.

# 4. Controller

```java
@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController {
    private final EmailService emailService;

    @PostMapping("/emailConfirm")
    public Response emailConfirm(@RequestParam String email) throws Exception {
        try {
            return emailService.sendSimpleMessage(email);
        } catch (IllegalArgumentException e) {
            return new Response(EMAILERRORMESSAGE, EMAILERRORCODE);
        }
    }
}
```

이렇게 파라미터로 email을 받으면 해당 email로 메일을 전송할 것이다.

# 5. Test

![email1](/static/images/emailSend/emailSend1.png)

이렇게 PostMan을 통해서 확인하면 성공적으로 동작했음을 확인할 수 있다.

그러면 해당 메일을 확인해보도록 하자.

![email2](/static/images/emailSend/emailSend2.png)

이렇게 메일이 온 모습을 확인할 수 있다.

이외에 조건을 추가하여 인증번호 유효기간 설정, 인정번호 저장등등 추가적인 요소를 공부해야겠다.
