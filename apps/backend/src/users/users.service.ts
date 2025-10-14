import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Finds a user by their ID or creates them if they don't exist.
   * This is used when a user signs in with Supabase Auth.
   * @param userId The user's unique ID from Supabase.
   * @param email The user's email.
   * @param name The user's name.
   * @returns The created or updated user.
   */
  async upsertUser(userId: string, email: string, name?: string): Promise<User> {
    return this.prisma.user.upsert({
      where: { id: userId },
      update: {
        email,
        name: name || email.split('@')[0],
      },
      create: {
        id: userId,
        email,
        name: name || email.split('@')[0],
      },
    });
  }

  /**
   * Find a user by their ID.
   * @param userId The user's unique ID.
   * @returns The user or null if not found.
   */
  async findById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}