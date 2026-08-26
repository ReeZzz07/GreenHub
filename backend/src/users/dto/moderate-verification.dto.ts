import { IsIn, IsString, MinLength, ValidateIf } from 'class-validator';

export class ModerateVerificationDto {
  @IsIn(['approve', 'reject'])
  action: 'approve' | 'reject';

  // Обязательна только при отклонении смены email
  @ValidateIf((dto: ModerateVerificationDto) => dto.action === 'reject')
  @IsString()
  @MinLength(3)
  reason?: string;
}
