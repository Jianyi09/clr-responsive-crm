const https = require('https');
const data = JSON.stringify({ username: 'admin', password: 'admin' });
const options = {
  hostname: 'clr-responsive-crm.onrender.com',
  port: 443,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    console.log('STATUS', res.statusCode, res.statusMessage);
    console.log('HEADERS', JSON.stringify(res.headers, null, 2));
    console.log('BODY', body);
  });
});

req.on('error', (err) => {
  console.error('ERROR', err.message);
});

req.write(data);
req.end();
