import { IsUUID } from 'class-validator';

export class TransferTokenDto {
  @IsUUID()
  teamId!: string;

  @IsUUID()
  toPlayerId!: string;
}
