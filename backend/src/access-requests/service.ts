import * as crypto from 'crypto';
import type { PrismaService } from '../prisma/prisma.service';
import type { NotificationsService } from '../notifications/service';

export async function createPasswordSetupToken(
  prisma: PrismaService,
  notifications: NotificationsService,
  newUser: { id: string; email: string; name: string },
) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await prisma.client.passwordSetupToken.create({
    data: {
      userId: newUser.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  await notifications.sendPasswordSetupEmail(newUser.email, newUser.name, rawToken);
}
