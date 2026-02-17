import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class HeadToHeadQueryDto {
  @IsUUID()
  playerA!: string;

  @IsUUID()
  playerB!: string;

  @IsOptional()
  @IsIn(['LEAGUE'])
  scope: string = 'LEAGUE';

  @IsOptional()
  @IsUUID()
  seasonId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;
}
