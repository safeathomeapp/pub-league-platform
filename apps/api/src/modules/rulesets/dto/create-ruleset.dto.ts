import { IsIn, IsObject, IsString, MinLength } from 'class-validator';

export class CreateRulesetDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsIn(['pool', 'darts'])
  sport!: string;

  @IsObject()
  config!: Record<string, unknown>;
}
