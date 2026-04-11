import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Brand } from './entities/brand.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CategoriesController } from './categories.controller';
import { BrandsController } from './brands.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, Brand])],
  providers: [ProductsService],
  controllers: [ProductsController, CategoriesController, BrandsController],
  exports: [ProductsService],
})
export class ProductsModule {}
