import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDisputeDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  reason?: string;
}
