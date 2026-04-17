-- ============================================
-- Smart Investor — Supabase Migration
-- ============================================
-- Run this in your Supabase SQL Editor to create all tables.

-- 1. Companies
CREATE TABLE IF NOT EXISTS companies (
  symbol        TEXT PRIMARY KEY,
  company_name  TEXT NOT NULL,
  short_name    TEXT,
  exchange      TEXT, -- HOSE, HNX, UPCOM
  industry      TEXT,
  sector        TEXT,
  description   TEXT,
  market_cap    NUMERIC,
  outstanding_shares NUMERIC,
  website       TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE companies IS 'Thông tin cơ bản của công ty niêm yết';

-- 2. Price History (OHLCV)
CREATE TABLE IF NOT EXISTS price_history (
  id        BIGSERIAL PRIMARY KEY,
  symbol    TEXT NOT NULL REFERENCES companies(symbol) ON DELETE CASCADE,
  date      DATE NOT NULL,
  open      NUMERIC,
  high      NUMERIC,
  low       NUMERIC,
  close     NUMERIC,
  volume    NUMERIC,
  interval  TEXT NOT NULL DEFAULT 'd', -- d=daily, w=weekly, m=monthly
  UNIQUE(symbol, date, interval)
);

CREATE INDEX IF NOT EXISTS idx_price_history_symbol_date 
  ON price_history(symbol, date DESC);

COMMENT ON TABLE price_history IS 'Giá lịch sử OHLCV cho biểu đồ';

-- 3. Financial Ratios
CREATE TABLE IF NOT EXISTS financial_ratios (
  id              BIGSERIAL PRIMARY KEY,
  symbol          TEXT NOT NULL REFERENCES companies(symbol) ON DELETE CASCADE,
  period_type     TEXT NOT NULL, -- 'year' or 'quarter'
  period          TEXT NOT NULL, -- '2024', 'Q3-2024'
  pe              NUMERIC,
  pb              NUMERIC,
  ps              NUMERIC,
  roe             NUMERIC,
  roa             NUMERIC,
  eps             NUMERIC,
  bvps            NUMERIC,
  dividend_yield  NUMERIC,
  debt_to_equity  NUMERIC,
  current_ratio   NUMERIC,
  gross_margin    NUMERIC,
  operating_margin NUMERIC,
  net_margin      NUMERIC,
  revenue_growth  NUMERIC,
  profit_growth   NUMERIC,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, period_type, period)
);

COMMENT ON TABLE financial_ratios IS 'Chỉ số tài chính: P/E, ROE, EPS...';

-- 4. Balance Sheet
CREATE TABLE IF NOT EXISTS balance_sheet (
  id                    BIGSERIAL PRIMARY KEY,
  symbol                TEXT NOT NULL REFERENCES companies(symbol) ON DELETE CASCADE,
  period_type           TEXT NOT NULL,
  period                TEXT NOT NULL,
  total_assets          NUMERIC,
  current_assets        NUMERIC,
  non_current_assets    NUMERIC,
  total_liabilities     NUMERIC,
  current_liabilities   NUMERIC,
  non_current_liabilities NUMERIC,
  owner_equity          NUMERIC,
  charter_capital       NUMERIC,
  retained_earnings     NUMERIC,
  raw_json              JSONB,
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, period_type, period)
);

COMMENT ON TABLE balance_sheet IS 'Bảng cân đối kế toán';

-- 5. Income Statement
CREATE TABLE IF NOT EXISTS income_statement (
  id                  BIGSERIAL PRIMARY KEY,
  symbol              TEXT NOT NULL REFERENCES companies(symbol) ON DELETE CASCADE,
  period_type         TEXT NOT NULL,
  period              TEXT NOT NULL,
  revenue             NUMERIC,
  cost_of_revenue     NUMERIC,
  gross_profit        NUMERIC,
  operating_expenses  NUMERIC,
  operating_profit    NUMERIC,
  interest_expense    NUMERIC,
  profit_before_tax   NUMERIC,
  net_profit          NUMERIC,
  ebitda              NUMERIC,
  raw_json            JSONB,
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, period_type, period)
);

COMMENT ON TABLE income_statement IS 'Kết quả hoạt động kinh doanh';

-- 6. Cash Flow
CREATE TABLE IF NOT EXISTS cash_flow (
  id                    BIGSERIAL PRIMARY KEY,
  symbol                TEXT NOT NULL REFERENCES companies(symbol) ON DELETE CASCADE,
  period_type           TEXT NOT NULL,
  period                TEXT NOT NULL,
  operating_cash_flow   NUMERIC,
  investing_cash_flow   NUMERIC,
  financing_cash_flow   NUMERIC,
  net_cash_flow         NUMERIC,
  free_cash_flow        NUMERIC,
  raw_json              JSONB,
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, period_type, period)
);

COMMENT ON TABLE cash_flow IS 'Lưu chuyển tiền tệ';

-- 7. Collections (Watchlists)
CREATE TABLE IF NOT EXISTS collections (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  icon        TEXT DEFAULT '⭐',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE collections IS 'Danh mục theo dõi cổ phiếu';

-- 8. Collection Stocks (Many-to-Many)
CREATE TABLE IF NOT EXISTS collection_stocks (
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  symbol        TEXT NOT NULL REFERENCES companies(symbol) ON DELETE CASCADE,
  sort_order    INTEGER DEFAULT 0,
  PRIMARY KEY (collection_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_collection_stocks_collection 
  ON collection_stocks(collection_id);

COMMENT ON TABLE collection_stocks IS 'Mã cổ phiếu trong từng danh mục';

-- 9. Sync Log (track data freshness)
CREATE TABLE IF NOT EXISTS sync_log (
  id          BIGSERIAL PRIMARY KEY,
  symbol      TEXT,
  sync_type   TEXT NOT NULL, -- 'prices', 'company', 'financials'
  status      TEXT NOT NULL, -- 'success', 'error'
  message     TEXT,
  records_count INTEGER DEFAULT 0,
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sync_log_symbol_type 
  ON sync_log(symbol, sync_type, started_at DESC);

COMMENT ON TABLE sync_log IS 'Log đồng bộ dữ liệu từ vnstock';

-- ============================================
-- Seed: Default collections
-- ============================================
INSERT INTO collections (id, name, icon) VALUES
  ('watchlist-default', 'Danh mục chính', '⭐'),
  ('banking', 'Ngân hàng', '🏦'),
  ('bluechip', 'Blue Chips', '💎')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- RLS Policies (optional — enable if using auth)
-- ============================================
-- For now, disable RLS since this is a personal tool.
-- If you enable Supabase Auth later, add policies here.

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_ratios ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_sheet ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_statement ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (personal tool, no auth)
CREATE POLICY "Allow all on companies" ON companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on price_history" ON price_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on financial_ratios" ON financial_ratios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on balance_sheet" ON balance_sheet FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on income_statement" ON income_statement FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cash_flow" ON cash_flow FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on collections" ON collections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on collection_stocks" ON collection_stocks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sync_log" ON sync_log FOR ALL USING (true) WITH CHECK (true);
