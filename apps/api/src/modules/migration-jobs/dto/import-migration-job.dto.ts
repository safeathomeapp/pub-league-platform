import { Type } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class ImportMigrationJobDto {
  @Type(() => Boolean)
  @IsBoolean()
  confirm!: boolean;
}
