import { useState, useEffect } from 'react';
import { fetchFundamental } from '../services/api';
import type { FundamentalAnalysis as FundamentalAnalysisType } from '../services/api';
import './FundamentalAnalysis.css';

interface FundamentalAnalysisProps {
  symbol: string;
}

function fmt(n: number | null | undefined, decimals = 2) {
  if (n == null) return '—';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: decimals }) + ' Tỷ';
  return n.toLocaleString('vi-VN', { maximumFractionDigits: decimals });
}

export function FundamentalAnalysis({ symbol }: FundamentalAnalysisProps) {
  const [data, setData] = useState<FundamentalAnalysisType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchFundamental(symbol)
      .then(res => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [symbol]);

  if (loading) {
    return <div className="fundamental-loading">Đang phân tích cơ bản...</div>;
  }

  if (!data || !data.dataAvailable) {
    return (
      <div className="fundamental-empty">
        <p>Hiện chưa có dữ liệu tài chính cho mã {symbol}</p>
      </div>
    );
  }

  const { metrics } = data;

  const renderMetric = (label: string, value: string | null | undefined, hint: string, highlight?: 'positive' | 'negative' | 'neutral') => (
    <div className={`fundamental-card ${highlight ? `fundamental-card--${highlight}` : ''}`} title={hint}>
      <span className="fundamental-card__label">{label}</span>
      <span className="fundamental-card__value">{value ?? '—'}</span>
    </div>
  );

  return (
    <div className="fundamental">
      <div className="fundamental__header">
        <h3>Chỉ số Cơ bản & Định giá</h3>
        <p>Tự động tổng hợp số liệu TTM và Báo cáo tài chính gần nhất</p>
      </div>

      <div className="fundamental__grid">
        {renderMetric('P/E', fmt(metrics.pe), 'Hệ số giá trên thu nhập. P/E thấp thường định giá rẻ.', metrics.pe && metrics.pe > 20 ? 'negative' : 'neutral')}
        {renderMetric('EPS (VNĐ)', fmt(metrics.eps, 0), 'Lợi nhuận trên mỗi cổ phiếu.', metrics.eps && metrics.eps > 0 ? 'positive' : 'negative')}
        {renderMetric('PEG', fmt(metrics.peg), 'P/E chia cho tốc độ tăng trưởng EPS. Nhỏ hơn 1 là tốt.', metrics.peg && metrics.peg < 1 ? 'positive' : 'neutral')}
        
        {renderMetric('P/B', fmt(metrics.pb), 'Giá trên giá trị sổ sách. Dưới 1 có thể đang bị định giá thấp.', metrics.pb && metrics.pb < 1.5 ? 'positive' : 'neutral')}
        {renderMetric('BVPS (VNĐ)', fmt(metrics.bvps, 0), 'Giá trị sổ sách trên mỗi cổ phiếu.')}
        {renderMetric('Tỉ suất Cổ tức', metrics.dividendYield ? `${fmt(metrics.dividendYield)}%` : '—', 'Lợi nhuận từ cổ tức chia cho giá cổ phiếu.', metrics.dividendYield && metrics.dividendYield > 5 ? 'positive' : 'neutral')}

        {renderMetric('ROE', metrics.roe ? `${fmt(metrics.roe * 100)}%` : '—', 'Lợi nhuận trên vốn chủ sở hữu. > 15% là xuất sắc.', metrics.roe && metrics.roe > 0.15 ? 'positive' : 'neutral')}
        {renderMetric('ROA', metrics.roa ? `${fmt(metrics.roa * 100)}%` : '—', 'Lợi nhuận trên tổng tài sản. Đo lường hiệu quả sử dụng tài sản.')}
        {renderMetric('Biên LN Ròng (ROS)', metrics.ros ? `${fmt(metrics.ros * 100)}%` : '—', 'Tỷ suất lợi nhuận ròng.', metrics.ros && metrics.ros > 0.1 ? 'positive' : 'neutral')}

        {renderMetric('Nợ / Vốn CSH', fmt(metrics.debtToEquity), 'Tỷ lệ Nợ trên Vốn chủ sở hữu. Càng cao rủi ro tài chính càng lớn.', metrics.debtToEquity && metrics.debtToEquity > 1.5 ? 'negative' : 'neutral')}
        {renderMetric('DAR', metrics.dar ? `${fmt(metrics.dar * 100)}%` : '—', 'Tỷ lệ nợ trên tổng tài sản.')}
        {renderMetric('Tăng trưởng EPS', metrics.epsGrowthRate ? `${fmt(metrics.epsGrowthRate)}%` : '—', 'Tăng trưởng EPS so với năm trước.', metrics.epsGrowthRate && metrics.epsGrowthRate > 0 ? 'positive' : 'negative')}
      </div>
      
      {/* Historical charts could be added here later */}
    </div>
  );
}
