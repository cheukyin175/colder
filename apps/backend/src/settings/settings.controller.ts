import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@UseGuards(JwtAuthGuard) // Protect all routes in this controller
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings(@Req() req) {
    // The JwtAuthGuard attaches the user object (from the token payload) to the request
    const userId = req.user.userId;
    return this.settingsService.getSettings(userId);
  }

  @Put()
  updateSettings(@Req() req, @Body() updateSettingsDto: UpdateSettingsDto) {
    const userId = req.user.userId;
    return this.settingsService.updateSettings(userId, updateSettingsDto);
  }
}