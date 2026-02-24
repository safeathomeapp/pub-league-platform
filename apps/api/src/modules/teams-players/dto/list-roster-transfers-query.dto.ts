import { IsISO8601, IsOptional, IsUUID } from 'class-validator';

export class ListRosterTransfersQueryDto {
  @IsOptional()
  @IsUUID()
  playerId?: string;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
