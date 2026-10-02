import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(16).optional(),
  CRON_SECRET: z.string().optional(),
  CAMPAY_API_URL: z.string().url().optional(),
  CAMPAY_TOKEN: z.string().optional(),
  CAMPAY_APP_USERNAME: z.string().optional(),
  CAMPAY_APP_PASSWORD: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});
