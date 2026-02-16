import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';
import { StandingsService } from '../standings/standings.service';

@Injectable()
export class DisputesService {
  constructor(
    private prisma: PrismaService,
    private standings: StandingsService,
  ) {}

  async create(orgId: string, fixtureId: string, actorUserId: string, reason?: string) {
    const fixture = await this.prisma.fixture.findFirst({
      where: {
        id: fixtureId,
        division: { season: { league: { organisationId: orgId } } },
      },
      select: { id: true },
    });
    if (!fixture) throw new NotFoundException('Fixture not found');

    return this.prisma.$transaction(async tx => {
      const dispute = await tx.dispute.create({
        data: {
          fixtureId,
          status: 'open',
          reason: reason ?? null,
        },
      });

      await this.appendEvent(tx, fixtureId, actorUserId, 'DISPUTE_OPENED', {
        dispute_id: dispute.id,
      });

      return dispute;
    });
  }

  async listByFixture(orgId: string, fixtureId: string) {
    const fixture = await this.prisma.fixture.findFirst({
      where: {
        id: fixtureId,
        division: { season: { league: { organisationId: orgId } } },
      },
      select: { id: true },
    });
    if (!fixture) throw new NotFoundException('Fixture not found');

    return this.prisma.dispute.findMany({
      where: { fixtureId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    orgId: string,
    disputeId: string,
    actorUserId: string,
    data: { status?: string; outcome?: string },
  ) {
    const dispute = await this.prisma.dispute.findFirst({
      where: {
        id: disputeId,
        fixture: { division: { season: { league: { organisationId: orgId } } } },
      },
      include: { fixture: { select: { id: true, divisionId: true } } },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');

    const updated = await this.prisma.$transaction(async tx => {
      const next = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.outcome !== undefined ? { outcome: data.outcome } : {}),
        },
      });

      if (next.status === 'resolved') {
        await this.appendEvent(tx, dispute.fixture.id, actorUserId, 'DISPUTE_RESOLVED', {
          dispute_id: next.id,
          outcome: next.outcome,
        });
      }

      return next;
    });

    if (updated.status === 'resolved') {
      // Keep standings consistent after dispute resolution updates.
      await this.standings.recomputeAndSnapshot(orgId, dispute.fixture.divisionId);
    }

    return updated;
  }

  private async appendEvent(
    tx: Prisma.TransactionClient,
    fixtureId: string,
    actorUserId: string,
    eventType: string,
    payload: Prisma.InputJsonValue,
  ) {
    const latest = await tx.matchEvent.findFirst({
      where: { fixtureId },
      orderBy: { revision: 'desc' },
      select: { revision: true },
    });
    const nextRevision = (latest?.revision ?? 0) + 1;

    await tx.matchEvent.create({
      data: {
        fixtureId,
        revision: nextRevision,
        eventType,
        actorUserId,
        payload,
      },
    });
  }
}
