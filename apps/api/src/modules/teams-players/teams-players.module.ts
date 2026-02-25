import { Module } from '@nestjs/common';
import { TeamsPlayersController } from './teams-players.controller';
import { RosterTransferWorker } from './roster-transfer.worker';
import { TeamsPlayersService } from './teams-players.service';

@Module({
  controllers: [TeamsPlayersController],
  providers: [TeamsPlayersService, RosterTransferWorker],
  exports: [TeamsPlayersService],
})
export class TeamsPlayersModule {}
