import { IsUUID } from 'class-validator';

export class MeCheckInDto {
  @IsUUID()
  roomId!: string;
}
