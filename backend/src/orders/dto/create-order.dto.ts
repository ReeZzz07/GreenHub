import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  listingId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}
