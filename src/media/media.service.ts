import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from './entities/media.entity';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../storage/storage.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

@Injectable()
export class MediaService {
  private readonly useMinIO: boolean;
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectRepository(Media)
    private readonly repo: Repository<Media>,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {
    this.useMinIO = !!this.configService.get('MINIO_ACCESS_KEY');
  }

  async upload(tenantId: string, userId: string, file: Express.Multer.File, entityType?: string, entityId?: string) {
    let url: string;
    let storageKey: string | undefined;

    if (this.useMinIO) {
      const folder = `${tenantId}/${entityType || 'general'}`;
      const result = await this.storageService.upload(file.buffer, file.originalname, file.mimetype, folder);
      url = result.url;
      storageKey = result.key;
      this.logger.log(`Uploaded to MinIO: ${storageKey}`);
    } else {
      const uploadPath = this.configService.get('UPLOAD_PATH', './uploads');
      const ext = path.extname(file.originalname);
      const filename = `${uuid()}${ext}`;
      const dir = path.join(uploadPath, tenantId);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(path.join(dir, filename), file.buffer);
      url = `/uploads/${tenantId}/${filename}`;
    }

    const media = this.repo.create({
      tenantId,
      uploadedBy: userId,
      filename: storageKey || path.basename(url),
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      url,
      entityType,
      entityId,
    });

    return this.repo.save(media);
  }

  findAll(tenantId: string, entityType?: string, entityId?: string) {
    const where: any = { tenantId };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const media = await this.repo.findOne({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');
    return media;
  }

  async delete(id: string) {
    const media = await this.findOne(id);
    if (this.useMinIO && media.filename.includes('/')) {
      await this.storageService.delete(media.filename);
    } else {
      const filePath = path.join(process.cwd(), media.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await this.repo.delete(id);
  }
}
