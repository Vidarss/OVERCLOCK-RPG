const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

(async () => {
  const dir = path.join(__dirname, '..', 'supabase', 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  const conn = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    for (const f of files) {
      const sql = fs.readFileSync(path.join(dir, f), 'utf8');
      process.stdout.write('Applying ' + f + ' ... ');
      try {
        await client.query(sql);
        console.log('OK');
      } catch (e) {
        console.log('ERR: ' + e.message);
      }
    }
    const t = await client.query("select table_name from information_schema.tables where table_schema='public' order by 1");
    console.log('\npublic tables:', t.rows.map(r => r.table_name).join(', '));
  } finally {
    await client.end();
  }
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
