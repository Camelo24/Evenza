import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/service';

@Controller('auth/password-setup')
export class PasswordSetupController {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  @Post('verify')
  async verify(@Body('token') token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = await this.prisma.client.passwordSetupToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('This link is invalid or has expired.');
    }

    return { valid: true, email: record.user.email };
  }

  @Post('submit')
  async submit(@Body('token') token: string, @Body('password') password: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = await this.prisma.client.passwordSetupToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('This link is invalid or has expired.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await this.prisma.client.$transaction([
      this.prisma.client.user.update({
        where: { id: record.userId },
        data: { passwordHash, isActive: true },
      }),
      this.prisma.client.passwordSetupToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await this.notifications.sendPasswordSetConfirmation(record.user.email, record.user.fullName);

    return { success: true };
  }
}