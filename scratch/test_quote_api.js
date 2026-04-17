import fetch from 'node-fetch';

async function testQuote() {
  const symbol = 'VJC';
  const url = `https://services.entrade.com.vn/stock-quote/quotes?symbols=${symbol}`;
  
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

testQuote();
