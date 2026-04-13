import { Controller, Post, Get, Body, Headers, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Get('check-availability')
  @ApiOperation({ summary: 'Check if email, phone or whatsapp is already taken' })
  checkAvailability(
    @Query('email') email: string,
    @Query('phone') phone: string,
    @Query('whatsapp') whatsapp: string,
    @Query('excludeUserId') excludeUserId: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.authService.checkAvailability({ email, phone, whatsapp, excludeUserId, tenantId });
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new customer' })
  register(
    @Body() dto: RegisterDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.authService.register({
      ...dto,
      tenantId: tenantId,
    });
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify user email with token' })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  login(
    @Body() dto: LoginDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.authService.login(
      dto.email,
      dto.password,
      tenantId,
    );
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  changePassword(
    @Request() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(req.user.id, body.currentPassword, body.newPassword);
  }
}
