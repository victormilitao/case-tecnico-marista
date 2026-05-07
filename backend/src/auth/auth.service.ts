import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { Database, DRIZZLE } from '../database/database.module';
import { users } from '../database/schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';

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

    return this.signTokenFor(created.id, created.email, created.name);
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

    return this.signTokenFor(user.id, user.email, user.name);
  }

  private signTokenFor(id: string, email: string, name: string) {
    const payload: JwtPayload = { sub: id, email };
    const accessToken = this.jwt.sign(payload);
    return {
      accessToken,
      user: { id, email, name },
    };
  }
}
