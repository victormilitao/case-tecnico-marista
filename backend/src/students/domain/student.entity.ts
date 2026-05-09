export interface Student {
  id: string;
  registration: string;
  name: string;
  email: string;
  passwordHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}
