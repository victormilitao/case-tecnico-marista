import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
} from '@nestjs/common';
import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { AttendanceService } from '../attendance/attendance.service';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { Database, DRIZZLE } from '../database/database.module';
import { attendances, rooms, students } from '../database/schema';
import { MeCheckInDto } from './dto/me-checkin.dto';

@Roles('student')
@Controller('me')
export class MeController {
  constructor(
    private readonly attendanceService: AttendanceService,
    @Inject(DRIZZLE) private readonly db: Database,
  ) {}

  @Get()
  async profile(@CurrentUser() user: AuthUser) {
    const [student] = await this.db
      .select({
        id: students.id,
        name: students.name,
        registration: students.registration,
        email: students.email,
      })
      .from(students)
      .where(eq(students.id, user.id))
      .limit(1);
    return student;
  }

  @Get('rooms')
  rooms() {
    return this.db
      .select({
        id: rooms.id,
        name: rooms.name,
        type: rooms.type,
        capacity: rooms.capacity,
      })
      .from(rooms)
      .orderBy(asc(rooms.name));
  }

  @Get('status')
  async status(@CurrentUser() user: AuthUser) {
    const [open] = await this.db
      .select({
        id: attendances.id,
        checkInAt: attendances.checkInAt,
        room: { id: rooms.id, name: rooms.name, type: rooms.type },
      })
      .from(attendances)
      .innerJoin(rooms, eq(attendances.roomId, rooms.id))
      .where(
        and(
          eq(attendances.studentId, user.id),
          isNull(attendances.checkOutAt),
        ),
      )
      .limit(1);

    return { activeCheckIn: open ?? null };
  }

  @Post('checkin')
  checkIn(@CurrentUser() user: AuthUser, @Body() dto: MeCheckInDto) {
    return this.attendanceService.checkIn({
      studentId: user.id,
      roomId: dto.roomId,
    });
  }

  @Post('checkout')
  @HttpCode(200)
  checkOut(@CurrentUser() user: AuthUser) {
    return this.attendanceService.checkOut({ studentId: user.id });
  }

  @Get('attendance')
  history(@CurrentUser() user: AuthUser) {
    return this.db
      .select({
        id: attendances.id,
        checkInAt: attendances.checkInAt,
        checkOutAt: attendances.checkOutAt,
        room: {
          id: rooms.id,
          name: rooms.name,
          type: rooms.type,
        },
      })
      .from(attendances)
      .innerJoin(rooms, eq(attendances.roomId, rooms.id))
      .where(eq(attendances.studentId, user.id))
      .orderBy(desc(attendances.checkInAt));
  }
}
