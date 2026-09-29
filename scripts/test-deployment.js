const http = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve({ url, status: res.statusCode });
    }).on('error', (e) => {
      resolve({ url, error: e.message });
    });
  });
}

async function run() {
  const urls = [
    'https://stea.africa/',
    'https://stea.africa/websites',
    'https://stea.africa/websites/developers',
    'https://stea.africa/search',
    'https://stea.africa/favorites',
    'https://sites.stea.africa/',
    'https://sites.stea.africa/websites',
  ];
  for (const url of urls) {
    const res = await checkUrl(url);
    console.log(res);
  }
}
run();
