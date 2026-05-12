// 字节 SSO 登录钩子
import { useState, useEffect } from 'react';

// 定义用户信息类型
export interface SSOUserInfo {
  username: string;
  email: string;
  avatar_url: string;
  organization: string;
  display_name?: string;
}

// 检查是否为本地环境
const isLocalhost = () => {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

// 模拟 SSO 登录函数（实际项目中使用字节的 getJwtUserInfo）
async function getByteDanceUserInfo(env: string): Promise<SSOUserInfo> {
  // 实际项目中使用：
  // import { getJwtUserInfo } from "@bytecloud/common-lib";
  // return await getJwtUserInfo(env);
  
  // 模拟 API 调用延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 返回模拟用户信息
  return {
    username: 'test_user',
    email: 'test_user@bytedance.com',
    avatar_url: '',
    organization: 'Engineering',
    display_name: '测试用户'
  };
}

export function useSSO() {
  const [userInfo, setUserInfo] = useState<SSOUserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化登录
  const initSSO = async () => {
    setLoading(true);
    setError(null);
    try {
      // 检查是否为本地环境
      if (isLocalhost()) {
        // 本地环境直接使用 mock 数据
        const mockInfo: SSOUserInfo = {
          username: 'local_test_user',
          email: 'local_test@bytedance.com',
          avatar_url: '',
          organization: 'Local Engineering',
          display_name: '本地测试用户'
        };
        setUserInfo(mockInfo);
        localStorage.setItem('sso_user_info', JSON.stringify(mockInfo));
      } else {
        // 非本地环境使用字节 SSO 登录
        const info = await getByteDanceUserInfo('online');
        setUserInfo(info);
        localStorage.setItem('sso_user_info', JSON.stringify(info));
      }
    } catch (err) {
      setError('SSO 登录失败，请重试');
      console.error('SSO 登录失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 登出函数
  const logout = () => {
    setUserInfo(null);
    localStorage.removeItem('sso_user_info');
    // 实际项目中可以调用字节 SSO 的登出接口
    window.location.reload();
  };

  // 初始化时检查本地存储的用户信息或尝试 SSO 登录
  useEffect(() => {
    const storedUserInfo = localStorage.getItem('sso_user_info');
    if (storedUserInfo) {
      try {
        setUserInfo(JSON.parse(storedUserInfo));
        setLoading(false);
      } catch (err) {
        localStorage.removeItem('sso_user_info');
        initSSO();
      }
    } else {
      initSSO();
    }
    setLoading(false);
  }, []);

  return {
    userInfo,
    loading,
    error,
    logout,
    refresh: initSSO
  };
}
