import fetch from 'node-fetch';

async function testEntrade() {
  const symbol = 'VJC';
  const fromUnix = Math.floor(Date.now()/1000) - 86400 * 3;
  const toUnix = Math.floor(Date.now()/1000);
  const url = `https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?from=${fromUnix}&to=${toUnix}&symbol=${symbol}&resolution=1D`;
  
  console.log(`URL: ${url}`);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Origin': 'https://banggia.dnse.com.vn',
      'Referer': 'https://banggia.dnse.com.vn/'
    }
  });
  const data = await res.json();
  console.log('Data:', JSON.stringify(data, null, 2));
}

testEntrade();
