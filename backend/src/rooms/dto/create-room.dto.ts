import {
  IsEnum,
  IsInt,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const ROOM_TYPES = ['classroom', 'laboratory', 'study_room'] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

export class CreateRoomDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsEnum(ROOM_TYPES, {
    message: 'type deve ser classroom, laboratory ou study_room',
  })
  type!: RoomType;

  @IsInt()
  @Min(1)
  capacity!: number;
}
