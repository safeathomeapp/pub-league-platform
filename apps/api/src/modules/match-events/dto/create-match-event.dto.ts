import { Type } from 'class-transformer';
import { IsInt, IsObject, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateMatchEventDto {
  @IsString()
  @MinLength(3)
  eventType!: string;

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
