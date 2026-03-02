import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MigrationJobStatus,
  MigrationSourceType,
  Prisma,
  Sport,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { PrismaService } from '../db/prisma.service';

type UploadedFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
};

type MigrationDraft = {
  league?: { name?: string; sport?: Sport; rulesetId?: string };
  season?: { name?: string; startDate?: string; endDate?: string };
  divisions?: Array<{ tempId?: string; name?: string }>;
  teams?: Array<{ tempId?: string; divisionTempId?: string; name?: string }>;
  players?: Array<{ displayName?: string; contactEmail?: string; contactPhone?: string }>;
  fixtures?: Array<{
    divisionTempId?: string;
    homeTeamTempId?: string;
    awayTeamTempId?: string;
    scheduledAt?: string | null;
  }>;
};

@Injectable()
export class MigrationJobsService {
  constructor(private prisma: PrismaService) {}

  async create(
    orgId: string,
    userId: string,
    dto: { sourceType: MigrationSourceType },
    file: UploadedFile | undefined,
  ) {
    if (!file) throw new BadRequestException('file is required');

    const jobId = randomUUID();
    const assetId = randomUUID();
    const originalFilename = this.sanitizeFilename(file.originalname || 'upload.bin');
    const relativePath = path.join('uploads', 'migration-jobs', orgId, jobId, originalFilename);
    const absolutePath = path.resolve(process.cwd(), relativePath);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, file.buffer);

