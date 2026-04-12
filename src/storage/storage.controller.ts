import { Controller, Get, Param, Res, StreamableFile, Logger, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { StorageService } from './storage.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Storage Storage Proxy')
@Controller('storage')
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(private readonly storageService: StorageService) { }

  @Get(':bucket/*')
  @ApiOperation({ summary: 'Proxy secure image from MinIO to avoid Mixed Content' })
  async proxyImage(
    @Param('bucket') bucket: string,
    @Param('0') path: string,
    @Res() res: Response,
  ) {
    try {
      if (bucket !== this.storageService['bucket']) {
        throw new NotFoundException('Bucket not found');
      }

      const fileData = await this.storageService.getObject(path);

      if (fileData.ContentType) {
        res.set('Content-Type', fileData.ContentType);
      }
      if (fileData.ContentLength) {
        res.set('Content-Length', fileData.ContentLength.toString());
      }
      res.set('Cache-Control', 'public, max-age=31536000');

      (fileData.Body as any).pipe(res);
    } catch (err) {
      this.logger.error(`Error delegating file ${path}: ${err.message}`);
      res.status(404).send('Image not found');
    }
  }
}
