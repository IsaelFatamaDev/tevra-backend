const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function main() {
  const hash = await bcrypt.hash('Admin123!', 10);
  console.log('New hash:', hash);

  const client = new Client({
    connectionString: 'postgresql://postgres:VCKhHHIUTneX4a5LEGLP@109.123.254.72:5432/tevra'
  });

  await client.connect();

  const res = await client.query(
    'UPDATE users SET password_hash = $1 RETURNING email, role',
    [hash]
  );

  console.log(`${res.rows.length} users updated:`);
  res.rows.forEach(u => console.log(`  ${u.email} (${u.role})`));

  await client.end();
}

main().catch(err => { console.error(err); process.exit(1); });
