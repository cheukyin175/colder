import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SUPABASE_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long',
      passReqToCallback: true, // Pass the request to the validate method
    } as any); // Type assertion to fix passport-jwt typing issue
  }

  /**
   * This method is called by the Passport framework after it has verified the JWT signature.
   * We also verify the token with Supabase to ensure it's valid.
   * @param req The request object
   * @param payload The decoded JWT payload (contains: sub=user_id, email, etc.)
   * @returns The user object to be attached to the request.
   */
  async validate(req: Request, payload: any) {
    try {
      // Extract the token from the Authorization header
      const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      // Verify the token with Supabase to ensure it's still valid
      const supabaseUser = await this.supabaseService.getUserFromToken(token);

      if (!supabaseUser) {
        throw new UnauthorizedException('Invalid token');
      }

      const userId = supabaseUser.id;
      const email = supabaseUser.email || '';

      // Ensure the user exists in our database (auto-create if they don't)
      const user = await this.prisma.user.upsert({
        where: { id: userId },
        update: {
          email,
        },
        create: {
          id: userId,
          email,
          name: email?.split('@')[0] || 'User', // Use email prefix as default name
        },
      });

      return { userId: user.id, email: user.email };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
