import { IsIn } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsIn(['ORG_ADMIN','COMMISSIONER','CAPTAIN','PLAYER'])
  role!: string;
}
