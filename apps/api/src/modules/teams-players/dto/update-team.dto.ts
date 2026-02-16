import { IsString, MinLength } from 'class-validator';

export class UpdateTeamDto {
  @IsString()
  @MinLength(2)
  name!: string;
}
