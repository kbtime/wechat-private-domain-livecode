import { api } from './client';

export { api };
import type {
  LoginRequest,
  LoginResponse,
  LiveCode,
  CreateLiveCodeRequest,
  UpdateLiveCodeRequest,
  ApiResponse,
  Statistics,
  UploadResult,
  Domain,
  DomainPoolConfig,
  DomainPoolStatistics,
  AddDomainRequest,
  UpdateDomainRequest,
  UpdatePoolConfigRequest,
  HealthCheckResult,
  DomainConfig,
  UpdateDomainConfigRequest,
  BindPrimaryDomainRequest,
  UnbindPrimaryDomainRequest,
  DomainBindingInfo
} from '../types';

/**
 * 认证相关 API
 */
export const authApi = {
  /**
   * 登录
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    return api.post<LoginResponse>('/api/admin/login', data);
  },

  /**
   * 登出
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    return api.post('/api/admin/logout');
  },
};

/**
 * 活码管理 API
 */
export const liveCodeApi = {
  /**
   * 获取所有活码
   */
  async getAll(): Promise<ApiResponse<LiveCode[]>> {
    return api.get<ApiResponse<LiveCode[]>>('/api/admin/live-codes');
  },

  /**
   * 获取单个活码详情
   */
  async getById(id: string): Promise<ApiResponse<LiveCode>> {
    return api.get<ApiResponse<LiveCode>>(`/api/admin/live-codes/${id}`);
  },

  /**
   * 创建新活码
   */
  async create(data: CreateLiveCodeRequest): Promise<ApiResponse<LiveCode>> {
    return api.post<ApiResponse<LiveCode>>('/api/admin/live-codes', data);
  },

  /**
   * 更新活码
   */
  async update(id: string, data: UpdateLiveCodeRequest): Promise<ApiResponse<LiveCode>> {
    return api.put<ApiResponse<LiveCode>>(`/api/admin/live-codes/${id}`, data);
  },

  /**
   * 删除活码
   */
  async delete(id: string): Promise<ApiResponse> {
    return api.delete<ApiResponse>(`/api/admin/live-codes/${id}`);
  },

  /**
   * 获取推广码
   */
  async getPromotionCode(id: string): Promise<ApiResponse<{ shortUrl: string; qrCode: string }>> {
    return api.get<ApiResponse<{ shortUrl: string; qrCode: string }>>(
      `/api/admin/live-codes/${id}/promotion-code`
    );
  },

  /**
   * 获取数据统计
   */
  async getStatistics(id: string): Promise<ApiResponse<Statistics>> {
    return api.get<ApiResponse<Statistics>>(
      `/api/admin/live-codes/${id}/statistics`
    );
  },

  /**
   * 获取活码的域名配置
   */
  async getDomainConfig(id: string): Promise<ApiResponse<DomainConfig>> {
    return api.get<ApiResponse<DomainConfig>>(
      `/api/admin/live-codes/${id}/domain-config`
    );
  },

  /**
   * 更新域名配置（备用域名、策略等）
   */
  async updateDomainConfig(
    id: string,
    data: UpdateDomainConfigRequest
  ): Promise<ApiResponse<DomainConfig>> {
    return api.put<ApiResponse<DomainConfig>>(
      `/api/admin/live-codes/${id}/domain-config`,
      data
    );
  },

  /**
   * 绑定主域名（不可逆操作）
   */
  async bindPrimaryDomain(
    id: string,
    data: BindPrimaryDomainRequest
  ): Promise<ApiResponse<DomainConfig>> {
    return api.post<ApiResponse<DomainConfig>>(
      `/api/admin/live-codes/${id}/domain-config/primary`,
      data
    );
  },

  /**
   * 解绑主域名（仅管理员，需强制确认）
   */
  async unbindPrimaryDomain(
    id: string,
    data: UnbindPrimaryDomainRequest
  ): Promise<ApiResponse<DomainConfig>> {
    return api.delete<ApiResponse<DomainConfig>>(
      `/api/admin/live-codes/${id}/domain-config/primary`,
      data
    );
  },
};

/**
 * 文件上传 API
 */
export const uploadApi = {
  /**
   * 上传文件到 OSS
   * @param file File 对象
   * @returns 上传结果，包含 URL 和文件名
   */
  async uploadFile(file: File): Promise<ApiResponse<UploadResult>> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const response = await api.post<ApiResponse<UploadResult>>('/api/admin/upload', {
            file: {
              mimetype: file.type,
              buffer: base64
            }
          });
          resolve(response);
        } catch (error) {
          reject(error);
        }
      };

          reader.onerror = () => {
            reject(new Error('Failed to read file'));
          };

          reader.readAsDataURL(file);
    });
  },

  /**
   * 获取已上传的文件列表
   */
  async getUploadedFiles(): Promise<ApiResponse<UploadResult[]>> {
    return api.get<ApiResponse<UploadResult[]>>('/api/admin/uploads');
  },
};

