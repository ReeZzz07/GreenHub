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

  @IsOptional()
  @IsString()
  SMTP_HOST?: string;

  @IsOptional()
  @IsString()
  SMTP_PORT?: string;

  @IsOptional()
  @IsString()
  SMTP_USER?: string;

  @IsOptional()
  @IsString()
  SMTP_PASSWORD?: string;

  @IsOptional()
  @IsString()
  SMTP_FROM?: string;

  @IsOptional()
  @IsString()
  SMTP_SECURE?: string;
}
