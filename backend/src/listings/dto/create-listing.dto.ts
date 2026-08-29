import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

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
}
