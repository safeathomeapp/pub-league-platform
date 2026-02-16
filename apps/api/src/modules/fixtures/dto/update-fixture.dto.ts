import { IsDateString, IsIn, IsOptional } from 'class-validator';

export class UpdateFixtureDto {
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsIn(['scheduled', 'in_progress', 'completed'])
  status?: string;
}
