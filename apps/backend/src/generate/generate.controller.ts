import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { GenerateService } from './generate.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateMessageDto } from './dto/generate-message.dto';
import { PolishMessageDto } from './dto/polish-message.dto';

@UseGuards(JwtAuthGuard)
@Controller('generate')
export class GenerateController {
  constructor(private readonly generateService: GenerateService) {}

  @Post()
  generateMessage(@Req() req, @Body() generateMessageDto: GenerateMessageDto) {
    const userId = req.user.userId;
    return this.generateService.generateMessageForUser(userId, generateMessageDto);
  }

  @Post('regenerate')
  regenerateMessage(@Req() req, @Body() generateMessageDto: GenerateMessageDto) {
    // Regenerate is just a new generation with the same parameters
    const userId = req.user.userId;
    return this.generateService.generateMessageForUser(userId, generateMessageDto);
  }

  @Post('polish')
  polishMessage(@Req() req, @Body() polishMessageDto: PolishMessageDto) {
    const userId = req.user.userId;
    return this.generateService.polishMessage(userId, polishMessageDto);
  }
}