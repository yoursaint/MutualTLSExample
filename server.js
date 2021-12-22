const fs = require('fs');
const https = require('https');

const options = {
    key: fs.readFileSync(`${__dirname}/certs/server-key.pem`),
    cert: fs.readFileSync(`${__dirname}/certs/server-crt.pem`),
    ca: [
        fs.readFileSync(`${__dirname}/certs/client-ca-crt.pem`)
    ],
    requestCert: true,
    rejectUnauthorized: true
};

https.createServer(options, function(req, res) {
    console.log(new Date() + " " + req.socket.remoteAddress + " " + req.method);
    res.writeHead(200);
    res.end("OK!\n");
}).listen(8888);