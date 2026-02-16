import { IsIn, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateLeagueDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsIn(['pool', 'darts'])
  sport!: string;

  @IsUUID()
  rulesetId!: string;
}
