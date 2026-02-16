import { IsString, MinLength } from 'class-validator';

export class CreateDivisionDto {
  @IsString()
  @MinLength(2)
  name!: string;
}
