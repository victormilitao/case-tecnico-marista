import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, gte, isNull, lte, SQL } from 'drizzle-orm';
import { Database, DRIZZLE } from '../database/database.module';
import { attendances, rooms, students } from '../database/schema';
import { CheckInDto } from './dto/checkin.dto';
import { CheckOutDto } from './dto/checkout.dto';
import { ListAttendanceDto } from './dto/list-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async checkIn(dto: CheckInDto) {
    const [student] = await this.db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.id, dto.studentId))
      .limit(1);
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const [room] = await this.db
      .select({ id: rooms.id, capacity: rooms.capacity, name: rooms.name })
      .from(rooms)
      .where(eq(rooms.id, dto.roomId))
      .limit(1);
    if (!room) throw new NotFoundException('Ambiente não encontrado');

    const openForStudent = await this.db
      .select({ id: attendances.id, roomId: attendances.roomId })
      .from(attendances)
      .where(
        and(
          eq(attendances.studentId, dto.studentId),
          isNull(attendances.checkOutAt),
        ),
      )
      .limit(1);
    if (openForStudent.length > 0) {
      throw new ConflictException(
        'Aluno já está em um ambiente. Faça check-out antes.',
      );
    }

    const occupants = await this.db
      .select({ id: attendances.id })
      .from(attendances)
      .where(
        and(
          eq(attendances.roomId, dto.roomId),
          isNull(attendances.checkOutAt),
        ),
      );
    if (occupants.length >= room.capacity) {
      throw new ConflictException(
        `Ambiente "${room.name}" atingiu a capacidade máxima (${room.capacity}).`,
      );
    }

    const [created] = await this.db
      .insert(attendances)
      .values({ studentId: dto.studentId, roomId: dto.roomId })
      .returning();
    return created;
  }

  async checkOut(dto: CheckOutDto) {
    const [open] = await this.db
      .select()
      .from(attendances)
      .where(
        and(
          eq(attendances.studentId, dto.studentId),
          isNull(attendances.checkOutAt),
        ),
      )
      .limit(1);

    if (!open) {
      throw new BadRequestException(
        'Não há check-in em aberto para este aluno.',
      );
    }

    const checkOutAt = new Date();
    const [updated] = await this.db
      .update(attendances)
      .set({ checkOutAt })
      .where(eq(attendances.id, open.id))
      .returning();

    const durationMs = checkOutAt.getTime() - updated.checkInAt.getTime();
    return {
      ...updated,
      durationMinutes: Math.round(durationMs / 60000),
    };
  }

  list(filter: ListAttendanceDto) {
    const conditions: SQL[] = [];
    if (filter.studentId)
      conditions.push(eq(attendances.studentId, filter.studentId));
    if (filter.roomId) conditions.push(eq(attendances.roomId, filter.roomId));
    if (filter.from) conditions.push(gte(attendances.checkInAt, filter.from));
    if (filter.to) conditions.push(lte(attendances.checkInAt, filter.to));

    return this.db
      .select({
        id: attendances.id,
        checkInAt: attendances.checkInAt,
        checkOutAt: attendances.checkOutAt,
        student: {
          id: students.id,
          name: students.name,
          registration: students.registration,
        },
        room: {
          id: rooms.id,
          name: rooms.name,
          type: rooms.type,
        },
      })
      .from(attendances)
      .innerJoin(students, eq(attendances.studentId, students.id))
      .innerJoin(rooms, eq(attendances.roomId, rooms.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(attendances.checkInAt));
  }

  private async findStudentByRegistration(registration: string) {
    const [student] = await this.db
      .select({ id: students.id, name: students.name })
      .from(students)
      .where(eq(students.registration, registration))
      .limit(1);
    if (!student) {
      throw new NotFoundException('Matrícula não encontrada');
    }
    return student;
  }

  async checkInByRegistration(registration: string, roomId: string) {
    const student = await this.findStudentByRegistration(registration);
    return this.checkIn({ studentId: student.id, roomId });
  }

  async checkOutByRegistration(registration: string) {
    const student = await this.findStudentByRegistration(registration);
    return this.checkOut({ studentId: student.id });
  }

  async getStatusByRegistration(registration: string) {
    const [student] = await this.db
      .select({ id: students.id, name: students.name })
      .from(students)
      .where(eq(students.registration, registration))
      .limit(1);
    if (!student) return { found: false, activeCheckIn: null };

    const [open] = await this.db
      .select({
        id: attendances.id,
        checkInAt: attendances.checkInAt,
        room: { id: rooms.id, name: rooms.name, type: rooms.type },
      })
      .from(attendances)
      .innerJoin(rooms, eq(attendances.roomId, rooms.id))
      .where(
        and(eq(attendances.studentId, student.id), isNull(attendances.checkOutAt)),
      )
      .limit(1);

    return {
      found: true,
      student,
      activeCheckIn: open ?? null,
    };
  }

  async occupancyByRoom(roomId: string) {
    const [room] = await this.db
      .select()
      .from(rooms)
      .where(eq(rooms.id, roomId))
      .limit(1);
    if (!room) throw new NotFoundException('Ambiente não encontrado');

    const occupants = await this.db
      .select({
        attendanceId: attendances.id,
        checkInAt: attendances.checkInAt,
        student: {
          id: students.id,
          name: students.name,
          registration: students.registration,
        },
      })
      .from(attendances)
      .innerJoin(students, eq(attendances.studentId, students.id))
      .where(
        and(eq(attendances.roomId, roomId), isNull(attendances.checkOutAt)),
      )
      .orderBy(attendances.checkInAt);

    return {
      room,
      occupants,
      occupancy: occupants.length,
      capacity: room.capacity,
      occupancyRate: Number((occupants.length / room.capacity).toFixed(2)),
    };
  }
}
