/**
 * Smart Investor — TCBS API Client (No Python dependency)
 *
 * Fetches data from TCBS public endpoints directly.
 * These are the same endpoints that vnstock wraps internally.
 */

const BASE_URL = 'https://apipubaws.tcbs.com.vn';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': 'application/json',
  'Origin': 'https://tcinvest.tcbs.com.vn',
  'Referer': 'https://tcinvest.tcbs.com.vn/',
};

async function apiFetch(path: string) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) throw new Error(`TCBS API error ${response.status}: ${url}`);
  return response.json();
}

// ─── Company Overview ────────────────────────────────

export async function fetchCompanyOverview(symbol: string) {
  const data = await apiFetch(`/tcanalysis/v1/company/${symbol}/overview`);

  return {
    symbol: symbol.toUpperCase(),
    company_name: data.companyName || data.shortName || symbol,
    short_name: data.shortName || symbol,
    exchange: data.exchange || '',
    industry: data.industry || '',
    sector: data.industryEn || '',
    description: data.companyProfile || '',
    market_cap: data.marketCap ? data.marketCap / 1e9 : null, // Convert to tỷ VND
    outstanding_shares: data.outstandingShare ? data.outstandingShare * 1e6 : null,
    website: data.website || '',
  };
}

// ─── Price History (OHLCV) ───────────────────────────

export async function fetchPriceHistory(symbol: string, fromDate: string = '2024-01-01') {
  // TCBS stock-insight endpoint
  const endDate = Math.floor(Date.now() / 1000);
  const startDate = Math.floor(new Date(fromDate).getTime() / 1000);

  const data = await apiFetch(
    `/stock-insight/v2/stock/bars-long-term?ticker=${symbol}&type=stock&resolution=D&from=${startDate}&to=${endDate}`
  );

  if (!data.data || !Array.isArray(data.data)) return [];

  return data.data.map((bar: any) => ({
    symbol: symbol.toUpperCase(),
    date: new Date(bar.tradingDate || bar.t * 1000).toISOString().split('T')[0],
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume,
    interval: 'd',
  }));
}

// ─── Financial Ratios ────────────────────────────────

export async function fetchFinancialRatios(symbol: string) {
  const data = await apiFetch(`/tcanalysis/v1/finance/${symbol}/financialratio?yearly=1&isAll=true`);

  if (!Array.isArray(data)) return [];

  return data.map((item: any) => ({
    symbol: symbol.toUpperCase(),
    period_type: 'year',
    period: String(item.year),
    pe: item.priceToEarning ?? null,
    pb: item.priceToBook ?? null,
    ps: null,
    roe: item.roe ?? null,
    roa: item.roa ?? null,
    eps: item.earningPerShare ?? null,
    bvps: item.bookValuePerShare ?? null,
    dividend_yield: item.dividend ?? null,
    debt_to_equity: item.debtOnEquity ?? null,
    current_ratio: item.currentPayment ?? null,
    gross_margin: item.grossProfitMargin ?? null,
    operating_margin: item.operatingProfitMargin ?? null,
    net_margin: item.postTaxMargin ?? null,
    revenue_growth: item.revenueGrowth ?? null,
    profit_growth: item.earningGrowth ?? null,
  }));
}

export async function fetchFinancialRatiosQuarterly(symbol: string) {
  const data = await apiFetch(`/tcanalysis/v1/finance/${symbol}/financialratio?yearly=0&isAll=true`);

  if (!Array.isArray(data)) return [];

  return data.map((item: any) => ({
    symbol: symbol.toUpperCase(),
    period_type: 'quarter',
    period: `Q${item.quarter}-${item.year}`,
    pe: item.priceToEarning ?? null,
    pb: item.priceToBook ?? null,
    ps: null,
    roe: item.roe ?? null,
    roa: item.roa ?? null,
    eps: item.earningPerShare ?? null,
    bvps: item.bookValuePerShare ?? null,
    dividend_yield: item.dividend ?? null,
    debt_to_equity: item.debtOnEquity ?? null,
    current_ratio: item.currentPayment ?? null,
    gross_margin: item.grossProfitMargin ?? null,
    operating_margin: item.operatingProfitMargin ?? null,
    net_margin: item.postTaxMargin ?? null,
    revenue_growth: item.revenueGrowth ?? null,
    profit_growth: item.earningGrowth ?? null,
  }));
}

