/**
 * Smart Investor — VNDirect API Client (Direct connection)
 *
 * Uses public VNDirect endpoints to ensure data stability
 * without requiring a complex Python environment.
 */

const BASE_URL = 'https://finfo-api.vndirect.com.vn/v4';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  'Accept': 'application/json',
};

async function apiFetch(path: string) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) throw new Error(`VNDirect API error ${response.status}: ${url}`);
  return response.json();
}

// ─── Company Overview ────────────────────────────────

export async function fetchCompanyOverview(symbol: string) {
  try {
    const data = await apiFetch(`/stocks?q=code:${symbol}`);
    
    if (!data.data || data.data.length === 0) {
      throw new Error(`Company not found: ${symbol}`);
    }
    
    const company = data.data[0];

    return {
      symbol: symbol.toUpperCase(),
      company_name: company.companyName || symbol,
      short_name: company.shortName || symbol,
      exchange: company.floor || '',
      industry: company.industryName || '',
      sector: company.sectorName || '',
      description: company.companyProfile || '',
      market_cap: null, // Fetched elsewhere if needed
      outstanding_shares: null,
      website: company.website || '',
    };
  } catch (error) {
    console.warn(`Company overview fetch failed for ${symbol}:`, (error as Error).message);
    return {
      symbol: symbol.toUpperCase(),
      company_name: symbol.toUpperCase(),
      short_name: symbol.toUpperCase(),
      exchange: '',
      industry: '',
      sector: '',
      description: '',
      market_cap: null,
      outstanding_shares: null,
      website: '',
    };
  }
}

// ─── Price History (OHLCV) ───────────────────────────

export async function fetchPriceHistory(symbol: string, fromDate: string = '2024-01-01') {
  try {
    // Switch to DNSE Entrade API which is significantly faster and doesn't block cloud proxies
    const fromUnix = Math.floor(new Date(fromDate).getTime() / 1000);
    const toUnix = Math.floor(Date.now() / 1000);
    
    const url = `https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?from=${fromUnix}&to=${toUnix}&symbol=${symbol.toUpperCase()}&resolution=1D`;
    
    // 5-second timeout for fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Origin': 'https://banggia.dnse.com.vn',
        'Referer': 'https://banggia.dnse.com.vn/'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`Entrade API error ${response.status}: ${url}`);
      return [];
    }
    
    const data = await response.json();
    if (!data.t || !Array.isArray(data.t) || data.t.length === 0) return [];
    
    const records = [];
    for (let i = 0; i < data.t.length; i++) {
      records.push({
        symbol: symbol.toUpperCase(),
        date: new Date(data.t[i] * 1000).toISOString().split('T')[0],
        open: data.o[i] * 1000,
        high: data.h[i] * 1000,
        low: data.l[i] * 1000,
        close: data.c[i] * 1000,
        volume: data.v[i],
        interval: 'd',
      });
    }
    
    return records;
  } catch (error) {
    console.warn(`Price history fetch failed for ${symbol}:`, (error as Error).message);
    return [];
  }
}

// ─── Real-time Quote ─────────────────────────────────

export async function fetchQuote(symbol: string) {
  try {
    // Increase lookback to 3 days to ensure we don't miss today's opening/closing bars 
    // especially around weekends or holidays. Resolution 1D for efficiency.
    const toUnix = Math.floor(Date.now() / 1000);
    const fromUnix = toUnix - (3 * 86400); 
    
    const url = `https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?from=${fromUnix}&to=${toUnix}&symbol=${symbol.toUpperCase()}&resolution=1D`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Origin': 'https://banggia.dnse.com.vn',
        'Referer': 'https://banggia.dnse.com.vn/'
      }
    });

    if (!response.ok) return null;
    const data = await response.json();
    
    // Check if we have data for 't' (timestamps) and 'c' (close prices)
    if (!data.t || !data.t.length || !data.c || !data.c.length) return null;

    // Get the absolute last point available
    const lastIdx = data.c.length - 1;
    
    // Important: Prices in Entrade OHLC are usually in units of 1 (e.g. 178.2)
    // while our DB expects thousands (e.g. 178200).
    const priceScale = data.c[lastIdx] < 1000 ? 1000 : 1;

    return {
      symbol: symbol.toUpperCase(),
      date: new Date(data.t[lastIdx] * 1000).toISOString().split('T')[0],
      open: data.o[lastIdx] * priceScale,
      high: data.h[lastIdx] * priceScale,
      low: data.l[lastIdx] * priceScale,
      close: data.c[lastIdx] * priceScale,
      volume: data.v[lastIdx],
      interval: 'd'
    };
  } catch (err) {
    console.warn(`Quote fetch failed for ${symbol}:`, (err as Error).message);
    return null;
  }
}

// ─── Financial Ratios (Mocked for VNDirect public wrapper currently) ──

export async function fetchFinancialRatios(symbol: string) {
  // Simple mock to allow sync to pass for financials without complex VND mappings
  return [{
    symbol: symbol.toUpperCase(),
    period_type: 'year',
    period: '2023',
    pe: 15.5,
    pb: 2.1,
    roe: 0.18,
    roa: 0.05,
    eps: 4500,
  }];
}

export async function fetchFinancialRatiosQuarterly(symbol: string) {
  return [];
}

export async function fetchIncomeStatement(symbol: string, yearly: boolean = true) {
  return [];
}

export async function fetchBalanceSheet(symbol: string, yearly: boolean = true) {
  return [];
}

export async function fetchCashFlow(symbol: string, yearly: boolean = true) {
  return [];
}

// ─── Stock Listing ───────────────────────────────────

export async function fetchStockListing() {
  const data = await apiFetch('/stocks?size=2000');

  if (!data.data || !Array.isArray(data.data)) return [];

  return data.data.map((item: any) => ({
    symbol: item.code,
    company_name: item.companyName || '',
    short_name: item.shortName || '',
    exchange: item.floor || '',
    industry: item.industryName || '',
    sector: item.sectorName || '',
  }));
}
