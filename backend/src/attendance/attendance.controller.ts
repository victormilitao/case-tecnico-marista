import { Controller, Get, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { ListAttendanceDto } from './dto/list-attendance.dto';
import { Roles } from '../auth/roles.decorator';

@Roles('admin')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  list(@Query() filter: ListAttendanceDto) {
    return this.attendanceService.list(filter);
  }
}
