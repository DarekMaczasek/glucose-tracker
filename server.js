const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS glucose (
      id SERIAL PRIMARY KEY,
      payload JSONB NOT NULL
    )
  `);
  const res = await pool.query('SELECT COUNT(*) FROM glucose');
  if (parseInt(res.rows[0].count) === 0) {
    await pool.query('INSERT INTO glucose (payload) VALUES ($1)', [JSON.stringify({ data: [], comments: {} })]);
  }
}

app.get('/data', async (req, res) => {
  const result = await pool.query('SELECT payload FROM glucose LIMIT 1');
  res.json(result.rows[0].payload);
});

app.post('/data', async (req, res) => {
  await pool.query('UPDATE glucose SET payload = $1', [JSON.stringify(req.body)]);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
init().then(() => {
  app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
}).catch(err => {
  console.error('DB Init Fehler:', err);
  process.exit(1);
});
