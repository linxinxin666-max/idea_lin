import { Layout, Avatar, Dropdown, Button } from '@douyinfe/semi-ui';
import { IconBell, IconExit } from '@douyinfe/semi-icons';
import { useAppStore } from '../../stores/useAppStore';
import { useSSO } from '../../hooks/useSSO';
import agentCallLogo from '../../../public/AgentCall_transparent.png';
import './TopBar.css';

const { Header } = Layout;

export function TopBar() {
  const { userInfo: ssoUserInfo, logout } = useSSO();

  const userMenu = (
    <Dropdown.Menu>
      <Dropdown.Item disabled>
        <div className="user-info-item">
          <div className="user-name">{ssoUserInfo?.display_name || ssoUserInfo?.username || '用户'}</div>
          <div className="user-email">{ssoUserInfo?.email || 'user@bytedance.com'}</div>
        </div>
      </Dropdown.Item>
      <Dropdown.Divider />
      <Dropdown.Item onClick={logout}>
        <IconExit style={{ marginRight: 8 }} />
        退出登录
      </Dropdown.Item>
    </Dropdown.Menu>
  );

  return (
    <Header className="top-bar">
      <div className="top-bar-left">
        <img src={agentCallLogo} alt="AgentCall" className="product-logo" />
      </div>
      <div className="top-bar-right">
        <Button
          theme="borderless"
          icon={<IconBell size="large" />}
          style={{ marginRight: 12 }}
        />
        <Dropdown
          trigger="click"
          position="bottomRight"
          render={userMenu}
        >
          <Avatar
            size="small"
            src={ssoUserInfo?.avatar_url}
            style={{ cursor: 'pointer', backgroundColor: 'var(--semi-color-primary)' }}
          >
            {(ssoUserInfo?.display_name?.charAt(0) || ssoUserInfo?.username?.charAt(0) || 'U').toUpperCase()}
          </Avatar>
        </Dropdown>
      </div>
    </Header>
  );
}
