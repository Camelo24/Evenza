import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { schema } from './schema';

// Reuse a single Postgres client and Drizzle instance across hot reloads
// to avoid creating many connections and hitting "too many clients" errors.
declare global {
	// eslint-disable-next-line no-var
	var __trufeta_postgres_client: ReturnType<typeof postgres> | undefined;
	// eslint-disable-next-line no-var
	var __trufeta_drizzle_db: ReturnType<typeof drizzle> | undefined;
}

const databaseUrl = process.env.DATABASE_URL ?? '';
if (!databaseUrl) {
	throw new Error('Missing DATABASE_URL environment variable. Set DATABASE_URL to your Postgres connection string.');
}

const client = global.__trufeta_postgres_client ?? postgres(databaseUrl, { prepare: false });
if (!global.__trufeta_postgres_client) global.__trufeta_postgres_client = client;

export const db = global.__trufeta_drizzle_db ?? drizzle(client, { schema });
if (!global.__trufeta_drizzle_db) global.__trufeta_drizzle_db = db;

export type Database = typeof db;

export default db;
