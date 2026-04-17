import type { OHLCVData } from '../data/mockData';

export interface TechnicalSignal {
  id: string;
  name: string;
  type: 'bullish' | 'bearish' | 'neutral';
  confidence: 'high' | 'medium' | 'low';
  description: string;
  startIndex: number;
  endIndex: number;
}

// Helper to calculate SMA
export function calculateSMA(data: OHLCVData[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result[i] = sum / period;
  }
  return result;
}

// Find local peaks
function findPeaks(data: OHLCVData[], lookback = 3, lookforward = 3): number[] {
  const peaks: number[] = [];
  for (let i = lookback; i < data.length - lookforward; i++) {
    let isPeak = true;
    const currentHigh = data[i].high;
    
    // Check backwards
    for (let j = 1; j <= lookback; j++) {
      if (data[i - j].high > currentHigh) { isPeak = false; break; }
    }
    // Check forwards
    if (isPeak) {
      for (let j = 1; j <= lookforward; j++) {
        if (data[i + j].high > currentHigh) { isPeak = false; break; }
      }
    }
    
    if (isPeak) peaks.push(i);
  }
  return peaks;
}

// Find local troughs
function findTroughs(data: OHLCVData[], lookback = 3, lookforward = 3): number[] {
  const troughs: number[] = [];
  for (let i = lookback; i < data.length - lookforward; i++) {
    let isTrough = true;
    const currentLow = data[i].low;
    
    for (let j = 1; j <= lookback; j++) {
      if (data[i - j].low < currentLow) { isTrough = false; break; }
    }
    if (isTrough) {
      for (let j = 1; j <= lookforward; j++) {
        if (data[i + j].low < currentLow) { isTrough = false; break; }
      }
    }
    if (isTrough) troughs.push(i);
  }
  return troughs;
}

// SMA Crossovers
export function detectSMACross(data: OHLCVData[]): TechnicalSignal[] {
  const signals: TechnicalSignal[] = [];
  if (data.length < 50) return signals;

  const sma20 = calculateSMA(data, 20);
  const sma50 = calculateSMA(data, 50);

  // Check last 10 days for crossovers
  for (let i = data.length - 10; i < data.length; i++) {
    const prev20 = sma20[i - 1];
    const prev50 = sma50[i - 1];
    const curr20 = sma20[i];
    const curr50 = sma50[i];

    if (prev20 < prev50 && curr20 >= curr50) {
      signals.push({
        id: `sc_bull_${i}`,
        name: 'Golden Cross (SMA20 cắt lên SMA50)',
        type: 'bullish',
        confidence: 'high',
        description: 'Đường trung bình ngắn hạn cắt lên dài hạn. Tín hiệu tăng giá trung dài hạn.',
        startIndex: i - 5,
        endIndex: i,
      });
    } else if (prev20 > prev50 && curr20 <= curr50) {
      signals.push({
        id: `sc_bear_${i}`,
        name: 'Death Cross (SMA20 cắt xuống SMA50)',
        type: 'bearish',
        confidence: 'high',
        description: 'Đường trung bình ngắn hạn cắt xuống dài hạn. Tín hiệu giảm giá trung dài hạn.',
        startIndex: i - 5,
        endIndex: i,
      });
    }
  }

  return signals;
}

// Engulfing Patterns
export function detectEngulfing(data: OHLCVData[]): TechnicalSignal[] {
  const signals: TechnicalSignal[] = [];
  if (data.length < 5) return signals;

  // Check last 10 days
  for (let i = data.length - 10; i < data.length; i++) {
    const prev = data[i - 1];
    const curr = data[i];

    const prevIsRed = prev.close < prev.open;
    const currIsGreen = curr.close > curr.open;
    const prevIsGreen = prev.close > prev.open;
    const currIsRed = curr.close < curr.open;

    // Bullish Engulfing
    if (prevIsRed && currIsGreen && curr.open <= prev.close && curr.close >= prev.open) {
      signals.push({
        id: `eng_bull_${i}`,
        name: 'Nến Nhấn Chìm Tăng (Bullish Engulfing)',
        type: 'bullish',
        confidence: 'medium',
        description: 'Thân nến tăng bao trùm hoàn toàn thân nến giảm trước đó. Lực mua áp đảo.',
        startIndex: i - 1,
        endIndex: i,
      });
    }
    // Bearish Engulfing
    else if (prevIsGreen && currIsRed && curr.open >= prev.close && curr.close <= prev.open) {
      signals.push({
        id: `eng_bear_${i}`,
        name: 'Nến Nhấn Chìm Giảm (Bearish Engulfing)',
        type: 'bearish',
        confidence: 'medium',
        description: 'Thân nến giảm bao trùm hoàn toàn thân nến tăng trước đó. Lực bán áp đảo.',
        startIndex: i - 1,
        endIndex: i,
      });
    }
  }

  return signals;
}

