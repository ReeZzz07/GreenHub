import { IsIn, IsString, MinLength, ValidateIf } from 'class-validator';

export class ModerateListingDto {
  @IsIn(['approve', 'reject'])
  action: 'approve' | 'reject';

  // Обязательна только при отклонении объявления
  @ValidateIf((dto: ModerateListingDto) => dto.action === 'reject')
  @IsString()
  @MinLength(3)
  reason?: string;
}
