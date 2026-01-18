import type { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.js';
import { liveCodeRoutes } from './live-codes.js';
import { uploadRoutes } from './upload.js';
import { domainPoolRoutes } from './domain-pool.js';

/**
 * 注册所有路由
 */
export async function registerRoutes(fastify: FastifyInstance) {
  // 认证路由
  await authRoutes(fastify);

  // 活码管理路由
  await liveCodeRoutes(fastify);

  // 文件上传路由
  await uploadRoutes(fastify);

  // 域名池管理路由
  await domainPoolRoutes(fastify);

  // 健康检查
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  });

  // 根路径
  fastify.get('/', async () => {
    return {
      name: 'LinkOS Admin Server',
      version: '1.0.0',
      status: 'running'
    };
  });
}
