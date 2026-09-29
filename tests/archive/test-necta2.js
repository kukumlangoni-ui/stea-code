import https from 'https';

https.get('https://onlinesys.necta.go.tz/results/2023/csee/indexfiles/index_t.htm', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const linkRegex = /<a[^>]+href=["']([^"']*\.htm)["'][^>]*>([^<]+)<\/a>/gi;
    let match;
    let count = 0;
    while ((match = linkRegex.exec(data)) !== null && count < 5) {
      console.log(match[1], match[2]);
      count++;
    }
  });
});
