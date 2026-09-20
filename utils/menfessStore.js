const fs = require('node:fs');
const path = require('node:path');

const STORE_PATH = path.join(__dirname, '..', 'data', 'menfess.json');

function ensureStore() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify({ counter: 0, logs: [] }, null, 2));
  }
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
}

function writeStore(data) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

// Ambil nomor menfess berikutnya (otomatis bertambah, tersimpan permanen)
function getNextMenfessNumber() {
  const store = readStore();
  store.counter += 1;
  writeStore(store);
  return store.counter;
}

// Simpan data internal (untuk moderasi) — TIDAK ditampilkan ke member
function logMenfess({ id, userId, threadId }) {
  const store = readStore();
  store.logs.push({ id, userId, threadId, timestamp: Date.now(), reported: false, reporters: [] });
  writeStore(store);
}

// Ambil satu entry menfess berdasarkan ID
function getMenfessEntry(id) {
  const store = readStore();
  return store.logs.find((log) => log.id === id) || null;
}

// Tambahkan report dari seorang user. Cegah report dobel dari orang yang sama.
function addReport(id, reporterId) {
  const store = readStore();
  const entry = store.logs.find((log) => log.id === id);

  if (!entry) {
    return { entry: null, alreadyReported: false };
  }

  if (entry.reporters.includes(reporterId)) {
    return { entry, alreadyReported: true };
  }

  entry.reporters.push(reporterId);
  entry.reported = true;
  entry.reportedAt = Date.now();
  writeStore(store);

  return { entry, alreadyReported: false };
}

module.exports = { getNextMenfessNumber, logMenfess, getMenfessEntry, addReport };