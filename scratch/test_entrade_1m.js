async function testEntrade1m() {
  const symbol = 'VJC';
  const toUnix = Math.floor(Date.now()/1000);
  const fromUnix = toUnix - 3600; // Last 1 hour
  const url = `https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?from=${fromUnix}&to=${toUnix}&symbol=${symbol}&resolution=1`;
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Origin': 'https://banggia.dnse.com.vn',
      'Referer': 'https://banggia.dnse.com.vn/'
    }
  });
  const data = await res.json();
  console.log('Result (1m):', JSON.stringify(data, null, 2));
}

testEntrade1m();
