
export enum DistributionMode {
  THRESHOLD = 'THRESHOLD',
  RANDOM = 'RANDOM',
  FIXED = 'FIXED'
}

export interface SubCode {
  id: string;
  qrUrl: string;
  threshold: number;
  currentPv: number;
  weight: number;
  status: 'enabled' | 'disabled';
}

export interface LiveCode {
  id: string;
  name: string;
  status: 'running' | 'paused';
  distributionMode: DistributionMode;
  totalPv: number;
  subCodes: SubCode[];
  mainUrl: string;
  createdAt?: string;
  updatedAt?: string;
  domainConfig?: DomainConfig;  // 域名配置（可选）
  // H5 页面配置
  h5Title?: string;        // H5 页面标题（导航栏）
  h5Description?: string;  // H5 页面描述（二维码下方说明）
}

export interface DashboardStats {
  totalPv: number;
  activeCodes: number;
  newToday: number;
  conversionRate: string;
}

// API Request/Response Types
export interface LoginRequest {
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface CreateLiveCodeRequest {
  name: string;
  distributionMode: DistributionMode;
  subCodes: SubCode[];
  // H5 页面配置（可选）
  h5Title?: string;
  h5Description?: string;
}

export interface UpdateLiveCodeRequest {
  name?: string;
  distributionMode?: DistributionMode;
  subCodes?: SubCode[];
  status?: 'running' | 'paused';
  // H5 页面配置（可选）
  h5Title?: string;
  h5Description?: string;
}

export interface Statistics {
  totalPv: number;
  dailyPv: number;
  subCodeStats: Array<{
    id: string;
    qrUrl: string;
    currentPv: number;
  }>;
}

export interface UploadResult {
  url: string;
  filename: string;
}

// ============ 域名池相关类型 ============

export type DomainStatus = 'active' | 'inactive' | 'banned' | 'testing';
export type SelectionStrategy = 'round-robin' | 'random' | 'weighted';

export interface Domain {
  id: string;
  domain: string;
  protocol: 'http' | 'https';
  status: DomainStatus;
  weight: number;
  order: number;
  healthCheckUrl?: string;
  lastCheckTime?: string;
  lastFailureTime?: string;
  failureCount: number;
  totalRequests: number;
  totalFailures: number;
  createdAt: string;
  updatedAt: string;
}

export interface DomainPoolConfig {
  id: string;
  name: string;
  strategy: SelectionStrategy;
  maxFailures: number;
  healthCheckInterval: number;
  retryInterval: number;
  currentIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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

export interface AddDomainRequest {
  domain: string;
  protocol: 'http' | 'https';
  weight?: number;
  order?: number;
  healthCheckUrl?: string;
}

export interface UpdateDomainRequest {
  domain?: string;
  protocol?: 'http' | 'https';
  status?: DomainStatus;
  weight?: number;
  order?: number;
  healthCheckUrl?: string;
}

export interface UpdatePoolConfigRequest {
  strategy?: SelectionStrategy;
  maxFailures?: number;
  healthCheckInterval?: number;
  retryInterval?: number;
  isActive?: boolean;
}

export interface HealthCheckResult {
  domainId: string;
  domain: string;
  status: 'ok' | 'failed';
  responseTime?: number;
  error?: string;
}

// ============ 域名池与活码集成相关类型 ============

export type DomainBindingMode = 'GLOBAL_POOL' | 'CUSTOM_DOMAINS' | 'HYBRID';

/**
 * 炮灰域名选择模式（落地展示策略）
 */
export type FallbackSelectionMode = 'sequential' | 'random' | 'round-robin';

export interface PrimaryDomainConfig {
  domainId: string;
  domain: string;
  protocol: 'http' | 'https';
  lockedAt: string;
  locked: boolean;
  canUnbind: boolean;
}

/**
 * 炮灰域名统计信息
 */
export interface FallbackDomainStats {
  redirectCount: number;
  lastRedirectAt?: string;
}

export interface FallbackDomainConfig {
  domainIds: string[];
  priority: number[];
  updatedAt: string;
  failoverEnabled?: boolean;

  // 落地展示策略
  selectionMode: FallbackSelectionMode;
  currentIndex?: number;

  // 统计信息
  stats: {
    totalRedirects: number;
    lastRedirectAt?: string;
    domainStats: {
      [domainId: string]: FallbackDomainStats;
    };
  };
}

export interface DomainConfig {
  mode: DomainBindingMode;
  primaryDomain?: PrimaryDomainConfig;
  fallbackDomains: FallbackDomainConfig;
  strategy?: SelectionStrategy;
}

export interface DomainBindingInfo {
  domainId: string;
  domain: string;
  boundToLiveCodes: LiveCodeBinding[];
}

export interface LiveCodeBinding {
  liveCodeId: string;
  liveCodeName: string;
  role: 'primary' | 'fallback';
  boundAt: string;
  priority?: number;
}

export interface LiveCodeDomainStats {
  primaryDomainSuccess: number;
  primaryDomainFailure: number;
  fallbackDomainUsage: number;
  lastFailoverTime?: string;
  currentUsingDomain: 'primary' | 'fallback' | 'none';
}

export interface UpdateDomainConfigRequest {
  fallbackDomains?: {
    domainIds: string[];
    priority: number[];
    selectionMode?: FallbackSelectionMode;
    currentIndex?: number;
    failoverEnabled?: boolean;
  };
  strategy?: SelectionStrategy;
}

export interface BindPrimaryDomainRequest {
  domainId: string;
  confirmed: boolean;
}

export interface UnbindPrimaryDomainRequest {
  forceUnbind: boolean;
  confirmationCode: string;
}
