import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { TeamsPlayersService } from './teams-players.service';

@Injectable()
export class RosterTransferWorker implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;

  constructor(private teamsPlayers: TeamsPlayersService) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;

    const configured = Number(process.env.ROSTER_TRANSFER_RECONCILE_MS ?? 60_000);
    const intervalMs = Number.isFinite(configured) && configured >= 1_000 ? configured : 60_000;
    this.timer = setInterval(() => {
      void this.processDue();
    }, intervalMs);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async processDue() {
    await this.teamsPlayers.reconcileDueTransfers();
  }
}
