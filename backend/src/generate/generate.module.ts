import { Module } from '@nestjs/common';
import { GenerateService } from './generate.service';
import { GenerateController } from './generate.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, UsersModule, ConfigModule],
  controllers: [GenerateController],
  providers: [GenerateService]
})
export class GenerateModule {}