// Head and Shoulders (Bearish)
export function detectHeadAndShoulders(data: OHLCVData[]): TechnicalSignal[] {
  const signals: TechnicalSignal[] = [];
  const peaks = findPeaks(data, 5, 5);
  
  for (let i = 0; i < peaks.length - 2; i++) {
    const p1 = peaks[i];
    const p2 = peaks[i + 1];
    const p3 = peaks[i + 2];
    
    const h1 = data[p1].high;
    const h2 = data[p2].high;
    const h3 = data[p3].high;
    
    if (h2 > h1 && h2 > h3) {
      const shoulderRatio = Math.max(h1, h3) / Math.min(h1, h3);
      if (shoulderRatio < 1.08) { // Loosened to 8% margin
        if (data.length - p3 < 60) {
          signals.push({
            id: `hs_${p1}_${p3}`,
            name: 'Mô hình Vai Đầu Vai',
            type: 'bearish',
            confidence: 'high',
            description: 'Phát hiện cấu trúc Vai Đầu Vai kinh điển. Thường báo hiệu xu hướng đảo chiều giảm.',
            startIndex: p1 - 5,
            endIndex: p3 + 5,
          });
        }
      }
    }
  }
  return signals;
}

// Double Top/Bottom
export function detectDoublePatterns(data: OHLCVData[]): TechnicalSignal[] {
  const signals: TechnicalSignal[] = [];
  
  // Peaks (Double Top)
  const peaks = findPeaks(data, 5, 5);
  for (let i = 0; i < peaks.length - 1; i++) {
    const p1 = peaks[i];
    const p2 = peaks[i + 1];
    if (data.length - p2 > 30) continue; // Only recent

    const ratio = Math.max(data[p1].high, data[p2].high) / Math.min(data[p1].high, data[p2].high);
    if (ratio < 1.03) { // 3% margin
      signals.push({
        id: `dt_${p1}_${p2}`,
        name: 'Mô hình Hai Đỉnh',
        type: 'bearish',
        confidence: 'medium',
        description: 'Hai đỉnh liền kề có chiều cao tương đương. Kháng cự mạnh ở vùng đỉnh.',
        startIndex: p1 - 5,
        endIndex: p2 + 5,
      });
    }
  }

  // Troughs (Double Bottom)
  const troughs = findTroughs(data, 5, 5);
  for (let i = 0; i < troughs.length - 1; i++) {
    const t1 = troughs[i];
    const t2 = troughs[i + 1];
    if (data.length - t2 > 30) continue;

    const ratio = Math.max(data[t1].low, data[t2].low) / Math.min(data[t1].low, data[t2].low);
    if (ratio < 1.03) {
      signals.push({
        id: `db_${t1}_${t2}`,
        name: 'Mô hình Hai Đáy',
        type: 'bullish',
        confidence: 'medium',
        description: 'Hai đáy liền kề có độ sâu tương đương. Hỗ trợ cứng ở vùng đáy.',
        startIndex: t1 - 5,
        endIndex: t2 + 5,
      });
    }
  }

  return signals;
}

export function detectChristmasTree(data: OHLCVData[]): TechnicalSignal[] {
  const signals: TechnicalSignal[] = [];
  if (data.length < 40) return signals;
  
  const recentData = data.slice(-40);
  let maxIdx = 0;
  for (let i = 1; i < recentData.length; i++) {
    if (recentData[i].high > recentData[maxIdx].high) maxIdx = i;
  }
  
  if (maxIdx > 10 && maxIdx < recentData.length - 5) {
    const startPrice = recentData[maxIdx - 10].close;
    const peakPrice = recentData[maxIdx].high;
    const endPrice = recentData[recentData.length - 1].close;
    
    if ((peakPrice - startPrice) / startPrice > 0.3) {
      if ((peakPrice - endPrice) / peakPrice > 0.15) {
        signals.push({
          id: `ctree_${data.length}`,
          name: 'Cây Thông (Xả hàng)',
          type: 'bearish',
          confidence: 'medium',
          description: 'Cổ phiếu tăng dốc đứng và bắt đầu giảm mạnh. Cảnh báo xả hàng.',
          startIndex: data.length - 40 + maxIdx - 10,
          endIndex: data.length - 1,
        });
      }
    }
  }
  return signals;
}

export function analyzePatterns(data: OHLCVData[]): TechnicalSignal[] {
  const allSignals = [
    ...detectSMACross(data),
    ...detectEngulfing(data),
    ...detectHeadAndShoulders(data),
    ...detectDoublePatterns(data),
    ...detectChristmasTree(data),
  ];
  
  // Sort by recent first
  return allSignals.sort((a, b) => b.endIndex - a.endIndex);
}
