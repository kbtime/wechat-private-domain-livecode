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
      status: 'active',  // 新域名默认为活跃状态
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
   * 记录域名失败（用于实际请求失败，会触发封禁）
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
   * 记录健康检查失败（不触发封禁，只记录状态）
   */
  async recordHealthCheckFailure(domainId: string): Promise<void> {
    const data = await this.readAll();
    const domain = data.domains.find(d => d.id === domainId);

    if (domain) {
      // 只更新最后检查时间和总失败数（用于统计），不增加 failureCount
      domain.totalFailures++;
      domain.lastFailureTime = new Date().toISOString();
      domain.lastCheckTime = new Date().toISOString();
      domain.updatedAt = new Date().toISOString();

      // 不修改 status，保持原状态（active/inactive/banned）
      // 不增加 failureCount，因此不会触发自动封禁

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
   *
   * 架构说明：
   * - 主域名：作为入口（推广码链接），不用于落地
   * - 炮灰域名：用于落地显示 H5 页面
   *
   * 扫码流程：
   * 1. 用户扫描推广码 → 访问 主域名/api/link?id=xxx
   * 2. 系统从炮灰域名中选择一个
   * 3. 302 重定向到 炮灰域名/h5/landing.html?id=xxx
   */
  async selectDomainForLiveCode(liveCodeDomainConfig: {
    primaryDomain?: { domainId: string; domain: string; protocol: 'http' | 'https' } | null;
    fallbackDomainIds?: string[];
    selectionMode?: 'sequential' | 'random' | 'round-robin';
    strategy: SelectionStrategy;
    failoverEnabled?: boolean;
  }): Promise<{ domain: string; protocol: 'http' | 'https'; role: 'primary' | 'fallback' } | null> {
    const data = await this.readAll();

    // 第一步：优先使用活码配置的炮灰域名（落地展示策略）
    if (liveCodeDomainConfig.fallbackDomainIds && liveCodeDomainConfig.fallbackDomainIds.length > 0) {
      const selectionMode = liveCodeDomainConfig.selectionMode || 'sequential';

      // 根据落地展示策略选择域名
      const selectedDomain = await this.selectFallbackDomain(
        liveCodeDomainConfig.fallbackDomainIds,
        selectionMode,
        data
      );

      if (selectedDomain) {
        return {
          domain: selectedDomain.domain,
          protocol: selectedDomain.protocol,
          role: 'fallback'
        };
      }
    }

    // 第二步：如果没有配置炮灰域名，使用域名池的全局选择逻辑
    if (data.config.isActive) {
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

    // 第三步：都没有可用域名，返回 null（会显示 404 错误页）
    return null;
  }

  /**
   * 根据落地展示策略选择炮灰域名
   */
  private async selectFallbackDomain(
    domainIds: string[],
    selectionMode: 'sequential' | 'random' | 'round-robin',
    data: DomainPoolData
  ): Promise<Domain | null> {
    // 获取所有 active 状态的炮灰域名
    const availableDomains = data.domains.filter(d =>
      domainIds.includes(d.id) && d.status === 'active'
    );

    if (availableDomains.length === 0) {
      return null;
    }

    switch (selectionMode) {
      case 'sequential':
        // 顺序模式：选择第一个可用域名
        return availableDomains[0];

      case 'random':
        // 随机模式：随机选择一个域名
        const randomIndex = Math.floor(Math.random() * availableDomains.length);
        return availableDomains[randomIndex];

      case 'round-robin':
        // 轮询模式：使用全局轮询逻辑
        const sortedDomains = [...availableDomains].sort((a, b) => a.order - b.order);
        let selectedIndex = sortedDomains.findIndex(
          d => d.order === data.config.currentIndex
        );

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

      default:
        return availableDomains[0];
    }
  }
}

// 导出单例
export const domainPoolStorage = new DomainPoolStorage();