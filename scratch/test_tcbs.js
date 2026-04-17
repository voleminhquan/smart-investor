async function testTCBS() {
  const symbol = 'VJC';
  const url = `https://api.tcbs.com.vn/v1/stock/price/quote?symbols=${symbol}`;
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });
  const data = await res.json();
  console.log('TCBS Result:', JSON.stringify(data, null, 2));
}

testTCBS();
