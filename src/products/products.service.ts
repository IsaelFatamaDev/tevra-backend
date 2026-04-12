import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Brand } from './entities/brand.entity';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Brand)
    private readonly brandRepo: Repository<Brand>,
    private readonly storageService: StorageService,
  ) { }

  // === Products ===
  async findAllProducts(tenantId: string, query?: {
    categorySlug?: string;
    brandId?: string;
    search?: string;
    featured?: boolean;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
    includeInactive?: boolean;
  }) {
    const qb = this.productRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.brand', 'brand')
      .where('p.tenantId = :tenantId', { tenantId });

    if (!query?.includeInactive) {
      qb.andWhere('p.isActive = true');
    }

    if (query?.categorySlug) {
      qb.andWhere('category.slug = :slug', { slug: query.categorySlug });
    }
    if (query?.brandId) {
      qb.andWhere('p.brandId = :brandId', { brandId: query.brandId });
    }
    if (query?.search) {
      qb.andWhere('(p.name ILIKE :search OR p.description ILIKE :search)', { search: `%${query.search}%` });
    }
    if (query?.featured !== undefined) {
      qb.andWhere('p.isFeatured = :featured', { featured: query.featured });
    }
    if (query?.minPrice) {
      qb.andWhere('p.priceUsd >= :minPrice', { minPrice: query.minPrice });
    }
    if (query?.maxPrice) {
      qb.andWhere('p.priceUsd <= :maxPrice', { maxPrice: query.maxPrice });
    }

    // Sorting
    switch (query?.sortBy) {
      case 'price_asc': qb.orderBy('p.priceUsd', 'ASC'); break;
      case 'price_desc': qb.orderBy('p.priceUsd', 'DESC'); break;
      case 'newest': qb.orderBy('p.createdAt', 'DESC'); break;
      case 'popular': qb.orderBy('p.demandLevel', 'DESC'); break;
      default: qb.orderBy('p.isFeatured', 'DESC').addOrderBy('p.createdAt', 'DESC');
    }

    const page = query?.page || 1;
    const limit = query?.limit || 20;
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        priceUsd: p.priceUsd,
        priceRefLocal: p.priceRefLocal,
        images: p.images,
        tags: p.tags,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        demandLevel: p.demandLevel,
        stockStatus: p.stockStatus,
        marginPct: p.marginPct,
        category: p.category ? { id: p.category.id, name: p.category.name, slug: p.category.slug } : null,
        brand: p.brand ? { id: p.brand.id, name: p.brand.name, logoUrl: p.brand.logoUrl } : null,
        createdAt: p.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findProduct(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrSlug);
    const where = isUuid
      ? [{ id: idOrSlug }, { slug: idOrSlug }]
      : [{ slug: idOrSlug }];
    const product = await this.productRepo.findOne({
      where,
      relations: ['category', 'brand'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async createProduct(tenantId: string, dto: Partial<Product>) {
    if (dto.name && !dto.slug) {
      dto.slug = this.generateSlug(dto.name) + '-' + Date.now();
    }
    const product = this.productRepo.create({ ...dto, tenantId });
    return this.productRepo.save(product);
  }

  async updateProduct(id: string, dto: Partial<Product>) {
    if (dto.name && !dto.slug) {
      dto.slug = this.generateSlug(dto.name) + '-' + Date.now();
    }
    await this.productRepo.update(id, { ...dto, updatedAt: new Date() });
    return this.findProduct(id);
  }

  async deleteProduct(id: string) {
    await this.productRepo.update(id, { isActive: false, updatedAt: new Date() });
  }

  async toggleActive(id: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    product.isActive = !product.isActive;
    product.updatedAt = new Date();
    return this.productRepo.save(product);
  }

  async addProductImage(id: string, base64Image: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    let imageUrl: string;

    if (base64Image.startsWith('http://') || base64Image.startsWith('http://')) {
      imageUrl = base64Image;
    } else {
      const matches = base64Image.match(/^data:([a-zA-Z0-9+/]+\/[a-zA-Z0-9+/]+);base64,(.+)$/);
      if (!matches) throw new Error('Invalid base64 image format');
      const mimeType = matches[1];
      const ext = mimeType.split('/')[1].replace('jpeg', 'jpg');
      const buffer = Buffer.from(matches[2], 'base64');
      const { url } = await this.storageService.upload(buffer, `product.${ext}`, mimeType, 'products');
      imageUrl = url;
    }

    const existingImages = (product.images || []).filter(img => img.startsWith('http'));
    existingImages.push(imageUrl);
    await this.productRepo.update(id, { images: existingImages, updatedAt: new Date() });
    return this.findProduct(id);
  }

  async removeProductImage(id: string, index: number) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    const images = product.images || [];
    if (index >= 0 && index < images.length) {
      images.splice(index, 1);
      await this.productRepo.update(id, { images, updatedAt: new Date() });
    }
    return this.findProduct(id);
  }

  // === Categories ===
  findAllCategories(tenantId: string) {
    return this.categoryRepo.find({
      where: { tenantId, isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async findCategory(idOrSlug: string) {
    const cat = await this.categoryRepo.findOne({
      where: [{ id: idOrSlug }, { slug: idOrSlug }],
    });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async createCategory(tenantId: string, dto: Partial<Category>) {
    const cat = this.categoryRepo.create({ ...dto, tenantId });
    return this.categoryRepo.save(cat);
  }

  async updateCategory(id: string, dto: Partial<Category>) {
    await this.categoryRepo.update(id, { ...dto, updatedAt: new Date() });
    return this.findCategory(id);
  }

  // === Brands ===
  findAllBrands(tenantId: string) {
    return this.brandRepo.find({
      where: { tenantId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async createBrand(tenantId: string, dto: Partial<Brand>) {
    const brand = this.brandRepo.create({ ...dto, tenantId });
    return this.brandRepo.save(brand);
  }

  async updateBrand(id: string, dto: Partial<Brand>) {
    await this.brandRepo.update(id, dto);
    return this.brandRepo.findOne({ where: { id } });
  }

  async deleteBrand(id: string) {
    await this.brandRepo.update(id, { isActive: false, updatedAt: new Date() });
  }
}
