Mutual TLS 예제
==============
본 예제는 TLS 연결 시 Client와 Server간 상호 인증을 수행하는 Mutual TLS(mTLS)를 간단하게 재연하는데 목적이 있다. 

>mTLS에 대한 자세한 설명: https://www.f5.com/labs/articles/education/what-is-mtls 

Status: 작성 완료(21-12-24)

본 repository의 certs폴더 내에 있는 인증서는 예제 실습을 위한 인증서로 실제 실습시에는 아래 설명에 따라 새로 생성하여 사용하는 것을 권장 함

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
아래와 같은 내용을 host파일에 추가한다. 해당 내용은 예제 수행 이후 삭제한다.

* Windows : C:\Windows\System32\drivers\etc\hosts
* Linux : \etc\hosts
    
127.0.0.1 server.localhost    
127.0.0.1 client1.localhost

# 2. 예제 구성 요소 설명
## 2.1 예제 코드 설명
예제 코드는 크게 client.js와 server.js로 구성되며 nodejs의 fs, https package를 사용한다.   
   
server.js는 127.0.0.1:8888(localhost:8888)을 통해 요청을 수신 받으면 응답 후 console에 OK를 출력한다. client.js는 server 요청 후에 응답을 console에 출력한다.
## 2.2 예제 인증 관련 파일 설명    
모든 요청과 응답은 https(TLS)를 통해 이루어지며 mutual TLS 동작을 위해 server 뿐만 아니라 client 역시 CA로부터 서명된 인증서가 필요하다.  
    
CA의 인증서로 서명된 인증서의 검증을 위해서는 서명을 위해 사용된 CA의 인증서가 필요하다. Client와 Server는 제출 받은 인증서의 검증을 위해서 사전에 서로의 CA 인증서를 교환한다.   

mTLS 동작을 위해 각 구성요소가 가져야하는 인증 관련 파일은 다음과 같다.

* **Server(server.js)**
    * Server의 키 (server-key.pem)
    * Server CA의 키 (server-ca-key.pem)
    * Server CA의 인증서 (server-ca-crt.pem)
    * **Server CA의 인증서로 서명된 Server의 인증서 (server-crt.pem)**
    * **Client CA의 인증서(client-ca-crt.pem)**
* **Client(client.js)**
    * Client의 키 (client1-key.pem)
    * Client CA의 키 (client-ca-key.pem)
    * Client CA의 인증서 (client-ca-crt.pem)
    * **Client CA의 인증서로 서명된 Client의 인증서(client1-crt.pem)**
    * **Server CA의 인증서(server-ca-crt.pem)**   
   
모든 인증 관련 파일은 certs 디렉토리에 위치하여야 한다.
   
# 3. 예제 진행 방법
## 3.1 hosts 파일 변경
1.2와 같이 host 파일을 수정한다.   

## 3.2 인증서 생성
openssl을 이용하여 client-ca, server-ca, client, server의 키를 생성하고 인증서를 생성한다.
    
단, Common Name의 경우 유의해서 입력을 진행해야한다.

server-ca-crt's Common Name : ca.server.localhost
server-crt's Common Name : server.localhost
client-ca-crt's Common Name : ca.client.localhost
client-crt's Common Name : client1.localhost

### 3.2.1 server-ca 키 생성 및 인증서 생성
다음과 같은 명령을 이용하여 server-ca의 키(server-ca-key.pem)와 인증서(server-ca-crt.pem)를 생성한다.    

생성시 PEM password를 입력해야하며 추후 client 인증서 서명시 password가 사용된다.   
PEM password 입력 후, 인증서 정보 입력시 Common Name이외의 다른 부분은 알아서 기입을 진행해도 된다.   

```bash
> openssl req -new -x509 -days 9999 -keyout server-ca-key.pem -out server-ca-crt.pem
Enter PEM pass phrase:
Verifying - Enter PEM pass phrase:
-----
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:KR
State or Province Name (full name) [Some-State]:
Locality Name (eg, city) []:
Organization Name (eg, company) [Internet Widgits Pty Ltd]:
Organizational Unit Name (eg, section) []:
Common Name (e.g. server FQDN or YOUR name) []:ca.server.localhost
Email Address []:
```

### 3.2.2 server 키 생성 및 인증서 요청(certificate request) 생성
다음과 같은 명령을 이용하여 server의 키(server-key.pem)와 인증서 요청(server-csr.pem)를 생성한다.    

인증서 정보 입력시 Common Name이외의 다른 부분은 알아서 기입을 진행해도 되며, 본 예제에서는 challenge password를 입력하지 않는다.   
    
```bash
> openssl genrsa -out server-key.pem 4096

> openssl req -new -sha256 -key server-key.pem -out server-csr.pem
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:KR
State or Province Name (full name) [Some-State]:
Locality Name (eg, city) []:
Organization Name (eg, company) [Internet Widgits Pty Ltd]:
Organizational Unit Name (eg, section) []:
Common Name (e.g. server FQDN or YOUR name) []:server.localhost
Email Address []:

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []:
An optional company name []:
```

### 3.2.3 서명된 server 인증서 생성
다음과 같은 명령을 이용하여 서명된 server의 인증서(server-crt.pem)를 생성한다.
    
서명된 인증서 생성 시 server-ca-key의 pass phrase(PEM password)를 입력해야한다.
      
```bash
> openssl x509 -req -days 9999 -in server-csr.pem -CA server-ca-crt.pem -CAkey server-ca-key.pem -CAcreateserial -out server-crt.pem
Enter pass phrase for server-ca-key.pem:
```
### 3.2.4 client-ca 키 생성 및 인증서 생성
다음과 같은 명령을 이용하여 client-ca의 키(client-ca-key.pem)와 인증서(client-ca-crt.pem)를 생성한다.    

