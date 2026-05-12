// 受保护的路由组件
import { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSSO } from '../hooks/useSSO';
import { Spin } from '@arco-design/web-react';

// 检查是否为本地环境
const isLocalhost = () => {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

interface ProtectedRouteProps {
  children?: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { userInfo, loading } = useSSO();

  // 本地环境下跳过登录验证
  if (isLocalhost()) {
    return children || <Outlet />;
  }

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100%'
      }}>
        <Spin size={32} />
      </div>
    );
  }

  // 如果用户未登录，重定向到登录页面
  if (!userInfo) {
    return <Navigate to="/self_help/login" replace />;
  }

  // 如果有子组件，渲染子组件，否则渲染 Outlet
  return children || <Outlet />;
}
