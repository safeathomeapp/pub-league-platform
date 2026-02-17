import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

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

  @IsString()
  @MinLength(3)
  reason!: string;
}
