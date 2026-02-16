import { IsUUID } from 'class-validator';

export class AcceptTokenDto {
  @IsUUID()
  teamId!: string;

  @IsUUID()
  playerId!: string;
}
