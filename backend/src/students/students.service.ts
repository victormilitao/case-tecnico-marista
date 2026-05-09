import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import {
  STUDENTS_REPOSITORY,
  StudentsRepository,
} from './domain/students.repository';

@Injectable()
export class StudentsService {
  constructor(
    @Inject(STUDENTS_REPOSITORY)
    private readonly repo: StudentsRepository,
  ) {}

  async create(dto: CreateStudentDto) {
    await this.assertUniqueness(dto.registration, dto.email);
    return this.repo.create(dto);
  }

  findAll() {
    return this.repo.findAll();
  }

  async findOne(id: string) {
    const student = await this.repo.findById(id);
    if (!student) throw new NotFoundException('Aluno não encontrado');
    return student;
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.findOne(id);
    if (dto.registration || dto.email) {
      await this.assertUniqueness(dto.registration, dto.email, id);
    }
    const updated = await this.repo.update(id, dto);
    if (!updated) throw new NotFoundException('Aluno não encontrado');
    return updated;
  }

  async remove(id: string) {
    const ok = await this.repo.delete(id);
    if (!ok) throw new NotFoundException('Aluno não encontrado');
    return { id };
  }

  private async assertUniqueness(
    registration?: string,
    email?: string,
    excludeId?: string,
  ) {
    const conflict = await this.repo.findRegistrationEmailConflict(
      registration,
      email,
      excludeId,
    );
    if (!conflict) return;
    if (conflict.registration === registration) {
      throw new ConflictException('Matrícula já cadastrada');
    }
    if (conflict.email === email) {
      throw new ConflictException('E-mail já cadastrado');
    }
  }
}
