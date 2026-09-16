# Trufeta Email Setup — Nodemailer + Brevo SMTP

Trufeta uses **Nodemailer** as its email transport library inside a NestJS module.
All outbound emails flow through the `NotificationsService`, which reads SMTP
settings from environment variables and never hard-codes credentials.

Brevo (formerly Sendinblue) provides a free SMTP relay that works as a drop-in
replacement for Gmail. The same `NotificationsService` code is used; only the
environment variables change.

---

## 1. Prerequisites

1. Create a free account at [brevo.com](https://www.brevo.com/).
2. Verify your sender domain (recommended) or use the default free-plan sender
   address. Domain verification removes the “sent on behalf of” notice and
   improves deliverability.
3. Generate an **SMTP key** from the Brevo dashboard:
   - Go to **SMTP & API** → **SMTP**
   - Click **Create a new SMTP key** (or use the default one)
   - Copy the key — you will paste it into `.env` as `SMTP_PASSWORD`

---

## 2. Environment variables

```env
# Brevo SMTP relay
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-brevo-account-email@example.com
SMTP_PASSWORD=your-brevo-smtp-key
SMTP_FROM="Trufeta <noreply@trufeta.cm>"
```

- `SMTP_HOST` — Brevo SMTP relay host.
- `SMTP_PORT` — `587` for STARTTLS (Brevo recommended). Use `465` for SSL/TLS
  and set `SMTP_SECURE=true`.
- `SMTP_SECURE` — `false` for port `587` (STARTTLS). `true` for port `465`
  (implicit TLS).
- `SMTP_USER` — the email address you used to sign up for Brevo (your Brevo
  account login).
- `SMTP_PASSWORD` — the **Brevo SMTP key**, not your Brevo account password.
- `SMTP_FROM` — the sender identity shown in the recipient inbox. Must be a
  verified sender in your Brevo account.

Keep these in `.env`. `.env` is git-ignored. Commit `.env.example` as the
template.

---

## 3. NestJS module wiring

```ts
// notifications/notifications.module.ts
@Module({
  imports: [ConfigModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
```

`NotificationsService` is a standard NestJS `@Injectable()` provider.
Because it is `exports: [NotificationsService]`, any other module (auth,
access-requests, admin, bookings, etc.) can inject and use it.

---

## 4. Transporter creation (Nodemailer inside NestJS)

```ts
// notifications/service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT'),
      secure: this.config.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }
```

Key points:

- Nodemailer’s `createTransport` builds a **Transporter**.
- NestJS `ConfigService` supplies all values from `.env`. No secrets are
  hard-coded.
- `secure` is set from `SMTP_SECURE` so it works for both Brevo STARTTLS
  (`587`, `false`) and SSL (`465`, `true`).

---

## 5. Sending an email

```ts
async send(to: string, subject: string, html: string) {
  try {
    await this.transporter.sendMail({
      from: this.config.get<string>('SMTP_FROM'),
      to,
      subject,
      html,
    });
  } catch (err) {
    this.logger.error(`Failed to send email to ${to}`, err as Error);
    throw err;
  }
}
```

- `from` — pulled from `SMTP_FROM` in `.env`.
- `to` — the recipient email address.
- `subject` — email subject line.
- `html` — HTML body. Trufeta uses simple inline HTML strings.

---

## 6. Domain-specific email methods

Trufeta groups email logic into named methods on the service:

```ts
async sendAccessRequestReceipt(to: string, name: string)
async sendPasswordSetupEmail(to: string, name: string, token: string)
async sendPasswordSetConfirmation(to: string, name: string)
```

These are thin wrappers around `send()` that build the correct subject and HTML
for each workflow step (access request, approval, password setup).

---

## 7. Standalone helper functions

Because Trufeta uses server actions in addition to NestJS controllers, some
parts of the codebase call email without injecting the module. To support that,
`service.ts` exports helper functions backed by a default `ConfigService`:

```ts
const defaultConfigService = new ConfigService();
const defaultNotificationsService = new NotificationsService(defaultConfigService);

export async function deliverEmail(args: { to: string; subject: string; body: string })
export async function sendAccessRequestReceipt(to: string, name: string)
export async function sendPasswordSetupEmail(to: string, name: string, token: string)
export async function sendPasswordSetConfirmation(to: string, name: string)
```

These are used by server actions in `auth/actions.ts`, `admin/actions.ts`, etc.

---

## 8. Logging emails

Every outbound email is persisted to the `email_log` table via `deliverEmail()`:

```ts
export async function deliverEmail(args: { to: string; subject: string; body: string }) {
  await db.insert(emailLog).values({
    id: crypto.randomUUID(),
    toEmail: args.to,
    subject: args.subject,
    body: args.body,
  });
  await defaultNotificationsService.send(args.to, args.subject, args.body);
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[Trufeta email] → ${args.to} · ${args.subject}`);
  }
}
```

This gives you an audit trail of everything Trufeta sends.

---

## 9. Security rules

1. **Never hard-code the SMTP key** in source code.
2. Always read it via `process.env.SMTP_PASSWORD` (through NestJS `ConfigService`).
3. `.env` is git-ignored. Commit only `.env.example`.
4. Verify your sender domain in Brevo so emails do not land in spam.

---

## 10. Brevo setup walkthrough

1. Sign up at [brevo.com](https://www.brevo.com/).
2. Verify your sender domain (Settings → Senders & Domains → Domains). Add
   the DNS records Brevo provides to your domain registrar.
3. Create an SMTP key (Settings → SMTP & API → SMTP). Copy it.
4. Add the values to `backend/.env`:

   ```env
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-brevo-account-email@example.com
   SMTP_PASSWORD=your-brevo-smtp-key
   SMTP_FROM="Trufeta <noreply@trufeta.cm>"
   ```

5. Start the backend and verify the connection:

   ```ts
   await transporter.verify();
   console.log("Server is ready to take our messages");
   ```

6. Trigger one of Trufeta’s email flows (access request, password setup, etc.)
   and confirm delivery in Brevo dashboard → Transactional → Logs.

---

## 11. Flow summary

```text
Organizer / Vendor
        │
        ▼
   Request Access
        │
        ▼
  Submit Name + Email + Role
  + Verification Document
        │
        ▼
      Trufeta
        │
        ▼
       Admin
    ┌───┴────┐
    │        │
 Reject    Approve
    │        │
    ▼        ▼
  Email    Create/activate
           account
              │
              ▼
        Send secure email
              │
              ▼
        User creates password
              │
              ▼
            Login
```

Each arrow that says "Email" goes through `NotificationsService` → Nodemailer
→ Brevo SMTP relay.
