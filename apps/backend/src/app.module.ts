import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SettingsModule } from './settings/settings.module';
import { GenerateModule } from './generate/generate.module';
import { StripeModule } from './stripe/stripe.module';
import { CreditsModule } from './credits/credits.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make config module global
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    SupabaseModule,
    AuthModule,
    UsersModule,
    SettingsModule,
    GenerateModule,
    StripeModule,
    CreditsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
