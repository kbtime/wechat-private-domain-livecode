import type { FastifyInstance } from 'fastify';
import type { LoginRequest, LoginResponse } from '../types.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

/**
 * 认证路由
 */
export async function authRoutes(fastify: FastifyInstance) {
  // 登录接口
  fastify.post<{
    Body: LoginRequest;
    Reply: LoginResponse;
  }>(
    '/api/admin/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['password'],
          properties: {
            password: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              token: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const { password } = request.body;

      // 验证密码
      if (password === ADMIN_PASSWORD) {
        // 生成 JWT token
        const token = fastify.jwt.sign({
          role: 'admin',
          timestamp: Date.now()
        });

        const response: LoginResponse = {
          success: true,
          token,
          message: '登录成功'
        };

        return response;
      }

      const response: LoginResponse = {
        success: false,
        message: '密码错误'
      };

      reply.code(401);
      return response;
    }
  );

  // 登出接口（可选，前端直接删除 token 即可）
  fastify.post(
    '/api/admin/logout',
    {
      onRequest: [fastify.authenticate],
      schema: {
        headers: {
          type: 'object',
          properties: {
            Authorization: { type: 'string' }
          },
          required: ['Authorization']
        }
      }
    },
    async (request, reply) => {
      return {
        success: true,
        message: '登出成功'
      };
    }
  );
}
