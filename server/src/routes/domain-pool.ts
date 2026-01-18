import type { FastifyInstance } from 'fastify';
import type {
  ApiResponse,
  DomainPoolData,
  DomainPoolStatistics,
  AddDomainRequest,
  UpdateDomainRequest,
  UpdatePoolConfigRequest,
  HealthCheckResult,
  DomainBindingInfo
} from '../types.js';
import { domainPoolStorage } from '../storage/domain-pool.js';
import { domainBindingsStorage } from '../storage/domain-bindings.js';

/**
 * 域名池管理路由
 */
export async function domainPoolRoutes(fastify: FastifyInstance) {
  // 获取域名池配置和统计
  fastify.get('/api/admin/domain-pool', {
    onRequest: [fastify.authenticate]
  },
  async (request, reply) => {
    try {
      const config = await domainPoolStorage.getConfig();
      const statistics = await domainPoolStorage.getStatistics();

      fastify.log.info(`[DomainPool] Config: ${JSON.stringify(config)}`);
      fastify.log.info(`[DomainPool] Statistics: ${JSON.stringify(statistics)}`);

      reply.send({
        success: true,
        data: { config, statistics }
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        message: '获取域名池配置失败'
      });
    }
  }
);

  // 更新域名池配置
  fastify.put<{
    Body: UpdatePoolConfigRequest;
    Reply: ApiResponse<DomainPoolData['config']>;
  }>(
    '/api/admin/domain-pool/config',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            strategy: { type: 'string', enum: ['round-robin', 'random', 'weighted'] },
            maxFailures: { type: 'number' },
            healthCheckInterval: { type: 'number' },
            retryInterval: { type: 'number' },
            isActive: { type: 'boolean' }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const config = await domainPoolStorage.updateConfig(request.body);
        reply.send({
          success: true,
          data: config
        });
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({
          success: false,
          message: '更新域名池配置失败'
        });
      }
    }
  );

  // 获取所有域名
  fastify.get<{
    Reply: ApiResponse<DomainPoolData['domains']>;
  }>(
    '/api/admin/domain-pool/domains',
    {
      onRequest: [fastify.authenticate]
    },
    async (request, reply) => {
      try {
        const domains = await domainPoolStorage.getDomains();
        reply.send({
          success: true,
          data: domains
        });
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({
          success: false,
          message: '获取域名列表失败'
        });
      }
    }
  );

  // 添加域名
  fastify.post<{
    Body: AddDomainRequest;
    Reply: ApiResponse<DomainPoolData['domains'][number]>;
  }>(
    '/api/admin/domain-pool/domains',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['domain', 'protocol'],
          properties: {
            domain: { type: 'string' },
            protocol: { type: 'string', enum: ['http', 'https'] },
            weight: { type: 'number' },
            order: { type: 'number' },
            healthCheckUrl: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const domain = await domainPoolStorage.addDomain(request.body);
        reply.send({
          success: true,
          data: domain
        });
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({
          success: false,
          message: '添加域名失败'
        });
      }
    }
  );

  // 更新域名
  fastify.put<{
    Params: { id: string };
    Body: UpdateDomainRequest;
    Reply: ApiResponse<DomainPoolData['domains'][number]>;
  }>(
    '/api/admin/domain-pool/domains/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          properties: {
            domain: { type: 'string' },
            protocol: { type: 'string', enum: ['http', 'https'] },
            status: { type: 'string', enum: ['active', 'inactive', 'banned', 'testing'] },
            weight: { type: 'number' },
            order: { type: 'number' },
            healthCheckUrl: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const domain = await domainPoolStorage.updateDomain(id, request.body);

        if (!domain) {
          reply.code(404).send({
            success: false,
            message: '域名不存在'
          });
          return;
        }

        reply.send({
          success: true,
          data: domain
        });
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({
          success: false,
          message: '更新域名失败'
        });
      }
    }
  );

  // 删除域名
  fastify.delete<{
    Params: { id: string };
    Reply: ApiResponse;
  }>(
    '/api/admin/domain-pool/domains/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const success = await domainPoolStorage.deleteDomain(id);

        if (!success) {
          reply.code(404).send({
            success: false,
            message: '域名不存在'
          });
          return;
        }

        reply.send({
          success: true,
          message: '域名删除成功'
        });
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({
          success: false,
          message: '删除域名失败'
        });
      }
    }
  );

  // 切换域名状态
  fastify.post<{
    Params: { id: string };
    Reply: ApiResponse<DomainPoolData['domains'][number]>;
  }>(
    '/api/admin/domain-pool/domains/:id/toggle',
    {
      onRequest: [fastify.authenticate]
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const domain = await domainPoolStorage.toggleDomainStatus(id);

        if (!domain) {
          reply.code(404).send({
            success: false,
            message: '域名不存在'
          });
          return;
        }

        reply.send({
          success: true,
          data: domain
        });
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({
          success: false,
          message: '切换域名状态失败'
        });
      }
    }
  );

  // 手动健康检查
  fastify.post('/api/admin/domain-pool/health-check', {
    onRequest: [fastify.authenticate]
  },
  async (request, reply) => {
    try {
      const domains = await domainPoolStorage.getDomains();
      const results: HealthCheckResult[] = [];

      for (const domain of domains) {
        const startTime = Date.now();
        try {
          const url = `${domain.protocol}://${domain.domain}${domain.healthCheckUrl || '/health'}`;
          const response = await fetch(url, {
            method: 'GET',
            signal: AbortSignal.timeout(10000) // 10秒超时
          });

          const responseTime = Date.now() - startTime;

          if (response.ok) {
            await domainPoolStorage.resetDomainFailure(domain.id);
            results.push({
              domainId: domain.id,
              domain: domain.domain,
              status: 'ok',
              responseTime
            });
          } else {
            await domainPoolStorage.recordDomainFailure(domain.id);
            results.push({
              domainId: domain.id,
              domain: domain.domain,
              status: 'failed',
              responseTime,
              error: `HTTP ${response.status}`
            });
          }
        } catch (error) {
          await domainPoolStorage.recordDomainFailure(domain.id);
          results.push({
            domainId: domain.id,
            domain: domain.domain,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const healthy = results.filter(r => r.status === 'ok').length;
      const unhealthy = results.filter(r => r.status === 'failed').length;

      reply.send({
        success: true,
        data: {
          checked: results.length,
          healthy,
          unhealthy,
          results
        }
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        message: '健康检查失败'
      });
    }
  }
);

  // 选择可用域名（供跳转使用）
  fastify.get<{
    Reply: ApiResponse<{
      domain: string;
      fullUrl: string;
    }>;
  }>(
    '/api/admin/domain-pool/select',
    async (request, reply) => {
      try {
        const selection = await domainPoolStorage.selectDomain();

        if (!selection) {
          reply.code(404).send({
            success: false,
            message: '没有可用的域名'
          });
          return;
        }

        reply.send({
          success: true,
          data: {
            domain: selection.domain,
            fullUrl: selection.fullUrl
          }
        });
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({
          success: false,
          message: '选择域名失败'
        });
      }
    }
  );

  // 查询域名被哪些活码绑定
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<DomainBindingInfo>;
  }>(
    '/api/admin/domain-pool/domains/:id/binding-info',
    {
      onRequest: [fastify.authenticate]
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const domain = await domainPoolStorage.findDomainById(id);

        if (!domain) {
          reply.code(404).send({
            success: false,
            message: '域名不存在'
          });
          return;
        }

        const bindingInfo = await domainBindingsStorage.getDomainBindingInfo(id, domain.domain);

        reply.send({
          success: true,
          data: bindingInfo
        });
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({
          success: false,
          message: '获取域名绑定信息失败'
        });
      }
    }
  );
}