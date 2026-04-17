"""
Smart Investor — vnstock Data Fetcher
Usage: python fetch_data.py <action> <symbol> [--api-key KEY] [--start DATE] [--end DATE]

Actions: company, prices, ratios, balance_sheet, income_statement, cash_flow
Output: JSON to stdout
"""
import sys
import json
import argparse
from datetime import datetime, timedelta

def setup_vnstock(api_key):
    """Register vnstock API key if provided."""
    try:
        from vnstock import register_user
        if api_key:
            register_user(api_key=api_key)
    except Exception:
        pass  # Proceed as guest if registration fails

def fetch_company(symbol: str, source: str = 'TCBS'):
    """Fetch company overview."""
    from vnstock import Vnstock
    stock = Vnstock().stock(symbol=symbol, source=source)
    df = stock.company.overview()
    if df is not None and not df.empty:
        record = df.iloc[0].to_dict()
        # Normalize keys
        return {
            'symbol': symbol.upper(),
            'company_name': record.get('company_name', record.get('companyName', '')),
            'short_name': record.get('short_name', record.get('shortName', '')),
            'exchange': record.get('exchange', ''),
            'industry': record.get('industry', record.get('industryName', '')),
            'sector': record.get('sector', ''),
            'description': record.get('description', ''),
            'market_cap': _safe_float(record.get('market_cap', record.get('marketCap'))),
            'outstanding_shares': _safe_float(record.get('outstanding_share', record.get('outstandingShare'))),
            'website': record.get('website', ''),
        }
    return None

def fetch_prices(symbol: str, start: str, end: str, source: str = 'TCBS'):
    """Fetch OHLCV history."""
    from vnstock import Vnstock
    stock = Vnstock().stock(symbol=symbol, source=source)
    df = stock.quote.history(start=start, end=end, interval='1D')
    if df is not None and not df.empty:
        records = []
        for _, row in df.iterrows():
            records.append({
                'symbol': symbol.upper(),
                'date': str(row.get('time', row.get('tradingDate', row.name)))[:10],
                'open': _safe_float(row.get('open')),
                'high': _safe_float(row.get('high')),
                'low': _safe_float(row.get('low')),
                'close': _safe_float(row.get('close')),
                'volume': _safe_float(row.get('volume')),
                'interval': 'd',
            })
        return records
    return []

def fetch_ratios(symbol: str, period: str = 'year', source: str = 'TCBS'):
    """Fetch financial ratios."""
    from vnstock import Vnstock
    stock = Vnstock().stock(symbol=symbol, source=source)
    df = stock.finance.ratio(period=period, lang='en')
    if df is not None and not df.empty:
        records = []
        for _, row in df.iterrows():
            d = row.to_dict()
            records.append({
                'symbol': symbol.upper(),
                'period_type': period,
                'period': str(d.get('year', d.get('period', ''))),
                'pe': _safe_float(d.get('priceToEarning', d.get('pe'))),
                'pb': _safe_float(d.get('priceToBook', d.get('pb'))),
                'ps': _safe_float(d.get('priceToSales', d.get('ps'))),
                'roe': _safe_float(d.get('roe')),
                'roa': _safe_float(d.get('roa')),
                'eps': _safe_float(d.get('earningPerShare', d.get('eps'))),
                'bvps': _safe_float(d.get('bookValuePerShare', d.get('bvps'))),
                'dividend_yield': _safe_float(d.get('dividend', d.get('dividendYield'))),
                'debt_to_equity': _safe_float(d.get('debtOnEquity', d.get('debtToEquity'))),
                'current_ratio': _safe_float(d.get('currentPayment', d.get('currentRatio'))),
                'gross_margin': _safe_float(d.get('grossProfitMargin', d.get('grossMargin'))),
                'operating_margin': _safe_float(d.get('operatingProfitMargin', d.get('operatingMargin'))),
                'net_margin': _safe_float(d.get('netProfitMargin', d.get('netMargin'))),
                'revenue_growth': _safe_float(d.get('revenueGrowth')),
                'profit_growth': _safe_float(d.get('earningGrowth', d.get('profitGrowth'))),
            })
        return records
    return []

def fetch_balance_sheet(symbol: str, period: str = 'year', source: str = 'TCBS'):
    """Fetch balance sheet."""
    from vnstock import Vnstock
    stock = Vnstock().stock(symbol=symbol, source=source)
    df = stock.finance.balance_sheet(period=period)
    if df is not None and not df.empty:
        records = []
        for _, row in df.iterrows():
            d = row.to_dict()
            records.append({
                'symbol': symbol.upper(),
                'period_type': period,
                'period': str(d.get('year', d.get('period', ''))),
                'total_assets': _safe_float(d.get('asset', d.get('totalAssets'))),
                'current_assets': _safe_float(d.get('shortAsset', d.get('currentAssets'))),
                'non_current_assets': _safe_float(d.get('longAsset', d.get('nonCurrentAssets'))),
                'total_liabilities': _safe_float(d.get('debt', d.get('totalLiabilities'))),
                'current_liabilities': _safe_float(d.get('shortDebt', d.get('currentLiabilities'))),
                'non_current_liabilities': _safe_float(d.get('longDebt', d.get('nonCurrentLiabilities'))),
                'owner_equity': _safe_float(d.get('equity', d.get('ownerEquity'))),
                'charter_capital': _safe_float(d.get('capital', d.get('charterCapital'))),
                'retained_earnings': _safe_float(d.get('unDistributedIncome', d.get('retainedEarnings'))),
                'raw_json': _safe_json(d),
            })
        return records
    return []

