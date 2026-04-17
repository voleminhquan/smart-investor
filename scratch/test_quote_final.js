import fetch from 'node-fetch';

async function testVnstock() {
  const symbol = 'VJC';
  const url = `https://services.entrade.com.vn/stock-quote/quotes?symbols=${symbol}`;
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Origin': 'https://banggia.dnse.com.vn',
      'Referer': 'https://banggia.dnse.com.vn/'
    }
  });
  const data = await res.json();
  console.log('Result:', JSON.stringify(data, null, 2));
}

testVnstock();
