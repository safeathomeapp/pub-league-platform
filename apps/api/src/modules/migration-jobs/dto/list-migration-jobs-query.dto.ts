import { MigrationJobStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ListMigrationJobsQueryDto {
  @IsOptional()
  @IsEnum(MigrationJobStatus)
  status?: MigrationJobStatus;
}
