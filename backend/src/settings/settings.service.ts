import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Retrieves the settings for a given user.
   * @param userId The ID of the user.
   * @returns The user's settings.
   */
  async getSettings(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        userName: true,
        userRole: true,
        userCompany: true,
        userBackground: true,
        userValueProposition: true,
        userOutreachObjectives: true,
      },
    });
    return user;
  }

  /**
   * Updates the settings for a given user.
   * @param userId The ID of the user.
   * @param data The settings data to update.
   * @returns The updated user settings.
   */
  async updateSettings(userId: string, data: UpdateSettingsDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        userName: true,
        userRole: true,
        userCompany: true,
        userBackground: true,
        userValueProposition: true,
        userOutreachObjectives: true,
      },
    });
  }
}