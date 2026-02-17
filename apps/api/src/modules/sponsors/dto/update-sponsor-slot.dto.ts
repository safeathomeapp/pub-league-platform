import { Type } from 'class-transformer';
import { SponsorScopeType } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUrl, IsUUID, Min, MinLength, ValidateIf } from 'class-validator';

export class UpdateSponsorSlotDto {
  @IsOptional()
  @IsEnum(SponsorScopeType)
  scopeType?: SponsorScopeType;

  @IsOptional()
  @ValidateIf(dto => dto.scopeType !== SponsorScopeType.ORG)
  @IsUUID()
  scopeId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsUrl()
  linkUrl?: string;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
