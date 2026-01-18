import type { FastifyInstance } from 'fastify';
import { storage } from '../storage.js';
import { domainPoolStorage } from '../storage/domain-pool.js';

/**
 * 活码访问入口 - 用户扫码后的第一个请求
 */
export async function linkRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Querystring: { id?: string };
  }>(
    '/api/link',
    async (request, reply) => {
      const { id } = request.query;

      // 参数验证
      if (!id) {
        // 没有 ID，重定向到错误页
        return reply.code(302).header('Location', '/h5/error.html').send();
      }

      // 获取活码
      const liveCode = await storage.findById(id);

      // 活码不存在或已停用 -> 404页面
      if (!liveCode || liveCode.status !== 'running') {
        return reply.code(302).header('Location', '/h5/error.html').send();
      }

      // 选择域名
      const domainSelection = await domainPoolStorage.selectDomainForLiveCode({
        primaryDomain: liveCode.domainConfig?.primaryDomain,
        fallbackDomainIds: liveCode.domainConfig?.fallbackDomains.domainIds,
        strategy: liveCode.domainConfig?.strategy || 'round-robin',
        failoverEnabled: liveCode.domainConfig?.fallbackDomains.failoverEnabled
      });

      // 没有可用域名 -> 404页面
      if (!domainSelection) {
        // 使用当前域名的错误页
        return reply.code(302).header('Location', '/h5/error.html').send();
      }

      // 重定向到落地页
      const landingUrl = `${domainSelection.protocol}://${domainSelection.domain}/h5/landing.html?id=${id}`;
      return reply.code(302).header('Location', landingUrl).send();
    }
  );
}
