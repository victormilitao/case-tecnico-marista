import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ne, or } from 'drizzle-orm';
import { Database, DRIZZLE } from '../database/database.module';
import { students } from '../database/schema';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(dto: CreateStudentDto) {
    await this.assertUniqueness(dto.registration, dto.email);
    const [created] = await this.db.insert(students).values(dto).returning();
    return created;
  }

  findAll() {
    return this.db.select().from(students).orderBy(students.name);
  }

  async findOne(id: string) {
    const [student] = await this.db
      .select()
      .from(students)
      .where(eq(students.id, id))
      .limit(1);
    if (!student) throw new NotFoundException('Aluno não encontrado');
    return student;
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.findOne(id);
    if (dto.registration || dto.email) {
      await this.assertUniqueness(dto.registration, dto.email, id);
    }
    const [updated] = await this.db
      .update(students)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    const [removed] = await this.db
      .delete(students)
      .where(eq(students.id, id))
      .returning({ id: students.id });
    if (!removed) throw new NotFoundException('Aluno não encontrado');
    return { id: removed.id };
  }

  private async assertUniqueness(
    registration?: string,
    email?: string,
    excludeId?: string,
  ) {
    const filters = [];
    if (registration) filters.push(eq(students.registration, registration));
    if (email) filters.push(eq(students.email, email));
    if (filters.length === 0) return;

    const where = excludeId
      ? and(or(...filters), ne(students.id, excludeId))
      : or(...filters);

    const conflicts = await this.db
      .select({
        registration: students.registration,
        email: students.email,
      })
      .from(students)
      .where(where)
      .limit(1);

    if (conflicts.length > 0) {
      const c = conflicts[0];
      if (c.registration === registration) {
        throw new ConflictException('Matrícula já cadastrada');
      }
      if (c.email === email) {
        throw new ConflictException('E-mail já cadastrado');
      }
    }
  }
}
