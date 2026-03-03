import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateVenueDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  poolTables?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  dartsBoards?: number;
}
