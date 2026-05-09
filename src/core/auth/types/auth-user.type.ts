import type { Role } from '@prisma-client';

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  role: Role;
}
