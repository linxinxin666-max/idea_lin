import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { SideNav } from './SideNav';
import { useAppStore } from '../../stores/useAppStore';
import './MainLayout.css';

export function MainLayout() {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="main-layout">
      <TopBar />
      <div className="layout-body">
        <SideNav collapsed={sidebarCollapsed} />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
