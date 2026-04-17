import { Router } from 'express';
import { supabase } from '../db';

export const pricesRouter = Router();

// GET /api/prices/:symbol?days=180&interval=d
pricesRouter.get('/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const days = parseInt(req.query.days as string) || 365;
  const interval = (req.query.interval as string) || 'd';

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('price_history')
    .select('date, open, high, low, close, volume')
    .eq('symbol', symbol.toUpperCase())
    .eq('interval', interval)
    .gte('date', since.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/prices/:symbol/latest — Latest price
pricesRouter.get('/:symbol/latest', async (req, res) => {
  const { symbol } = req.params;

  const { data, error } = await supabase
    .from('price_history')
    .select('date, open, high, low, close, volume')
    .eq('symbol', symbol.toUpperCase())
    .eq('interval', 'd')
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (error) return res.status(404).json({ error: 'No price data found' });
  res.json(data);
});

// POST /api/prices/bulk — Bulk upsert OHLCV data
pricesRouter.post('/bulk', async (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'records array required' });
  }

  const { error, count } = await supabase
    .from('price_history')
    .upsert(records, { onConflict: 'symbol,date,interval', ignoreDuplicates: false })
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ inserted: count ?? records.length });
});
