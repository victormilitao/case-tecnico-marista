import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class StudentLoginDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  registration!: string;

  @IsOptional()
  @IsString()
  password?: string;
}
