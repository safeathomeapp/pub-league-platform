import { Type } from 'class-transformer';
import { MatchEventType } from '@prisma/client';
import { IsEnum, IsInt, IsObject, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateMatchEventDto {
  @IsEnum(MatchEventType)
  eventType!: MatchEventType;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  expectedRevision!: number;

  @IsObject()
  payload!: Record<string, unknown>;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsUUID()
  actorPlayerId?: string;
}
