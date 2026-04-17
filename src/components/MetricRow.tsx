import './MetricRow.css';
import type { StockMetric } from '../data/mockData';

interface MetricRowProps {
  metric: StockMetric;
  animationDelay?: number;
}

export function MetricRow({ metric, animationDelay = 0 }: MetricRowProps) {
  const valueColorClass =
    metric.type === 'positive'
      ? 'metric-value--positive'
      : metric.type === 'negative'
        ? 'metric-value--negative'
        : metric.type === 'range'
          ? 'metric-value--range'
          : '';

  return (
    <div
      className="metric-row"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <span className="metric-label">{metric.label}</span>
      <span className={`metric-value ${valueColorClass}`}>{metric.value}</span>
    </div>
  );
}
