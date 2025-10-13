import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleSignInDto } from './dto/google-sign-in.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  async signInWithGoogle(@Body() googleSignInDto: GoogleSignInDto) {
    try {
      // 1. Verify the Google access token with Google's API
      const googleUserInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleSignInDto.accessToken}`
      );

      if (!googleUserInfoResponse.ok) {
        throw new UnauthorizedException('Failed to verify Google token.');
      }

      const googleUser = await googleUserInfoResponse.json();

      // Ensure we have essential user info
      if (!googleUser.sub || !googleUser.email || !googleUser.name) {
        throw new UnauthorizedException('Missing essential Google user info.');
      }

      // 2. Sign the user into our system (upsert into our database and get our JWT)
      return this.authService.signIn(
        googleUser.sub, // Google's unique user ID
        googleUser.email,
        googleUser.name
      );
    } catch (error: any) {
      console.error("Google authentication failed on backend:", error);
      throw new UnauthorizedException('Authentication failed: ' + error.message);
    }
  }
}
