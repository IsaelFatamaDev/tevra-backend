import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
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
  ) { }

  async register(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    whatsapp?: string;
    tenantId: string;
  }) {
    const exists = await this.usersRepo.findOne({
      where: { email: dto.email, tenantId: dto.tenantId },
    });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const { password, ...userData } = dto;
    const user = this.usersRepo.create({
      ...userData,
      passwordHash,
      role: UserRole.CUSTOMER,
      isActive: true,
    });
    const saved = await this.usersRepo.save(user);
    return this.generateTokens(saved as User);
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
