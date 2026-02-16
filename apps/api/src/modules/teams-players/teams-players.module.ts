import { Module } from '@nestjs/common';
import { TeamsPlayersController } from './teams-players.controller';
import { TeamsPlayersService } from './teams-players.service';

@Module({
  controllers: [TeamsPlayersController],
  providers: [TeamsPlayersService],
  exports: [TeamsPlayersService],
})
export class TeamsPlayersModule {}
