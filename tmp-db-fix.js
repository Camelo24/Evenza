const postgres = require('postgres');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sql = postgres('postgresql://postgres:camelo123@localhost:5432/book_event', { prepare: false });

(async () => {
  const email = 'hoodcharmer@gmail.com';
  const userRow = await sql.unsafe("SELECT id, full_name, email, role FROM users WHERE email = 'hoodcharmer@gmail.com' LIMIT 1");
  const user = userRow[0];
  if (!user) {
    throw new Error('User not found');
  }

  const passwordHash = await bcrypt.hash('hood2004', 10);
  await sql.unsafe("UPDATE users SET password_hash = $1, role = 'service_provider', service_provider_status = 'approved', updated_at = NOW() WHERE id = $2", [passwordHash, user.id]);

  const vendorExists = await sql.unsafe("SELECT id FROM vendor_profiles WHERE user_id = $1 LIMIT 1", [user.id]);
  if (vendorExists.length === 0) {
    const vendorId = crypto.randomUUID();
    await sql.unsafe("INSERT INTO vendor_profiles (id, user_id, business_name, slug, tagline, description, city, address, rating, review_count, starting_price, verified, response_time, image_url, cover_url, completed_events, featured, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())",
      [
        vendorId,
        user.id,
        'Hood Audio & Events Studio',
        'hood-audio-events-studio',
        'Event sound, lighting and ambience for unforgettable nights.',
        'We curate sound, lighting, and atmosphere for festivals, private events, and cultural experiences across Cameroon.',
        'Yaoundé',
        'Mokolo, Yaoundé',
        4.8,
        0,
        180000,
        true,
        'Within 2 hours',
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30',
        'https://images.unsplash.com/photo-1501386761578-eac5c94b800a',
        0,
        true,
      ]);

    await sql.unsafe("INSERT INTO vendor_categories (vendor_id, category_id) VALUES ($1, $2)", [vendorId, 4]);
  } else {
    const vendorId = vendorExists[0].id;
    const existingCategory = await sql.unsafe("SELECT 1 FROM vendor_categories WHERE vendor_id = $1 AND category_id = 4 LIMIT 1", [vendorId]);
    if (existingCategory.length === 0) {
      await sql.unsafe("INSERT INTO vendor_categories (vendor_id, category_id) VALUES ($1, $2)", [vendorId, 4]);
    }
  }

  await sql.unsafe("UPDATE events SET service_category_id = 4 WHERE id = '10ac95cc-24dd-4699-9cce-f4a2a8f7750a'");

  console.log('Updated user', email, 'to service provider with Sound & Lighting domain and event category assignment.');
  await sql.end();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
