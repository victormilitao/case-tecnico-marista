import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class KioskCheckInDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  registration!: string;

  @IsUUID()
  roomId!: string;
}

export class KioskCheckOutDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  registration!: string;
}
