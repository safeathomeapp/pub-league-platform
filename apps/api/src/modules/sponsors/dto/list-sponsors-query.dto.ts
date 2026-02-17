import { SponsorScopeType } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class ListSponsorsQueryDto {
  @IsOptional()
  @IsEnum(SponsorScopeType)
  scopeType?: SponsorScopeType;

  @IsOptional()
  @ValidateIf(dto => dto.scopeType !== SponsorScopeType.ORG)
  @IsUUID()
  scopeId?: string;
}
