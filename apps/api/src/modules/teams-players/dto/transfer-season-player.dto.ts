import { IsString, IsUUID, MinLength } from 'class-validator';

export class TransferSeasonPlayerDto {
  @IsUUID()
  toTeamId!: string;

  @IsString()
  @MinLength(3)
  reason!: string;
}
