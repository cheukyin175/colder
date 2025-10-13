import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersModule, // Import UsersModule to use UsersService
    PassportModule,
    ConfigModule.forRoot(), // Make .env variables available
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('SUPABASE_JWT_SECRET'),
        signOptions: { expiresIn: '7d' }, // Tokens will be valid for 7 days
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy], // Provide both AuthService and our new JwtStrategy
  controllers: [AuthController],
})
export class AuthModule {}