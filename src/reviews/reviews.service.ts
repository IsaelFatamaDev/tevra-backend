import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly repo: Repository<Review>,
  ) { }

  async findAll(tenantId: string, query?: {
    productId?: string;
    agentId?: string;
    search?: string;
    rating?: number;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const qb = this.repo.createQueryBuilder('r')
      .leftJoinAndSelect('r.reviewer', 'reviewer')
      .where('r.tenantId = :tenantId', { tenantId });

    // By default (public), only show approved reviews. Pass status='all' to see all.
    const statusFilter = query?.status;
    if (statusFilter === 'all') {
      // show every status (admin)
    } else if (statusFilter && statusFilter !== 'all') {
      qb.andWhere('r.status = :status', { status: statusFilter });
    } else {
      qb.andWhere('r.status = :status', { status: 'approved' });
    }

    if (query?.productId) qb.andWhere('r.productId = :productId', { productId: query.productId });
    if (query?.agentId) qb.andWhere('r.agentId = :agentId', { agentId: query.agentId });
    if (query?.rating) qb.andWhere('r.rating = :rating', { rating: query.rating });
    if (query?.search) {
      qb.andWhere(
        "(LOWER(r.title) LIKE :s OR LOWER(r.body) LIKE :s OR LOWER(reviewer.firstName || ' ' || reviewer.lastName) LIKE :s)",
        { s: `%${query.search.toLowerCase()}%` },
      );
    }

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
        status: r.status,
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
      where: { productId, status: 'approved' as any },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
    });
    const avgRating = reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;
    return {
      reviews: reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        isVerifiedPurchase: r.isVerifiedPurchase,
        helpfulCount: r.helpfulCount,
        reviewer: r.reviewer ? { firstName: r.reviewer.firstName, lastName: r.reviewer.lastName, avatarUrl: r.reviewer.avatarUrl } : null,
        createdAt: r.createdAt,
      })), avgRating: parseFloat(avgRating.toFixed(1)), total: reviews.length
    };
  }

  async findByAgent(agentId: string) {
    const reviews = await this.repo.find({
      where: { agentId, status: 'approved' as any },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
    });
    const avgRating = reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;
    return {
      reviews: reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        isVerifiedPurchase: r.isVerifiedPurchase,
        reviewer: r.reviewer ? { firstName: r.reviewer.firstName, lastName: r.reviewer.lastName, avatarUrl: r.reviewer.avatarUrl } : null,
        createdAt: r.createdAt,
      })), avgRating: parseFloat(avgRating.toFixed(1)), total: reviews.length
    };
  }

  async create(tenantId: string, reviewerId: string, dto: Partial<Review>) {
    const review = this.repo.create({ ...dto, tenantId, reviewerId, status: 'pending' as any });
    return this.repo.save(review);
  }

  async markHelpful(id: string) {
    await this.repo.increment({ id }, 'helpfulCount', 1);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: string, tenantId: string) {
    const review = await this.repo.findOne({ where: { id, tenantId } });
    if (!review) throw new NotFoundException('Review not found');
    await this.repo.remove(review);
    return { deleted: true };
  }

  async moderate(id: string, tenantId: string, action: 'approve' | 'reject') {
    const review = await this.repo.findOne({ where: { id, tenantId } });
    if (!review) throw new NotFoundException('Review not found');
    if (action === 'reject') {
      (review as any).status = 'rejected';
      return this.repo.save(review);
    }
    (review as any).status = 'approved';
    review.isVerifiedPurchase = true;
    return this.repo.save(review);
  }
}
