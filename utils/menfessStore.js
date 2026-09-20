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
function logMenfess({ id, userId }) {
  const store = readStore();
  store.logs.push({ id, userId, timestamp: Date.now(), reported: false });
  writeStore(store);
}

// Tandai menfess sebagai dilaporkan
function markReported(id) {
  const store = readStore();
  const entry = store.logs.find((log) => log.id === id);
  if (entry) {
    entry.reported = true;
    entry.reportedAt = Date.now();
    writeStore(store);
  }
  return entry || null;
}

module.exports = { getNextMenfessNumber, logMenfess, markReported };