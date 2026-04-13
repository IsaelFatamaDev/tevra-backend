import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRegisteredEvent } from '../common/events/user-registered.event';
import { User, UserRole } from '../users/entities/user.entity';
import { Agent, AgentStatus } from '../agents/entities/agent.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Agent)
    private readonly agentsRepo: Repository<Agent>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async checkAvailability(params: {
    email?: string;
    phone?: string;
    whatsapp?: string;
    excludeUserId?: string;
    tenantId: string;
  }) {
    const { email, phone, whatsapp, excludeUserId, tenantId } = params;
    const result: { email?: string; phone?: string; whatsapp?: string } = {};

    if (email) {
      const where: any = { email, tenantId };
      if (excludeUserId) where.id = Not(excludeUserId);
      const found = await this.usersRepo.findOne({ where });
      if (found) result.email = 'El email ya está registrado';
    }

    if (phone) {
      const where: any = { phone, tenantId };
      if (excludeUserId) where.id = Not(excludeUserId);
      const found = await this.usersRepo.findOne({ where });
      if (found) result.phone = 'El número de teléfono ya está registrado';
    }

    if (whatsapp) {
      const where: any = { whatsapp, tenantId };
      if (excludeUserId) where.id = Not(excludeUserId);
      const found = await this.usersRepo.findOne({ where });
      if (found) result.whatsapp = 'El número de WhatsApp ya está registrado';
    }

    return result;
  }

  async register(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    whatsapp?: string;
    tenantId: string;
  }) {
    // Validate email uniqueness
    const emailExists = await this.usersRepo.findOne({
      where: { email: dto.email, tenantId: dto.tenantId },
    });
    if (emailExists) throw new ConflictException('El email ya está registrado');

    // Validate phone uniqueness
    if (dto.phone) {
      const phoneExists = await this.usersRepo.findOne({
        where: { phone: dto.phone, tenantId: dto.tenantId },
      });
      if (phoneExists) throw new ConflictException('El número de teléfono ya está registrado');
    }

    // Validate whatsapp uniqueness
    if (dto.whatsapp) {
      const whatsappExists = await this.usersRepo.findOne({
        where: { whatsapp: dto.whatsapp, tenantId: dto.tenantId },
      });
      if (whatsappExists) throw new ConflictException('El número de WhatsApp ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const verificationToken = randomUUID();
    const { password, ...userData } = dto;
    const user = this.usersRepo.create({
      ...userData,
      passwordHash,
      role: UserRole.CUSTOMER,
      isActive: true,
      isVerified: false,
      verificationToken,
    });
    const saved = await this.usersRepo.save(user);

    // Emit event for email notification (includes plain password for first welcome email only)
    this.eventEmitter.emit(
      'user.registered',
      new UserRegisteredEvent(
        (saved as User).email,
        (saved as User).firstName,
        dto.password,
        verificationToken,
        (saved as User).tenantId,
      ),
    );

    return {
      message: 'Account created successfully. Please check your email to verify your account before logging in.',
    };
  }

  async login(email: string, password: string, tenantId: string) {
    const user = await this.usersRepo.findOne({
      where: { email, tenantId, isActive: true },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // Block unverified customers from logging in
    if (user.role === UserRole.CUSTOMER && !user.isVerified) {
      throw new UnauthorizedException('Your account has not been verified. Please check your email and click the verification link.');
    }

    if (user.role === UserRole.AGENT) {
      const agent = await this.agentsRepo.findOne({ where: { userId: user.id } });
      if (!agent || agent.status !== AgentStatus.ACTIVE) {
        throw new UnauthorizedException('Tu cuenta de agente está inactiva o suspendida.');
      }
    }

    user.lastLoginAt = new Date();
    await this.usersRepo.save(user);

    return this.generateTokens(user);
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.usersRepo.findOne({
        where: { id: payload.sub, isActive: true },
      });
      if (!user) throw new UnauthorizedException();
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { id: userId, isActive: true },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid user');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    if (newPassword.length < 6) throw new BadRequestException('New password must be at least 6 characters');

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.usersRepo.save(user);
    return { message: 'Password changed successfully' };
  }

  async verifyEmail(token: string) {
    const user = await this.usersRepo.findOne({
      where: { verificationToken: token },
    });
    if (!user) throw new BadRequestException('Invalid or expired verification token.');

    user.isVerified = true;
    user.verificationToken = null;
    await this.usersRepo.save(user);

    return { message: 'Your account has been verified successfully. You can now log in.' };
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d'),
    });

    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await this.usersRepo.update(user.id, { refreshTokenHash: refreshHash });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        tenantId: user.tenantId,
      },
    };
  }
}
