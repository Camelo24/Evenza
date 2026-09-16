export const configuration = () => ({
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET ?? "trufeta-local-preview-secret-change-in-production",
  cronSecret: process.env.CRON_SECRET,
  campay: {
    apiUrl: process.env.CAMPAY_API_URL,
    token: process.env.CAMPAY_TOKEN,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD,
    from: (process.env.SMTP_FROM ?? "Trufeta <noreply@trufeta.cm>").replace(/^['"]|['"]$/g, ""),
  },
});
