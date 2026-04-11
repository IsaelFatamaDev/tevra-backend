import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { TenantId, CurrentUser } from '../common/decorators/tenant.decorator';

@ApiTags('Media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private readonly service: MediaService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }, entityType: { type: 'string' }, entityId: { type: 'string' } } } })
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.service.upload(tenantId, user.sub, file, entityType, entityId);
  }

  @Get()
  findAll(
    @TenantId() tenantId: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.service.findAll(tenantId, entityType, entityId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
