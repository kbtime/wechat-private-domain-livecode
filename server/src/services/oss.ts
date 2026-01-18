import OSS from 'ali-oss';
import * as path from 'path';

export interface OSSUploadResult {
  url: string;
  filename: string;
  size: number;
}

export class OSSService {
  private client: OSS;
  private bucket: string;
  private endpoint: string;
  private prefix: string;

  constructor() {
    const requiredEnvVars = [
      'OSS_ACCESS_KEY_ID',
      'OSS_ACCESS_KEY_SECRET',
      'OSS_ENDPOINT',
      'OSS_BUCKET',
      'OSS_BUCKET_PATH_PREFIX'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    this.bucket = process.env.OSS_BUCKET!;
    this.endpoint = process.env.OSS_ENDPOINT!;
    this.prefix = process.env.OSS_BUCKET_PATH_PREFIX!;

    // 使用 endpoint 而不是 region，确保正确的 OSS 地址
    this.client = new OSS({
      accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
      bucket: this.bucket,
      endpoint: this.endpoint,
      secure: true, // 使用 HTTPS
    });

    console.log(`OSS Service initialized for bucket: ${this.bucket}, prefix: ${this.prefix}`);
  }

  async uploadFile(buffer: Buffer, originalName: string, mimeType: string): Promise<OSSUploadResult> {
    try {
      const timestamp = Date.now();
      const ext = path.extname(originalName);
      const name = path.basename(originalName, ext);
      const filename = `${this.prefix}/${name}-${timestamp}${ext}`;

      const result = await this.client.put(filename, buffer, {
        headers: {
          'Content-Type': mimeType,
        },
      });

      if (!result || !result.url) {
        throw new Error('OSS upload failed: No URL returned');
      }

      console.log(`File uploaded to OSS: ${filename}, URL: ${result.url}`);

      return {
        url: result.url,
        filename: path.basename(filename),
        size: buffer.length,
      };
    } catch (error) {
      console.error('OSS upload error:', error);
      throw new Error(`Failed to upload file to OSS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteFile(filename: string): Promise<void> {
    try {
      const objectKey = `${this.prefix}/${filename}`;
      await this.client.delete(objectKey);
      console.log(`File deleted from OSS: ${objectKey}`);
    } catch (error) {
      console.error('OSS delete error:', error);
      throw new Error(`Failed to delete file from OSS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listFiles(): Promise<string[]> {
    try {
      const result = await this.client.list({
        prefix: `${this.prefix}/`,
        'max-keys': 1000,
      }, {});

      const files = result.objects?.map(obj => 
        obj.name?.replace(`${this.prefix}/`, '') || ''
      ).filter(Boolean) || [];

      return files;
    } catch (error) {
      console.error('OSS list error:', error);
      throw new Error(`Failed to list files from OSS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.client.listBuckets({});
      console.log('OSS connection test successful');
      return true;
    } catch (error) {
      console.error('OSS connection test failed:', error);
      return false;
    }
  }

  getPublicUrl(filename: string): string {
    return `https://${this.endpoint}/${this.bucket}/${this.prefix}/${filename}`;
  }
}

export const ossService = new OSSService();