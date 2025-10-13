import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SUPABASE_JWT_SECRET, // Use the secret from .env
    });
  }

  /**
   * This method is called by the Passport framework after it has verified the JWT signature.
   * The payload is the decoded JWT.
   * @param payload The decoded JWT payload.
   * @returns The user object to be attached to the request.
   */
  async validate(payload: any) {
    // For now, we'll just return the payload which contains user id, email etc.
    // In a real app, you might use the userId from the payload to fetch the full user object from the database.
    return { userId: payload.sub, email: payload.email };
  }
}
