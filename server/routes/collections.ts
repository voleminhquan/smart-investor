import { Router } from 'express';
import { supabase } from '../db';
import { syncCompany, syncPrices } from '../sync/vnstock-worker';

export const collectionsRouter = Router();

// GET /api/collections — List all collections with stock counts
collectionsRouter.get('/', async (_req, res) => {
  const { data: collections, error } = await supabase
    .from('collections')
    .select(`
      id, name, icon, created_at,
      collection_stocks(symbol, sort_order)
    `)
    .order('created_at');

  if (error) return res.status(500).json({ error: error.message });

  // Transform to flatten symbols
  const result = (collections ?? []).map((col: any) => ({
    id: col.id,
    name: col.name,
    icon: col.icon,
    createdAt: col.created_at,
    symbols: (col.collection_stocks ?? [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((cs: any) => cs.symbol),
  }));

  res.json(result);
});

// POST /api/collections — Create a collection
collectionsRouter.post('/', async (req, res) => {
  const { id, name, icon } = req.body;

  const { data, error } = await supabase
    .from('collections')
    .insert({ id: id || `col-${Date.now()}`, name, icon: icon || '⭐' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ...data, symbols: [] });
});

// DELETE /api/collections/:id
collectionsRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// POST /api/collections/:id/stocks — Add stock to collection
collectionsRouter.post('/:id/stocks', async (req, res) => {
  const { id } = req.params;
  const { symbol } = req.body;

  // Get max sort_order
  const { data: existing } = await supabase
    .from('collection_stocks')
    .select('sort_order')
    .eq('collection_id', id)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  // Insert stub to companies table if it doesn't exist to prevent FK error
  // The background sync worker will fill in the real company details later
  await supabase
    .from('companies')
    .upsert({ symbol: symbol.toUpperCase(), company_name: symbol.toUpperCase() }, { onConflict: 'symbol', ignoreDuplicates: true });

  const { error } = await supabase
    .from('collection_stocks')
    .upsert({ collection_id: id, symbol: symbol.toUpperCase(), sort_order: nextOrder });

  // Async trigger to fetch real price and company data without blocking the response
  if (!error) {
    setTimeout(async () => {
      try {
        console.log(`[Collections] Background syncing data for new stock: ${symbol}`);
        await syncCompany(symbol.toUpperCase());
        await syncPrices(symbol.toUpperCase());
      } catch (err) {
        console.error(`[Collections] Background sync failed for ${symbol}:`, err);
      }
    }, 0);
  }

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// DELETE /api/collections/:id/stocks/:symbol
collectionsRouter.delete('/:id/stocks/:symbol', async (req, res) => {
  const { id, symbol } = req.params;

  const { error } = await supabase
    .from('collection_stocks')
    .delete()
    .eq('collection_id', id)
    .eq('symbol', symbol.toUpperCase());

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});
