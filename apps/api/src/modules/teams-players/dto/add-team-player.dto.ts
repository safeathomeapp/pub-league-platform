import { IsIn, IsUUID } from 'class-validator';

export class AddTeamPlayerDto {
  @IsUUID()
  playerId!: string;

  @IsIn(['CAPTAIN', 'PLAYER'])
  role!: 'CAPTAIN' | 'PLAYER';
}
