import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class CompetitionPolicyDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  minimumPlayersPerMatch?: number;

  @IsOptional()
  @IsBoolean()
  hideOrdersUntilBothSubmitted?: boolean;

  @IsOptional()
  @IsBoolean()
  preventSameTeamOpponentRepeatSameNight?: boolean;

  @IsOptional()
  @IsBoolean()
  requireMatchSignoffOnNight?: boolean;
}
