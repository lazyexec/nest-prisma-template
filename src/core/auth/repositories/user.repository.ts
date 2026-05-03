import { Injectable } from '@nestjs/common';
import type {
  AuthProvider,
  Role,
  User,
  UserStatus,
} from '@prisma-client';
import { PrismaService } from '@/database/prisma.service';

export interface CreateUserInput {
  email?: string | null;
  phone?: string | null;
  role?: Role;
  status?: UserStatus;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id, isDeleted: false },
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, isDeleted: false },
    });
  }

  findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { phone, isDeleted: false },
    });
  }

  findByProviderIdentity(
    provider: AuthProvider,
    providerId: string,
  ): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        isDeleted: false,
        credentials: { some: { provider, providerId } },
      },
    });
  }

  create(input: CreateUserInput): Promise<User> {
    return this.prisma.user.create({ data: input });
  }

  markEmailVerified(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { isEmailVerified: true },
    });
  }

  markPhoneVerified(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { isPhoneVerified: true },
    });
  }

  updateEmail(id: string, email: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { email, isEmailVerified: false },
    });
  }

  updatePhone(id: string, phone: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { phone, isPhoneVerified: false },
    });
  }
}
