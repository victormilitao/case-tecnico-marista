import { Module } from '@nestjs/common';
import { STUDENTS_REPOSITORY } from './domain/students.repository';
import { StudentsDrizzleRepository } from './infra/students.drizzle.repository';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  controllers: [StudentsController],
  providers: [
    StudentsService,
    { provide: STUDENTS_REPOSITORY, useClass: StudentsDrizzleRepository },
  ],
})
export class StudentsModule {}
