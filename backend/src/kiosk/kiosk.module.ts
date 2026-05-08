import { Module } from '@nestjs/common';
import { AttendanceModule } from '../attendance/attendance.module';
import { KioskController } from './kiosk.controller';

@Module({
  imports: [AttendanceModule],
  controllers: [KioskController],
})
export class KioskModule {}