def fetch_income_statement(symbol: str, period: str = 'year', source: str = 'TCBS'):
    """Fetch income statement."""
    from vnstock import Vnstock
    stock = Vnstock().stock(symbol=symbol, source=source)
    df = stock.finance.income_statement(period=period)
    if df is not None and not df.empty:
        records = []
        for _, row in df.iterrows():
            d = row.to_dict()
            records.append({
                'symbol': symbol.upper(),
                'period_type': period,
                'period': str(d.get('year', d.get('period', ''))),
                'revenue': _safe_float(d.get('revenue')),
                'cost_of_revenue': _safe_float(d.get('costOfGoodSold', d.get('costOfRevenue'))),
                'gross_profit': _safe_float(d.get('grossProfit')),
                'operating_expenses': _safe_float(d.get('operatingExpenses', d.get('operationExpense'))),
                'operating_profit': _safe_float(d.get('operationProfit', d.get('operatingProfit'))),
                'interest_expense': _safe_float(d.get('interestExpense')),
                'profit_before_tax': _safe_float(d.get('preTaxProfit', d.get('profitBeforeTax'))),
                'net_profit': _safe_float(d.get('postTaxProfit', d.get('netProfit'))),
                'ebitda': _safe_float(d.get('ebitda')),
                'raw_json': _safe_json(d),
            })
        return records
    return []

def fetch_cash_flow(symbol: str, period: str = 'year', source: str = 'TCBS'):
    """Fetch cash flow statement."""
    from vnstock import Vnstock
    stock = Vnstock().stock(symbol=symbol, source=source)
    df = stock.finance.cash_flow(period=period)
    if df is not None and not df.empty:
        records = []
        for _, row in df.iterrows():
            d = row.to_dict()
            records.append({
                'symbol': symbol.upper(),
                'period_type': period,
                'period': str(d.get('year', d.get('period', ''))),
                'operating_cash_flow': _safe_float(d.get('fromSale', d.get('operatingCashFlow'))),
                'investing_cash_flow': _safe_float(d.get('fromInvest', d.get('investingCashFlow'))),
                'financing_cash_flow': _safe_float(d.get('fromFinancial', d.get('financingCashFlow'))),
                'net_cash_flow': _safe_float(d.get('freeCashFlow', d.get('netCashFlow'))),
                'free_cash_flow': _safe_float(d.get('freeCashFlow')),
                'raw_json': _safe_json(d),
            })
        return records
    return []

def _safe_float(val):
    """Convert to float safely."""
    if val is None:
        return None
    try:
        import math
        f = float(val)
        return None if math.isnan(f) or math.isinf(f) else f
    except (ValueError, TypeError):
        return None

def _safe_json(d: dict) -> str:
    """Convert dict to JSON string, handling non-serializable values."""
    def default(obj):
        if hasattr(obj, 'isoformat'):
            return obj.isoformat()
        try:
            import numpy as np
            if isinstance(obj, (np.integer, np.int64)):
                return int(obj)
            if isinstance(obj, (np.floating, np.float64)):
                import math
                return None if math.isnan(obj) else float(obj)
            if isinstance(obj, np.ndarray):
                return obj.tolist()
        except ImportError:
            pass
        return str(obj)
    return json.dumps(d, default=default, ensure_ascii=False)

def main():
    parser = argparse.ArgumentParser(description='Smart Investor vnstock fetcher')
    parser.add_argument('action', choices=['company', 'prices', 'ratios', 'balance_sheet', 'income_statement', 'cash_flow'])
    parser.add_argument('symbol')
    parser.add_argument('--api-key', default=None)
    parser.add_argument('--start', default=(datetime.now() - timedelta(days=365*3)).strftime('%Y-%m-%d'))
    parser.add_argument('--end', default=datetime.now().strftime('%Y-%m-%d'))
    parser.add_argument('--period', default='year', choices=['year', 'quarter'])
    parser.add_argument('--source', default='TCBS')

    args = parser.parse_args()

    setup_vnstock(args.api_key)

    try:
        if args.action == 'company':
            result = fetch_company(args.symbol, args.source)
        elif args.action == 'prices':
            result = fetch_prices(args.symbol, args.start, args.end, args.source)
        elif args.action == 'ratios':
            result = fetch_ratios(args.symbol, args.period, args.source)
        elif args.action == 'balance_sheet':
            result = fetch_balance_sheet(args.symbol, args.period, args.source)
        elif args.action == 'income_statement':
            result = fetch_income_statement(args.symbol, args.period, args.source)
        elif args.action == 'cash_flow':
            result = fetch_cash_flow(args.symbol, args.period, args.source)
        else:
            result = None

        print(json.dumps({'success': True, 'data': result}, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}, ensure_ascii=False))
        sys.exit(1)

if __name__ == '__main__':
    main()
