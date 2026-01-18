import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { DomainBindingInfo, LiveCodeBinding } from '../types.js';

const DOMAIN_BINDINGS_FILE_PATH = process.env.DOMAIN_BINDINGS_FILE_PATH || './data/domain-bindings.json';

/**
 * 域名绑定数据存储结构
 */
interface DomainBindingsData {
  bindings: {
    [domainId: string]: {
      domainId: string;
      domain: string;
      boundToLiveCodes: LiveCodeBinding[];
    };
  };
  lastUpdated: string;
}

/**
 * 域名绑定追踪存储服务
 * 用于追踪每个域名被哪些活码绑定
 */
export class DomainBindingsStorage {
  private dataPath: string;

  constructor(dataPath?: string) {
    this.dataPath = dataPath || path.resolve(DOMAIN_BINDINGS_FILE_PATH);
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
      const initialData: DomainBindingsData = {
        bindings: {},
        lastUpdated: new Date().toISOString()
      };
      await fs.writeFile(this.dataPath, JSON.stringify(initialData, null, 2), 'utf-8');
    }
  }

  /**
   * 读取所有绑定数据
   */
  private async readAll(): Promise<DomainBindingsData> {
    await this.ensureFileExists();
    const content = await fs.readFile(this.dataPath, 'utf-8');
    const data: DomainBindingsData = JSON.parse(content);
    return data;
  }

  /**
   * 写入所有绑定数据
   */
  private async writeAll(data: DomainBindingsData): Promise<void> {
    await this.ensureFileExists();
    data.lastUpdated = new Date().toISOString();
    await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * 记录域名绑定
   */
  async recordBinding(
    domainId: string,
    domain: string,
    liveCodeId: string,
    liveCodeName: string,
    role: 'primary' | 'fallback',
    priority?: number
  ): Promise<void> {
    const data = await this.readAll();

    if (!data.bindings[domainId]) {
      data.bindings[domainId] = {
        domainId,
        domain,
        boundToLiveCodes: []
      };
    }

    // 检查是否已经绑定
    const existingBinding = data.bindings[domainId].boundToLiveCodes.find(
      b => b.liveCodeId === liveCodeId && b.role === role
    );

    if (!existingBinding) {
      data.bindings[domainId].boundToLiveCodes.push({
        liveCodeId,
        liveCodeName,
        role,
        boundAt: new Date().toISOString(),
        priority
      });
    }

    await this.writeAll(data);
  }

  /**
   * 移除域名绑定
   */
  async removeBinding(
    domainId: string,
    liveCodeId: string,
    role?: 'primary' | 'fallback'
  ): Promise<void> {
    const data = await this.readAll();

    if (!data.bindings[domainId]) {
      return;
    }

    if (role) {
      // 移除特定角色的绑定
      data.bindings[domainId].boundToLiveCodes =
        data.bindings[domainId].boundToLiveCodes.filter(
          b => !(b.liveCodeId === liveCodeId && b.role === role)
        );
    } else {
      // 移除该活码的所有绑定
      data.bindings[domainId].boundToLiveCodes =
        data.bindings[domainId].boundToLiveCodes.filter(
          b => b.liveCodeId !== liveCodeId
        );
    }

    // 如果没有绑定了，删除该域名记录
    if (data.bindings[domainId].boundToLiveCodes.length === 0) {
      delete data.bindings[domainId];
    }

    await this.writeAll(data);
  }

  /**
   * 获取域名的绑定信息
   */
  async getDomainBindingInfo(domainId: string, domain: string): Promise<DomainBindingInfo> {
    const data = await this.readAll();

    const binding = data.bindings[domainId] || {
      domainId,
      domain,
      boundToLiveCodes: []
    };

    return {
      domainId: binding.domainId,
      domain: binding.domain,
      boundToLiveCodes: binding.boundToLiveCodes
    };
  }

  /**
   * 获取所有绑定信息
   */
  async getAllBindings(): Promise<DomainBindingInfo[]> {
    const data = await this.readAll();

    return Object.values(data.bindings).map(binding => ({
      domainId: binding.domainId,
      domain: binding.domain,
      boundToLiveCodes: binding.boundToLiveCodes
    }));
  }

  /**
   * 更新活码名称（当活码名称修改时调用）
   */
  async updateLiveCodeName(liveCodeId: string, newName: string): Promise<void> {
    const data = await this.readAll();

    for (const domainId in data.bindings) {
      const binding = data.bindings[domainId];
      for (const liveCodeBinding of binding.boundToLiveCodes) {
        if (liveCodeBinding.liveCodeId === liveCodeId) {
          liveCodeBinding.liveCodeName = newName;
        }
      }
    }

    await this.writeAll(data);
  }

  /**
   * 删除活码时清理所有相关绑定
   */
  async removeLiveCodeBindings(liveCodeId: string): Promise<void> {
    const data = await this.readAll();

    for (const domainId in data.bindings) {
      data.bindings[domainId].boundToLiveCodes =
        data.bindings[domainId].boundToLiveCodes.filter(
          b => b.liveCodeId !== liveCodeId
        );

      // 如果没有绑定了，删除该域名记录
      if (data.bindings[domainId].boundToLiveCodes.length === 0) {
        delete data.bindings[domainId];
      }
    }

    await this.writeAll(data);
  }
}

// 导出单例
export const domainBindingsStorage = new DomainBindingsStorage();
