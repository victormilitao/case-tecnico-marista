import { Inject, Injectable } from '@nestjs/common';
import { and, eq, ne, or } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../database/database.module';
import { students } from '../../database/schema';
import { Student } from '../domain/student.entity';
import {
  CreateStudentData,
  StudentConflict,
  StudentsRepository,
  UpdateStudentData,
} from '../domain/students.repository';

@Injectable()
export class StudentsDrizzleRepository implements StudentsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  findAll(): Promise<Student[]> {
    return this.db.select().from(students).orderBy(students.name);
  }

  async findById(id: string): Promise<Student | null> {
    const [s] = await this.db
      .select()
      .from(students)
      .where(eq(students.id, id))
      .limit(1);
    return s ?? null;
  }

  async findRegistrationEmailConflict(
    registration?: string,
    email?: string,
    excludeId?: string,
  ): Promise<StudentConflict | null> {
    const filters = [];
    if (registration) filters.push(eq(students.registration, registration));
    if (email) filters.push(eq(students.email, email));
    if (filters.length === 0) return null;

    const where = excludeId
      ? and(or(...filters), ne(students.id, excludeId))
      : or(...filters);

    const [conflict] = await this.db
      .select({
        registration: students.registration,
        email: students.email,
      })
      .from(students)
      .where(where)
      .limit(1);

    return conflict ?? null;
  }

  async create(data: CreateStudentData): Promise<Student> {
    const [created] = await this.db.insert(students).values(data).returning();
    return created;
  }

  async update(id: string, data: UpdateStudentData): Promise<Student | null> {
    const [updated] = await this.db
      .update(students)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return updated ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const [removed] = await this.db
      .delete(students)
      .where(eq(students.id, id))
      .returning({ id: students.id });
    return !!removed;
  }
}
