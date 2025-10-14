import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreditsService } from './credits.service';

@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  /**
   * Get current user's credit status
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getCreditStatus(@Req() req) {
    const userId = req.user.userId;
    return await this.creditsService.getUserCredits(userId);
  }
}