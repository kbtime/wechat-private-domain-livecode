import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type {
  DomainPoolData,
  DomainPoolConfig,
  Domain,
  AddDomainRequest,
  UpdateDomainRequest,
  UpdatePoolConfigRequest,
  DomainSelection,
  SelectionStrategy,
  DomainPoolStatistics,
  DomainBindingInfo,
  LiveCodeBinding
} from '../types.js';

const DOMAIN_POOL_FILE_PATH = process.env.DOMAIN_POOL_FILE_PATH || './data/domain-pool.json';

const DEFAULT_CONFIG: DomainPoolConfig = {
  id: 'pool-main',
  name: '主域名池',
  strategy: 'round-robin',
  maxFailures: 3,
  healthCheckInterval: 300,
  retryInterval: 60,
  currentIndex: 0,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * 域名池存储服务
 */
export class DomainPoolStorage {
  private dataPath: string;

  constructor(dataPath?: string) {
    this.dataPath = dataPath || path.resolve(DOMAIN_POOL_FILE_PATH);
  }

  /**
   * 确保数据文件存在
   */
  private async ensureFileExists(): Promise<void> {
    const dir = path.dirname(this.dataPath);
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }

    try {
      await fs.access(this.dataPath);
    } catch {
      // 文件不存在，创建初始数据
      const initialData: DomainPoolData = {
        config: DEFAULT_CONFIG,
        domains: []
      };
      await fs.writeFile(this.dataPath, JSON.stringify(initialData, null, 2), 'utf-8');
    }
  }

  /**
   * 读取所有数据
   */
  async readAll(): Promise<DomainPoolData> {
    await this.ensureFileExists();
    const content = await fs.readFile(this.dataPath, 'utf-8');
    const data: DomainPoolData = JSON.parse(content);
    return data;
  }

  /**
   * 写入所有数据
   */
  async writeAll(data: DomainPoolData): Promise<void> {
    await this.ensureFileExists();
    data.config.updatedAt = new Date().toISOString();
    await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * 获取域名池配置
   */
  async getConfig(): Promise<DomainPoolConfig> {
    const data = await this.readAll();
    return data.config;
  }

  /**
   * 更新域名池配置
   */
  async updateConfig(updates: UpdatePoolConfigRequest): Promise<DomainPoolConfig> {
    const data = await this.readAll();
    data.config = { ...data.config, ...updates };
    await this.writeAll(data);
    return data.config;
  }

  /**
   * 获取所有域名
   */
  async getDomains(): Promise<Domain[]> {
    const data = await this.readAll();
    return data.domains;
  }

  /**
   * 根据 ID 查找域名
   */
  async findDomainById(id: string): Promise<Domain | null> {
    const domains = await this.getDomains();
    return domains.find(d => d.id === id) || null;
  }

  /**
   * 添加域名
   */
  async addDomain(request: AddDomainRequest): Promise<Domain> {
    const data = await this.readAll();

    // 获取当前最大的 order 值
    const maxOrder = data.domains.length > 0
      ? Math.max(...data.domains.map(d => d.order))
      : 0;

    const newDomain: Domain = {
      id: `domain-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      domain: request.domain,
      protocol: request.protocol || 'https',
      status: 'testing',
      weight: request.weight ?? 1,
      order: request.order ?? (maxOrder + 1),
      healthCheckUrl: request.healthCheckUrl || '/health',
      failureCount: 0,
      totalRequests: 0,
      totalFailures: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.domains.push(newDomain);
    await this.writeAll(data);
    return newDomain;
  }

  /**
   * 更新域名
   */
  async updateDomain(id: string, updates: UpdateDomainRequest): Promise<Domain | null> {
    const data = await this.readAll();
    const index = data.domains.findIndex(d => d.id === id);

    if (index === -1) {
      return null;
    }

    data.domains[index] = {
      ...data.domains[index],
      ...updates,
      id, // 确保 ID 不被修改
      updatedAt: new Date().toISOString()
    };

    await this.writeAll(data);
    return data.domains[index];
  }

  /**
   * 删除域名
   */
  async deleteDomain(id: string): Promise<boolean> {
    const data = await this.readAll();
    const initialLength = data.domains.length;
    data.domains = data.domains.filter(d => d.id !== id);

    if (data.domains.length === initialLength) {
      return false; // 没有找到要删除的域名
    }

    // 如果删除的域名当前索引小于 currentIndex，需要调整索引
    const deletedDomain = data.domains.find(d => d.id === id);
    if (deletedDomain && deletedDomain.order < data.config.currentIndex) {
      data.config.currentIndex = Math.max(0, data.config.currentIndex - 1);
    }

    await this.writeAll(data);
    return true;
  }

  /**
   * 切换域名状态
   */
  async toggleDomainStatus(id: string): Promise<Domain | null> {
    const domain = await this.findDomainById(id);
    if (!domain) {
      return null;
    }

    const newStatus: Domain['status'] = domain.status === 'active' ? 'inactive' : 'active';
    return await this.updateDomain(id, { status: newStatus });
  }

  /**
   * 域名选择逻辑
   */
  async selectDomain(): Promise<DomainSelection | null> {
    const data = await this.readAll();

    // 如果域名池未启用或没有域名，返回 null
    if (!data.config.isActive || data.domains.length === 0) {
      return null;
    }

    // 根据策略选择域名
    const selectedDomain = await this.selectDomainByStrategy(data.config.strategy, data);

    if (!selectedDomain) {
      return null;
    }

    // 更新统计
    await this.incrementDomainStats(selectedDomain.id);

    return {
      domain: selectedDomain.domain,
      fullUrl: `${selectedDomain.protocol}://${selectedDomain.domain}`,
      poolId: data.config.id,
      domainId: selectedDomain.id
    };
  }

  /**
   * 根据策略选择域名
   */
  private async selectDomainByStrategy(
    strategy: SelectionStrategy,
    data: DomainPoolData
  ): Promise<Domain | null> {
    const activeDomains = data.domains.filter(d => d.status === 'active');

    if (activeDomains.length === 0) {
      return null;
    }

    switch (strategy) {
      case 'round-robin':
        return this.selectRoundRobin(activeDomains, data);

      case 'random':
        return this.selectRandom(activeDomains);

      case 'weighted':
        return this.selectWeighted(activeDomains);

      default:
        return this.selectRoundRobin(activeDomains, data);
    }
  }

  /**
   * 顺序轮询选择
   */
  private async selectRoundRobin(
    activeDomains: Domain[],
    data: DomainPoolData
  ): Promise<Domain | null> {
    // 按 order 排序
    const sortedDomains = [...activeDomains].sort((a, b) => a.order - b.order);

    // 找到当前索引对应的域名
    let selectedIndex = sortedDomains.findIndex(
      d => d.order === data.config.currentIndex
    );

    // 如果当前索引对应的域名不在活跃列表中，从头开始
    if (selectedIndex === -1) {
      selectedIndex = 0;
    }

    const selectedDomain = sortedDomains[selectedIndex];
    if (!selectedDomain) {
      return null;
    }

    // 更新 currentIndex 到下一个域名
    const nextIndex = (selectedIndex + 1) % sortedDomains.length;
    data.config.currentIndex = sortedDomains[nextIndex].order;
    await this.writeAll(data);

    return selectedDomain;
  }

  /**
   * 随机选择
   */
  private selectRandom(activeDomains: Domain[]): Domain | null {
    const index = Math.floor(Math.random() * activeDomains.length);
    return activeDomains[index] || null;
  }

  /**
   * 权重随机选择
   */
  private selectWeighted(activeDomains: Domain[]): Domain | null {
    const totalWeight = activeDomains.reduce((sum, d) => sum + d.weight, 0);
    if (totalWeight === 0) {
      return this.selectRandom(activeDomains);
    }

    let random = Math.random() * totalWeight;
    for (const domain of activeDomains) {
      random -= domain.weight;
      if (random <= 0) {
        return domain;
      }
    }

    return activeDomains[activeDomains.length - 1] || null;
  }

  /**
   * 增加域名统计
   */
  private async incrementDomainStats(domainId: string): Promise<void> {
    const data = await this.readAll();
    const domain = data.domains.find(d => d.id === domainId);

    if (domain) {
      domain.totalRequests++;
      domain.updatedAt = new Date().toISOString();
      await this.writeAll(data);
    }
  }

  /**
   * 记录域名失败
   */
  async recordDomainFailure(domainId: string): Promise<void> {
    const data = await this.readAll();
    const domain = data.domains.find(d => d.id === domainId);

    if (domain) {
      domain.failureCount++;
      domain.totalFailures++;
      domain.lastFailureTime = new Date().toISOString();
      domain.updatedAt = new Date().toISOString();

      // 检查是否需要标记为 banned
      if (domain.failureCount >= data.config.maxFailures) {
        domain.status = 'banned';
      }

      await this.writeAll(data);
    }
  }

  /**
   * 重置域名失败计数
   */
  async resetDomainFailure(domainId: string): Promise<void> {
    const data = await this.readAll();
    const domain = data.domains.find(d => d.id === domainId);

    if (domain) {
      domain.failureCount = 0;
      domain.lastCheckTime = new Date().toISOString();

      // 如果之前是 banned 状态，恢复为 active
      if (domain.status === 'banned') {
        domain.status = 'active';
      }

      domain.updatedAt = new Date().toISOString();
      await this.writeAll(data);
    }
  }

  /**
   * 获取统计信息
   */
  async getStatistics(): Promise<DomainPoolStatistics> {
    const data = await this.readAll();
    const domains = data.domains;

    const totalRequests = domains.reduce((sum, d) => sum + d.totalRequests, 0);
    const totalFailures = domains.reduce((sum, d) => sum + d.totalFailures, 0);
    const totalFailureCount = domains.reduce((sum, d) => sum + d.failureCount, 0);

    // 计算成功率：如果有实际请求则用请求数据，否则基于失败计数估算
    let successRate: number;
    if (totalRequests > 0) {
      successRate = ((totalRequests - totalFailures) / totalRequests) * 100;
    } else if (totalFailureCount > 0) {
      // 只有健康检查失败，全部算失败
      successRate = 0;
    } else {
      // 没有任何数据，默认100%
      successRate = 100;
    }

    return {
      totalDomains: domains.length,
      activeDomains: domains.filter(d => d.status === 'active').length,
      bannedDomains: domains.filter(d => d.status === 'banned').length,
      inactiveDomains: domains.filter(d => d.status === 'inactive').length,
      testingDomains: domains.filter(d => d.status === 'testing').length,
      totalRequests,
      totalFailures,
      successRate
    };
  }

  /**
   * 根据策略为活码选择域名（集成故障转移逻辑）
   */
  async selectDomainForLiveCode(liveCodeDomainConfig: {
    primaryDomain?: { domainId: string; domain: string; protocol: 'http' | 'https' } | null;
    fallbackDomainIds?: string[];
    strategy: SelectionStrategy;
    failoverEnabled?: boolean;
  }): Promise<{ domain: string; protocol: 'http' | 'https'; role: 'primary' | 'fallback' } | null> {
    const data = await this.readAll();

    // 优先使用主域名
    if (liveCodeDomainConfig.primaryDomain) {
      const primaryDomain = data.domains.find(d => d.id === liveCodeDomainConfig.primaryDomain?.domainId);
      if (primaryDomain && primaryDomain.status === 'active') {
        return {
          domain: primaryDomain.domain,
          protocol: primaryDomain.protocol,
          role: 'primary'
        };
      }
    }

    // 主域名不可用，检查是否启用故障转移
    if (liveCodeDomainConfig.failoverEnabled && liveCodeDomainConfig.fallbackDomainIds && liveCodeDomainConfig.fallbackDomainIds.length > 0) {
      // 按优先级查找可用的备用域名
      for (const domainId of liveCodeDomainConfig.fallbackDomainIds) {
        const fallbackDomain = data.domains.find(d => d.id === domainId);
        if (fallbackDomain && fallbackDomain.status === 'active') {
          return {
            domain: fallbackDomain.domain,
            protocol: fallbackDomain.protocol,
            role: 'fallback'
          };
        }
      }
    }

    // 如果没有配置主域名，使用域名池的全局选择逻辑
    if (!liveCodeDomainConfig.primaryDomain && data.config.isActive) {
      const selection = await this.selectDomain();
      if (selection) {
        const domain = data.domains.find(d => d.id === selection.domainId);
        if (domain) {
          return {
            domain: domain.domain,
            protocol: domain.protocol,
            role: 'fallback'
          };
        }
      }
    }

    return null;
  }
}

// 导出单例
export const domainPoolStorage = new DomainPoolStorage();