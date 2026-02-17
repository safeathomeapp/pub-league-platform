import { Type } from 'class-transformer';
import { IsInt, IsUUID, Min } from 'class-validator';

export class SubmitResultDto {
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

  @IsUUID()
  teamId!: string;

  @IsUUID()
  actorPlayerId!: string;
}
