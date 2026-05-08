import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { Database, DRIZZLE } from '../database/database.module';
import { rooms } from '../database/schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(dto: CreateRoomDto) {
    const [created] = await this.db.insert(rooms).values(dto).returning();
    return created;
  }

  findAll() {
    return this.db.select().from(rooms).orderBy(rooms.name);
  }

  async findOne(id: string) {
    const [room] = await this.db
      .select()
      .from(rooms)
      .where(eq(rooms.id, id))
      .limit(1);
    if (!room) throw new NotFoundException('Ambiente não encontrado');
    return room;
  }

  async update(id: string, dto: UpdateRoomDto) {
    await this.findOne(id);
    const [updated] = await this.db
      .update(rooms)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(rooms.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    const [removed] = await this.db
      .delete(rooms)
      .where(eq(rooms.id, id))
      .returning({ id: rooms.id });
    if (!removed) throw new NotFoundException('Ambiente não encontrado');
    return { id: removed.id };
  }
}
