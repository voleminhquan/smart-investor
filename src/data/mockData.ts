export interface StockMetric {
  label: string;
  value: string;
  type?: 'positive' | 'negative' | 'neutral' | 'range';
}

export interface MetricSection {
  id: string;
  title?: string;
  metrics: StockMetric[];
}

export interface StockData {
  symbol: string;
  companyName: string;
  exchange: string;
  industry: string;
  price: number;
  change: number;
  changePercent: number;
  sections: MetricSection[];
}

export interface OHLCVData {
  time: string; // 'YYYY-MM-DD'
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Collection {
  id: string;
  name: string;
  icon: string;
  symbols: string[];
  createdAt: number;
}

// ─────────────────────────────────────────
// Stock Database
// ─────────────────────────────────────────

export const allStocks: Record<string, StockData> = {
  FPT: {
    symbol: 'FPT',
    companyName: 'CTCP FPT',
    exchange: 'HOSE',
    industry: 'Công nghệ thông tin',
    price: 168200,
    change: 2700,
    changePercent: 1.63,
    sections: [
      {
        id: 'foreign',
        title: 'Giao dịch nước ngoài',
        metrics: [
          { label: 'Khối lượng nước ngoài mua', value: '126,620' },
          { label: 'Khối lượng nước ngoài bán', value: '5,310' },
          { label: 'Room nước ngoài', value: '3,461,438,505' },
        ],
      },
      {
        id: 'market',
        title: 'Thông tin thị trường',
        metrics: [
          { label: 'Vốn hóa', value: '1,297,696Tỷ' },
          { label: '52 tuần', value: '29.00 - 190.00', type: 'range' },
          { label: '% chênh lệch', value: '1.62%', type: 'positive' },
          { label: 'KLTB 1 tuần', value: '5,069,935' },
          { label: 'KLTB 1 tháng', value: '6,791,311' },
        ],
      },
      {
        id: 'shares',
        title: 'Cổ phiếu',
        metrics: [
          { label: 'Khối lượng lưu hành', value: '7.71Tỷ' },
          { label: '% giao dịch', value: '0.02%' },
          { label: 'EPS (TTM)', value: '1,467.86' },
        ],
      },
      {
        id: 'valuation',
        title: 'Định giá',
        metrics: [
          { label: 'P/E (TTM)', value: '112.75' },
          { label: 'P/B', value: '8.64' },
          { label: 'P/S', value: '3.84' },
        ],
      },
      {
        id: 'dividend',
        title: 'Cổ tức & Lợi nhuận',
        metrics: [
          { label: 'ROE', value: '7.97' },
          { label: 'Cổ tức', value: '-0', type: 'negative' },
          { label: 'Tỷ lệ cổ tức', value: '-0.00%', type: 'negative' },
        ],
      },
    ],
  },
  VCB: {
    symbol: 'VCB',
    companyName: 'Ngân hàng TMCP Ngoại Thương VN',
    exchange: 'HOSE',
    industry: 'Ngân hàng',
    price: 86500,
    change: -500,
    changePercent: -0.57,
    sections: [
      {
        id: 'foreign',
        title: 'Giao dịch nước ngoài',
        metrics: [
          { label: 'Khối lượng nước ngoài mua', value: '312,450' },
          { label: 'Khối lượng nước ngoài bán', value: '198,200' },
          { label: 'Room nước ngoài', value: '1,245,000,000' },
        ],
      },
      {
        id: 'market',
        title: 'Thông tin thị trường',
        metrics: [
          { label: 'Vốn hóa', value: '423,568Tỷ' },
          { label: '52 tuần', value: '62.80 - 98.50', type: 'range' },
          { label: '% chênh lệch', value: '-0.57%', type: 'negative' },
          { label: 'KLTB 1 tuần', value: '3,245,100' },
          { label: 'KLTB 1 tháng', value: '4,128,700' },
        ],
      },
      {
        id: 'shares',
        title: 'Cổ phiếu',
        metrics: [
          { label: 'Khối lượng lưu hành', value: '4.89Tỷ' },
          { label: '% giao dịch', value: '0.04%' },
          { label: 'EPS (TTM)', value: '3,856.42' },
        ],
      },
      {
        id: 'valuation',
        title: 'Định giá',
        metrics: [
          { label: 'P/E (TTM)', value: '22.43' },
          { label: 'P/B', value: '3.12' },
          { label: 'P/S', value: '8.95' },
        ],
      },
      {
        id: 'dividend',
        title: 'Cổ tức & Lợi nhuận',
        metrics: [
          { label: 'ROE', value: '21.34' },
          { label: 'Cổ tức', value: '1,500', type: 'positive' },
          { label: 'Tỷ lệ cổ tức', value: '1.73%', type: 'positive' },
        ],
      },
    ],
  },
  MWG: {
    symbol: 'MWG',
    companyName: 'CTCP Đầu tư Thế Giới Di Động',
    exchange: 'HOSE',
    industry: 'Bán lẻ',
    price: 52400,
    change: 1200,
    changePercent: 2.34,
    sections: [
      {
        id: 'foreign',
        title: 'Giao dịch nước ngoài',
        metrics: [
          { label: 'Khối lượng nước ngoài mua', value: '89,230' },
          { label: 'Khối lượng nước ngoài bán', value: '45,100' },
          { label: 'Room nước ngoài', value: '892,300,000' },
        ],
      },
      {
        id: 'market',
        title: 'Thông tin thị trường',
        metrics: [
          { label: 'Vốn hóa', value: '75,456Tỷ' },
          { label: '52 tuần', value: '38.50 - 67.20', type: 'range' },
          { label: '% chênh lệch', value: '2.34%', type: 'positive' },
          { label: 'KLTB 1 tuần', value: '8,912,300' },
          { label: 'KLTB 1 tháng', value: '10,234,500' },
        ],
      },
      {
        id: 'shares',
        title: 'Cổ phiếu',
        metrics: [
          { label: 'Khối lượng lưu hành', value: '1.44Tỷ' },
          { label: '% giao dịch', value: '0.12%' },
          { label: 'EPS (TTM)', value: '2,345.67' },
        ],
      },
      {
        id: 'valuation',
        title: 'Định giá',
        metrics: [
          { label: 'P/E (TTM)', value: '22.35' },
          { label: 'P/B', value: '4.56' },
          { label: 'P/S', value: '0.89' },
        ],
      },
      {
        id: 'dividend',
        title: 'Cổ tức & Lợi nhuận',
        metrics: [
          { label: 'ROE', value: '18.92' },
          { label: 'Cổ tức', value: '500', type: 'positive' },
          { label: 'Tỷ lệ cổ tức', value: '0.95%', type: 'positive' },
        ],
      },
    ],
  },
  TCB: {
    symbol: 'TCB',
    companyName: 'Ngân hàng TMCP Kỹ Thương VN',
    exchange: 'HOSE',
    industry: 'Ngân hàng',
    price: 25800,
    change: 350,
    changePercent: 1.38,
    sections: [
      {
        id: 'foreign',
        title: 'Giao dịch nước ngoài',
        metrics: [
          { label: 'Khối lượng nước ngoài mua', value: '567,890' },
          { label: 'Khối lượng nước ngoài bán', value: '234,560' },
          { label: 'Room nước ngoài', value: '2,345,000,000' },
        ],
      },
      {
        id: 'market',
        title: 'Thông tin thị trường',
        metrics: [
          { label: 'Vốn hóa', value: '90,300Tỷ' },
          { label: '52 tuần', value: '18.90 - 32.40', type: 'range' },
          { label: '% chênh lệch', value: '1.38%', type: 'positive' },
          { label: 'KLTB 1 tuần', value: '12,456,000' },
          { label: 'KLTB 1 tháng', value: '15,678,000' },
        ],
      },
      {
        id: 'shares',
        title: 'Cổ phiếu',
        metrics: [
          { label: 'Khối lượng lưu hành', value: '3.5Tỷ' },
          { label: '% giao dịch', value: '0.08%' },
          { label: 'EPS (TTM)', value: '4,123.45' },
        ],
      },
      {
        id: 'valuation',
        title: 'Định giá',
        metrics: [
          { label: 'P/E (TTM)', value: '6.26' },
          { label: 'P/B', value: '1.23' },
          { label: 'P/S', value: '3.45' },
        ],
      },
      {
        id: 'dividend',
        title: 'Cổ tức & Lợi nhuận',
        metrics: [
          { label: 'ROE', value: '17.85' },
          { label: 'Cổ tức', value: '0' },
          { label: 'Tỷ lệ cổ tức', value: '0.00%' },
        ],
      },
    ],
  },
  VNM: {
    symbol: 'VNM',
    companyName: 'CTCP Sữa Việt Nam',
    exchange: 'HOSE',
    industry: 'Thực phẩm',
    price: 72300,
    change: -800,
    changePercent: -1.09,
    sections: [
      {
        id: 'foreign',
        title: 'Giao dịch nước ngoài',
        metrics: [
          { label: 'Khối lượng nước ngoài mua', value: '234,500' },
          { label: 'Khối lượng nước ngoài bán', value: '312,100' },
          { label: 'Room nước ngoài', value: '1,567,000,000' },
        ],
      },
      {
        id: 'market',
        title: 'Thông tin thị trường',
        metrics: [
          { label: 'Vốn hóa', value: '150,789Tỷ' },
          { label: '52 tuần', value: '58.20 - 82.50', type: 'range' },
          { label: '% chênh lệch', value: '-1.09%', type: 'negative' },
          { label: 'KLTB 1 tuần', value: '2,345,600' },
          { label: 'KLTB 1 tháng', value: '3,456,700' },
        ],
      },
      {
        id: 'shares',
        title: 'Cổ phiếu',
        metrics: [
          { label: 'Khối lượng lưu hành', value: '2.09Tỷ' },
          { label: '% giao dịch', value: '0.03%' },
          { label: 'EPS (TTM)', value: '3,890.12' },
        ],
      },
      {
        id: 'valuation',
        title: 'Định giá',
        metrics: [
          { label: 'P/E (TTM)', value: '18.59' },
          { label: 'P/B', value: '5.67' },
          { label: 'P/S', value: '2.56' },
        ],
      },
      {
        id: 'dividend',
        title: 'Cổ tức & Lợi nhuận',
        metrics: [
          { label: 'ROE', value: '29.45' },
          { label: 'Cổ tức', value: '3,000', type: 'positive' },
          { label: 'Tỷ lệ cổ tức', value: '4.15%', type: 'positive' },
        ],
      },
    ],
  },
  HPG: {
    symbol: 'HPG',
    companyName: 'CTCP Tập đoàn Hòa Phát',
    exchange: 'HOSE',
    industry: 'Thép & Vật liệu',
    price: 27650,
    change: 450,
    changePercent: 1.65,
    sections: [
      {
        id: 'foreign',
        title: 'Giao dịch nước ngoài',
        metrics: [
          { label: 'Khối lượng nước ngoài mua', value: '1,234,500' },
          { label: 'Khối lượng nước ngoài bán', value: '987,600' },
          { label: 'Room nước ngoài', value: '3,890,000,000' },
        ],
      },
      {
        id: 'market',
        title: 'Thông tin thị trường',
        metrics: [
          { label: 'Vốn hóa', value: '162,345Tỷ' },
          { label: '52 tuần', value: '21.30 - 33.80', type: 'range' },
          { label: '% chênh lệch', value: '1.65%', type: 'positive' },
          { label: 'KLTB 1 tuần', value: '18,345,000' },
          { label: 'KLTB 1 tháng', value: '22,456,000' },
        ],
      },
      {
        id: 'shares',
        title: 'Cổ phiếu',
        metrics: [
          { label: 'Khối lượng lưu hành', value: '5.87Tỷ' },
          { label: '% giao dịch', value: '0.15%' },
          { label: 'EPS (TTM)', value: '2,567.89' },
        ],
      },
      {
        id: 'valuation',
        title: 'Định giá',
        metrics: [
          { label: 'P/E (TTM)', value: '10.77' },
          { label: 'P/B', value: '1.89' },
          { label: 'P/S', value: '1.23' },
        ],
      },
      {
        id: 'dividend',
        title: 'Cổ tức & Lợi nhuận',
        metrics: [
          { label: 'ROE', value: '15.67' },
          { label: 'Cổ tức', value: '1,000', type: 'positive' },
          { label: 'Tỷ lệ cổ tức', value: '3.62%', type: 'positive' },
        ],
      },
    ],
  },
};

// Simple stock listing for search
export const stockList = Object.values(allStocks).map((s) => ({
  symbol: s.symbol,
  companyName: s.companyName,
  exchange: s.exchange,
  industry: s.industry,
  price: s.price,
  change: s.change,
  changePercent: s.changePercent,
}));

export const tabs = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'indicators', label: 'Chỉ số' },
  { id: 'technical', label: 'PTKT' },
  { id: 'financials', label: 'Tài chính' },
  { id: 'news', label: 'Tin tức' },
];

