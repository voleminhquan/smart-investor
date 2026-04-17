import { Router } from 'express';
import { supabase } from '../db';

export const financialsRouter = Router();

// GET /api/financials/:symbol/ratios?period_type=year
financialsRouter.get('/:symbol/ratios', async (req, res) => {
  const { symbol } = req.params;
  const periodType = (req.query.period_type as string) || 'year';

  const { data, error } = await supabase
    .from('financial_ratios')
    .select('*')
    .eq('symbol', symbol.toUpperCase())
    .eq('period_type', periodType)
    .order('period', { ascending: false })
    .limit(12);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/financials/:symbol/balance-sheet?period_type=year
financialsRouter.get('/:symbol/balance-sheet', async (req, res) => {
  const { symbol } = req.params;
  const periodType = (req.query.period_type as string) || 'year';

  const { data, error } = await supabase
    .from('balance_sheet')
    .select('*')
    .eq('symbol', symbol.toUpperCase())
    .eq('period_type', periodType)
    .order('period', { ascending: false })
    .limit(8);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/financials/:symbol/income-statement?period_type=year
financialsRouter.get('/:symbol/income-statement', async (req, res) => {
  const { symbol } = req.params;
  const periodType = (req.query.period_type as string) || 'year';

  const { data, error } = await supabase
    .from('income_statement')
    .select('*')
    .eq('symbol', symbol.toUpperCase())
    .eq('period_type', periodType)
    .order('period', { ascending: false })
    .limit(8);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/financials/:symbol/cash-flow?period_type=year
financialsRouter.get('/:symbol/cash-flow', async (req, res) => {
  const { symbol } = req.params;
  const periodType = (req.query.period_type as string) || 'year';

  const { data, error } = await supabase
    .from('cash_flow')
    .select('*')
    .eq('symbol', symbol.toUpperCase())
    .eq('period_type', periodType)
    .order('period', { ascending: false })
    .limit(8);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
