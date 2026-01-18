import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type {
  LiveCode,
  DataStore,
  CreateLiveCodeRequest,
  SubCode,
  DomainConfig,
  UpdateDomainConfigRequest,
  BindPrimaryDomainRequest,
  PrimaryDomainConfig,
  FallbackDomainConfig,
  FallbackSelectionMode
} from './types.js';

const DATA_FILE_PATH = process.env.DATA_FILE_PATH || './data/live-codes.json';
const ADMIN_DOMAIN = process.env.ADMIN_DOMAIN || 'hm.wx11.top';

/**
 * 默认炮灰域名配置
 */
function createDefaultFallbackDomains(): FallbackDomainConfig {
  return {
    domainIds: [],
    priority: [],
    selectionMode: 'sequential',
    currentIndex: 0,
    stats: {
      totalRedirects: 0,
      domainStats: {}
    },
    updatedAt: new Date().toISOString(),
    failoverEnabled: false
  };
}

/**
 * JSON 文件存储层
 */
export class Storage {
  private dataPath: string;

  constructor(dataPath?: string) {
    this.dataPath = dataPath || path.resolve(DATA_FILE_PATH);
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
      const initialData: DataStore = {
        liveCodes: [],
        lastUpdated: new Date().toISOString()
      };
      await fs.writeFile(this.dataPath, JSON.stringify(initialData, null, 2), 'utf-8');
    }
  }

  /**
   * 读取所有活码数据
   */
  async readAll(): Promise<LiveCode[]> {
    await this.ensureFileExists();
    const content = await fs.readFile(this.dataPath, 'utf-8');
    const data: DataStore = JSON.parse(content);
    return data.liveCodes || [];
  }

  /**
   * 写入所有活码数据
   */
  async writeAll(liveCodes: LiveCode[]): Promise<void> {
    await this.ensureFileExists();
    const data: DataStore = {
      liveCodes,
      lastUpdated: new Date().toISOString()
    };
    await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * 根据 ID 查找活码
   */
  async findById(id: string): Promise<LiveCode | null> {
    const liveCodes = await this.readAll();
    return liveCodes.find(c => c.id === id) || null;
  }

  /**
   * 创建新活码
   */
  async create(request: CreateLiveCodeRequest): Promise<LiveCode> {
    const liveCodes = await this.readAll();

    // 生成新 ID
    const id = `code-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 生成子码 ID 和初始化 currentPv
    const subCodes: SubCode[] = request.subCodes.map((sub, index) => ({
      ...sub,
      id: `sub-${id}-${index}`,
      currentPv: 0
    }));

    const newLiveCode: LiveCode = {
      id,
      name: request.name,
      status: 'running',
      distributionMode: request.distributionMode,
      totalPv: 0,
      subCodes,
      mainUrl: `https://${ADMIN_DOMAIN}/api/link?id=${id}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // H5 页面配置（使用默认值或请求中的值）
      h5Title: request.h5Title || undefined,
      h5Description: request.h5Description || undefined
    };

    liveCodes.unshift(newLiveCode);
    await this.writeAll(liveCodes);

    return newLiveCode;
  }

  /**
   * 更新活码
   */
  async update(id: string, updates: Partial<LiveCode>): Promise<LiveCode | null> {
    const liveCodes = await this.readAll();
    const index = liveCodes.findIndex(c => c.id === id);

    if (index === -1) {
      return null;
    }

    // 如果更新了 subCodes，重置每个子码的 currentPv（编辑后重新开始计数）
    let updatedSubCodes = updates.subCodes;
    if (updatedSubCodes) {
      updatedSubCodes = updatedSubCodes.map(sub => ({
        ...sub,
        currentPv: 0 // 编辑子码时重置访问计数
      }));
    }

    // 更新字段，保留原有值
    liveCodes[index] = {
      ...liveCodes[index],
      ...updates,
      ...(updatedSubCodes && { subCodes: updatedSubCodes }),
      id, // 确保 ID 不被修改
      updatedAt: new Date().toISOString()
    };

    await this.writeAll(liveCodes);
    return liveCodes[index];
  }

  /**
   * 删除活码
   */
  async delete(id: string): Promise<boolean> {
    const liveCodes = await this.readAll();
    const filteredCodes = liveCodes.filter(c => c.id !== id);

    if (filteredCodes.length === liveCodes.length) {
      return false; // 没有找到要删除的活码
    }

    await this.writeAll(filteredCodes);
    return true;
  }

  /**
   * 增加活码访问量
   */
  async incrementPv(liveCodeId: string, subCodeId?: string): Promise<LiveCode | null> {
    const liveCodes = await this.readAll();
    const liveCodeIndex = liveCodes.findIndex(c => c.id === liveCodeId);

    if (liveCodeIndex === -1) {
      return null;
    }

    const liveCode = liveCodes[liveCodeIndex];

    // 增加总访问量
    liveCode.totalPv += 1;
    liveCode.updatedAt = new Date().toISOString();

    // 如果指定了子码，增加子码访问量
    if (subCodeId) {
      const subCodeIndex = liveCode.subCodes.findIndex(s => s.id === subCodeId);
      if (subCodeIndex !== -1) {
        liveCode.subCodes[subCodeIndex].currentPv += 1;
      }
    }

    await this.writeAll(liveCodes);
    return liveCode;
  }

  /**
   * 获取活码的域名配置
   */
  async getDomainConfig(liveCodeId: string): Promise<DomainConfig | null> {
    const liveCode = await this.findById(liveCodeId);
    return liveCode?.domainConfig || null;
  }

  /**
   * 更新域名配置（备用域名、策略等，不包括主域名）
   */
  async updateDomainConfig(
    liveCodeId: string,
    updates: UpdateDomainConfigRequest
  ): Promise<DomainConfig | null> {
    const liveCodes = await this.readAll();
    const index = liveCodes.findIndex(c => c.id === liveCodeId);

    if (index === -1) {
      return null;
    }

    const liveCode = liveCodes[index];

    // 初始化域名配置（如果不存在）
    if (!liveCode.domainConfig) {
      liveCode.domainConfig = {
        mode: 'CUSTOM_DOMAINS',
        fallbackDomains: createDefaultFallbackDomains(),
        strategy: 'round-robin'
      };
    }

    // 确保炮灰域名配置有必需的字段（向后兼容）
    if (!liveCode.domainConfig.fallbackDomains.selectionMode) {
      liveCode.domainConfig.fallbackDomains.selectionMode = 'sequential';
    }
    if (!liveCode.domainConfig.fallbackDomains.currentIndex) {
      liveCode.domainConfig.fallbackDomains.currentIndex = 0;
    }
    if (!liveCode.domainConfig.fallbackDomains.stats) {
      liveCode.domainConfig.fallbackDomains.stats = {
        totalRedirects: 0,
        domainStats: {}
      };
    }

    // 更新备用域名配置
    if (updates.fallbackDomains) {
      liveCode.domainConfig.fallbackDomains = {
        ...liveCode.domainConfig.fallbackDomains, // 保留现有字段
        ...updates.fallbackDomains, // 覆盖更新的字段
        updatedAt: new Date().toISOString()
      };
    }

    // 更新选择策略
    if (updates.strategy !== undefined) {
      liveCode.domainConfig.strategy = updates.strategy;
    }

    liveCode.updatedAt = new Date().toISOString();
    await this.writeAll(liveCodes);

    return liveCode.domainConfig;
  }

  /**
   * 绑定主域名（不可逆操作）
   */
  async bindPrimaryDomain(
    liveCodeId: string,
    request: BindPrimaryDomainRequest,
    domainInfo: { domain: string; protocol: 'http' | 'https' }
  ): Promise<DomainConfig | null> {
    if (!request.confirmed) {
      throw new Error('必须确认才能绑定主域名');
    }

    const liveCodes = await this.readAll();
    const index = liveCodes.findIndex(c => c.id === liveCodeId);

    if (index === -1) {
      return null;
    }

    const liveCode = liveCodes[index];

    // 检查是否已经绑定了主域名
    if (liveCode.domainConfig?.primaryDomain?.locked) {
      throw new Error('主域名已锁定，无法重新绑定');
    }

    // 初始化域名配置（如果不存在）
    if (!liveCode.domainConfig) {
      liveCode.domainConfig = {
        mode: 'CUSTOM_DOMAINS',
        fallbackDomains: createDefaultFallbackDomains(),
        strategy: 'round-robin'
      };
    }

    // 确保炮灰域名配置有必需的字段（向后兼容）
    if (!liveCode.domainConfig.fallbackDomains.selectionMode) {
      liveCode.domainConfig.fallbackDomains.selectionMode = 'sequential';
    }
    if (!liveCode.domainConfig.fallbackDomains.currentIndex) {
      liveCode.domainConfig.fallbackDomains.currentIndex = 0;
    }
    if (!liveCode.domainConfig.fallbackDomains.stats) {
      liveCode.domainConfig.fallbackDomains.stats = {
        totalRedirects: 0,
        domainStats: {}
      };
    }

    // 设置主域名（锁定状态）
    liveCode.domainConfig.primaryDomain = {
      domainId: request.domainId,
      domain: domainInfo.domain,
      protocol: domainInfo.protocol,
      lockedAt: new Date().toISOString(),
      locked: true,
      canUnbind: false
    };

    liveCode.updatedAt = new Date().toISOString();
    await this.writeAll(liveCodes);

    return liveCode.domainConfig;
  }

  /**
   * 解绑主域名（仅管理员，需强制确认）
   */
  async unbindPrimaryDomain(
    liveCodeId: string,
    forceUnbind: boolean,
    confirmationCode: string
  ): Promise<DomainConfig | null> {
    if (!forceUnbind) {
      throw new Error('需要管理员强制解绑权限');
    }

    // 简单的确认码验证（生产环境应该使用更安全的方式）
    if (confirmationCode !== 'ADMIN_UNBIND_CONFIRM') {
      throw new Error('确认码错误');
    }

    const liveCodes = await this.readAll();
    const index = liveCodes.findIndex(c => c.id === liveCodeId);

    if (index === -1) {
      return null;
    }

    const liveCode = liveCodes[index];

    if (!liveCode.domainConfig?.primaryDomain) {
      throw new Error('未绑定主域名');
    }

    // 解绑主域名
    liveCode.domainConfig.primaryDomain = undefined;
    liveCode.updatedAt = new Date().toISOString();

    await this.writeAll(liveCodes);

    return liveCode.domainConfig;
  }

  /**
   * 选择炮灰域名（根据落地展示策略）
   */
  async selectFallbackDomain(liveCodeId: string): Promise<{ domainId: string; index: number } | null> {
    const liveCode = await this.findById(liveCodeId);
    if (!liveCode?.domainConfig?.fallbackDomains) {
      return null;
    }

    const fallbackDomains = liveCode.domainConfig.fallbackDomains;
    const domainCount = fallbackDomains.domainIds.length;

    if (domainCount === 0) {
      return null;
    }

    let selectedIndex: number;

    // 根据选择模式选择域名
    switch (fallbackDomains.selectionMode) {
      case 'sequential':
        // 顺序模式：按1→2→3顺序循环
        selectedIndex = (fallbackDomains.currentIndex || 0) % domainCount;
        break;

      case 'random':
        // 随机模式：随机选择
        selectedIndex = Math.floor(Math.random() * domainCount);
        break;

      case 'round-robin':
        // 轮询模式：循环遍历
        selectedIndex = (fallbackDomains.currentIndex || 0) % domainCount;
        break;

      default:
        selectedIndex = 0;
    }

    // 更新索引（用于顺序/轮询模式）
    if (fallbackDomains.selectionMode === 'sequential' || fallbackDomains.selectionMode === 'round-robin') {
      fallbackDomains.currentIndex = (selectedIndex + 1) % domainCount;
    }

    // 更新统计信息
    const selectedDomainId = fallbackDomains.domainIds[selectedIndex];
    fallbackDomains.stats.totalRedirects += 1;
    fallbackDomains.stats.lastRedirectAt = new Date().toISOString();

    if (!fallbackDomains.stats.domainStats[selectedDomainId]) {
      fallbackDomains.stats.domainStats[selectedDomainId] = {
        redirectCount: 0
      };
    }
    fallbackDomains.stats.domainStats[selectedDomainId].redirectCount += 1;
    fallbackDomains.stats.domainStats[selectedDomainId].lastRedirectAt = new Date().toISOString();

    fallbackDomains.updatedAt = new Date().toISOString();
    liveCode.updatedAt = new Date().toISOString();

    // 保存更新
    await this.update(liveCodeId, { domainConfig: liveCode.domainConfig });

    return {
      domainId: selectedDomainId,
      index: selectedIndex
    };
  }

  /**
   * 重置炮灰域名统计信息
   */
  async resetFallbackDomainStats(liveCodeId: string): Promise<DomainConfig | null> {
    const liveCode = await this.findById(liveCodeId);
    if (!liveCode?.domainConfig?.fallbackDomains) {
      return null;
    }

    liveCode.domainConfig.fallbackDomains.stats = {
      totalRedirects: 0,
      domainStats: {}
    };
    liveCode.domainConfig.fallbackDomains.currentIndex = 0;
    liveCode.domainConfig.fallbackDomains.updatedAt = new Date().toISOString();
    liveCode.updatedAt = new Date().toISOString();

    await this.update(liveCodeId, { domainConfig: liveCode.domainConfig });

    return liveCode.domainConfig;
  }
}

// 导出单例
export const storage = new Storage();
