import type { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.js';
import { liveCodeRoutes } from './live-codes.js';
import { uploadRoutes } from './upload.js';
import { domainPoolRoutes } from './domain-pool.js';
import { h5Routes } from './h5.js';
import { linkRoutes } from './link.js';

/**
 * 注册所有路由
 */
export async function registerRoutes(fastify: FastifyInstance) {
  // 活码访问入口（需要在其他路由之前注册）
  await linkRoutes(fastify);

  // 认证路由
  await authRoutes(fastify);

  // 活码管理路由
  await liveCodeRoutes(fastify);

  // 文件上传路由
  await uploadRoutes(fastify);

  // 域名池管理路由
  await domainPoolRoutes(fastify);

  // H5 用户端路由
  await h5Routes(fastify);

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
