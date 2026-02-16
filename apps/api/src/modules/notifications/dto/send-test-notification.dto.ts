import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class SendTestNotificationDto {
  @IsIn(['sms', 'whatsapp', 'email'])
  channel!: string;

  @IsString()
  @MinLength(5)
  to!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  message?: string;
}
