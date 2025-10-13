import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Finds a user by their unique Google ID or creates them if they don't exist.
   * This is the core of the user login/registration process.
   * @param googleId The user's unique ID provided by Google.
   * @param email The user's email.
   * @param name The user's name.
   * @returns The created or updated user.
   */
  async upsertUser(googleId: string, email: string, name: string): Promise<User> {
    return this.prisma.user.upsert({
      where: { googleId },
      update: {
        email,
        name,
      },
      create: {
        googleId,
        email,
        name,
      },
    });
  }
}