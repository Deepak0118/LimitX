// A tiny fake "developer API" so you can test LimitX locally. Run: npm run mock-origin
const http = require('http');
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

http
  .createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    if (req.url.startsWith('/slow')) await delay(15000); // to test origin timeouts
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        hello: 'from origin',
        method: req.method,
        url: req.url,
        seenClientIp: req.headers['x-forwarded-for'],
        bodyBytes: Buffer.concat(chunks).length,
      })
    );
  })
  .listen(4000, () => console.log('Mock origin on http://localhost:4000'));
