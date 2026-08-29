import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { CategoryIconType } from '@prisma/client';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsEnum(CategoryIconType)
  iconType?: CategoryIconType;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsBoolean()
  requiresPhytosanitaryCertificate?: boolean;
}
