import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SettingsModule } from './settings/settings.module';
import { GenerateModule } from './generate/generate.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, SettingsModule, GenerateModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
