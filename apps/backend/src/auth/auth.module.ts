import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { SupabaseModule } from '../supabase/supabase.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule, // For database access in JwtStrategy
    SupabaseModule, // Import SupabaseModule to use SupabaseService
    PassportModule,
    ConfigModule, // Config module is already global in app.module
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('SUPABASE_JWT_SECRET') || 'super-secret-jwt-token-with-at-least-32-characters-long',
        signOptions: { expiresIn: '7d' }, // Tokens will be valid for 7 days
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [JwtStrategy], // Only provide JwtStrategy for validating tokens
  exports: [JwtStrategy], // Export JwtStrategy for use in other modules if needed
})
export class AuthModule {}