import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class ReviewResultDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expectedRevision!: number;

  @IsUUID()
  teamId!: string;

  @IsUUID()
  actorPlayerId!: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  reason?: string;
}
