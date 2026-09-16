const { Client } = require('pg');
(async () => {
  const client = new Client({ connectionString: 'postgresql://postgres:camelo123@localhost:5432/book_event' });
  await client.connect();
  const cols = await client.query("SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position");
  const count = await client.query("SELECT count(*) AS count FROM users");
  console.log('COLUMNS', JSON.stringify(cols.rows, null, 2));
  console.log('COUNT', count.rows[0].count);
  const rows = await client.query("SELECT id, full_name, email, role, organizer_verification_status, service_provider_status FROM users ORDER BY created_at DESC LIMIT 20");
  console.log('ROWS', JSON.stringify(rows.rows, null, 2));
  await client.end();
})();
