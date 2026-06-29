'use strict';
require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const fs        = require('fs');
const zlib      = require('zlib');
const initSqlJs = require('sql.js');

const app  = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'portfolio.db');
const PROD = process.env.NODE_ENV === 'production';

// ── Security headers ──────────────────────────────────────
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json({ limit: '16kb' }));

// ── Gzip compression for all text responses ───────────────
app.use((req, res, next) => {
  const ae = req.headers['accept-encoding'] || '';
  if (!ae.includes('gzip')) return next();
  const _json = res.json.bind(res);
  res.json = (data) => {
    const buf = Buffer.from(JSON.stringify(data));
    zlib.gzip(buf, (err, compressed) => {
      if (err) return _json(data);
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Length', compressed.length);
      res.end(compressed);
    });
  };
  next();
});

// ── Static files with caching ─────────────────────────────
// HTML → no-cache (always fresh); CSS/JS/images → 1 year
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// ── Simple in-memory rate limiter (no extra dep) ──────────
const hits = new Map();
function rateLimit(max, windowMs) {
  return (req, res, next) => {
    const key  = req.ip;
    const now  = Date.now();
    const data = hits.get(key) || { count: 0, start: now };
    if (now - data.start > windowMs) { data.count = 0; data.start = now; }
    data.count++;
    hits.set(key, data);
    if (data.count > max) return res.status(429).json({ error: 'Too many requests. Try again later.' });
    next();
  };
}

// ── Database ──────────────────────────────────────────────
let db;

async function initDb() {
  const SQL = await initSqlJs();
  db = fs.existsSync(DB_PATH)
    ? new SQL.Database(fs.readFileSync(DB_PATH))
    : new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      title    TEXT NOT NULL,
      description TEXT NOT NULL,
      tech     TEXT NOT NULL,
      github   TEXT DEFAULT '',
      demo     TEXT DEFAULT '',
      image    TEXT DEFAULT '',
      featured INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS skills (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      name     TEXT NOT NULL,
      category TEXT NOT NULL,
      level    INTEGER DEFAULT 80
    );
    CREATE TABLE IF NOT EXISTS contacts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL,
      message    TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed projects
  const pr = db.exec('SELECT COUNT(*) FROM projects');
  if (!pr.length || pr[0].values[0][0] === 0) {
    [
      ['Portfolio Website',  'Full-stack personal portfolio built with Node.js and SQLite.',  'Node.js,Express,SQLite,HTML/CSS',  'https://github.com', 'https://example.com', 1],
      ['E-Commerce App',     'A full-featured online store with cart and Stripe payments.',   'React,Node.js,MongoDB,Stripe',     'https://github.com', 'https://example.com', 1],
      ['Task Manager',       'Collaborative task management app with real-time updates.',      'Vue.js,Firebase,Tailwind',         'https://github.com', '',                   0],
      ['Weather Dashboard',  'Real-time weather app consuming OpenWeather API.',               'JavaScript,CSS,REST API',          'https://github.com', 'https://example.com', 0],
    ].forEach(([t, d, tech, gh, demo, feat]) =>
      db.run('INSERT INTO projects (title,description,tech,github,demo,featured) VALUES (?,?,?,?,?,?)',
        [t, d, tech, gh, demo, feat])
    );
  }

  // Seed skills
  const sr = db.exec('SELECT COUNT(*) FROM skills');
  if (!sr.length || sr[0].values[0][0] === 0) {
    [
      ['JavaScript','Frontend',90],['React.js','Frontend',85],['HTML/CSS','Frontend',95],
      ['Node.js','Backend',80],['Express.js','Backend',80],['Python','Backend',75],
      ['PostgreSQL','Database',75],['MongoDB','Database',70],['SQLite','Database',85],
      ['Git','Tools',90],['Docker','Tools',65],['AWS','Tools',60],
    ].forEach(([n, c, l]) =>
      db.run('INSERT INTO skills (name,category,level) VALUES (?,?,?)', [n, c, l])
    );
  }

  saveDb();
}

function saveDb() {
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

function toRows(result) {
  if (!result || !result.length) return [];
  const { columns, values } = result[0];
  return values.map(row => Object.fromEntries(columns.map((c, i) => [c, row[i]])));
}

// ── API routes ────────────────────────────────────────────

// Cache + ETag: browser skips body on 304 Not Modified
const API_CACHE = 'public, max-age=30, stale-while-revalidate=60';

// Simple ETag helper — hash of JSON string length + content sample
function setETag(res, data) {
  const str = JSON.stringify(data);
  const tag  = `"${str.length.toString(36)}-${str.slice(0,8).replace(/\W/g,'')}"`;
  res.setHeader('ETag', tag);
}

app.get('/api/projects', (req, res) => {
  res.setHeader('Cache-Control', API_CACHE);
  const data = toRows(db.exec('SELECT * FROM projects ORDER BY featured DESC, id DESC'))
    .map(p => ({ ...p, tech: p.tech.split(',') }));
  setETag(res, data);
  if (req.headers['if-none-match'] === res.getHeader('ETag'))
    return res.status(304).end();
  res.json(data);
});

app.get('/api/projects/:id', (req, res) => {
  const rows = toRows(db.exec('SELECT * FROM projects WHERE id = ?', [req.params.id]));
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json({ ...rows[0], tech: rows[0].tech.split(',') });
});

app.post('/api/projects', (req, res) => {
  const key = req.headers['x-api-key'];
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY)
    return res.status(403).json({ error: 'Forbidden' });
  const { title, description, tech, github = '', demo = '', image = '', featured = 0 } = req.body;
  if (!title || !description || !tech)
    return res.status(400).json({ error: 'title, description and tech are required.' });
  db.run('INSERT INTO projects (title,description,tech,github,demo,image,featured) VALUES (?,?,?,?,?,?,?)',
    [title, description, Array.isArray(tech) ? tech.join(',') : tech, github, demo, image, featured ? 1 : 0]);
  saveDb();
  const [[{ values: [[id]] }]] = db.exec('SELECT last_insert_rowid()');
  res.status(201).json({ id });
});

app.get('/api/skills', (req, res) => {
  res.setHeader('Cache-Control', API_CACHE);
  const data = toRows(db.exec('SELECT * FROM skills ORDER BY category, level DESC'));
  setETag(res, data);
  if (req.headers['if-none-match'] === res.getHeader('ETag'))
    return res.status(304).end();
  res.json(data);
});

app.post('/api/contact', rateLimit(10, 15 * 60 * 1000), (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message)
    return res.status(400).json({ error: 'All fields are required.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Invalid email address.' });
  if (String(name).length > 100 || String(message).length > 2000)
    return res.status(400).json({ error: 'Input too long.' });
  db.run('INSERT INTO contacts (name,email,message) VALUES (?,?,?)',
    [String(name).trim(), String(email).trim(), String(message).trim()]);
  saveDb();
  console.log(`📬 Contact from ${name} <${email}>`);
  res.json({ success: true, message: 'Message received!' });
});

// SPA fallback
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── Start ─────────────────────────────────────────────────
initDb()
  .then(() => app.listen(PORT, () =>
    console.log(`✓ Portfolio running → http://localhost:${PORT}`)))
  .catch(err => {
    console.error('DB init failed:', err.message);
    app.listen(PORT, () =>
      console.log(`⚠ Running without DB → http://localhost:${PORT}`));
  });
