/**
 * 分流模式枚举
 */
export enum DistributionMode {
  THRESHOLD = 'THRESHOLD',  // 阈值切换
  RANDOM = 'RANDOM',        // 随机展示
  FIXED = 'FIXED'           // 固定一张
}

/**
 * 子码接口
 */
export interface SubCode {
  id: string;
  qrUrl: string;           // 二维码图片URL
  threshold: number;        // 访问阈值
  currentPv: number;        // 当前访问量
  weight: number;           // 权重
  status: 'enabled' | 'disabled';  // 启用状态
}

/**
 * 活码接口
 */
export interface LiveCode {
  id: string;
  name: string;
  status: 'running' | 'paused';
  distributionMode: DistributionMode;
  totalPv: number;
  subCodes: SubCode[];
  mainUrl: string;         // 主链接URL
  createdAt?: string;      // 创建时间
  updatedAt?: string;      // 更新时间
  domainConfig?: DomainConfig;  // 域名配置（可选）
}

/**
 * 创建活码请求
 */
export interface CreateLiveCodeRequest {
  name: string;
  distributionMode: DistributionMode;
  subCodes: Omit<SubCode, 'id' | 'currentPv'>[];
}

/**
 * 更新活码请求
 */
export interface UpdateLiveCodeRequest {
  name?: string;
  distributionMode?: DistributionMode;
  subCodes?: SubCode[];
  status?: 'running' | 'paused';
}

/**
 * 登录请求
 */
export interface LoginRequest {
  password: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
}

/**
 * API 响应基础结构
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * 推广码数据
 */
export interface PromotionCode {
  id: string;
  liveCodeId: string;
  shortUrl: string;
  qrCode: string; // Base64 或 URL
  createdAt: string;
}

/**
 * 数据统计
 */
export interface Statistics {
  liveCodeId: string;
  dateRange: {
    start: string;
    end: string;
  };
  metrics: {
    totalPV: number;
    totalUV: number;
    conversionRate: number;
  };
  trends: Array<{
    date: string;
    pv: number;
    uv: number;
  }>;
}

/**
 * 数据存储结构
 */
export interface DataStore {
  liveCodes: LiveCode[];
  lastUpdated: string;
}

/**
 * ========== 域名池相关类型 ==========
 */

/**
 * 域名状态
 */
export type DomainStatus = 'active' | 'inactive' | 'banned' | 'testing';

/**
 * 选择策略
 */
export type SelectionStrategy = 'round-robin' | 'random' | 'weighted';

/**
 * 域名实体
 */
export interface Domain {
  id: string;
  domain: string;              // 域名，如 "mtw1.example.com"
  protocol: 'http' | 'https';  // 协议
  status: DomainStatus;
  weight: number;              // 权重（随机模式使用）
  order: number;               // 顺序（顺序模式使用）
  healthCheckUrl?: string;     // 健康检查路径
  lastCheckTime?: string;      // 最后检查时间
  lastFailureTime?: string;    // 最后失败时间
  failureCount: number;        // 连续失败次数
  totalRequests: number;       // 总请求数
  totalFailures: number;       // 总失败数
  createdAt: string;
  updatedAt: string;
}

/**
 * 域名池配置
 */
export interface DomainPoolConfig {
  id: string;
  name: string;                // 池名称，如 "主域名池"
  strategy: SelectionStrategy;
  maxFailures: number;         // 最大连续失败次数（默认3次）
  healthCheckInterval: number; // 健康检查间隔（秒，默认300）
  retryInterval: number;       // 失败重试间隔（秒，默认60）
  currentIndex: number;        // 当前轮询索引
  isActive: boolean;           // 是否启用此池
  createdAt: string;
  updatedAt: string;
}

/**
 * 域名池数据存储结构
 */
export interface DomainPoolData {
  config: DomainPoolConfig;
  domains: Domain[];
}

/**
 * 域名选择结果
 */
export interface DomainSelection {
  domain: string;
  fullUrl: string;
  poolId: string;
  domainId: string;
}

/**
 * 添加域名请求
 */
export interface AddDomainRequest {
  domain: string;
  protocol: 'http' | 'https';
  weight?: number;
  order?: number;
  healthCheckUrl?: string;
}

/**
 * 更新域名请求
 */
export interface UpdateDomainRequest {
  domain?: string;
  protocol?: 'http' | 'https';
  status?: DomainStatus;
  weight?: number;
  order?: number;
  healthCheckUrl?: string;
}

/**
 * 更新域名池配置请求
 */
export interface UpdatePoolConfigRequest {
  strategy?: SelectionStrategy;
  maxFailures?: number;
  healthCheckInterval?: number;
  retryInterval?: number;
  isActive?: boolean;
}

