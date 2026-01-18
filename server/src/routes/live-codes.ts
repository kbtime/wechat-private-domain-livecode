import type { FastifyInstance } from 'fastify';
import { storage } from '../storage.js';
import { domainPoolStorage } from '../storage/domain-pool.js';
import { domainBindingsStorage } from '../storage/domain-bindings.js';
import type {
  LiveCode,
  CreateLiveCodeRequest,
  UpdateLiveCodeRequest,
  ApiResponse,
  Statistics,
  DomainConfig,
  UpdateDomainConfigRequest,
  BindPrimaryDomainRequest,
  UnbindPrimaryDomainRequest
} from '../types.js';

/**
 * 活码管理路由
 */
export async function liveCodeRoutes(fastify: FastifyInstance) {
  // 获取所有活码
  fastify.get(
    '/api/admin/live-codes',
    {
      onRequest: [fastify.authenticate],
      schema: {
        headers: {
          type: 'object',
          properties: {
            Authorization: { type: 'string' }
          },
          required: ['Authorization']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    status: { type: 'string' },
                    distributionMode: { type: 'string' },
                    totalPv: { type: 'number' },
                    mainUrl: { type: 'string' },
                    subCodes: { type: 'array' }
                  }
                }
              }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const liveCodes = await storage.readAll();
      const response: ApiResponse<LiveCode[]> = {
        success: true,
        data: liveCodes
      };
      return response;
    }
  );

  // 获取单个活码详情
  fastify.get<{ Params: { id: string } }>(
    '/api/admin/live-codes/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      const { id } = request.params;
      const liveCode = await storage.findById(id);

      if (!liveCode) {
        const response: ApiResponse = {
          success: false,
          message: '活码不存在'
        };
        reply.code(404);
        return response;
      }

      const response: ApiResponse<LiveCode> = {
        success: true,
        data: liveCode
      };
      return response;
    }
  );

  // 创建新活码
  fastify.post<{ Body: CreateLiveCodeRequest }>(
    '/api/admin/live-codes',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['name', 'distributionMode', 'subCodes'],
          properties: {
            name: { type: 'string' },
            distributionMode: { type: 'string', enum: ['THRESHOLD', 'RANDOM', 'FIXED'] },
            subCodes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  qrUrl: { type: 'string' },
                  threshold: { type: 'number' },
                  weight: { type: 'number' },
                  status: { type: 'string', enum: ['enabled', 'disabled'] }
                }
              }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const body = request.body;

      // 验证
      if (!body.name || body.name.trim() === '') {
        const response: ApiResponse = {
          success: false,
          message: '活码名称不能为空'
        };
        reply.code(400);
        return response;
      }

      if (!body.subCodes || body.subCodes.length === 0) {
        const response: ApiResponse = {
          success: false,
          message: '至少需要一个子码'
        };
        reply.code(400);
        return response;
      }

      const newLiveCode = await storage.create(body);
      const response: ApiResponse<LiveCode> = {
        success: true,
        data: newLiveCode,
        message: '活码创建成功'
      };
      reply.code(201);
      return response;
    }
  );

  // 更新活码
  fastify.put<{ Params: { id: string }; Body: UpdateLiveCodeRequest }>(
    '/api/admin/live-codes/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            distributionMode: { type: 'string', enum: ['THRESHOLD', 'RANDOM', 'FIXED'] },
            status: { type: 'string', enum: ['running', 'paused'] },
            subCodes: { type: 'array' }
          }
        }
      }
    },
    async (request, reply) => {
      const { id } = request.params;
      const updates = request.body;

      const updatedLiveCode = await storage.update(id, updates);

      if (!updatedLiveCode) {
        const response: ApiResponse = {
          success: false,
          message: '活码不存在'
        };
        reply.code(404);
        return response;
      }

      const response: ApiResponse<LiveCode> = {
        success: true,
        data: updatedLiveCode,
        message: '活码更新成功'
      };
      return response;
    }
  );

  // 删除活码
  fastify.delete<{ Params: { id: string } }>(
    '/api/admin/live-codes/:id',
    {
      onRequest: [fastify.authenticate]
    },
    async (request, reply) => {
      const { id } = request.params;
      const deleted = await storage.delete(id);

      if (!deleted) {
        const response: ApiResponse = {
          success: false,
          message: '活码不存在'
        };
        reply.code(404);
        return response;
      }

      const response: ApiResponse = {
        success: true,
        message: '活码删除成功'
      };
      return response;
    }
  );

  // 生成/获取推广码
  fastify.get<{ Params: { id: string } }>(
    '/api/admin/live-codes/:id/promotion-code',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      const { id } = request.params;
      const liveCode = await storage.findById(id);

      if (!liveCode) {
        const response: ApiResponse = {
          success: false,
          message: '活码不存在'
        };
        reply.code(404);
        return response;
      }

      // 返回推广信息（使用 mainUrl 作为推广链接）
      const response: ApiResponse<{
        shortUrl: string;
        qrCode: string;
      }> = {
        success: true,
        data: {
          shortUrl: liveCode.mainUrl,
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(liveCode.mainUrl)}`
        }
      };
      return response;
    }
  );

  // 获取数据统计（简单实现）
  fastify.get<{ Params: { id: string } }>(
    '/api/admin/live-codes/:id/statistics',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      const { id } = request.params;
      const liveCode = await storage.findById(id);

      if (!liveCode) {
        const response: ApiResponse = {
          success: false,
          message: '活码不存在'
        };
        reply.code(404);
        return response;
      }

      // 简单的统计数据（实际项目中可以从访问日志中统计）
      const statistics: Statistics = {
        liveCodeId: id,
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        },
        metrics: {
          totalPV: liveCode.totalPv,
          totalUV: Math.floor(liveCode.totalPv * 0.8), // 简单估算
          conversionRate: 18.5
        },
        trends: [
          { date: 'Mon', pv: 400, uv: 320 },
          { date: 'Tue', pv: 300, uv: 240 },
          { date: 'Wed', pv: 200, uv: 160 },
          { date: 'Thu', pv: 278, uv: 222 },
          { date: 'Fri', pv: 189, uv: 151 },
          { date: 'Sat', pv: 239, uv: 191 },
          { date: 'Sun', pv: 349, uv: 279 }
        ]
      };

      const response: ApiResponse<Statistics> = {
        success: true,
        data: statistics
      };
      return response;
    }
  );

  // ========== 域名配置相关 API ==========

  // 获取活码的域名配置
  fastify.get<{ Params: { id: string } }>(
    '/api/admin/live-codes/:id/domain-config',
    {
      onRequest: [fastify.authenticate]
    },
    async (request, reply) => {
      const { id } = request.params;
      const liveCode = await storage.findById(id);

      if (!liveCode) {
        const response: ApiResponse = {
          success: false,
          message: '活码不存在'
        };
        reply.code(404);
        return response;
      }

      // 返回域名配置，如果不存在则返回默认配置
      const domainConfig = liveCode.domainConfig || {
        mode: 'CUSTOM_DOMAINS',
        fallbackDomains: {
          domainIds: [],
          priority: [],
          updatedAt: new Date().toISOString(),
          failoverEnabled: false
        },
        strategy: 'round-robin'
      };

      const response: ApiResponse<DomainConfig> = {
        success: true,
        data: domainConfig
      };
      return response;
    }
  );

  // 更新域名配置（备用域名、策略等，不包括主域名）
  fastify.put<{ Params: { id: string }; Body: UpdateDomainConfigRequest }>(
    '/api/admin/live-codes/:id/domain-config',
    {
      onRequest: [fastify.authenticate]
    },
    async (request, reply) => {
      const { id } = request.params;
      const updates = request.body;

      const liveCode = await storage.findById(id);
      if (!liveCode) {
        const response: ApiResponse = {
          success: false,
          message: '活码不存在'
        };
        reply.code(404);
        return response;
      }

      // 更新备用域名配置
      const domainConfig = await storage.updateDomainConfig(id, updates);

      // 更新域名绑定记录
      if (updates.fallbackDomains) {
        // 先移除旧的备用域名绑定
        const oldConfig = liveCode.domainConfig;
        if (oldConfig?.fallbackDomains.domainIds) {
          for (const oldDomainId of oldConfig.fallbackDomains.domainIds) {
            await domainBindingsStorage.removeBinding(oldDomainId, id, 'fallback');
          }
        }

        // 添加新的备用域名绑定
        for (let i = 0; i < updates.fallbackDomains.domainIds.length; i++) {
          const domainId = updates.fallbackDomains.domainIds[i];
          const domain = await domainPoolStorage.findDomainById(domainId);
          if (domain) {
            await domainBindingsStorage.recordBinding(
              domainId,
              domain.domain,
              id,
              liveCode.name,
              'fallback',
              updates.fallbackDomains.priority[i]
            );
          }
        }
      }

      const response: ApiResponse<DomainConfig> = {
        success: true,
        data: domainConfig || null,
        message: '域名配置更新成功'
      };
      return response;
    }
  );

  // 绑定主域名（不可逆操作）
  fastify.post<{ Params: { id: string }; Body: BindPrimaryDomainRequest }>(
    '/api/admin/live-codes/:id/domain-config/primary',
    {
      onRequest: [fastify.authenticate]
    },
    async (request, reply) => {
      const { id } = request.params;
      const body = request.body;

      if (!body.confirmed) {
        const response: ApiResponse = {
          success: false,
          message: '必须确认才能绑定主域名'
        };
        reply.code(400);
        return response;
      }

      const liveCode = await storage.findById(id);
      if (!liveCode) {
        const response: ApiResponse = {
          success: false,
          message: '活码不存在'
        };
        reply.code(404);
        return response;
      }

      // 检查是否已经绑定了主域名
      if (liveCode.domainConfig?.primaryDomain?.locked) {
        const response: ApiResponse = {
          success: false,
          message: '主域名已锁定，无法重新绑定'
        };
        reply.code(400);
        return response;
      }

      // 获取域名信息
      const domain = await domainPoolStorage.findDomainById(body.domainId);
      if (!domain) {
        const response: ApiResponse = {
          success: false,
          message: '域名不存在'
        };
        reply.code(404);
        return response;
      }

      if (domain.status !== 'active') {
        const response: ApiResponse = {
          success: false,
          message: '只能绑定活跃状态的域名'
        };
        reply.code(400);
        return response;
      }

      // 绑定主域名
      const domainConfig = await storage.bindPrimaryDomain(id, body, {
        domain: domain.domain,
        protocol: domain.protocol
      });

      // 记录绑定关系
      await domainBindingsStorage.recordBinding(
        body.domainId,
        domain.domain,
        id,
        liveCode.name,
        'primary'
      );

      const response: ApiResponse<DomainConfig> = {
        success: true,
        data: domainConfig || null,
        message: '主域名绑定成功'
      };
      return response;
    }
  );

  // 解绑主域名（仅管理员，需强制确认）
  fastify.delete<{ Params: { id: string }; Body: UnbindPrimaryDomainRequest }>(
    '/api/admin/live-codes/:id/domain-config/primary',
    {
      onRequest: [fastify.authenticate]
    },
    async (request, reply) => {
      const { id } = request.params;
      const body = request.body;

      const liveCode = await storage.findById(id);
      if (!liveCode) {
        const response: ApiResponse = {
          success: false,
          message: '活码不存在'
        };
        reply.code(404);
        return response;
      }

      try {
        // 解绑主域名
        const domainConfig = await storage.unbindPrimaryDomain(
          id,
          body.forceUnbind,
          body.confirmationCode
        );

        // 移除绑定记录
        if (liveCode.domainConfig?.primaryDomain) {
          await domainBindingsStorage.removeBinding(
            liveCode.domainConfig.primaryDomain.domainId,
            id,
            'primary'
          );
        }

        const response: ApiResponse<DomainConfig> = {
          success: true,
          data: domainConfig || null,
          message: '主域名解绑成功'
        };
        return response;
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          message: error instanceof Error ? error.message : '解绑失败'
        };
        reply.code(400);
        return response;
      }
    }
  );
}
