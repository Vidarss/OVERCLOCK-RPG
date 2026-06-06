const fs = require('fs');
const { Client } = require('pg');

(async () => {
  const sql = fs.readFileSync(__dirname + '/clan_boss_migration.sql', 'utf8');
  const conn = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!conn) { console.error('no postgres url'); process.exit(1); }
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log('migration applied OK');
    const r = await client.query(
      "select table_name from information_schema.tables where table_name in ('clan_bosses','clan_boss_contributions') order by 1"
    );
    console.log('tables:', r.rows.map(x => x.table_name).join(', '));
    const f = await client.query(
      "select proname from pg_proc where proname in ('spawn_clan_boss','deal_clan_boss_damage') order by 1"
    );
    console.log('functions:', f.rows.map(x => x.proname).join(', '));
  } finally {
    await client.end();
  }
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
