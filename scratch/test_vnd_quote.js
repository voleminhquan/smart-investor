async function testVNDQuote() {
  const symbol = 'VJC';
  const url = `https://finfo-api.vndirect.com.vn/v4/stock_prices?q=code:${symbol}&size=1`;
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });
  const data = await res.json();
  console.log('VNDirect Quote:', JSON.stringify(data, null, 2));
}

testVNDQuote();
