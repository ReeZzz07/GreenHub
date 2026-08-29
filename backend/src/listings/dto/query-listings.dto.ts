import { PlantType, LifeCycle, LightNeed, RootSystemType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryListingsDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sellerId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsIn(['newest', 'price_asc', 'price_desc'])
  sortBy?: 'newest' | 'price_asc' | 'price_desc';

  @IsOptional()
  @IsEnum(PlantType)
  plantType?: PlantType;

  @IsOptional()
  @IsEnum(LifeCycle)
  lifeCycle?: LifeCycle;

  @IsOptional()
  @IsEnum(LightNeed)
  lightNeed?: LightNeed;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  toxicToPets?: boolean;

  @IsOptional()
  @IsEnum(RootSystemType)
  rootSystemType?: RootSystemType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minHeight?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxHeight?: number;
}
