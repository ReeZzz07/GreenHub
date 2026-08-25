import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

// MODERATOR и ADMIN назначаются вручную, самостоятельная регистрация с этими ролями запрещена
export const SELF_REGISTER_ROLES = [
  UserRole.BUYER,
  UserRole.SELLER_INDIVIDUAL,
  UserRole.SELLER_BUSINESS,
] as const;

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  name: string;

  @IsIn(SELF_REGISTER_ROLES)
  role: UserRole;

  @IsOptional()
  @IsString()
  phone?: string;
}
