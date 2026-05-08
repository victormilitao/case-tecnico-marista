import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { Database, DRIZZLE } from '../database/database.module';
import { students, users } from '../database/schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { StudentLoginDto } from './dto/student-login.dto';
import { StudentSetPasswordDto } from './dto/student-set-password.dto';
import { AuthRole, JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const [created] = await this.db
      .insert(users)
      .values({ name: dto.name, email: dto.email, passwordHash })
      .returning({ id: users.id, name: users.name, email: users.email });

    return this.signTokenFor('admin', created.id, created.email, created.name);
  }

  async login(dto: LoginDto) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.signTokenFor('admin', user.id, user.email, user.name);
  }

  async studentLogin(dto: StudentLoginDto) {
    const [student] = await this.db
      .select()
      .from(students)
      .where(eq(students.registration, dto.registration))
      .limit(1);

    if (!student) {
      throw new UnauthorizedException('Matrícula ou senha inválidos.');
    }

    if (!student.passwordHash) {
      return { requiresPasswordSetup: true };
    }

    if (!dto.password) {
      return { requiresPassword: true };
    }

    const ok = await bcrypt.compare(dto.password, student.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Matrícula ou senha inválidos.');
    }

    return this.signTokenFor(
      'student',
      student.id,
      student.email,
      student.name,
      { registration: student.registration },
    );
  }

  async studentSetPassword(dto: StudentSetPasswordDto) {
    const [student] = await this.db
      .select()
      .from(students)
      .where(eq(students.registration, dto.registration))
      .limit(1);

    if (!student) {
      throw new NotFoundException('Matrícula não encontrada.');
    }

    if (student.passwordHash) {
      throw new BadRequestException(
        'Este aluno já possui senha cadastrada. Faça login normalmente.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.db
      .update(students)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(students.id, student.id));

    return this.signTokenFor(
      'student',
      student.id,
      student.email,
      student.name,
      { registration: student.registration },
    );
  }

  private signTokenFor(
    role: AuthRole,
    id: string,
    email: string,
    name: string,
    extra: Record<string, unknown> = {},
  ) {
    const payload: JwtPayload = { sub: id, email, role };
    const accessToken = this.jwt.sign(payload);
    return {
      accessToken,
      user: { id, email, name, role, ...extra },
    };
  }
}
