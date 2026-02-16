import { IsDateString, IsIn, IsOptional } from 'class-validator';

export class ListFixturesQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsIn(['scheduled', 'in_progress', 'completed'])
  status?: string;
}
