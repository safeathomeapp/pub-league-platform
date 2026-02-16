import { IsUUID } from 'class-validator';

export class GenerateRoundRobinParamsDto {
  @IsUUID()
  orgId!: string;

  @IsUUID()
  divisionId!: string;
}
