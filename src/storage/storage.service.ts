import { Injectable, Logger, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import * as path from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get('MINIO_ENDPOINT');
    this.bucket = this.configService.get('MINIO_BUCKET', 'tevra');

    this.s3 = new S3Client({
      endpoint: this.endpoint,
      region: this.configService.get('MINIO_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get('MINIO_ACCESS_KEY', ''),
        secretAccessKey: this.configService.get('MINIO_SECRET_KEY', ''),
      },
      forcePathStyle: true,
    });
  }

  async onModuleInit() {
    try {
      const policy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        }],
      });
      await this.s3.send(new PutBucketPolicyCommand({ Bucket: this.bucket, Policy: policy }));
      this.logger.log(`Bucket "${this.bucket}" set to public read`);
    } catch (err) {
      this.logger.warn(`Could not set bucket policy: ${err.message}`);
    }
  }

  async upload(
    file: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'uploads',
  ): Promise<{ key: string; url: string }> {
    const ext = path.extname(originalName);
    const key = `${folder}/${uuid()}${ext}`;

    this.logger.log(`Uploading to MinIO: endpoint=${this.endpoint}, bucket=${this.bucket}, key=${key}`);

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file,
          ContentType: mimeType,
        }),
      );
    } catch (err) {
      this.logger.error(`MinIO upload failed: ${err.message}`, err.stack);
      throw new InternalServerErrorException(`Error de MinIO (Posible desincronización de reloj en PC local): ${err.message}`);
    }

    const url = `${this.endpoint}/${this.bucket}/${key}`;
    this.logger.log(`Uploaded successfully: ${url}`);
    return { key, url };
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    this.logger.log(`Deleted ${key} from MinIO`);
  }

  async getObject(key: string) {
    const response = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    return response;
  }

  getPublicUrl(key: string): string {
    return `${this.endpoint}/${this.bucket}/${key}`;
  }
}
