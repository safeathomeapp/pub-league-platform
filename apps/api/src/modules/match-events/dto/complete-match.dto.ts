import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CompleteMatchDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expectedRevision!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  homeFrames!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  awayFrames!: number;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsUUID()
  actorPlayerId?: string;
}
