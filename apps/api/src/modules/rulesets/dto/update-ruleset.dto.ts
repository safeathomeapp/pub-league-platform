import { IsIn, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateRulesetDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsIn(['pool', 'darts'])
  sport?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
