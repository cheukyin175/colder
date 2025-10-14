import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SettingsModule } from './settings/settings.module';
import { GenerateModule } from './generate/generate.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make config module global
    }),
    PrismaModule,
    SupabaseModule,
    AuthModule,
    UsersModule,
    SettingsModule,
    GenerateModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
