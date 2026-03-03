import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { CompetitionPolicyDto } from './competition-policy.dto';

export class CreateSeasonDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CompetitionPolicyDto)
  competitionPolicy?: CompetitionPolicyDto;
}
