import { Module } from '@nestjs/common';
import { MatchEventsController } from './match-events.controller';
import { MatchEventsService } from './match-events.service';
import { StandingsModule } from '../standings/standings.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [StandingsModule, NotificationsModule],
  controllers: [MatchEventsController],
  providers: [MatchEventsService],
  exports: [MatchEventsService],
})
export class MatchEventsModule {}
