import { Card } from '@douyinfe/semi-ui';
import { IconArrowUp, IconArrowDown } from '@douyinfe/semi-icons';
import './MetricCard.css';

interface MetricTrend {
  direction: 'up' | 'down';
  value: string;
}

interface MetricCardProps {
  icon: string;
  title: string;
  value: string | number;
  trend?: MetricTrend;
  loading?: boolean;
}

export function MetricCard({ icon, title, value, trend }: MetricCardProps) {
  return (
    <Card className="metric-card" bodyStyle={{ padding: '20px' }}>
      <div className="metric-header">
        <span className="metric-icon">{icon}</span>
        <span className="metric-title">{title}</span>
      </div>
      <div className="metric-value">{value}</div>
      {trend && (
        <div className={`metric-trend ${trend.direction}`}>
          {trend.direction === 'up' ? (
            <IconArrowUp style={{ marginRight: 4 }} />
          ) : (
            <IconArrowDown style={{ marginRight: 4 }} />
          )}
          <span>{trend.value}</span>
        </div>
      )}
    </Card>
  );
}
