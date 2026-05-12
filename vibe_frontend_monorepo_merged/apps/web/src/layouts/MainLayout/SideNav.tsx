import { Nav, Switch, Tooltip } from '@douyinfe/semi-ui';
import {
  IconEdit,
  IconList,
  IconHistory,
  IconSetting,
  IconChevronLeft,
  IconChevronRight,
  IconBookStroked,
} from '@douyinfe/semi-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../stores/useAppStore';
import { useCreateStore } from '../../stores/useCreateStore';
import './SideNav.css';

interface SideNavProps {
  collapsed: boolean;
}

const menuItems = [
  { key: 'create', label: '剧本创建', icon: <IconEdit />, path: '/self_help/agent_call/create' },
  { key: 'list', label: '剧本管理', icon: <IconList />, path: '/self_help/agent_call/list' },
  { key: 'data', label: '剧本数据', icon: <IconHistory />, path: '/self_help/agent_call/data' },
  { key: 'knowledge', label: '知识库管理', icon: <IconBookStroked />, path: '/self_help/agent_call/knowledge' },
];

const bottomMenuItems = [
  { key: 'settings', label: '设置', icon: <IconSetting />, path: '/self_help/agent_call/settings' },
];

const version = '0.1.0';

export function SideNav({ collapsed }: SideNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { useMockData, toggleMockData } = useAppStore();
  const { resetForm, setCurrentStep } = useCreateStore();

  const getCurrentKey = () => {
    const path = location.pathname;
    for (const item of [...menuItems, ...bottomMenuItems]) {
      if (path.startsWith(item.path)) {
        return item.key;
      }
    }
    return 'list';
  };

  const handleNavClick = (path: string) => {
    if (path === '/self_help/agent_call/create') {
      resetForm();
      setCurrentStep(0);
    }
    navigate(path);
  };

  return (
    <div className={`side-nav ${collapsed ? 'collapsed' : ''}`}>
      <div className="nav-menu">
        {menuItems.map((item) => (
          <Tooltip key={item.key} content={item.label} position="right" disabled={!collapsed}>
            <div
              className={`nav-item ${getCurrentKey() === item.key ? 'active' : ''}`}
              onClick={() => handleNavClick(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-text">{item.label}</span>}
            </div>
          </Tooltip>
        ))}
      </div>
      
      <div className="nav-bottom">
        <div className="nav-divider" />
        {bottomMenuItems.map((item) => (
          <Tooltip key={item.key} content={item.label} position="right" disabled={!collapsed}>
            <div
              className={`nav-item ${getCurrentKey() === item.key ? 'active' : ''}`}
              onClick={() => handleNavClick(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-text">{item.label}</span>}
            </div>
          </Tooltip>
        ))}
        {!collapsed && <div className="version">v{version}</div>}
      </div>
    </div>
  );
}
