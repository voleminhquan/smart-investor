fetch('https://finfo-api.vndirect.com.vn/v4/financial_indicators?q=code:FPT')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

fetch('https://finfo-api.vndirect.com.vn/v4/ratios?q=code:FPT')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
