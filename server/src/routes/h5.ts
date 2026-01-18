import type { FastifyInstance } from 'fastify';
import { storage } from '../storage.js';
import type { LiveCode, SubCode } from '../types.js';

/**
 * H5 用户端路由
 */
export async function h5Routes(fastify: FastifyInstance) {
  // 获取活码展示内容
  fastify.get<{ Params: { id: string } }>(
    '/api/h5/live-code/:id',
    async (request, reply) => {
      const { id } = request.params;
      const liveCode = await storage.findById(id);

      // 活码不存在或已停用
      if (!liveCode || liveCode.status !== 'running') {
        reply.code(404);
        return {
          success: false,
          message: '二维码已失效或不存在',
          code: 404
        };
      }

      // 选择子码（根据分配模式）
      const subCode = selectSubCodeForDisplay(liveCode);

      // 更新访问统计
      await storage.incrementPv(id, subCode.id);

      // 返回展示内容
      return {
        success: true,
        data: {
          liveCodeId: id,
          title: liveCode.h5Title || liveCode.name || '扫码页面标题',
          qrCodeUrl: subCode.qrUrl,
          description: liveCode.h5Description || '添加微信好友',
          status: 'active'
        }
      };
    }
  );

  // H5 落地页路由（静态页面）
  fastify.get('/h5/landing', async (request, reply) => {
    return reply.sendFile('landing.html');
  });

  // H5 错误页路由（静态页面）
  fastify.get('/h5/error', async (request, reply) => {
    return reply.sendFile('error.html');
  });

  // 数据上报（可选）
  fastify.post('/api/h5/analytics', async (request, reply) => {
    const { liveCodeId, domainUsed, timestamp } = request.body as {
      liveCodeId?: string;
      domainUsed?: string;
      timestamp?: string;
    };

    // 简单记录日志（实际项目中可以存储到数据库或文件）
    fastify.log.info({
      msg: 'H5 Analytics',
      liveCodeId,
      domainUsed,
      timestamp,
      userAgent: request.headers['user-agent']
    });

    return { success: true };
  });
}

/**
 * 选择子码用于展示
 */
function selectSubCodeForDisplay(liveCode: LiveCode): SubCode {
  const { distributionMode, subCodes } = liveCode;
  const enabledSubCodes = subCodes.filter(s => s.status === 'enabled');

  if (enabledSubCodes.length === 0) {
    throw new Error('没有可用的子码');
  }

  switch (distributionMode) {
    case 'THRESHOLD':
      // 阈值模式：选择当前未达阈值的子码
      for (const sub of enabledSubCodes) {
        if (sub.currentPv < (sub.threshold || Infinity)) {
          return sub;
        }
      }
      return enabledSubCodes[0];

    case 'RANDOM':
      // 随机模式
      return enabledSubCodes[Math.floor(Math.random() * enabledSubCodes.length)];

    case 'FIXED':
    default:
      // 固定模式：返回第一个
      return enabledSubCodes[0];
  }
}
