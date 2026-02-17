import { DisputeStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDefined, IsEnum, IsInt, IsOptional, IsString, Min, MinLength, ValidateIf } from 'class-validator';

export class UpdateDisputeDto {
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @IsOptional()
  @ValidateIf(dto => dto.status === DisputeStatus.resolved)
  @IsDefined()
  @IsString()
  @MinLength(2)
  outcome?: string;

  @IsOptional()
  @ValidateIf(dto => dto.status === DisputeStatus.resolved)
  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  finalHomeFrames?: number;

  @IsOptional()
  @ValidateIf(dto => dto.status === DisputeStatus.resolved)
  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  finalAwayFrames?: number;
}
