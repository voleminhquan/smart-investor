import { MetricRow } from './MetricRow';
import './IndicatorSection.css';
import type { MetricSection } from '../data/mockData';

interface IndicatorSectionProps {
  section: MetricSection;
  sectionIndex?: number;
}

export function IndicatorSection({ section, sectionIndex = 0 }: IndicatorSectionProps) {
  return (
    <div
      className="indicator-section"
      style={{ animationDelay: `${sectionIndex * 80}ms` }}
    >
      {section.title && (
        <div className="indicator-section__header">
          <h3 className="indicator-section__title">{section.title}</h3>
        </div>
      )}
      <div className="indicator-section__body">
        {section.metrics.map((metric, i) => (
          <MetricRow
            key={metric.label}
            metric={metric}
            animationDelay={sectionIndex * 80 + i * 50}
          />
        ))}
      </div>
    </div>
  );
}
