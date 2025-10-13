import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Handles the sign-in logic.
   * It upserts the user in the database and then returns a signed JWT for that user.
   * @param googleId The user's unique Google ID.
   * @param email The user's email.
   * @param name The user's name.
   * @returns A signed JWT.
   */
  async signIn(googleId: string, email: string, name: string): Promise<{ accessToken: string }> {
    const user = await this.usersService.upsertUser(googleId, email, name);

    const payload = {
      sub: user.id, // 'sub' is the standard JWT subject field
      email: user.email,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}