import type { TechnicalSignal } from '../utils/technicalPatterns';
import './TechnicalSignals.css';

interface TechnicalSignalsProps {
  signals: TechnicalSignal[];
}

export function TechnicalSignals({ signals }: TechnicalSignalsProps) {
  const bullishCount = signals.filter(s => s.type === 'bullish').length;
  const bearishCount = signals.filter(s => s.type === 'bearish').length;

  return (
    <div className="tech-signals">
      <div className="tech-signals__header">
        <h4>Nhận diện Mẫu hình & Tín hiệu</h4>
        <div className="tech-signals__summary">
          <span className="badge badge-bullish">{bullishCount} Bullish</span>
          <span className="badge badge-bearish">{bearishCount} Bearish</span>
        </div>
      </div>
      
      {signals.length === 0 ? (
        <div className="tech-signals__empty">
          Không phát hiện mẫu hình kỹ thuật đáng chú ý nào trong 30 ngày qua.
        </div>
      ) : (
        <div className="tech-signals__list">
          {signals.map(sig => (
            <div key={sig.id} className={`tech-signal-card type-${sig.type}`}>
              <div className="tech-signal-card__header">
                <span className="tech-signal-card__name">{sig.name}</span>
                <span className={`tech-signal-card__conf conf-${sig.confidence}`}>
                  Độ tin cậy: {sig.confidence === 'high' ? 'Cao' : sig.confidence === 'medium' ? 'Trung bình' : 'Thấp'}
                </span>
              </div>
              <p className="tech-signal-card__desc">{sig.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
