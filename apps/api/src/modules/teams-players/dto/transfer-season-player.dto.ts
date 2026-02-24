import { IsISO8601, IsString, IsUUID, MinLength } from 'class-validator';

export class TransferSeasonPlayerDto {
  @IsUUID()
  toTeamId!: string;

  @IsISO8601()
  effectiveFrom!: string;

  @IsString()
  @MinLength(3)
  reason!: string;
}
