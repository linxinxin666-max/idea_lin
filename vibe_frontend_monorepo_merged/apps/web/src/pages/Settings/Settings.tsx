import { Card, Typography, Switch, Space } from '@douyinfe/semi-ui';
import { IconMoon, IconSun } from '@douyinfe/semi-icons';
import { useAppStore } from '../../stores/useAppStore';
import './Settings.css';

export function Settings() {
  const { theme, toggleTheme } = useAppStore();

  return (
    <div className="settings-page">
      <div className="page-header">
        <h2 className="page-title">设置</h2>
      </div>

      <Card className="settings-card">
        <Typography.Title heading={4} style={{ marginBottom: 24 }}>
          外观设置
        </Typography.Title>
        
        <div className="setting-item">
          <div className="setting-info">
            <div className="setting-title">深色模式</div>
            <div className="setting-desc">切换应用的深色/浅色主题外观</div>
          </div>
          <div className="setting-action">
            <Space>
              <IconSun style={{ color: theme === 'light' ? 'var(--semi-color-warning)' : 'var(--semi-color-text-2)' }} />
              <Switch 
                checked={theme === 'dark'} 
                onChange={toggleTheme}
                aria-label="暗色模式切换"
              />
              <IconMoon style={{ color: theme === 'dark' ? 'var(--semi-color-primary)' : 'var(--semi-color-text-2)' }} />
            </Space>
          </div>
        </div>
      </Card>
    </div>
  );
}
