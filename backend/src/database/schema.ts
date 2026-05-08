import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const roomTypeEnum = pgEnum('room_type', [
  'classroom',
  'laboratory',
  'study_room',
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 120 }).notNull(),
  email: varchar('email', { length: 160 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  registration: varchar('registration', { length: 32 }).notNull().unique(),
  name: varchar('name', { length: 160 }).notNull(),
  email: varchar('email', { length: 160 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 120 }).notNull(),
  type: roomTypeEnum('type').notNull(),
  capacity: integer('capacity').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const attendances = pgTable('attendances', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  roomId: uuid('room_id')
    .notNull()
    .references(() => rooms.id, { onDelete: 'restrict' }),
  checkInAt: timestamp('check_in_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  checkOutAt: timestamp('check_out_at', { withTimezone: true }),
});

export const studentsRelations = relations(students, ({ many }) => ({
  attendances: many(attendances),
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
  attendances: many(attendances),
}));

export const attendancesRelations = relations(attendances, ({ one }) => ({
  student: one(students, {
    fields: [attendances.studentId],
    references: [students.id],
  }),
  room: one(rooms, {
    fields: [attendances.roomId],
    references: [rooms.id],
  }),
}));
