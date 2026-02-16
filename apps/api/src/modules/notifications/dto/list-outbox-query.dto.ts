import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class ListOutboxQueryDto {
  @IsOptional()
  @IsIn(['pending', 'sending', 'sent', 'failed'])
  status?: string;

  @IsOptional()
  @IsIn(['sms', 'whatsapp', 'email'])
  channel?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  templateKey?: string;
}