// ─── Income Statement ────────────────────────────────

export async function fetchIncomeStatement(symbol: string, yearly: boolean = true) {
  const flag = yearly ? 1 : 0;
  const data = await apiFetch(`/tcanalysis/v1/finance/${symbol}/incomestatement?yearly=${flag}&isAll=true`);

  if (!Array.isArray(data)) return [];

  return data.map((item: any) => ({
    symbol: symbol.toUpperCase(),
    period_type: yearly ? 'year' : 'quarter',
    period: yearly ? String(item.year) : `Q${item.quarter}-${item.year}`,
    revenue: item.revenue ?? null,
    cost_of_revenue: item.costOfGoodSold ?? null,
    gross_profit: item.grossProfit ?? null,
    operating_expenses: item.operationExpense ?? null,
    operating_profit: item.operationProfit ?? null,
    interest_expense: item.interestExpense ?? null,
    profit_before_tax: item.preTaxProfit ?? null,
    net_profit: item.postTaxProfit ?? null,
    ebitda: item.ebitda ?? null,
    raw_json: item,
  }));
}

// ─── Balance Sheet ───────────────────────────────────

export async function fetchBalanceSheet(symbol: string, yearly: boolean = true) {
  const flag = yearly ? 1 : 0;
  const data = await apiFetch(`/tcanalysis/v1/finance/${symbol}/balancesheet?yearly=${flag}&isAll=true`);

  if (!Array.isArray(data)) return [];

  return data.map((item: any) => ({
    symbol: symbol.toUpperCase(),
    period_type: yearly ? 'year' : 'quarter',
    period: yearly ? String(item.year) : `Q${item.quarter}-${item.year}`,
    total_assets: item.asset ?? null,
    current_assets: item.shortAsset ?? null,
    non_current_assets: item.longAsset ?? null,
    total_liabilities: item.debt ?? null,
    current_liabilities: item.shortDebt ?? null,
    non_current_liabilities: item.longDebt ?? null,
    owner_equity: item.equity ?? null,
    charter_capital: item.capital ?? null,
    retained_earnings: item.unDistributedIncome ?? null,
    raw_json: item,
  }));
}

// ─── Cash Flow ───────────────────────────────────────

export async function fetchCashFlow(symbol: string, yearly: boolean = true) {
  const flag = yearly ? 1 : 0;
  const data = await apiFetch(`/tcanalysis/v1/finance/${symbol}/cashflow?yearly=${flag}&isAll=true`);

  if (!Array.isArray(data)) return [];

  return data.map((item: any) => ({
    symbol: symbol.toUpperCase(),
    period_type: yearly ? 'year' : 'quarter',
    period: yearly ? String(item.year) : `Q${item.quarter}-${item.year}`,
    operating_cash_flow: item.fromSale ?? null,
    investing_cash_flow: item.fromInvest ?? null,
    financing_cash_flow: item.fromFinancial ?? null,
    net_cash_flow: (item.fromSale ?? 0) + (item.fromInvest ?? 0) + (item.fromFinancial ?? 0) || null,
    free_cash_flow: item.freeCashFlow ?? null,
    raw_json: item,
  }));
}

// ─── Stock Listing ───────────────────────────────────

export async function fetchStockListing() {
  const data = await apiFetch('/stock-insight/v1/stock/getAll');

  if (!Array.isArray(data)) return [];

  return data.map((item: any) => ({
    symbol: item.ticker || item.symbol,
    company_name: item.organName || item.companyName || '',
    short_name: item.organShortName || item.shortName || '',
    exchange: item.comGroupCode || item.exchange || '',
    industry: item.icbName4 || '',
    sector: item.icbName2 || '',
  }));
}