/**
 * 域名池统计信息
 */
export interface DomainPoolStatistics {
  totalDomains: number;
  activeDomains: number;
  bannedDomains: number;
  inactiveDomains: number;
  testingDomains: number;
  totalRequests: number;
  totalFailures: number;
  successRate: number;
}

/**
 * 健康检查结果
 */
export interface HealthCheckResult {
  domainId: string;
  domain: string;
  status: 'ok' | 'failed';
  responseTime?: number;
  error?: string;
}

/**
 * ========== 域名池与活码集成相关类型 ==========
 */

/**
 * 域名绑定模式
 */
export type DomainBindingMode = 'GLOBAL_POOL' | 'CUSTOM_DOMAINS' | 'HYBRID';

/**
 * 炮灰域名选择模式（落地展示策略）
 */
export type FallbackSelectionMode = 'sequential' | 'random' | 'round-robin';

/**
 * 主域名配置（锁定后不可修改）
 */
export interface PrimaryDomainConfig {
  domainId: string;              // 域名池中的域名ID
  domain: string;                // 域名
  protocol: 'http' | 'https';    // 协议
  lockedAt: string;              // 锁定时间戳
  locked: boolean;               // 锁定状态
  canUnbind: boolean;            // 是否允许解绑（通常为false）
}

/**
 * 炮灰域名统计信息
 */
export interface FallbackDomainStats {
  redirectCount: number;        // 该域名的跳转次数
  lastRedirectAt?: string;       // 最后跳转时间
}

/**
 * 备用域名配置（完全灵活，包含落地展示策略）
 */
export interface FallbackDomainConfig {
  domainIds: string[];           // 备用域名ID列表
  priority: number[];            // 优先级顺序（对应domainIds）
  updatedAt: string;             // 最后更新时间
  failoverEnabled?: boolean;     // 是否启用故障转移（保留字段）

  // 落地展示策略（新增）
  selectionMode: FallbackSelectionMode;  // 选择模式
  currentIndex?: number;         // 当前跳转索引（用于顺序/轮询模式）

  // 统计信息（新增）
  stats: {
    totalRedirects: number;      // 总跳转次数
    lastRedirectAt?: string;      // 最后跳转时间
    domainStats: {
      [domainId: string]: FallbackDomainStats;
    };
  };
}

/**
 * 活码域名配置
 */
export interface DomainConfig {
  mode: DomainBindingMode;       // 绑定模式
  primaryDomain?: PrimaryDomainConfig;  // 主域名配置（可选）
  fallbackDomains: FallbackDomainConfig;  // 备用域名配置
  strategy?: SelectionStrategy;   // 域名选择策略（保留但不在UI显示）
}

/**
 * 域名绑定信息（用于追踪域名被哪些活码绑定）
 */
export interface DomainBindingInfo {
  domainId: string;
  domain: string;
  boundToLiveCodes: LiveCodeBinding[];
}

/**
 * 活码绑定信息
 */
export interface LiveCodeBinding {
  liveCodeId: string;
  liveCodeName: string;
  role: 'primary' | 'fallback';  // 绑定角色
  boundAt: string;               // 绑定时间
  priority?: number;             // 优先级（仅备用域名有）
}

/**
 * 活码域名统计
 */
export interface LiveCodeDomainStats {
  primaryDomainSuccess: number;  // 主域名成功次数
  primaryDomainFailure: number;  // 主域名失败次数
  fallbackDomainUsage: number;   // 备用域名使用次数
  lastFailoverTime?: string;     // 最后故障转移时间
  currentUsingDomain: 'primary' | 'fallback' | 'none';  // 当前使用的域名类型
}

/**
 * 更新域名配置请求（备用域名、策略等，不包括主域名）
 */
export interface UpdateDomainConfigRequest {
  fallbackDomains?: {
    domainIds: string[];
    priority: number[];
    failoverEnabled: boolean;
  };
  strategy?: SelectionStrategy;
}

/**
 * 绑定主域名请求（不可逆操作）
 */
export interface BindPrimaryDomainRequest {
  domainId: string;
  confirmed: boolean;  // 必须为true表示用户确认
}

/**
 * 解绑主域名请求（仅管理员，需强制确认）
 */
export interface UnbindPrimaryDomainRequest {
  forceUnbind: boolean;
  confirmationCode: string;  // 管理员确认码
}

/**
 * 域名选择结果（扩展版，包含活码信息）
 */
export interface LiveCodeDomainSelection extends DomainSelection {
  liveCodeId: string;
  role: 'primary' | 'fallback';
  strategy: SelectionStrategy;
}
