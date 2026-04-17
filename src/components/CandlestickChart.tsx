import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
} from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, HistogramData, Time } from 'lightweight-charts';
import { fetchPrices } from '../services/api';
import { TechnicalSignals } from './TechnicalSignals';
import { analyzePatterns } from '../utils/technicalPatterns';
import type { TechnicalSignal } from '../utils/technicalPatterns';
import './CandlestickChart.css';

interface CandlestickChartProps {
  symbol: string;
}

type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y';

function calculateSMA(data: { close: number; time: string }[], period: number) {
  const result: { time: string; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
}

const TIME_RANGES: { key: TimeRange; label: string; days: number }[] = [
  { key: '1D', label: '1 ngày', days: 2 }, 
  { key: '1W', label: '1 tuần', days: 7 },
  { key: '1M', label: '1 tháng', days: 30 },
  { key: '3M', label: '3 tháng', days: 90 },
  { key: '6M', label: '6 tháng', days: 180 },
  { key: '1Y', label: '1 năm', days: 365 },
];

export function CandlestickChart({ symbol }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const sma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [timeRange, setTimeRange] = useState<TimeRange>('3M');
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [signals, setSignals] = useState<TechnicalSignal[]>([]);

  // Create chart on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94A3B8',
        fontFamily: "'Inter', sans-serif",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: {
        vertLine: { color: 'rgba(59,130,246,0.3)', labelBackgroundColor: '#3B82F6' },
        horzLine: { color: 'rgba(59,130,246,0.3)', labelBackgroundColor: '#3B82F6' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.06)',
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        timeVisible: false,
      },
      width: containerRef.current.clientWidth,
      height: 400,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#34D399',
      downColor: '#F87171',
      borderUpColor: '#34D399',
      borderDownColor: '#F87171',
      wickUpColor: '#34D399',
      wickDownColor: '#F87171',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    const sma20Series = chart.addSeries(LineSeries, {
      color: '#3B82F6',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const sma50Series = chart.addSeries(LineSeries, {
      color: '#FBBF24',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    sma20SeriesRef.current = sma20Series;
    sma50SeriesRef.current = sma50Series;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Fetch data
  useEffect(() => {
    let isMounted = true;
    
    async function loadData() {
      if (!symbol || !candleSeriesRef.current || !volumeSeriesRef.current || !sma20SeriesRef.current || !sma50SeriesRef.current) return;
      try {
        const prices = await fetchPrices(symbol);
        if (!isMounted) return;

        const rangeConfig = TIME_RANGES.find((r) => r.key === timeRange);
        const days = Math.min(rangeConfig?.days ?? 180, prices.length);
        
        const fullData = prices.map((p: any) => ({
          time: p.date,
          open: p.open,
          high: p.high,
          low: p.low,
          close: p.close,
          volume: p.volume
        }));

        // SMA calculated on FULL data
        const sma20Full = calculateSMA(fullData, 20);
        const sma50Full = calculateSMA(fullData, 50);

        const dataToPlot = fullData.slice(-days);

        const detectedSignals = analyzePatterns(fullData); // Analyze on ALL data
        setSignals(detectedSignals);

        const candles: CandlestickData<Time>[] = dataToPlot.map((d: any) => ({
          time: d.time as Time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));

        const volumes: HistogramData<Time>[] = dataToPlot.map((d: any) => ({
          time: d.time as Time,
          value: d.volume,
          color: d.close >= d.open ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)',
        }));

        candleSeriesRef.current.setData(candles);
        volumeSeriesRef.current.setData(volumes);

        // SMA sliced appropriately
        const sma20Data = sma20Full.slice(-days);
        const sma50Data = sma50Full.slice(-days);
        
        sma20SeriesRef.current.setData(
          showSMA20 ? sma20Data.map((d: any) => ({ time: d.time as Time, value: d.value })) : []
        );
        sma50SeriesRef.current.setData(
          showSMA50 ? sma50Data.map((d: any) => ({ time: d.time as Time, value: d.value })) : []
        );

        chartRef.current?.timeScale().fitContent();
      } catch (e) {
        console.error('Failed to load chart prices:', e);
      }
    }
    
    loadData();
    return () => { isMounted = false; };
  }, [symbol, timeRange, showSMA20, showSMA50]);

  return (
    <div className="chart-container">
      <div className="chart-toolbar">
        <div className="chart-toolbar__ranges">
          {TIME_RANGES.map((r) => (
            <button
              key={r.key}
              className={`chart-range-btn ${timeRange === r.key ? 'chart-range-btn--active' : ''}`}
              onClick={() => setTimeRange(r.key)}
            >
              {r.key}
            </button>
          ))}
        </div>
        <div className="chart-toolbar__indicators">
          <button
            className={`chart-indicator-btn ${showSMA20 ? 'chart-indicator-btn--active' : ''}`}
            style={{ '--indicator-color': '#3B82F6' } as React.CSSProperties}
            onClick={() => setShowSMA20(!showSMA20)}
          >
            SMA 20
          </button>
          <button
            className={`chart-indicator-btn ${showSMA50 ? 'chart-indicator-btn--active' : ''}`}
            style={{ '--indicator-color': '#FBBF24' } as React.CSSProperties}
            onClick={() => setShowSMA50(!showSMA50)}
          >
            SMA 50
          </button>
        </div>
      </div>
      <div className="chart-wrapper" ref={containerRef} />
      <TechnicalSignals signals={signals} />
    </div>
  );
}
