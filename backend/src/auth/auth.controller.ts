import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { StudentLoginDto } from './dto/student-login.dto';
import { StudentSetPasswordDto } from './dto/student-set-password.dto';
import { AuthUser, CurrentUser } from './current-user.decorator';
import { Public } from './public.decorator';
import { Database, DRIZZLE } from '../database/database.module';
import { students, users } from '../database/schema';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(DRIZZLE) private readonly db: Database,
  ) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('student/login')
  @HttpCode(200)
  studentLogin(@Body() dto: StudentLoginDto) {
    return this.authService.studentLogin(dto);
  }

  @Public()
  @Post('student/set-password')
  @HttpCode(200)
  studentSetPassword(@Body() dto: StudentSetPasswordDto) {
    return this.authService.studentSetPassword(dto);
  }

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    if (user.role === 'student') {
      const [s] = await this.db
        .select({
          id: students.id,
          name: students.name,
          email: students.email,
          registration: students.registration,
        })
        .from(students)
        .where(eq(students.id, user.id))
        .limit(1);
      return { ...s, role: 'student' as const };
    }

    const [u] = await this.db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    return { ...u, role: 'admin' as const };
  }
}
