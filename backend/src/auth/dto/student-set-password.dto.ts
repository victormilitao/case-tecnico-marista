import { IsString, MaxLength, MinLength } from 'class-validator';

export class StudentSetPasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  registration!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password!: string;
}
