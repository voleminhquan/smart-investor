import { Router } from 'express';
import { supabase } from '../db';

export const companiesRouter = Router();

// GET /api/companies — List all companies
companiesRouter.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('companies')
    .select(`
      symbol, company_name, short_name, exchange, industry, market_cap, outstanding_shares, updated_at,
      price_history(close, open, date)
    `)
    .order('symbol')
    .order('date', { foreignTable: 'price_history', ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // Map to format that frontend expects
  const formattedData = data.map((c: any) => {
    let latestPrice = 0;
    let change = 0;
    let changePercent = 0;
    let updatedAt = c.updated_at;
    
    if (c.price_history && c.price_history.length > 0) {
      const latest = c.price_history[0];
      latestPrice = latest.close;
      updatedAt = new Date(latest.date).toISOString(); // Use price date as data freshness indicator
      
      const prev = c.price_history.length > 1 ? c.price_history[1] : null;
      if (prev && prev.close > 0) {
        change = latest.close - prev.close; 
        changePercent = (change / prev.close) * 100;
      } else {
        change = latest.close - latest.open;
        changePercent = latest.open > 0 ? (change / latest.open) * 100 : 0;
      }
    }

    return {
      symbol: c.symbol,
      companyName: c.company_name,
      exchange: c.exchange,
      industry: c.industry,
      price: latestPrice,
      change: change,
      changePercent: changePercent || 0,
      updatedAt: updatedAt
    };
  });

  res.json(formattedData);
});

// GET /api/companies/:symbol — Get company details
companiesRouter.get('/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('symbol', symbol.toUpperCase())
    .single();

  if (error) return res.status(404).json({ error: 'Company not found' });
  res.json(data);
});

// POST /api/companies — Upsert a company
companiesRouter.post('/', async (req, res) => {
  const company = req.body;
  company.symbol = company.symbol?.toUpperCase();
  company.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('companies')
    .upsert(company, { onConflict: 'symbol' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
