// Fires N requests in parallel and counts the status codes.
// Usage: node scripts/load-test.js <url> [count] [headerName:value]
// Example: node scripts/load-test.js http://localhost:3000/proxy/api_xxx/api/login 100
const [url, count = '100', header] = process.argv.slice(2);
if (!url) {
  console.log('Usage: node scripts/load-test.js <url> [count] [header:value]');
  process.exit(1);
}

(async () => {
  const headers = {};
  if (header) {
    const i = header.indexOf(':');
    headers[header.slice(0, i)] = header.slice(i + 1);
  }
  const results = await Promise.all(
    Array.from({ length: Number(count) }, () =>
      fetch(url, { headers }).then((r) => r.status).catch(() => 'error')
    )
  );
  const summary = {};
  for (const s of results) summary[s] = (summary[s] || 0) + 1;
  console.log(summary);
})();
