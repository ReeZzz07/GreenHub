import { PlantType, LifeCycle, LightNeed, RootSystemType } from '@prisma/client';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateListingDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  latinName?: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsInt()
  @Min(1)
  price: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsString({ each: true })
  videos?: string[];

  @IsOptional()
  @IsString()
  lightRequirements?: string;

  @IsOptional()
  @IsString()
  waterRequirements?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  careInstructions?: string[];

  @IsOptional()
  @IsString()
  deliveryInfo?: string;

  @IsOptional()
  @IsString()
  certificateUrl?: string;

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
  @IsBoolean()
  toxicToPets?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  ageMonths?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  heightCm?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  diameterCm?: number;

  @IsOptional()
  @IsEnum(RootSystemType)
  rootSystemType?: RootSystemType;

  @IsOptional()
  @IsInt()
  @Min(0)
  potVolumeL?: number;
}