생성시 PEM password를 입력해야하며 추후 client 인증서 서명시 password가 사용된다.   
PEM password 입력 후, 인증서 정보 입력시 Common Name이외의 다른 부분은 알아서 기입을 진행해도 된다.   

```bash
> openssl req -new -x509 -days 9999 -keyout client-ca-key.pem -out client-ca-crt.pem
.+.+..............+....+.....+.+......+...........+............+..........+..+....+...........+...+.+..+....+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*...+..+...+...+.+....................+...+..........+..+...+......+.+......+........+.+.....+.+........+.......+..+.......+.....+.+.....+...+.+...+..+.+.....+...+....+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*......+.+.....+.......+...............+...............+..+...+.+............+............+...+...+............+........+.+...........+....+.........+.........+..+.+...+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
...........+.+..+....+.........+.....+.+........+.+.....+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*.+..+......+....+..+.............+..+......+.......+..+...+......+..........+.........+..+...+.+...............+..+....+...+...+.....+...+...................+............+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*.+.+..............+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Enter PEM pass phrase:
Verifying - Enter PEM pass phrase:
-----
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:KR
State or Province Name (full name) [Some-State]:
Locality Name (eg, city) []:
Organization Name (eg, company) [Internet Widgits Pty Ltd]:
Organizational Unit Name (eg, section) []:
Common Name (e.g. server FQDN or YOUR name) []:ca.client.localhost
Email Address []:
```

### 3.2.5 client 키 생성 및 인증서 요청(certificate request) 생성
다음과 같은 명령을 이용하여 client의 키(client1-key.pem)와 인증서 요청(client1-csr.pem)를 생성한다.    

인증서 정보 입력시 Common Name이외의 다른 부분은 알아서 기입을 진행해도 되며, 본 예제에서는 challenge password를 입력하지 않는다.   
    
```bash
> openssl genrsa -out client1-key.pem 4096

> openssl req -new -sha256 -key client1-key.pem -out client1-csr.pem
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:KR
State or Province Name (full name) [Some-State]:
Locality Name (eg, city) []:
Organization Name (eg, company) [Internet Widgits Pty Ltd]:
Organizational Unit Name (eg, section) []:
Common Name (e.g. server FQDN or YOUR name) []:client1.localhost
Email Address []:

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []:
An optional company name []:
```

### 3.2.6 서명된 client 인증서 생성
다음과 같은 명령을 이용하여 서명된 client의 인증서(client1-crt.pem)를 생성한다.
    
서명된 인증서 생성 시 client-ca-key의 pass phrase(PEM password)를 입력해야한다.
      
```bash
> openssl x509 -req -days 9999 -in client1-csr.pem -CA client-ca-crt.pem -CAkey client-ca-key.pem -CAcreateserial -out client1-crt.pem
Enter pass phrase for client-ca-key.pem:
```
## 3.3 인증서 검증
다음과 같은 명령을 이용하여 서명된 인증서를 검증한다.

```bash
> openssl verify -CAfile server-ca-crt.pem server.crt.pem
server-crt.pem: OK
```
```bash
> openssl verify -CAfile client-ca-crt.pem client1-crt.pem
client1-crt.pem: OK
```
## 3.4 Server.js/Client.js 실행
다음과 같은 명령을 이용하여 Server와 Client를 실행한다.(다른 prompt에서 실행)
    
```bash
## Prompt 1
..\MutualTLSExample> node server.js
```
```bash
## Prompt 2
..\MutualTLSExample> node client.js
```
# 4. 결과
client.js로 서버 요청 시 정상적으로 응답을 수신하여 TLS Connection을 종료하게 됨.

## 4.1 Server Prompt
```bash
..\MutualTLSExample> node server.js
Fri Dec 24 2021 15:04:00 GMT+0900 (GMT+09:00) ::ffff:127.0.0.1 GET
```
## 4.2 Client Prompt
```bash
..\MutualTLSExample> node client.js
TLS Connection established successfully!
Response statusCode:  200
Response headers:  {
  date: 'Fri, 24 Dec 2021 06:04:00 GMT',
  connection: 'close',
  'transfer-encoding': 'chunked'
}
Server Host Name: server.localhost
Received message: OK!

TLS Connection closed!
```

# 5. (부록) Client로 Browser를 사용하는 예제
해당 예제는 Client로 Browser를 사용하여 server에 접속하며 Browser로는 Chrome을 사용한다. 크롬에서 인증서를 사용하기 위하여 client의 키와 인증서를 사용하여 pkcs12 형식의 인증서 파일을 생성하고 등록을 수행해야한다.

>PKCS12 상세 정보 : https://datatracker.ietf.org/doc/html/rfc7292

1. pkcs12 형식의 인증서 파일의 생성을 위해서 client1-crt.pem과 client1-key.pem을 병합 해야한다. 다음과 같이 병합되면 되며, cat 명령이 가능한경우 아래 명령어가 권장된다. 
```bash
> cat client1-crt.pem client1-key.pem > client-pkcs12.pem
```
2. 생성된 병합파일을 pkcs12 형식 파일로 생성하기 위해 아래 명령을 수행한다.
```bash
openssl pkcs12 -in client-pkcs12.pem -export -out pkcs12.p12
```
    
3. 인증서 파일 생성 이후 chrome에 인증서를 등록한다.    

>설정 URL : chrome://settings/security   

4. 인증서 관리, 가져오기, 파일 등록을 수행한 후 https://server.localhost:8888 에 접속을 수행한다.