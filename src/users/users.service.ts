import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Address } from './entities/address.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,
  ) {}

  findAll(tenantId: string, query?: { role?: string; search?: string }) {
    const qb = this.usersRepo.createQueryBuilder('u')
      .where('u.tenantId = :tenantId', { tenantId })
      .andWhere('u.isActive = true')
      .select(['u.id', 'u.email', 'u.firstName', 'u.lastName', 'u.phone', 'u.whatsapp', 'u.role', 'u.avatarUrl', 'u.isVerified', 'u.createdAt'])
      .orderBy('u.createdAt', 'DESC');

    if (query?.role) qb.andWhere('u.role = :role', { role: query.role });
    if (query?.search) {
      qb.andWhere(
        "(LOWER(u.firstName || ' ' || u.lastName) LIKE :s OR LOWER(u.email) LIKE :s OR LOWER(u.phone) LIKE :s)",
        { s: `%${query.search.toLowerCase()}%` },
      );
    }
    return qb.getMany();
  }

  async findOne(id: string) {
    const user = await this.usersRepo.findOne({
      where: { id, isActive: true },
      select: ['id', 'email', 'firstName', 'lastName', 'phone', 'whatsapp', 'role', 'avatarUrl', 'isVerified', 'tenantId', 'createdAt'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: Partial<User>) {
    await this.usersRepo.update(id, { ...dto, updatedAt: new Date() });
    return this.findOne(id);
  }

  async getProfile(userId: string) {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'firstName', 'lastName', 'phone', 'whatsapp', 'role', 'avatarUrl', 'isVerified', 'tenantId', 'createdAt'],
    });
    if (!user) throw new NotFoundException('User not found');

    const addresses = await this.addressRepo.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });

    return { ...user, addresses };
  }

  // Address management
  async getAddresses(userId: string) {
    return this.addressRepo.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async createAddress(userId: string, dto: Partial<Address>) {
    if (dto.isDefault) {
      await this.addressRepo.update({ userId }, { isDefault: false });
    }
    const address = this.addressRepo.create({ ...dto, userId });
    return this.addressRepo.save(address);
  }

  async updateAddress(id: string, userId: string, dto: Partial<Address>) {
    if (dto.isDefault) {
      await this.addressRepo.update({ userId }, { isDefault: false });
    }
    await this.addressRepo.update({ id, userId }, dto);
    return this.addressRepo.findOne({ where: { id } });
  }

  async deleteAddress(id: string, userId: string) {
    await this.addressRepo.delete({ id, userId });
  }
}
