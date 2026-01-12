import { query } from '../src/lib/db';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npm run make:admin -- <email>');
    process.exit(1);
  }

  try {
    const userRes = await query('SELECT id, email FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      console.error(`User not found: ${email}`);
      process.exit(2);
    }
    const userId = userRes.rows[0].id;

    await query(
      "INSERT INTO user_roles (user_id, role) VALUES ($1, 'admin') ON CONFLICT (user_id, role) DO NOTHING",
      [userId]
    );

    console.log(`✅ Granted admin role to ${email} (${userId})`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to grant admin role:', err);
    process.exit(3);
  }
}

main();
