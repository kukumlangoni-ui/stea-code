import https from 'https';

https.get('https://onlinesys.necta.go.tz/results/2023/csee/results/s0155.htm', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(res.statusCode);
    console.log(data.substring(0, 500));
  });
});
