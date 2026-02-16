import { IsUUID } from 'class-validator';

export class IssueTokenDto {
  @IsUUID()
  teamId!: string;

  @IsUUID()
  holderPlayerId!: string;
}
