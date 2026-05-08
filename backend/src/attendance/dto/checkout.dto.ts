import { IsUUID } from 'class-validator';

export class CheckOutDto {
  @IsUUID()
  studentId!: string;
}
