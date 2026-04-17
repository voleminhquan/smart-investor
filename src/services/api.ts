export interface Collection {
  id: string;
  name: string;
  icon: string;
  createdAt: string;
  symbols: string[];
}

export interface Company {
  symbol: string;
  company_name: string;
  short_name: string;
  exchange: string;
  industry: string;
  market_cap: number;
}

export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ─── Collections ──────────────────────────────────────

export async function fetchCollections(): Promise<Collection[]> {
  const res = await fetch('/api/collections');
  if (!res.ok) throw new Error('Failed to fetch collections');
  return res.json();
}

export async function createCollection(name: string, icon: string): Promise<Collection> {
  const res = await fetch('/api/collections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, icon }),
  });
  if (!res.ok) throw new Error('Failed to create collection');
  return res.json();
}

export async function deleteCollection(id: string): Promise<void> {
  const res = await fetch(`/api/collections/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete collection');
}

export async function addStockToCollection(collectionId: string, symbol: string): Promise<void> {
  const res = await fetch(`/api/collections/${collectionId}/stocks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol }),
  });
  if (!res.ok) throw new Error('Failed to add stock');
}

export async function removeStockFromCollection(collectionId: string, symbol: string): Promise<void> {
  const res = await fetch(`/api/collections/${collectionId}/stocks/${symbol}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to remove stock');
}

// ─── Data ─────────────────────────────────────────────

export async function fetchCompanies(): Promise<Company[]> {
  const res = await fetch('/api/companies');
  if (!res.ok) throw new Error('Failed to fetch companies');
  return res.json();
}

export async function fetchCompanyDetails(symbol: string): Promise<Company> {
  const res = await fetch(`/api/companies/${symbol}`);
  if (!res.ok) throw new Error('Failed to fetch company details');
  return res.json();
}

export async function fetchPrices(symbol: string): Promise<PriceData[]> {
  const res = await fetch(`/api/prices/${symbol}`);
  if (!res.ok) throw new Error('Failed to fetch prices');
  return res.json();
}

export async function triggerSync(symbol: string): Promise<void> {
  const res = await fetch(`/api/sync/symbol/${symbol}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger sync');
}

// ─── Portfolio ─────────────────────────────────────────────────

export interface Transaction {
  id?: number;
  collection_id: string;
  symbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  fee?: number;
  note?: string;
  traded_at: string;
  created_at?: string;
}

export interface Holding {
  symbol: string;
  companyName: string;
  exchange: string;
  quantity: number;
  averageCost: number;
  totalCost: number;
  currentPrice: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  transactions: Transaction[];
}

export interface PortfolioSummary {
  holdings: Holding[];
  totalValue: number;
  totalCost: number;
  totalPnL: number;
  totalPnLPercent: number;
}

export async function fetchPortfolio(collectionId: string): Promise<PortfolioSummary> {
  const res = await fetch(`/api/portfolio/${collectionId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || err?.message || 'Failed to fetch portfolio');
  }
  return res.json();
}

export async function fetchTransactions(collectionId: string): Promise<Transaction[]> {
  const res = await fetch(`/api/portfolio/transactions/${collectionId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || err?.message || 'Failed to fetch transactions');
  }
  return res.json();
}

export async function addTransaction(tx: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
  const res = await fetch('/api/portfolio/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tx),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    
    // Check for schema cache missing table error
    if (err?.error?.includes('Could not find the table') || err?.message?.includes('Could not find the table')) {
      throw new Error('LỖI DATABASE: Bảng portfolio_transactions chưa được tạo. BẠN BẮT BUỘC PHẢI VÀO SUPABASE DASHBOARD -> SQL Editor -> Chạy file supabase/migration_v2.sql để tạo bảng!');
    }
    
    throw new Error(err?.error || err?.message || 'Failed to add transaction');
  }
  return res.json();
}

export async function deleteTransaction(id: number): Promise<void> {
  const res = await fetch(`/api/portfolio/transactions/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete transaction');
}

// ─── Analysis ─────────────────────────────────────────────────

export interface FundamentalMetrics {
  eps: number | null;
  pe: number | null;
  peg: number | null;
  pb: number | null;
  bvps: number | null;
  roe: number | null;
  roa: number | null;
  ros: number | null;
  dar: number | null;
  epsGrowthRate: number | null;
  dividendYield: number | null;
  debtToEquity: number | null;
}

export interface FundamentalAnalysis {
  symbol: string;
  companyName: string;
  currentPrice: number;
  metrics: FundamentalMetrics;
  history: {
    eps: Array<{ period: string; eps: number; roe: number; pe: number }>;
    income: Array<{ period: string; revenue: number; net_profit: number }>;
  };
  dataAvailable: boolean;
}

export async function fetchFundamental(symbol: string): Promise<FundamentalAnalysis> {
  const res = await fetch(`/api/analysis/${symbol}/fundamental`);
  if (!res.ok) throw new Error('Failed to fetch fundamental analysis');
  return res.json();
}

// ─── Sync ─────────────────────────────────────────────────────

export interface SyncLog {
  id: number;
  sync_type: string;
  status: string;
  message: string;
  records_count: number;
  started_at: string;
  finished_at: string | null;
}

export interface SyncStatus {
  syncing: boolean;
  lastSync?: SyncLog;
}

export async function triggerFullSync(): Promise<{ status: string; message: string }> {
  const res = await fetch('/api/sync/all', { method: 'POST' });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to trigger sync');
  }
  return res.json();
}

export async function fetchSyncStatus(): Promise<SyncStatus> {
  const res = await fetch('/api/sync/status');
  if (!res.ok) throw new Error('Failed to fetch sync status');
  return res.json();
}
