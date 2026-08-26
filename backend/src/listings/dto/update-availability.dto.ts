import { IsIn } from 'class-validator';

export class UpdateAvailabilityDto {
  @IsIn(['mark_sold', 'relist'])
  action: 'mark_sold' | 'relist';
}