// ─────────────────────────────────────────
// Generate OHLCV data for charts
// ─────────────────────────────────────────

function generateOHLCV(basePrice: number, days: number): OHLCVData[] {
  const data: OHLCVData[] = [];
  let price = basePrice * 0.7;
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const volatility = price * 0.025;
    const open = price + (Math.random() - 0.48) * volatility;
    const close = open + (Math.random() - 0.47) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(2000000 + Math.random() * 15000000);

    price = close;

    data.push({
      time: date.toISOString().split('T')[0],
      open: Math.round(open / 100) * 100,
      high: Math.round(high / 100) * 100,
      low: Math.round(low / 100) * 100,
      close: Math.round(close / 100) * 100,
      volume,
    });
  }

  return data;
}

// Pre-generated OHLCV for each stock
const ohlcvCache: Record<string, OHLCVData[]> = {};

export function getOHLCV(symbol: string): OHLCVData[] {
  if (!ohlcvCache[symbol]) {
    const stock = allStocks[symbol];
    if (!stock) return [];
    ohlcvCache[symbol] = generateOHLCV(stock.price, 365);
  }
  return ohlcvCache[symbol];
}

// Default collections
export const defaultCollections: Collection[] = [
  {
    id: 'watchlist-default',
    name: 'Danh mục chính',
    icon: '⭐',
    symbols: ['FPT', 'VCB', 'MWG'],
    createdAt: Date.now(),
  },
  {
    id: 'banking',
    name: 'Ngân hàng',
    icon: '🏦',
    symbols: ['VCB', 'TCB'],
    createdAt: Date.now(),
  },
  {
    id: 'bluechip',
    name: 'Blue Chips',
    icon: '💎',
    symbols: ['FPT', 'VCB', 'VNM', 'HPG'],
    createdAt: Date.now(),
  },
];
