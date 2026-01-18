
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
}

export interface UpdateLiveCodeRequest {
  name?: string;
  distributionMode?: DistributionMode;
  subCodes?: SubCode[];
  status?: 'running' | 'paused';
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

export interface PrimaryDomainConfig {
  domainId: string;
  domain: string;
  protocol: 'http' | 'https';
  lockedAt: string;
  locked: boolean;
  canUnbind: boolean;
}

export interface FallbackDomainConfig {
  domainIds: string[];
  priority: number[];
  updatedAt: string;
  failoverEnabled: boolean;
}

export interface DomainConfig {
  mode: DomainBindingMode;
  primaryDomain?: PrimaryDomainConfig;
  fallbackDomains: FallbackDomainConfig;
  strategy: SelectionStrategy;
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
    failoverEnabled: boolean;
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
