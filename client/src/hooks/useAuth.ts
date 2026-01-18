import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { authApi } from '../api';

/**
 * 认证状态管理 Hook
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化：检查是否有 token
  useEffect(() => {
    const token = api.getToken();
    if (token) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  /**
   * 登录
   */
  const login = async (password: string): Promise<boolean> => {
    setError(null);
    try {
      const response = await authApi.login({ password });
      if (response.success && response.token) {
        api.setToken(response.token);
        setIsAuthenticated(true);
        return true;
      }
      setError(response.message || '登录失败');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
      return false;
    }
  };

  /**
   * 登出
   */
  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // 忽略登出错误
    } finally {
      api.setToken(null);
      setIsAuthenticated(false);
    }
  };

  return {
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
  };
}
