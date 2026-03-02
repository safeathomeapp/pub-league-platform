import { Type } from 'class-transformer';
import { IsBoolean, IsObject, IsOptional } from 'class-validator';

export class ReviewMigrationJobDto {
  @IsObject()
  draft!: Record<string, unknown>;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readyToImport?: boolean;
}
