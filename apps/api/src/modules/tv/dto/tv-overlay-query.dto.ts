import { IsISO8601, IsOptional, IsUUID } from 'class-validator';

export class TvOverlayQueryDto {
  @IsUUID()
  divisionId!: string;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsISO8601()
  at?: string;
}
