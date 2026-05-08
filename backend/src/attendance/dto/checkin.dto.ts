import { IsUUID } from 'class-validator';

export class CheckInDto {
  @IsUUID()
  studentId!: string;

  @IsUUID()
  roomId!: string;
}