/**
 * 系统健康检查 API
 */
export const healthApi = {
  /**
   * 健康检查
   */
  async check(): Promise<{ status: string; timestamp: string }> {
    return api.get<{ status: string; timestamp: string }>('/health');
  },
};

/**
 * 域名池管理 API
 */
export const domainPoolApi = {
  /**
   * 获取域名池配置和统计
   */
  async getConfig(): Promise<ApiResponse<{ config: DomainPoolConfig; statistics: DomainPoolStatistics }>> {
    return api.get<ApiResponse<{ config: DomainPoolConfig; statistics: DomainPoolStatistics }>>(
      '/api/admin/domain-pool'
    );
  },

  /**
   * 更新域名池配置
   */
  async updateConfig(data: UpdatePoolConfigRequest): Promise<ApiResponse<DomainPoolConfig>> {
    return api.put<ApiResponse<DomainPoolConfig>>('/api/admin/domain-pool/config', data);
  },

  /**
   * 获取所有域名
   */
  async getDomains(): Promise<ApiResponse<Domain[]>> {
    return api.get<ApiResponse<Domain[]>>('/api/admin/domain-pool/domains');
  },

  /**
   * 添加域名
   */
  async addDomain(data: AddDomainRequest): Promise<ApiResponse<Domain>> {
    return api.post<ApiResponse<Domain>>('/api/admin/domain-pool/domains', data);
  },

  /**
   * 更新域名
   */
  async updateDomain(id: string, data: UpdateDomainRequest): Promise<ApiResponse<Domain>> {
    return api.put<ApiResponse<Domain>>(`/api/admin/domain-pool/domains/${id}`, data);
  },

  /**
   * 删除域名
   */
  async deleteDomain(id: string): Promise<ApiResponse> {
    return api.delete<ApiResponse>(`/api/admin/domain-pool/domains/${id}`);
  },

  /**
   * 切换域名状态
   */
  async toggleDomainStatus(id: string): Promise<ApiResponse<Domain>> {
    return api.post<ApiResponse<Domain>>(`/api/admin/domain-pool/domains/${id}/toggle`);
  },

  /**
   * 手动健康检查
   */
  async healthCheck(): Promise<ApiResponse<{
    checked: number;
    healthy: number;
    unhealthy: number;
    results: HealthCheckResult[];
  }>> {
    return api.post<ApiResponse<{
      checked: number;
      healthy: number;
      unhealthy: number;
      results: HealthCheckResult[];
    }>>('/api/admin/domain-pool/health-check');
  },

  /**
   * 选择可用域名（供跳转使用）
   */
  async selectDomain(): Promise<ApiResponse<{ domain: string; fullUrl: string }>> {
    return api.get<ApiResponse<{ domain: string; fullUrl: string }>>(
      '/api/admin/domain-pool/select'
    );
  },

  /**
   * 查询域名被哪些活码绑定
   */
  async getDomainBindingInfo(id: string): Promise<ApiResponse<DomainBindingInfo>> {
    return api.get<ApiResponse<DomainBindingInfo>>(
      `/api/admin/domain-pool/domains/${id}/binding-info`
    );
  },
};
