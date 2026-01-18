import 'dotenv/config';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import staticFiles from '@fastify/static';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerRoutes } from './routes/index.js';
import { domainPoolStorage } from './storage/domain-pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3001', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const fastify = Fastify({
  logger: {
    level: 'info'
  },
  bodyLimit: 10485760,
  disableRequestLogging: true
});

// 注册JWT 插件
await fastify.register(jwt, {
  secret: JWT_SECRET
});

// 认证中间件 - 扩展 FastifyInstance 类型
declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

fastify.decorate('authenticate', async function(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({
      success: false,
      message: '未授权，请先登录'
    });
  }
});

// 注册 CORS
await fastify.register(cors, {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});


 
// 注册所有路由
await registerRoutes(fastify);

// 域名池健康检查定时任务
let healthCheckTimer: NodeJS.Timeout | null = null;

async function runHealthCheck() {
  try {
    const config = await domainPoolStorage.getConfig();
    if (!config.isActive) {
      return;
    }

    const domains = await domainPoolStorage.getDomains();
    fastify.log.info(`[HealthCheck] Starting health check for ${domains.length} domains`);

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
          fastify.log.info(`[HealthCheck] ✅ ${domain.domain} - OK (${responseTime}ms)`);
        } else {
          await domainPoolStorage.recordDomainFailure(domain.id);
          fastify.log.warn(`[HealthCheck] ❌ ${domain.domain} - HTTP ${response.status}`);
        }
      } catch (error) {
        await domainPoolStorage.recordDomainFailure(domain.id);
        fastify.log.error(`[HealthCheck] ❌ ${domain.domain} - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    fastify.log.info(`[HealthCheck] Completed`);
  } catch (error) {
    fastify.log.error(`[HealthCheck] Error: ${error}`);
  }
}

async function startHealthCheck() {
  const config = await domainPoolStorage.getConfig();
  const interval = config.healthCheckInterval * 1000; // 转换为毫秒

  // 立即执行一次
  await runHealthCheck();

  // 设置定时任务
  healthCheckTimer = setInterval(runHealthCheck, interval);
  fastify.log.info(`[HealthCheck] Timer started, interval: ${config.healthCheckInterval}s`);
}

function stopHealthCheck() {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
    fastify.log.info('[HealthCheck] Timer stopped');
  }
}

// 启动服务器
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 LinkOS Admin Server running on http://localhost:${PORT}`);
    console.log(`📚 API 文档: http://localhost:${PORT}/health`);

    // 启动健康检查定时任务
    await startHealthCheck();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// 优雅关闭
fastify.addHook('onClose', async () => {
  console.log('👋 Server closing...');
  stopHealthCheck();
});

start();
