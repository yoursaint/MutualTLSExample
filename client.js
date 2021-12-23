const fs = require('fs');
const https = require('https');

const message = { msg: 'Hello!'};

const reqStat = {
    host: 'server.localhost',
    port: 8888,
    secureProtocol: 'TLSv1_2_method',
    key: fs.readFileSync(`${__dirname}/certs/client-key.pem`),
    cert: fs.readFileSync(`${__dirname}/certs/client-crt.pem`),
    ca: [
        fs.readFileSync(`${__dirname}/certs/server-ca-crt.pem`)
    ],
    path: '/',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(message))
    }
};

const req = https.request(reqStat, function(res) {
    let rawData = '';

    console.log('Response statusCode: ', res.statusCode);
    console.log('Response headers: ', res.headers);
    console.log(`Server Host Name: ${res.socket.getPeerCertificate().subject.CN}`);

    if (res.statusCode !== 200) {
        console.log('Wrong status code');
        return;
    }

    res.on('data', function(data) {
        rawData += data;
    });

    res.on('end', function() {
        if (rawData.length > 0) {
            console.log(`Received message: ${rawData}`);
        }
        console.log('TLS Connection closed!');
    });
});

req.on('socket', function(socket) {
    socket.on('secureConnect', function() {
        if (socket.authorized === false) {
            console.log(`SOCKET AUTH FAILED ${socket.authorizationError}`);
        }
        console.log('TLS Connection established successfully!');
    });
    socket.setTimeout(10000);
    socket.on('timeout', function() {
        console.log('TLS Socket Timeout!');
        req.end();
        return;
    });
});

req.on('error', function(err) {
    console.log(`TLS Socket ERROR (${err})`);
    req.end();
    return
});

req.write(JSON.stringify(message))