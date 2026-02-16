import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../db/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { OrgsModule } from '../orgs/orgs.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { FixturesModule } from '../fixtures/fixtures.module';
import { RulesetsModule } from '../rulesets/rulesets.module';
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
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
