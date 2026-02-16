import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpdateLeagueDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsIn(['pool', 'darts'])
  sport?: string;

  @IsOptional()
  @IsUUID()
  rulesetId?: string;
}
