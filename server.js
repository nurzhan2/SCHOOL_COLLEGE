// ============================================================
//  СЕРВЕР «Первый Школледж»
//  - Раздаёт статические файлы сайта
//  - API для раздела «События»: список / добавить / удалить
//  - Загрузка фото из админки
//
//  Запуск:  node server.js   (Railway: startCommand = "node server.js")
//  Пароль админки берётся из переменной окружения ADMIN_KEY,
//  по умолчанию "shkol2026".
//
//  ВАЖНО про хранение: события пишутся в data/events.json, фото —
//  в assets/events/. На Railway, чтобы данные не сбрасывались при
//  редеплое, подключите Volume и примонтируйте его к папке /data
//  (см. переменную DATA_DIR ниже).
// ============================================================

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'shkol2026';

// --- папки для данных и загрузок ---
const ROOT = __dirname;
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const UPLOAD_DIR = path.join(ROOT, 'assets', 'events');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

for (const dir of [DATA_DIR, UPLOAD_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
if (!fs.existsSync(EVENTS_FILE)) fs.writeFileSync(EVENTS_FILE, '[]', 'utf-8');

// --- helpers ---
function readEvents() {
  try { return JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8')) || []; }
  catch (e) { return []; }
}
function writeEvents(list) {
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
}
function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.key;
  if (key !== ADMIN_KEY) return res.status(401).json({ error: 'Неверный ключ администратора' });
  next();
}

// --- загрузка фото ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    cb(null, 'event-' + Date.now() + '-' + Math.round(Math.random() * 1e6) + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // до 8 МБ
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype))
});

app.use(express.json({ limit: '2mb' }));

// ====================== API: СОБЫТИЯ ======================

// Публичный список событий (новые сверху)
app.get('/api/events', (req, res) => {
  const list = readEvents().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  res.json(list);
});

// Загрузка фото (только админ) -> возвращает путь к файлу
app.post('/api/upload', requireAdmin, upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не получен' });
  res.json({ url: 'assets/events/' + req.file.filename });
});

// Добавить событие (только админ)
app.post('/api/events', requireAdmin, (req, res) => {
  const { title = '', date = '', text = '', photo = '', link = '' } = req.body || {};
  if (!title.trim()) return res.status(400).json({ error: 'Укажите заголовок' });
  const list = readEvents();
  const item = {
    id: 'ev_' + Date.now(),
    title: String(title).slice(0, 200),
    date: String(date).slice(0, 40),
    text: String(text).slice(0, 1000),
    photo: String(photo).slice(0, 300),
    link: String(link).slice(0, 500),
    created: new Date().toISOString()
  };
  list.push(item);
  writeEvents(list);
  res.json(item);
});

// Удалить событие (только админ)
app.delete('/api/events/:id', requireAdmin, (req, res) => {
  const list = readEvents();
  const item = list.find(e => e.id === req.params.id);
  const next = list.filter(e => e.id !== req.params.id);
  writeEvents(next);
  // подчистим файл фото, если он наш
  if (item && item.photo && item.photo.startsWith('assets/events/')) {
    const fp = path.join(ROOT, item.photo);
    fs.existsSync(fp) && fs.unlink(fp, () => {});
  }
  res.json({ ok: true });
});

// ====================== СТАТИКА ======================
app.use(express.static(ROOT, { extensions: ['html'] }));

app.listen(PORT, () => console.log('Первый Школледж — сервер запущен на порту ' + PORT));
