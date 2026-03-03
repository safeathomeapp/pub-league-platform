import { FixtureState } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export class ListFixturesQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsEnum(FixtureState)
  state?: FixtureState;
}
