import { Router } from 'express';
import { syncAll, initialSync, syncPrices, syncFinancials } from '../sync/vnstock-worker';

export const syncRouter = Router();

let isSyncing = false;

// POST /api/sync/all — Trigger full sync
syncRouter.post('/all', async (_req, res) => {
  if (isSyncing) return res.status(409).json({ error: 'Sync already in progress' });
  isSyncing = true;
  res.json({ status: 'started', message: 'Full sync started in background' });
  try { await syncAll(); } catch (err: any) { console.error('Sync error:', err.message); } finally { isSyncing = false; }
});

// GET /api/sync/cron — Vercel Cron endpoint
syncRouter.get('/cron', async (req, res) => {
  if (isSyncing) return res.status(409).json({ error: 'Sync already in progress' });
  
  // Vercel sends a specific auth header, but for simplicity we will just execute it.
  isSyncing = true;
  res.json({ status: 'started', message: 'Vercel cron sync started' });
  try {
    await syncAll();
  } catch (err: any) {
    console.error('Vercel cron error:', err.message);
  } finally {
    isSyncing = false;
  }
});

// POST /api/sync/symbol/:symbol — Initial sync for a new symbol
syncRouter.post('/symbol/:symbol', async (req, res) => {
  const { symbol } = req.params;

  res.json({ status: 'started', message: `Initial sync for ${symbol} started` });

  try {
    await initialSync(symbol.toUpperCase());
  } catch (err: any) {
    console.error(`Initial sync error for ${symbol}:`, err.message);
  }
});

// POST /api/sync/prices/:symbol — Sync prices only
syncRouter.post('/prices/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const fromDate = (req.query.from_date as string) || '2024-01-01';

  try {
    const count = await syncPrices(symbol.toUpperCase(), fromDate);
    res.json({ status: 'success', records: count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sync/financials/:symbol — Sync financials only
syncRouter.post('/financials/:symbol', async (req, res) => {
  const { symbol } = req.params;

  res.json({ status: 'started', message: `Financial sync for ${symbol} started` });

  try {
    await syncFinancials(symbol.toUpperCase());
  } catch (err: any) {
    console.error(`Financial sync error for ${symbol}:`, err.message);
  }
});

// GET /api/sync/status — Check sync status and get last log
syncRouter.get('/status', async (_req, res) => {
  try {
    const { data: lastSync } = await supabase
      .from('sync_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    res.json({ 
      syncing: isSyncing,
      lastSync: lastSync || null
    });
  } catch (err) {
    res.json({ syncing: isSyncing, lastSync: null });
  }
});