    return this.prisma.migrationJob.create({
      data: {
        id: jobId,
        organisationId: orgId,
        createdByUserId: userId,
        sourceType: dto.sourceType,
        status: MigrationJobStatus.REVIEW_REQUIRED,
        draft: this.emptyDraft(),
        assets: {
          create: {
            id: assetId,
            originalFilename: file.originalname || originalFilename,
            mimeType: file.mimetype || 'application/octet-stream',
            storagePath: relativePath.replace(/\\/g, '/'),
          },
        },
      },
      include: {
        assets: {
          orderBy: { createdAt: 'asc' },
        },
        importAudits: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async list(orgId: string, query?: { status?: MigrationJobStatus }) {
    return this.prisma.migrationJob.findMany({
      where: {
        organisationId: orgId,
        ...(query?.status ? { status: query.status } : {}),
      },
      include: {
        assets: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async get(orgId: string, jobId: string) {
    const job = await this.prisma.migrationJob.findFirst({
      where: { id: jobId, organisationId: orgId },
      include: {
        assets: {
          orderBy: { createdAt: 'asc' },
        },
        importAudits: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!job) throw new NotFoundException('Migration job not found');
    return job;
  }

  async review(
    orgId: string,
    jobId: string,
    dto: { draft: Record<string, unknown>; readyToImport?: boolean },
  ) {
    await this.get(orgId, jobId);

    return this.prisma.migrationJob.update({
      where: { id: jobId },
      data: {
        draft: this.normalizeDraft(dto.draft),
        reviewedAt: new Date(),
        failureReason: null,
        status: dto.readyToImport ? MigrationJobStatus.READY_TO_IMPORT : MigrationJobStatus.REVIEW_REQUIRED,
      },
      include: {
        assets: {
          orderBy: { createdAt: 'asc' },
        },
        importAudits: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async import(orgId: string, jobId: string, actorUserId: string, dto: { confirm: boolean }) {
    if (!dto.confirm) throw new BadRequestException('confirm must be true');

    const job = await this.get(orgId, jobId);
    if (job.status === MigrationJobStatus.IMPORTED) {
      throw new ConflictException('Migration job already imported');
    }
    if (job.status !== MigrationJobStatus.READY_TO_IMPORT) {
      throw new ConflictException('Migration job is not ready to import');
    }

    const draft = this.normalizeDraft(job.draft as Record<string, unknown>);

    try {
      const summary = await this.prisma.$transaction(async tx => {
        const rulesetId = await this.resolveRulesetId(tx, orgId, draft);

        const league = await tx.league.create({
          data: {
            organisationId: orgId,
            name: this.requireNonEmptyString(draft.league?.name, 'draft.league.name'),
            sport: draft.league?.sport ?? Sport.pool,
            rulesetId,
          },
        });

        const season = await tx.season.create({
          data: {
            leagueId: league.id,
            name: this.requireNonEmptyString(draft.season?.name, 'draft.season.name'),
            startDate: this.requireDate(draft.season?.startDate, 'draft.season.startDate'),
            endDate: this.requireDate(draft.season?.endDate, 'draft.season.endDate'),
          },
        });

        const divisionIdByTemp = new Map<string, string>();
        for (const division of draft.divisions ?? []) {
          const tempId = this.requireNonEmptyString(division.tempId, 'draft.divisions[].tempId');
          const created = await tx.division.create({
            data: {
              seasonId: season.id,
              name: this.requireNonEmptyString(division.name, 'draft.divisions[].name'),
            },
          });
          divisionIdByTemp.set(tempId, created.id);
        }

        const teamIdByTemp = new Map<string, { id: string; divisionId: string }>();
        for (const team of draft.teams ?? []) {
          const tempId = this.requireNonEmptyString(team.tempId, 'draft.teams[].tempId');
          const divisionTempId = this.requireNonEmptyString(team.divisionTempId, 'draft.teams[].divisionTempId');
          const divisionId = divisionIdByTemp.get(divisionTempId);
          if (!divisionId) throw new BadRequestException(`Unknown division tempId: ${divisionTempId}`);

          const created = await tx.team.create({
            data: {
              divisionId,
              name: this.requireNonEmptyString(team.name, 'draft.teams[].name'),
            },
          });
          teamIdByTemp.set(tempId, { id: created.id, divisionId });
        }

        let playersCreated = 0;
        for (const player of draft.players ?? []) {
          await tx.player.create({
            data: {
              organisationId: orgId,
              displayName: this.requireNonEmptyString(player.displayName, 'draft.players[].displayName'),
              contactEmail: player.contactEmail?.trim() || null,
              contactPhone: player.contactPhone?.trim() || null,
            },
          });
          playersCreated += 1;
        }

        let fixturesCreated = 0;
        for (const fixture of draft.fixtures ?? []) {
          const home = teamIdByTemp.get(
            this.requireNonEmptyString(fixture.homeTeamTempId, 'draft.fixtures[].homeTeamTempId'),
          );
          const away = teamIdByTemp.get(
            this.requireNonEmptyString(fixture.awayTeamTempId, 'draft.fixtures[].awayTeamTempId'),
          );
          if (!home || !away) throw new BadRequestException('Fixture references unknown team tempId');
          if (home.divisionId !== away.divisionId) {
            throw new BadRequestException('Fixture teams must resolve to the same division');
          }

          const divisionTempId = this.requireNonEmptyString(
            fixture.divisionTempId,
            'draft.fixtures[].divisionTempId',
          );
          if (divisionIdByTemp.get(divisionTempId) !== home.divisionId) {
            throw new BadRequestException('Fixture divisionTempId does not match resolved team division');
          }

          await tx.fixture.create({
            data: {
              divisionId: home.divisionId,
              homeTeamId: home.id,
              awayTeamId: away.id,
              scheduledAt: fixture.scheduledAt
                ? this.requireDate(fixture.scheduledAt, 'draft.fixtures[].scheduledAt')
                : null,
            },
          });
          fixturesCreated += 1;
        }

        const summary = {
          leagueId: league.id,
          seasonId: season.id,
          counts: {
            divisions: divisionIdByTemp.size,
            teams: teamIdByTemp.size,
            players: playersCreated,
            fixtures: fixturesCreated,
          },
        };

        await tx.migrationImportAudit.create({
          data: {
            organisationId: orgId,
            migrationJobId: jobId,
            actorUserId,
            summaryJson: summary,
          },
        });

        await tx.migrationJob.update({
          where: { id: jobId },
          data: {
            status: MigrationJobStatus.IMPORTED,
            importedAt: new Date(),
            failureReason: null,
          },
        });

        return summary;
      });

      return {
        imported: true,
        summary,
        job: await this.get(orgId, jobId),
      };
    } catch (error) {
      if (
        !(error instanceof BadRequestException)
        && !(error instanceof ConflictException)
        && !(error instanceof NotFoundException)
      ) {
        await this.prisma.migrationJob.update({
          where: { id: jobId },
          data: {
            status: MigrationJobStatus.FAILED,
            failureReason: error instanceof Error ? error.message : 'Migration import failed',
          },
        });
      }
      throw error;
    }
  }

  private async resolveRulesetId(tx: Prisma.TransactionClient, orgId: string, draft: MigrationDraft) {
    const draftRulesetId = draft.league?.rulesetId?.trim();
    if (draftRulesetId) {
      const ruleset = await tx.ruleset.findFirst({
        where: { id: draftRulesetId, organisationId: orgId },
        select: { id: true },
      });
      if (!ruleset) throw new BadRequestException('draft.league.rulesetId is not in this organisation');
      return ruleset.id;
    }

    const firstRuleset = await tx.ruleset.findFirst({
      where: { organisationId: orgId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!firstRuleset) throw new BadRequestException('Organisation has no ruleset for import');
    return firstRuleset.id;
  }

  private emptyDraft(): MigrationDraft {
    return {
      league: { name: '', sport: Sport.pool, rulesetId: '' },
      season: { name: '', startDate: '', endDate: '' },
      divisions: [],
      teams: [],
      players: [],
      fixtures: [],
    };
  }

  private normalizeDraft(input: Record<string, unknown>): MigrationDraft {
    return {
      league: this.isRecord(input.league)
        ? {
            name: this.asOptionalString(input.league.name),
            sport: this.asSport(input.league.sport),
            rulesetId: this.asOptionalString(input.league.rulesetId),
          }
        : { name: '', sport: Sport.pool, rulesetId: '' },
      season: this.isRecord(input.season)
        ? {
            name: this.asOptionalString(input.season.name),
            startDate: this.asOptionalString(input.season.startDate),
            endDate: this.asOptionalString(input.season.endDate),
          }
        : { name: '', startDate: '', endDate: '' },
      divisions: this.asArray(input.divisions).map(item => ({
        tempId: this.isRecord(item) ? this.asOptionalString(item.tempId) : '',
        name: this.isRecord(item) ? this.asOptionalString(item.name) : '',
      })),
      teams: this.asArray(input.teams).map(item => ({
        tempId: this.isRecord(item) ? this.asOptionalString(item.tempId) : '',
        divisionTempId: this.isRecord(item) ? this.asOptionalString(item.divisionTempId) : '',
        name: this.isRecord(item) ? this.asOptionalString(item.name) : '',
      })),
      players: this.asArray(input.players).map(item => ({
        displayName: this.isRecord(item) ? this.asOptionalString(item.displayName) : '',
        contactEmail: this.isRecord(item) ? this.asOptionalString(item.contactEmail) : '',
        contactPhone: this.isRecord(item) ? this.asOptionalString(item.contactPhone) : '',
      })),
      fixtures: this.asArray(input.fixtures).map(item => ({
        divisionTempId: this.isRecord(item) ? this.asOptionalString(item.divisionTempId) : '',
        homeTeamTempId: this.isRecord(item) ? this.asOptionalString(item.homeTeamTempId) : '',
        awayTeamTempId: this.isRecord(item) ? this.asOptionalString(item.awayTeamTempId) : '',
        scheduledAt: this.isRecord(item) ? this.asOptionalString(item.scheduledAt) || null : null,
      })),
    };
  }

  private sanitizeFilename(filename: string) {
    const cleaned = filename.replace(/[^A-Za-z0-9._-]/g, '_');
    return cleaned || 'upload.bin';
  }

  private asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private asOptionalString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private asSport(value: unknown): Sport {
    return value === Sport.darts ? Sport.darts : Sport.pool;
  }

  private requireNonEmptyString(value: string | undefined, field: string) {
    if (!value || !value.trim()) throw new BadRequestException(`${field} is required`);
    return value.trim();
  }

  private requireDate(value: string | undefined, field: string) {
    const parsed = new Date(this.requireNonEmptyString(value, field));
    if (Number.isNaN(parsed.getTime())) throw new BadRequestException(`${field} must be a valid ISO date`);
    return parsed;
  }
}
