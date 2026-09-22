const fs = require('node:fs');
const path = require('node:path');

const STORE_PATH = path.join(__dirname, '..', 'data', 'menfess.json');

function ensureStore() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify({ counter: 0, logs: [], freedNumbers: [], commentCounter: 0, comments: [] }, null, 2));
  }
}

function readStore() {
  ensureStore();
  const data = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
  if (!data.freedNumbers) data.freedNumbers = []; // jaga-jaga buat data lama
  if (!data.commentCounter) data.commentCounter = 0;
  if (!data.comments) data.comments = [];
  return data;
}

function writeStore(data) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

// Ambil nomor menfess berikutnya. Prioritas: pakai nomor bekas yang udah dibebasin
// (yang paling kecil dulu). Kalau nggak ada, baru nambah nomor baru.
function getNextMenfessNumber() {
  const store = readStore();

  if (store.freedNumbers.length > 0) {
    store.freedNumbers.sort((a, b) => a - b);
    const reused = store.freedNumbers.shift();
    writeStore(store);
    return reused;
  }

  store.counter += 1;
  writeStore(store);
  return store.counter;
}

// Simpan data komentar (untuk moderasi & fitur hapus komen sendiri)
function logComment({ menfessId, userId, messageId, threadId }) {
  const store = readStore();
  store.commentCounter += 1;
  const id = store.commentCounter;

  store.comments.push({ id, menfessId, userId, messageId, threadId, timestamp: Date.now() });
  writeStore(store);

  return id;
}

// Ambil satu entry komentar berdasarkan ID
function getCommentEntry(id) {
  const store = readStore();
  return store.comments.find((c) => c.id === id) || null;
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

// Reset counter menfess. Kalau startFrom diisi, nomor berikutnya mulai dari situ+1.
// Kalau kosong, reset ke 0 (nomor berikutnya #001). Ini juga ngosongin daftar nomor bebas.
function resetCounter(startFrom = 0) {
  const store = readStore();
  store.counter = startFrom;
  store.freedNumbers = [];
  writeStore(store);
}

// Bebasin sebuah nomor menfess (dipanggil pas menfess dihapus), biar bisa dipakai lagi nanti
function freeNumber(id) {
  const store = readStore();
  store.logs = store.logs.filter((log) => log.id !== id);
  if (!store.freedNumbers.includes(id)) {
    store.freedNumbers.push(id);
  }
  writeStore(store);
}

// Ambil daftar nomor yang lagi bebas (bisa dipakai ulang), urut dari kecil
function getFreedNumbers() {
  const store = readStore();
  return [...store.freedNumbers].sort((a, b) => a - b);
}

module.exports = {
  getNextMenfessNumber,
  logMenfess,
  getMenfessEntry,
  addReport,
  resetCounter,
  freeNumber,
  getFreedNumbers,
  logComment,
  getCommentEntry,
};