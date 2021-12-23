Mutual TLS 예제
==============
본 예제는 TLS 연결 시 Client와 Server간 상호 인증을 수행하는 Mutual TLS(mTLS)를 간단하게 재연하는데 목적이 있다. 

mTLS에 대한 자세한 설명: https://www.f5.com/labs/articles/education/what-is-mtls 

Status: 작성중(21-12-23)

# 1. 준비
## 1.1 준비물
Nodejs와 Openssl을 사용해 진행하며 예제 작성 시 사용했던 버전 정보 및 다운로드 URL은 다음과 같다.

* Nodejs
    * Version: 14.17.6^
    * Site: https://nodejs.org/en/
* Openssl
    * Version: 3.0.1
    * Site: https://www.openssl.org/source/

## 1.2 hosts file 수정
아래와 같은 내용을 host파일에 추가합니다. 해당 내용은 예제 수행 이후 삭제합니다.

* Windows : C:\Windows\System32\drivers\etc\hosts
* Linux : \etc\hosts
    
127.0.0.1 server.localhost    
127.0.0.1 client.localhost

# 2. 예제 구성 요소 설명
## 2.1 예제 코드 설명
예제 코드는 크게 client.js와 server.js로 구성되며 nodejs의 fs, https package를 사용한다.   
   
server.js는 127.0.0.1:8888(localhost:8888)을 통해 요청을 수신 받으면 응답 후 console에 OK를 출력한다. client.js는 server 요청 후에 응답을 console에 출력한다.
## 2.2 예제 인증 관련 파일 설명    
모든 요청과 응답은 https(TLS)를 통해 이루어지며 mutual TLS 동작을 위해 server 뿐만 아니라 client 역시 CA로부터 서명된 인증서가 필요하다.  
    
CA의 인증서로 서명된 인증서의 검증을 위해서는 서명을 위해 사용된 CA의 인증서가 필요하다. Client와 Server는 제출 받은 인증서의 검증을 위해서 사전에 서로의 CA 인증서를 교환한다.   

mTLS 동작을 위해 각 구성요소가 가져야하는 인증 관련 파일은 다음과 같다.

* **Server(server.js)**
    * Server의 키
    * Server CA의 키
    * Server CA의 인증서
    * **Server CA의 인증서로 서명된 Server의 인증서**
    * **Client CA의 인증서**
* **Client(client.js)**
    * Client의 키
    * Client CA의 키
    * Client CA의 인증서
    * **Client CA의 인증서로 서명된 Client의 인증서**
    * **Server CA의 인증서**   

