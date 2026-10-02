const fs = require('node:fs');
const path = require('node:path');

const STORE_PATH = path.join(__dirname, '..', 'data', 'tiktok.json');

function ensureStore() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(
      STORE_PATH,
      JSON.stringify(
        {
          channels: {}, // guildId -> channelId
          trackedUsers: [], // list of usernames or objects
        },
        null,
        2
      )
    );
  }
}

function readStore() {
  ensureStore();
  try {
    const data = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
    if (!data.channels) data.channels = {};
    if (!data.trackedUsers) data.trackedUsers = [];
    return data;
  } catch (err) {
    return { channels: {}, trackedUsers: [] };
  }
}

function writeStore(data) {
  ensureStore();
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

function getNotificationChannel(guildId) {
  const store = readStore();
  return store.channels[guildId] || null;
}

function setNotificationChannel(guildId, channelId) {
  const store = readStore();
  store.channels[guildId] = channelId;
  writeStore(store);
}

function getTrackedUsers() {
  const store = readStore();
  return store.trackedUsers;
}

function addTrackedUser(username) {
  const store = readStore();
  const normalized = username.trim().replace(/^@/, '');
  if (!store.trackedUsers.includes(normalized)) {
    store.trackedUsers.push(normalized);
    writeStore(store);
    return true;
  }
  return false;
}

function removeTrackedUser(username) {
  const store = readStore();
  const normalized = username.trim().replace(/^@/, '');
  const index = store.trackedUsers.indexOf(normalized);
  if (index !== -1) {
    store.trackedUsers.splice(index, 1);
    writeStore(store);
    return true;
  }
  return false;
}

module.exports = {
  getNotificationChannel,
  setNotificationChannel,
  getTrackedUsers,
  addTrackedUser,
  removeTrackedUser,
};
