import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { CompetitionPolicyDto } from './competition-policy.dto';

export class UpdateSeasonDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CompetitionPolicyDto)
  competitionPolicy?: CompetitionPolicyDto;
}
