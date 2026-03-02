import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  StreamableFile,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMigrationJobDto } from './dto/create-migration-job.dto';
import { ImportMigrationJobDto } from './dto/import-migration-job.dto';
import { ListMigrationJobsQueryDto } from './dto/list-migration-jobs-query.dto';
import { ReviewMigrationJobDto } from './dto/review-migration-job.dto';
import { MigrationJobsService } from './migration-jobs.service';

type UploadedFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
};

@Controller('orgs/:orgId/migration-jobs')
@UseGuards(JwtAuthGuard, OrgMembershipGuard, RolesGuard)
export class MigrationJobsController {
  constructor(private migrationJobs: MigrationJobsService) {}

  @Get()
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  list(@Param('orgId') orgId: string, @Query() query: ListMigrationJobsQueryDto) {
    return this.migrationJobs.list(orgId, query);
  }

  @Get(':jobId')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  get(@Param('orgId') orgId: string, @Param('jobId') jobId: string) {
    return this.migrationJobs.get(orgId, jobId);
  }

  @Get(':jobId/assets/:assetId')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  async getAsset(
    @Param('orgId') orgId: string,
    @Param('jobId') jobId: string,
    @Param('assetId') assetId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const asset = await this.migrationJobs.getAsset(orgId, jobId, assetId);
    response.setHeader('Content-Type', asset.mimeType);
    response.setHeader('Content-Disposition', `inline; filename="${asset.originalFilename}"`);
    return new StreamableFile(asset.buffer);
  }

  @Post()
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Param('orgId') orgId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateMigrationJobDto,
    @UploadedFile() file?: UploadedFile,
  ) {
    return this.migrationJobs.create(orgId, user.id, dto, file);
  }

  @Patch(':jobId/review')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  review(@Param('orgId') orgId: string, @Param('jobId') jobId: string, @Body() dto: ReviewMigrationJobDto) {
    return this.migrationJobs.review(orgId, jobId, dto);
  }

  @Post(':jobId/import')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  importJob(
    @Param('orgId') orgId: string,
    @Param('jobId') jobId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ImportMigrationJobDto,
  ) {
    return this.migrationJobs.import(orgId, jobId, user.id, dto);
  }
}
