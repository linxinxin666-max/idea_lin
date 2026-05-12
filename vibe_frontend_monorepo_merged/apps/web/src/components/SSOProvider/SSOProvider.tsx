import { useEffect } from 'react';
import { useSSO } from '../../hooks/useSSO';
import { Spin } from '@douyinfe/semi-ui';

interface SSOProviderProps {
  children: React.ReactNode;
}

export function SSOProvider({ children }: SSOProviderProps) {
  const { userInfo, loading, error, refresh } = useSSO();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
        <div style={{ marginLeft: 16 }}>正在登录...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>
        <button onClick={refresh} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          重试
        </button>
      </div>
    );
  }

  if (!userInfo) {
    return null;
  }

  return <>{children}</>;
}