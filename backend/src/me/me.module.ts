import { Module } from '@nestjs/common';
import { AttendanceModule } from '../attendance/attendance.module';
import { MeController } from './me.controller';

@Module({
  imports: [AttendanceModule],
  controllers: [MeController],
})
export class MeModule {}
