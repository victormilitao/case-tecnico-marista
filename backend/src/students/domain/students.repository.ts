import { Student } from './student.entity';

export const STUDENTS_REPOSITORY = Symbol('STUDENTS_REPOSITORY');

export interface StudentConflict {
  registration: string;
  email: string;
}

export interface CreateStudentData {
  registration: string;
  name: string;
  email: string;
}

export type UpdateStudentData = Partial<CreateStudentData>;

export interface StudentsRepository {
  findAll(): Promise<Student[]>;
  findById(id: string): Promise<Student | null>;
  findRegistrationEmailConflict(
    registration?: string,
    email?: string,
    excludeId?: string,
  ): Promise<StudentConflict | null>;
  create(data: CreateStudentData): Promise<Student>;
  update(id: string, data: UpdateStudentData): Promise<Student | null>;
  delete(id: string): Promise<boolean>;
}
