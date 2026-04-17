import { Router } from 'express';
import { supabase } from '../db';

export const analysisRouter = Router();

// ─── GET /api/analysis/:symbol/fundamental ────────────────────
// Returns computed fundamental indicators for a symbol
analysisRouter.get('/:symbol/fundamental', async (req, res) => {
  const { symbol } = req.params;
  const sym = symbol.toUpperCase();

  // Fetch all data in parallel
  const [ratiosRes, incomeRes, balanceRes, companyRes, latestPriceRes] = await Promise.all([
    supabase.from('financial_ratios').select('*').eq('symbol', sym)
      .eq('period_type', 'year').order('period', { ascending: false }).limit(5),
    supabase.from('income_statement').select('*').eq('symbol', sym)
      .eq('period_type', 'year').order('period', { ascending: false }).limit(5),
    supabase.from('balance_sheet').select('*').eq('symbol', sym)
      .eq('period_type', 'year').order('period', { ascending: false }).limit(5),
    supabase.from('companies').select('*').eq('symbol', sym).single(),
    supabase.from('price_history').select('close, open').eq('symbol', sym)
      .eq('interval', 'd').order('date', { ascending: false }).limit(1).single(),
  ]);

  const ratios = ratiosRes.data ?? [];
  const income = incomeRes.data ?? [];
  const balance = balanceRes.data ?? [];
  const company = companyRes.data;
  const latestPrice = latestPriceRes.data;

  const currentPrice = latestPrice?.close ?? 0;
  const latestRatio = ratios[0] ?? {};
  const latestIncome = income[0] ?? {};
  const latestBalance = balance[0] ?? {};
  const prevIncome = income[1] ?? {};

  // Derived calculations
  const eps = latestRatio.eps ?? null;
  const pe = eps && currentPrice ? currentPrice / eps : (latestRatio.pe ?? null);
  const pb = latestRatio.pb ?? null;
  const roe = latestRatio.roe ?? null;
  const roa = latestRatio.roa ?? null;

  // BVPS = owner_equity / outstanding_shares
  const ownerEquity = latestBalance.owner_equity ?? null;
  const outstandingShares = company?.outstanding_shares ?? null;
  const bvps = ownerEquity && outstandingShares ? ownerEquity / outstandingShares : null;

  // ROS = net_profit / revenue
  const ros = (latestIncome.net_profit && latestIncome.revenue)
    ? latestIncome.net_profit / latestIncome.revenue
    : null;

  // DAR = total_liabilities / total_assets
  const dar = (latestBalance.total_liabilities && latestBalance.total_assets)
    ? latestBalance.total_liabilities / latestBalance.total_assets
    : null;

  // PEG = PE / EPS growth rate
  const currentEps = latestRatio.eps ?? null;
  const prevEps = ratios[1]?.eps ?? null;
  const epsGrowthRate = (currentEps && prevEps && prevEps > 0)
    ? ((currentEps - prevEps) / prevEps) * 100
    : null;
  const peg = (pe && epsGrowthRate && epsGrowthRate > 0)
    ? pe / epsGrowthRate
    : null;

  // Historical EPS for trend chart
  const epsHistory = ratios.map((r: any) => ({
    period: r.period,
    eps: r.eps,
    roe: r.roe,
    pe: r.pe,
  })).reverse();

  // Revenue & profit trend
  const incomeHistory = income.map((r: any) => ({
    period: r.period,
    revenue: r.revenue,
    net_profit: r.net_profit,
    gross_profit: r.gross_profit,
  })).reverse();

  res.json({
    symbol: sym,
    companyName: company?.company_name ?? sym,
    currentPrice,
    metrics: {
      eps,
      pe,
      peg,
      pb,
      bvps,
      roe,
      roa,
      ros,
      dar,
      epsGrowthRate,
      netMargin: ros,
      grossMargin: latestRatio.gross_margin ?? null,
      dividendYield: latestRatio.dividend_yield ?? null,
      debtToEquity: latestRatio.debt_to_equity ?? null,
    },
    history: {
      eps: epsHistory,
      income: incomeHistory,
    },
    rawRatios: latestRatio,
    dataAvailable: ratios.length > 0,
  });
});
