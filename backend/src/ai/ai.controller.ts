import { Body, Controller, ForbiddenException, Post, Req, UseGuards } from '@nestjs/common';
import { getSession, type Session } from '@backend/auth/session';
import { RolesGuard } from '@backend/common/guards/roles.guard';
import { AiService } from './ai.service';
import { AiChatDto } from './dto/chat.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * POST /ai/chat — protected by the existing session/JWT guard.
   * Available to every authenticated role (client, organiser, service provider, admin).
   */
  @Post('chat')
  @UseGuards(new RolesGuard())
  async chat(@Body() dto: AiChatDto, @Req() req: { user?: Session }) {
    const session = req.user ?? (await getSession());
    if (!session) throw new ForbiddenException('Authentication required.');

    const result = await this.aiService.chat(session, dto.message, dto.history ?? []);
    return { reply: result.reply, degraded: result.degraded };
  }
}
