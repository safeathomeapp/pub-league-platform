import { Module } from '@nestjs/common';
import { MigrationJobsController } from './migration-jobs.controller';
import { MigrationJobsService } from './migration-jobs.service';

@Module({
  controllers: [MigrationJobsController],
  providers: [MigrationJobsService],
})
export class MigrationJobsModule {}
