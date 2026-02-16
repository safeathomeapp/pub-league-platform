import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateDisputeDto {
  @IsOptional()
  @IsIn(['open', 'under_review', 'resolved', 'rejected'])
  status?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  outcome?: string;
}
