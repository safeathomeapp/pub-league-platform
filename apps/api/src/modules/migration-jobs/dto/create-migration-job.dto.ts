import { MigrationSourceType } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class CreateMigrationJobDto {
  @IsEnum(MigrationSourceType)
  sourceType!: MigrationSourceType;
}
