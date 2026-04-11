import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from './entities/media.entity';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly repo: Repository<Media>,
    private readonly configService: ConfigService,
  ) {}

  async upload(tenantId: string, userId: string, file: Express.Multer.File, entityType?: string, entityId?: string) {
    const uploadPath = this.configService.get('UPLOAD_PATH', './uploads');
    const ext = path.extname(file.originalname);
    const filename = `${uuid()}${ext}`;
    const dir = path.join(uploadPath, tenantId);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(path.join(dir, filename), file.buffer);

    const media = this.repo.create({
      tenantId,
      uploadedBy: userId,
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      url: `/uploads/${tenantId}/${filename}`,
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
    const filePath = path.join(process.cwd(), media.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await this.repo.delete(id);
  }
}
