import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly repo: Repository<Review>,
  ) {}

  async findAll(tenantId: string, query?: {
    productId?: string;
    agentId?: string;
    page?: number;
    limit?: number;
  }) {
    const qb = this.repo.createQueryBuilder('r')
      .leftJoinAndSelect('r.reviewer', 'reviewer')
      .where('r.tenantId = :tenantId', { tenantId });

    if (query?.productId) qb.andWhere('r.productId = :productId', { productId: query.productId });
    if (query?.agentId) qb.andWhere('r.agentId = :agentId', { agentId: query.agentId });

    qb.orderBy('r.createdAt', 'DESC');

    const page = query?.page || 1;
    const limit = query?.limit || 20;
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map(r => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        isVerifiedPurchase: r.isVerifiedPurchase,
        helpfulCount: r.helpfulCount,
        reviewer: r.reviewer ? {
          id: r.reviewer.id,
          firstName: r.reviewer.firstName,
          lastName: r.reviewer.lastName,
          avatarUrl: r.reviewer.avatarUrl,
        } : null,
        productId: r.productId,
        agentId: r.agentId,
        createdAt: r.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  async findByProduct(productId: string) {
    const reviews = await this.repo.find({
      where: { productId },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
    });
    const avgRating = reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;
    return { reviews: reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      isVerifiedPurchase: r.isVerifiedPurchase,
      helpfulCount: r.helpfulCount,
      reviewer: r.reviewer ? { firstName: r.reviewer.firstName, lastName: r.reviewer.lastName, avatarUrl: r.reviewer.avatarUrl } : null,
      createdAt: r.createdAt,
    })), avgRating: parseFloat(avgRating.toFixed(1)), total: reviews.length };
  }

  async findByAgent(agentId: string) {
    const reviews = await this.repo.find({
      where: { agentId },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
    });
    const avgRating = reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;
    return { reviews: reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      isVerifiedPurchase: r.isVerifiedPurchase,
      reviewer: r.reviewer ? { firstName: r.reviewer.firstName, lastName: r.reviewer.lastName, avatarUrl: r.reviewer.avatarUrl } : null,
      createdAt: r.createdAt,
    })), avgRating: parseFloat(avgRating.toFixed(1)), total: reviews.length };
  }

  async create(tenantId: string, reviewerId: string, dto: Partial<Review>) {
    const review = this.repo.create({ ...dto, tenantId, reviewerId });
    return this.repo.save(review);
  }

  async markHelpful(id: string) {
    await this.repo.increment({ id }, 'helpfulCount', 1);
    return this.repo.findOne({ where: { id } });
  }
}
