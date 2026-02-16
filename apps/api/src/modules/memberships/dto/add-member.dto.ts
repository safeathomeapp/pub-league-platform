import { IsEmail, IsIn } from 'class-validator';

export class AddMemberDto {
  @IsEmail()
  email!: string;

  @IsIn(['ORG_ADMIN','COMMISSIONER','CAPTAIN','PLAYER'])
  role!: string;
}
