import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class GenerateDescriptionDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @MinLength(2)
  categoryName: string;

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
}
