import { Module } from '@nestjs/common';
import { AttendanceModule } from '../attendance/attendance.module';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

@Module({
  imports: [AttendanceModule],
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule {}
