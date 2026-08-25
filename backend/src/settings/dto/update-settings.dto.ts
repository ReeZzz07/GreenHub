import { IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  YOOKASSA_SHOP_ID?: string;

  @IsOptional()
  @IsString()
  YOOKASSA_SECRET_KEY?: string;

  @IsOptional()
  @IsString()
  PLANT_ID_API_KEY?: string;

  @IsOptional()
  @IsString()
  LLM_API_KEY?: string;

  @IsOptional()
  @IsString()
  LLM_API_URL?: string;

  @IsOptional()
  @IsString()
  LLM_MODEL?: string;
}
