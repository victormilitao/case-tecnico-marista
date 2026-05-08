import { Body, Controller, Get, HttpCode, Inject, Param, Post } from '@nestjs/common';
import { asc } from 'drizzle-orm';
import { AttendanceService } from '../attendance/attendance.service';
import { Public } from '../auth/public.decorator';
import { Database, DRIZZLE } from '../database/database.module';
import { rooms } from '../database/schema';
import { KioskCheckInDto, KioskCheckOutDto } from './dto/kiosk-checkin.dto';

@Public()
@Controller('kiosk')
export class KioskController {
  constructor(
    private readonly attendanceService: AttendanceService,
    @Inject(DRIZZLE) private readonly db: Database,
  ) {}

  @Get('rooms')
  listRooms() {
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

  @Post('checkin')
  checkIn(@Body() dto: KioskCheckInDto) {
    return this.attendanceService.checkInByRegistration(
      dto.registration,
      dto.roomId,
    );
  }

  @Post('checkout')
  @HttpCode(200)
  checkOut(@Body() dto: KioskCheckOutDto) {
    return this.attendanceService.checkOutByRegistration(dto.registration);
  }

  @Get('status/:registration')
  getStatus(@Param('registration') registration: string) {
    return this.attendanceService.getStatusByRegistration(registration);
  }
}
