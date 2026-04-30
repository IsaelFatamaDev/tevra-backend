import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { MailService } from './mail.service';

class ContactDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(200)
  email: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  subject: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message: string;
}

@Controller('contact')
export class ContactController {
  constructor(private readonly mailService: MailService) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  async sendContact(@Body() dto: ContactDto) {
    await this.mailService.sendContactFormEmail(dto.name, dto.email, dto.subject, dto.message);
    return { ok: true };
  }
}
