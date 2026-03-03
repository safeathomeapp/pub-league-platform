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

type ValidationIssue = {
  code: string;
  message: string;
  path: string;
};

type MigrationDraftValidationSummary = {
  valid: boolean;
  errorCount: number;
  warningCount: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
};

type MigrationImportPreviewSummary = {
  leagueName: string;
  seasonName: string;
  divisionNames: string[];
  teamNames: string[];
  playerDisplayNames: string[];
  fixturePairs: string[];
  counts: {
    divisions: number;
    teams: number;
    players: number;
    fixtures: number;
  };
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
    const absolutePath = path.resolve(this.getUploadsRoot(), relativePath);

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
    return this.withReviewSummaries(orgId, job);
  }

  async getAsset(orgId: string, jobId: string, assetId: string) {
    const asset = await this.prisma.migrationJobAsset.findFirst({
      where: {
        id: assetId,
        migrationJobId: jobId,
        migrationJob: {
          organisationId: orgId,
        },
      },
      include: {
        migrationJob: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!asset) throw new NotFoundException('Migration job asset not found');

    const absolutePath = path.resolve(this.getUploadsRoot(), asset.storagePath);

    try {
      const buffer = await fs.readFile(absolutePath);
      return {
        buffer,
        mimeType: asset.mimeType || 'application/octet-stream',
        originalFilename: asset.originalFilename,
      };
    } catch {
      throw new NotFoundException('Migration job asset file not found');
    }
  }

  async review(
    orgId: string,
    jobId: string,
    dto: { draft: Record<string, unknown>; readyToImport?: boolean },
  ) {
    await this.get(orgId, jobId);
    const normalizedDraft = this.normalizeDraft(dto.draft);
    const validationSummary = await this.buildValidationSummary(orgId, normalizedDraft);

    const updated = await this.prisma.migrationJob.update({
      where: { id: jobId },
      data: {
        draft: normalizedDraft,
        reviewedAt: new Date(),
        failureReason: null,
        status:
          dto.readyToImport && validationSummary.valid
            ? MigrationJobStatus.READY_TO_IMPORT
            : MigrationJobStatus.REVIEW_REQUIRED,
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

    return {
      ...updated,
      validationSummary,
      importPreviewSummary: this.buildImportPreviewSummary(normalizedDraft),
    };
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
    const validation = await this.buildValidationSummary(orgId, draft);
    if (!validation.valid) {
      throw new BadRequestException({
        code: 'MIGRATION_DRAFT_INVALID',
        message: 'Migration job draft has blocking validation errors',
        details: validation,
      });
    }

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

  private getUploadsRoot() {
    return process.env.UPLOADS_ROOT?.trim() || process.cwd();
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

  private async withReviewSummaries<T extends { draft: unknown }>(orgId: string, job: T) {
    const draft = this.normalizeDraft(job.draft as Record<string, unknown>);
    const validationSummary = await this.buildValidationSummary(orgId, draft);
    const importPreviewSummary = this.buildImportPreviewSummary(draft);
    return {
      ...job,
      validationSummary,
      importPreviewSummary,
    };
  }

  private async buildValidationSummary(orgId: string, draft: MigrationDraft): Promise<MigrationDraftValidationSummary> {
    const summary = this.createEmptyValidationSummary();
    this.collectDraftValidationIssues(summary, draft);

    const rulesetId = draft.league?.rulesetId?.trim();
    if (rulesetId) {
      const ruleset = await this.prisma.ruleset.findFirst({
        where: { id: rulesetId, organisationId: orgId },
        select: { id: true },
      });
      if (!ruleset) {
        summary.errors.push({
          code: 'RULESET_NOT_IN_ORG',
          message: 'League rulesetId does not belong to this organisation',
          path: 'draft.league.rulesetId',
        });
      }
    }

    return this.finalizeValidationSummary(summary);
  }

  private createEmptyValidationSummary(): MigrationDraftValidationSummary {
    return {
      valid: true,
      errorCount: 0,
      warningCount: 0,
      errors: [],
      warnings: [],
    };
  }

  private finalizeValidationSummary(summary: MigrationDraftValidationSummary): MigrationDraftValidationSummary {
    return {
      ...summary,
      valid: summary.errors.length === 0,
      errorCount: summary.errors.length,
      warningCount: summary.warnings.length,
    };
  }

  private collectDraftValidationIssues(summary: MigrationDraftValidationSummary, draft: MigrationDraft) {
    if (!draft.league?.name?.trim()) {
      summary.errors.push({
        code: 'LEAGUE_NAME_REQUIRED',
        message: 'League name is required',
        path: 'draft.league.name',
      });
    }
    if (!draft.season?.name?.trim()) {
      summary.errors.push({
        code: 'SEASON_NAME_REQUIRED',
        message: 'Season name is required',
        path: 'draft.season.name',
      });
    }
    this.validateDateField(summary, draft.season?.startDate, 'draft.season.startDate', 'Season startDate is required');
    this.validateDateField(summary, draft.season?.endDate, 'draft.season.endDate', 'Season endDate is required');
    if ((draft.divisions ?? []).length === 0) {
      summary.errors.push({
        code: 'DIVISION_REQUIRED',
        message: 'At least one division is required',
        path: 'draft.divisions',
      });
    }
    if ((draft.teams ?? []).length === 0) {
      summary.errors.push({
        code: 'TEAM_REQUIRED',
        message: 'At least one team is required',
        path: 'draft.teams',
      });
    }

    const divisionIds = new Set<string>();
    const divisionNames = new Set<string>();
    for (const [index, division] of (draft.divisions ?? []).entries()) {
      const tempId = division.tempId?.trim() ?? '';
      const name = division.name?.trim() ?? '';
      if (!tempId) {
        summary.errors.push({
          code: 'DIVISION_TEMP_ID_REQUIRED',
          message: 'Division tempId is required',
          path: `draft.divisions[${index}].tempId`,
        });
      } else if (divisionIds.has(tempId)) {
        summary.errors.push({
          code: 'DIVISION_TEMP_ID_DUPLICATE',
          message: `Duplicate division tempId: ${tempId}`,
          path: `draft.divisions[${index}].tempId`,
        });
      } else {
        divisionIds.add(tempId);
      }

      if (!name) {
        summary.errors.push({
          code: 'DIVISION_NAME_REQUIRED',
          message: 'Division name is required',
          path: `draft.divisions[${index}].name`,
        });
      } else {
        const key = name.toLowerCase();
        if (divisionNames.has(key)) {
          summary.errors.push({
            code: 'DIVISION_NAME_DUPLICATE',
            message: `Duplicate division name: ${name}`,
            path: `draft.divisions[${index}].name`,
          });
        } else {
          divisionNames.add(key);
        }
      }
    }

    const teamIds = new Set<string>();
    const teamNamesByDivision = new Set<string>();
    for (const [index, team] of (draft.teams ?? []).entries()) {
      const tempId = team.tempId?.trim() ?? '';
      const divisionTempId = team.divisionTempId?.trim() ?? '';
      const name = team.name?.trim() ?? '';
      if (!tempId) {
        summary.errors.push({
          code: 'TEAM_TEMP_ID_REQUIRED',
          message: 'Team tempId is required',
          path: `draft.teams[${index}].tempId`,
        });
      } else if (teamIds.has(tempId)) {
        summary.errors.push({
          code: 'TEAM_TEMP_ID_DUPLICATE',
          message: `Duplicate team tempId: ${tempId}`,
          path: `draft.teams[${index}].tempId`,
        });
      } else {
        teamIds.add(tempId);
      }

      if (!divisionTempId) {
        summary.errors.push({
          code: 'TEAM_DIVISION_TEMP_ID_REQUIRED',
          message: 'Team divisionTempId is required',
          path: `draft.teams[${index}].divisionTempId`,
        });
      } else if (!divisionIds.has(divisionTempId)) {
        summary.errors.push({
          code: 'TEAM_DIVISION_UNKNOWN',
          message: `Unknown division tempId: ${divisionTempId}`,
          path: `draft.teams[${index}].divisionTempId`,
        });
      }

      if (!name) {
        summary.errors.push({
          code: 'TEAM_NAME_REQUIRED',
          message: 'Team name is required',
          path: `draft.teams[${index}].name`,
        });
      } else if (divisionTempId) {
        const key = `${divisionTempId.toLowerCase()}::${name.toLowerCase()}`;
        if (teamNamesByDivision.has(key)) {
          summary.errors.push({
            code: 'TEAM_NAME_DUPLICATE_IN_DIVISION',
            message: `Duplicate team name in division: ${name}`,
            path: `draft.teams[${index}].name`,
          });
        } else {
          teamNamesByDivision.add(key);
        }
      }
    }

    const playerEmails = new Set<string>();
    for (const [index, player] of (draft.players ?? []).entries()) {
      const displayName = player.displayName?.trim() ?? '';
      const contactEmail = player.contactEmail?.trim() ?? '';
      if (!displayName) {
        summary.errors.push({
          code: 'PLAYER_DISPLAY_NAME_REQUIRED',
          message: 'Player displayName is required',
          path: `draft.players[${index}].displayName`,
        });
      }
      if (contactEmail) {
        const emailKey = contactEmail.toLowerCase();
        if (playerEmails.has(emailKey)) {
          summary.errors.push({
            code: 'PLAYER_EMAIL_DUPLICATE',
            message: `Duplicate player contactEmail: ${contactEmail}`,
            path: `draft.players[${index}].contactEmail`,
          });
        } else {
          playerEmails.add(emailKey);
        }
      } else {
        summary.warnings.push({
          code: 'PLAYER_EMAIL_MISSING',
          message: 'Player contactEmail is missing',
          path: `draft.players[${index}].contactEmail`,
        });
      }
    }

    for (const [index, fixture] of (draft.fixtures ?? []).entries()) {
      const divisionTempId = fixture.divisionTempId?.trim() ?? '';
      const homeTeamTempId = fixture.homeTeamTempId?.trim() ?? '';
      const awayTeamTempId = fixture.awayTeamTempId?.trim() ?? '';
      if (!divisionTempId) {
        summary.errors.push({
          code: 'FIXTURE_DIVISION_REQUIRED',
          message: 'Fixture divisionTempId is required',
          path: `draft.fixtures[${index}].divisionTempId`,
        });
      } else if (!divisionIds.has(divisionTempId)) {
        summary.errors.push({
          code: 'FIXTURE_DIVISION_UNKNOWN',
          message: `Unknown fixture division tempId: ${divisionTempId}`,
          path: `draft.fixtures[${index}].divisionTempId`,
        });
      }

      if (!homeTeamTempId) {
        summary.errors.push({
          code: 'FIXTURE_HOME_REQUIRED',
          message: 'Fixture homeTeamTempId is required',
          path: `draft.fixtures[${index}].homeTeamTempId`,
        });
      } else if (!teamIds.has(homeTeamTempId)) {
        summary.errors.push({
          code: 'FIXTURE_HOME_UNKNOWN',
          message: `Unknown home team tempId: ${homeTeamTempId}`,
          path: `draft.fixtures[${index}].homeTeamTempId`,
        });
      }

      if (!awayTeamTempId) {
        summary.errors.push({
          code: 'FIXTURE_AWAY_REQUIRED',
          message: 'Fixture awayTeamTempId is required',
          path: `draft.fixtures[${index}].awayTeamTempId`,
        });
      } else if (!teamIds.has(awayTeamTempId)) {
        summary.errors.push({
          code: 'FIXTURE_AWAY_UNKNOWN',
          message: `Unknown away team tempId: ${awayTeamTempId}`,
          path: `draft.fixtures[${index}].awayTeamTempId`,
        });
      }

      if (homeTeamTempId && awayTeamTempId && homeTeamTempId === awayTeamTempId) {
        summary.errors.push({
          code: 'FIXTURE_SAME_TEAM',
          message: 'Fixture home and away team cannot be the same',
          path: `draft.fixtures[${index}]`,
        });
      }

      if (fixture.scheduledAt) {
        this.validateDateField(
          summary,
          fixture.scheduledAt,
          `draft.fixtures[${index}].scheduledAt`,
          'Fixture scheduledAt must be a valid ISO date',
          false,
        );
      }
    }
  }

  private validateDateField(
    summary: MigrationDraftValidationSummary,
    value: string | undefined | null,
    path: string,
    message: string,
    required = true,
  ) {
    const normalized = value?.trim() ?? '';
    if (!normalized) {
      if (required) {
        summary.errors.push({
          code: 'DATE_REQUIRED',
          message,
          path,
        });
      }
      return;
    }

    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      summary.errors.push({
        code: 'DATE_INVALID',
        message: required ? `${path} must be a valid ISO date` : message,
        path,
      });
    }
  }

  private buildImportPreviewSummary(draft: MigrationDraft): MigrationImportPreviewSummary {
    const teamsByTempId = new Map(
      (draft.teams ?? []).map(team => [team.tempId?.trim() ?? '', team.name?.trim() ?? '']),
    );

    return {
      leagueName: draft.league?.name?.trim() ?? '',
      seasonName: draft.season?.name?.trim() ?? '',
      divisionNames: (draft.divisions ?? [])
        .map(division => division.name?.trim() ?? '')
        .filter(Boolean),
      teamNames: (draft.teams ?? [])
        .map(team => team.name?.trim() ?? '')
        .filter(Boolean),
      playerDisplayNames: (draft.players ?? [])
        .map(player => player.displayName?.trim() ?? '')
        .filter(Boolean),
      fixturePairs: (draft.fixtures ?? []).map(fixture => {
        const home = teamsByTempId.get(fixture.homeTeamTempId?.trim() ?? '') || fixture.homeTeamTempId?.trim() || '?';
        const away = teamsByTempId.get(fixture.awayTeamTempId?.trim() ?? '') || fixture.awayTeamTempId?.trim() || '?';
        return `${home} vs ${away}`;
      }),
      counts: {
        divisions: draft.divisions?.length ?? 0,
        teams: draft.teams?.length ?? 0,
        players: draft.players?.length ?? 0,
        fixtures: draft.fixtures?.length ?? 0,
      },
    };
  }
}
