/**
 * API 基础配置
 * Docker环境使用相对路径，开发环境使用完整URL
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

/**
 * API 请求封装
 */
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // 从 localStorage 读取 token
    this.token = localStorage.getItem('admin_token');
  }

  /**
   * 设置 token
   */
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('admin_token', token);
    } else {
      localStorage.removeItem('admin_token');
    }
  }

  /**
   * 获取 token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * 通用请求方法
   */
  private async request<T>(
     endpoint: string,
     options: RequestInit = {}
  ): Promise<T> {
     const url = `${this.baseUrl}${endpoint}`;

     const headers: HeadersInit = {
       ...options.headers,
     };

     // 只有在有body时才设置Content-Type
     if (options.body) {
       headers['Content-Type'] = 'application/json';
     }

     // 添加认证头
     if (this.token) {
       headers['Authorization'] = `Bearer ${this.token}`;
     }

     console.log(`[API] ${options.method || 'GET'} ${url}`, options.body ? JSON.parse(options.body as string) : '');

     try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log(`[API] Response status:`, response.status);

      // 处理 401 未授权
      if (response.status === 401) {
        this.setToken(null);
        throw new Error('未授权，请重新登录');
      }

      // 检查HTTP状态码
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // 解析 JSON 响应
      const data = await response.json();

      // 检查业务逻辑错误
      if (!data.success) {
        throw new Error(data.message || '请求失败');
      }

      return data;
    } catch (error) {
      console.error(`[API] Request failed:`, error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络请求失败');
    }
  }

  /**
   * GET 请求
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST 请求
   */
  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT 请求
   */
  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE 请求
   */
  async delete<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

// 创建 API 客户端实例
export const api = new ApiClient(API_BASE_URL);
