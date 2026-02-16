import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../db/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { OrgsModule } from '../orgs/orgs.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { FixturesModule } from '../fixtures/fixtures.module';
import { RulesetsModule } from '../rulesets/rulesets.module';
import { LeaguesModule } from '../leagues/leagues.module';
import { SeasonsModule } from '../seasons/seasons.module';
import { TeamsPlayersModule } from '../teams-players/teams-players.module';
import { CalendarModule } from '../calendar/calendar.module';
import { TokensModule } from '../tokens/tokens.module';
import { MatchEventsModule } from '../match-events/match-events.module';
import { StandingsModule } from '../standings/standings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { HealthController } from './health.controller';
import { RequestIdMiddleware } from '../../common/middleware/request-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    OrgsModule,
    MembershipsModule,
    FixturesModule,
    RulesetsModule,
    LeaguesModule,
    SeasonsModule,
    TeamsPlayersModule,
    CalendarModule,
    TokensModule,
    MatchEventsModule,
    StandingsModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
