import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { db } from '@db/client';
import crypto from 'crypto';
import { emailLog, notifications } from '@db/schema';
import { and, count, desc, eq } from 'drizzle-orm';

type CreateArgs = {
  userId?: string | null;
  title: string;
  body: string;
  href?: string;
  email?: { to?: string | null; subject?: string };
};

const normalizeEnvValue = (value: string | undefined) => value?.trim().replace(/^['"]|['"]$/g, '') || undefined;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: Transporter;
  private readonly emailEnabled: boolean;

  constructor(private config: ConfigService) {
    const host = normalizeEnvValue(this.config.get<string>('SMTP_HOST') ?? process.env.SMTP_HOST ?? process.env.MAIL_HOST) ?? undefined;
    const port = Number(normalizeEnvValue(this.config.get<string>('SMTP_PORT') ?? process.env.SMTP_PORT) ?? 587);
    const secure = this.config.get<string>('SMTP_SECURE') === 'true' || process.env.SMTP_SECURE === 'true';
    const user = normalizeEnvValue(this.config.get<string>('SMTP_USER') ?? process.env.SMTP_USER ?? process.env.MAIL_USER) ?? undefined;
    const pass = normalizeEnvValue(this.config.get<string>('SMTP_PASS') ?? this.config.get<string>('SMTP_PASSWORD') ?? process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD ?? process.env.MAIL_PASS) ?? undefined;
    const from = normalizeEnvValue(this.config.get<string>('SMTP_FROM') ?? process.env.SMTP_FROM) ?? 'Trufeta <noreply@trufeta.cm>';

    this.emailEnabled = Boolean(host && user && pass);

    if (host === 'smtp.gmail.com' && pass && !/^[A-Za-z0-9]{16}$/.test(pass)) {
      this.logger.warn('SMTP_PASS should be a 16-character Gmail App Password, not your regular account password.');
    }

    if (!this.emailEnabled) {
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
      this.logger.warn('SMTP is not configured; email delivery is disabled in this environment.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      from,
    });
    // Surface transporter errors and verify connection early so failures are visible in logs.
    this.transporter.on?.('error', (err) => this.logger.error('SMTP transporter error', err as Error));
    void this.transporter.verify().then(() => {
      this.logger.log('SMTP transporter verified and ready to send messages');
    }).catch((err) => {
      this.logger.error('SMTP transporter verification failed', err as Error);
    });
  }

  async send(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.emailEnabled) {
      this.logger.warn(`Skipped email to ${to} because SMTP is not configured.`);
      return false;
    }

    const from = normalizeEnvValue(this.config.get<string>('SMTP_FROM') ?? process.env.SMTP_FROM) ?? 'Trufeta <noreply@trufeta.cm>';

    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      // Log the transport response for easier troubleshooting (messageId/response)
      this.logger.log(`Email sent to ${to} (${info?.messageId ?? 'no-id'}) ${info?.response ?? ''}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${(err instanceof Error ? (err.stack || err.message) : String(err))}`);
      return false;
    }
  }

  async sendAccessRequestReceipt(to: string, name: string) {
    await this.send(
      to,
      'We received your Trufeta access request',
      `<p>Hi ${name},</p><p>We received your Trufeta access request. Our team will review it shortly and email you once a decision is made.</p>`,
    );
  }

  async sendPasswordSetupEmail(to: string, name: string, token: string) {
    const url = `${this.config.get<string>('FRONTEND_URL')}/set-password?token=${token}`;
    await this.send(
      to,
      'Your Trufeta account has been approved',
      `<p>Hi ${name},</p><p>Your access request was approved. Set your password to activate your account:</p><p><a href="${url}">${url}</a></p><p>This link expires in 1 hour and can only be used once.</p>`,
    );
  }

  async sendPasswordSetConfirmation(to: string, name: string) {
    const loginUrl = `${this.config.get<string>('FRONTEND_URL')}/login`;
    await this.send(
      to,
      'Your Trufeta password has been set',
      `<p>Hi ${name},</p><p>Your password has been set successfully. You can now log in:</p><p><a href="${loginUrl}">${loginUrl}</a></p>`,
    );
  }
}

let defaultNotificationsService: NotificationsService | undefined;

function getDefaultNotificationsService() {
  defaultNotificationsService ??= new NotificationsService(new ConfigService());
  return defaultNotificationsService;
}

export async function notify({ userId, title, body, href, email }: CreateArgs) {
  if (userId) await db.insert(notifications).values({ id: crypto.randomUUID(), userId, title, body, href });
  if (email?.to) {
    await deliverEmail({ to: email.to, subject: email.subject ?? title, body });
  }
}

export async function deliverEmail(args: { to: string; subject: string; body: string }) {
  await db.insert(emailLog).values({ id: crypto.randomUUID(), toEmail: args.to, subject: args.subject, body: args.body });
  try {
    const sent = await getDefaultNotificationsService().send(args.to, args.subject, args.body);
    if (!sent) {
      const msg = `Email delivery failed for ${args.to}. Check SMTP auth, Gmail App Password, and rate limits.`;
      console.error('[email][deliver][failed]', { to: args.to, subject: args.subject, message: msg });
      throw new Error(msg);
    }
  } catch (err) {
    console.error('[email][deliver][exception]', { to: args.to, subject: args.subject, error: err instanceof Error ? err.stack || err.message : String(err) });
    throw err;
  }
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[Trufeta email] → ${args.to} · ${args.subject}`);
  }
}

export async function sendAccessRequestReceipt(to: string, name: string) {
  await getDefaultNotificationsService().sendAccessRequestReceipt(to, name);
}

export async function sendPasswordSetupEmail(to: string, name: string, token: string) {
  await getDefaultNotificationsService().sendPasswordSetupEmail(to, name, token);
}

export async function sendPasswordSetConfirmation(to: string, name: string) {
  await getDefaultNotificationsService().sendPasswordSetConfirmation(to, name);
}

export async function listNotifications(userId: string, limit = 10) {
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function countUnreadNotifications(userId: string) {
  const [result] = await db.select({ total: count() }).from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  return Number(result?.total ?? 0);
}
