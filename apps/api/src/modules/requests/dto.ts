import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateRequestDto {
  @IsString() @IsOptional()
  title?: string;

  @IsString()
  @IsIn(['BREAKDOWN', 'TYRE', 'TOW', 'DELIVERY'])
  kind!: 'BREAKDOWN'|'TYRE'|'TOW'|'DELIVERY';

  @IsString() @IsOptional()
  pickup?: string;

  @IsString() @IsOptional()
  dropoff?: string;
}
