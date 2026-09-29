import https from 'https';

https.get('https://onlinesys.necta.go.tz/results/2022/csee/index.htm', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(data.substring(0, 500));
  });
});
