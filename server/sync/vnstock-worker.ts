import { supabase } from '../db';
import {
  fetchCompanyOverview,
  fetchPriceHistory,
  fetchQuote,
  fetchFinancialRatios,
  fetchFinancialRatiosQuarterly,
  fetchBalanceSheet,
  fetchIncomeStatement,
  fetchCashFlow,
} from './vndirect-client';

/**
 * Sync company info.
 */
export async function syncCompany(symbol: string): Promise<void> {
  console.log(`  📋 Syncing company: ${symbol}`);
  const company = await fetchCompanyOverview(symbol);

  const { error } = await supabase
    .from('companies')
    .upsert({ ...company, updated_at: new Date().toISOString() }, { onConflict: 'symbol' });

  if (error) throw new Error(`Company upsert error: ${error.message}`);
  console.log(`    ✅ Company ${symbol} synced`);
}

/**
 * Sync OHLCV price history.
 */
export async function syncPrices(symbol: string, fromDate: string = '2024-01-01'): Promise<number> {
  console.log(`  📈 Syncing prices: ${symbol} (from ${fromDate})`);
  const records = await fetchPriceHistory(symbol, fromDate);

  if (records.length === 0) {
    console.log(`    ⚠️ No price data for ${symbol}`);
    return 0;
  }

  // Batch upsert in chunks of 500
  const chunkSize = 500;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('price_history')
      .upsert(chunk, { onConflict: 'symbol,date,interval' });

    if (error) throw new Error(`Price upsert error: ${error.message}`);
  }

  console.log(`    ✅ ${records.length} price records synced`);
  return records.length;
}

/**
 * Sync all financial data (ratios + statements).
 */
export async function syncFinancials(symbol: string): Promise<void> {
  console.log(`  📊 Syncing financials: ${symbol}`);

  // Ratios (yearly)
  try {
    const ratiosY = await fetchFinancialRatios(symbol);
    if (ratiosY.length > 0) {
      const { error } = await supabase
        .from('financial_ratios')
        .upsert(ratiosY, { onConflict: 'symbol,period_type,period' });
      if (error) console.warn(`    ⚠️ Yearly ratios: ${error.message}`);
      else console.log(`    ✅ ${ratiosY.length} yearly ratios`);
    }
  } catch (e: any) {
    console.warn(`    ⚠️ Yearly ratios error: ${e.message}`);
  }

  // Ratios (quarterly)
  try {
    const ratiosQ = await fetchFinancialRatiosQuarterly(symbol);
    if (ratiosQ.length > 0) {
      const { error } = await supabase
        .from('financial_ratios')
        .upsert(ratiosQ, { onConflict: 'symbol,period_type,period' });
      if (error) console.warn(`    ⚠️ Quarterly ratios: ${error.message}`);
      else console.log(`    ✅ ${ratiosQ.length} quarterly ratios`);
    }
  } catch (e: any) {
    console.warn(`    ⚠️ Quarterly ratios error: ${e.message}`);
  }

  // Balance Sheet
  for (const yearly of [true, false]) {
    try {
      const data = await fetchBalanceSheet(symbol, yearly);
      if (data.length > 0) {
        const { error } = await supabase
          .from('balance_sheet')
          .upsert(data, { onConflict: 'symbol,period_type,period' });
        if (error) console.warn(`    ⚠️ Balance sheet (${yearly ? 'Y' : 'Q'}): ${error.message}`);
      }
    } catch (e: any) {
      console.warn(`    ⚠️ Balance sheet error: ${e.message}`);
    }
  }

  // Income Statement
  for (const yearly of [true, false]) {
    try {
      const data = await fetchIncomeStatement(symbol, yearly);
      if (data.length > 0) {
        const { error } = await supabase
          .from('income_statement')
          .upsert(data, { onConflict: 'symbol,period_type,period' });
        if (error) console.warn(`    ⚠️ Income statement (${yearly ? 'Y' : 'Q'}): ${error.message}`);
      }
    } catch (e: any) {
      console.warn(`    ⚠️ Income statement error: ${e.message}`);
    }
  }

  // Cash Flow
  for (const yearly of [true, false]) {
    try {
      const data = await fetchCashFlow(symbol, yearly);
      if (data.length > 0) {
        const { error } = await supabase
          .from('cash_flow')
          .upsert(data, { onConflict: 'symbol,period_type,period' });
        if (error) console.warn(`    ⚠️ Cash flow (${yearly ? 'Y' : 'Q'}): ${error.message}`);
      }
    } catch (e: any) {
      console.warn(`    ⚠️ Cash flow error: ${e.message}`);
    }
  }

  console.log(`    ✅ Financials for ${symbol} synced`);
}

/**
 * Sync all tracked symbols (periodic — prices only, 30 days).
 */
export async function syncAll(): Promise<void> {
  console.log(`\n🔄 Starting sync at ${new Date().toLocaleString('vi-VN')}`);

  // Get all unique symbols from collections
  const { data: stocks } = await supabase
    .from('collection_stocks')
    .select('symbol');

  const symbols = [...new Set((stocks ?? []).map((s: any) => s.symbol))];

  if (symbols.length === 0) {
    console.log('  No symbols to sync.');
    return;
  }

  console.log(`  Syncing ${symbols.length} symbols: ${symbols.join(', ')}`);

  const { data: syncLog } = await supabase
    .from('sync_log')
    .insert({ sync_type: 'prices', status: 'running', message: `Syncing ${symbols.length} symbols (parallel)` })
    .select()
    .single();

  let totalPrices = 0;
  const errors: string[] = [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000).toISOString().split('T')[0];

  // Process in parallel chunks to stay within Vercel's 10s limit
  const processInParallel = async (symbol: string) => {
    try {
      // 1. Sync Company Info (fast)
      await syncCompany(symbol);
      
      // 2. Sync Latest Quote (very fast)
      const quote = await fetchQuote(symbol);
      if (quote) {
        await supabase.from('price_history').upsert(quote, { onConflict: 'symbol,date,interval' });
        totalPrices++;
      }

      // 3. Sync Recent History (moderate)
      const count = await syncPrices(symbol, thirtyDaysAgo);
      totalPrices += count;
    } catch (err: any) {
      errors.push(`${symbol}: ${err.message}`);
    }
  };

  // Run all in parallel
  await Promise.all(symbols.map(s => processInParallel(s)));

  // Update sync log
  if (syncLog) {
    await supabase
      .from('sync_log')
      .update({
        status: errors.length > 0 ? 'partial' : 'success',
        message: errors.length > 0 ? errors.join('; ') : `${symbols.length} symbols, ${totalPrices} prices`,
        records_count: totalPrices,
        finished_at: new Date().toISOString(),
      })
      .eq('id', syncLog.id);
  }

  console.log(`✅ Sync done: ${totalPrices} prices, ${errors.length} errors.\n`);
}

/**
 * Full initial sync (2024-now + financials).
 */
export async function initialSync(symbol: string): Promise<void> {
  console.log(`\n🚀 Initial sync: ${symbol}`);
  await syncCompany(symbol);
  await syncPrices(symbol, '2024-01-01');
  await syncFinancials(symbol);
  console.log(`✅ Initial sync for ${symbol} complete.\n`);
}
