-- ============================================
-- Smart Investor — Migration v2: Portfolio Tracker
-- ============================================
-- Run this in your Supabase SQL Editor AFTER migration.sql

-- Portfolio Transactions
CREATE TABLE IF NOT EXISTS portfolio_transactions (
  id            BIGSERIAL PRIMARY KEY,
  collection_id TEXT REFERENCES collections(id) ON DELETE CASCADE,
  symbol        TEXT NOT NULL REFERENCES companies(symbol) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  quantity      NUMERIC NOT NULL CHECK (quantity > 0),
  price         NUMERIC NOT NULL CHECK (price > 0),
  fee           NUMERIC DEFAULT 0,
  note          TEXT,
  traded_at     DATE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_collection
  ON portfolio_transactions(collection_id, symbol);

CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_symbol
  ON portfolio_transactions(symbol, traded_at DESC);

COMMENT ON TABLE portfolio_transactions IS 'Lịch sử giao dịch mua/bán cổ phiếu';

ALTER TABLE portfolio_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on portfolio_transactions" ON portfolio_transactions 
  FOR ALL USING (true) WITH CHECK (true);
