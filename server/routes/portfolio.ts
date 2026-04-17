import { Router } from 'express';
import { supabase } from '../db';
import { syncCompany, syncPrices } from '../sync/vnstock-worker';

export const portfolioRouter = Router();

// ─── GET /api/portfolio/:collectionId ─────────────────────────
// Calculate P&L summary per symbol in a collection
portfolioRouter.get('/:collectionId', async (req, res) => {
  const { collectionId } = req.params;

  // Get all transactions for this collection (or all if 'all')
  let query = supabase
    .from('portfolio_transactions')
    .select('*')
    .order('traded_at', { ascending: true });

  if (collectionId !== 'all') {
    query = query.eq('collection_id', collectionId);
  }

  const { data: txns, error: txnErr } = await query;

  if (txnErr) return res.status(500).json({ error: txnErr.message });
  if (!txns || txns.length === 0) return res.json({ holdings: [], totalValue: 0, totalCost: 0, totalPnL: 0 });

  // Group by symbol
  const symbolSet = [...new Set(txns.map((t: any) => t.symbol))];

  // Fetch latest prices for all symbols
  const priceMap: Record<string, number> = {};
  for (const sym of symbolSet) {
    const { data: ph } = await supabase
      .from('price_history')
      .select('close')
      .eq('symbol', sym)
      .eq('interval', 'd')
      .order('date', { ascending: false })
      .limit(1)
      .single();
    priceMap[sym] = ph?.close ?? 0;
  }

  // Fetch company names
  const { data: companies } = await supabase
    .from('companies')
    .select('symbol, company_name, exchange')
    .in('symbol', symbolSet);
  const companyMap: Record<string, any> = {};
  for (const c of companies ?? []) companyMap[c.symbol] = c;

  // Calculate FIFO holdings per symbol
  const holdingsMap: Record<string, {
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
    transactions: any[];
  }> = {};

  for (const sym of symbolSet) {
    const symTxns = txns.filter((t: any) => t.symbol === sym);
    let totalBuyQty = 0;
    let totalBuyValue = 0;
    let totalSellQty = 0;

    for (const t of symTxns) {
      if (t.type === 'buy') {
        totalBuyQty += Number(t.quantity);
        totalBuyValue += Number(t.quantity) * Number(t.price) + Number(t.fee || 0);
      } else {
        totalSellQty += Number(t.quantity);
      }
    }

    const holdingQty = totalBuyQty - totalSellQty;
    const avgCost = totalBuyQty > 0 ? totalBuyValue / totalBuyQty : 0;
    const currentPrice = priceMap[sym] || 0;
    const currentValue = holdingQty * currentPrice;
    const totalCost = holdingQty * avgCost;
    const pnl = currentValue - totalCost;
    const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

    holdingsMap[sym] = {
      symbol: sym,
      companyName: companyMap[sym]?.company_name || sym,
      exchange: companyMap[sym]?.exchange || '',
      quantity: holdingQty,
      averageCost: avgCost,
      totalCost,
      currentPrice,
      currentValue,
      pnl,
      pnlPercent,
      transactions: symTxns,
    };
  }

  const holdings = Object.values(holdingsMap).filter(h => h.quantity > 0);
  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const totalCost = holdings.reduce((s, h) => s + h.totalCost, 0);
  const totalPnL = totalValue - totalCost;
  const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  res.json({ holdings, totalValue, totalCost, totalPnL, totalPnLPercent });
});

// ─── GET /api/portfolio/transactions/:collectionId ────────────
portfolioRouter.get('/transactions/:collectionId', async (req, res) => {
  const { collectionId } = req.params;

  let query = supabase
    .from('portfolio_transactions')
    .select('*')
    .order('traded_at', { ascending: false });

  if (collectionId !== 'all') {
    query = query.eq('collection_id', collectionId);
  }

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── POST /api/portfolio/transactions ─────────────────────────
portfolioRouter.post('/transactions', async (req, res) => {
  const { collection_id, symbol, type, quantity, price, fee, note, traded_at } = req.body;

  if (!collection_id || !symbol || !type || !quantity || !price || !traded_at) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Ensure company stub exists
  await supabase
    .from('companies')
    .upsert({ symbol: symbol.toUpperCase(), company_name: symbol.toUpperCase() },
      { onConflict: 'symbol', ignoreDuplicates: true });

  const { data, error } = await supabase
    .from('portfolio_transactions')
    .insert({
      collection_id,
      symbol: symbol.toUpperCase(),
      type,
      quantity: Number(quantity),
      price: Number(price),
      fee: Number(fee || 0),
      note: note || null,
      traded_at,
    })
    .select()
    .single();

  // Async trigger to fetch real price and company data without blocking the response
  if (!error) {
    setTimeout(async () => {
      try {
        console.log(`[Portfolio] Background syncing data for new transaction symbol: ${symbol}`);
        await syncCompany(symbol.toUpperCase());
        await syncPrices(symbol.toUpperCase());
      } catch (err) {
        console.error(`[Portfolio] Background sync failed for ${symbol}:`, err);
      }
    }, 0);
  }

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── DELETE /api/portfolio/transactions/:id ───────────────────
portfolioRouter.delete('/transactions/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('portfolio_transactions')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});
