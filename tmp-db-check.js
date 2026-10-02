const postgres = require('postgres');
const sql = postgres('postgresql://postgres:camelo123@localhost:5432/book_event', { prepare: false });

(async () => {
  const users = await sql.unsafe("SELECT id, full_name, email, role, organizer_verification_status, service_provider_status FROM users WHERE email ILIKE '%hood%' OR full_name ILIKE '%hood%' ORDER BY created_at");
  const events = await sql.unsafe("SELECT e.id, e.title, e.service_category_id, c.name AS category_name FROM events e LEFT JOIN categories c ON c.id = e.service_category_id WHERE e.title ILIKE '%Nuit%' OR c.name ILIKE '%Music%' OR c.name ILIKE '%Photography%' OR c.name ILIKE '%Catering%' OR c.name ILIKE '%Decoration%' OR c.name ILIKE '%Sound%' OR c.name ILIKE '%Entertainment%' ORDER BY e.created_at");
  const categories = await sql.unsafe("SELECT id, name, slug FROM categories ORDER BY id");
  console.log(JSON.stringify({ users, events, categories }, null, 2));
  await sql.end();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
