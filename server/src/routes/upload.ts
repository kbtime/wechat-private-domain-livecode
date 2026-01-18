import type { FastifyInstance } from 'fastify';
import { ossService } from '../services/oss.js';

export async function uploadRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/admin/upload',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            file: {
              type: 'object',
              properties: {
                mimetype: { type: 'string' },
                buffer: { type: 'string' }
              }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const body = request.body as any;
        const { file } = body;

        if (!file) {
          const response = {
            success: false,
            message: '没有上传文件'
          };
          reply.code(400);
          return response;
        }

        const buffer = Buffer.from(file.buffer, 'base64');
        const originalName = `upload.${file.mimetype.split('/')[1] || 'png'}`;
        
        const result = await ossService.uploadFile(buffer, originalName, file.mimetype);

        const response = {
          success: true,
          data: {
            url: result.url,
            filename: result.filename
          },
          message: '图片上传成功'
        };

        reply.send(response);
      } catch (error) {
        fastify.log.error(error);
        const response = {
          success: false,
          message: '上传失败'
        };
        reply.code(500);
        return response;
      }
    }
  );

  fastify.get(
    '/api/admin/uploads',
    {
      onRequest: [fastify.authenticate]
    },
    async (request, reply) => {
      try {
        const files = await ossService.listFiles();

        const fileList = files.map(filename => ({
          filename,
          url: ossService.getPublicUrl(filename)
        }));

        const response = {
          success: true,
          data: fileList
        };

        reply.send(response);
      } catch (error) {
        fastify.log.error(error);
        const response = {
          success: false,
          message: '获取文件列表失败'
        };
        reply.code(500);
        return response;
      }
    }
  );
}
