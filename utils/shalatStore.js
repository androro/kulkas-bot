const fs = require('node:fs');
const path = require('node:path');

const STORE_PATH = path.join(
  __dirname,
  '..',
  'data',
  'shalat.json'
);

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
          users: {},
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
    const data = JSON.parse(
      fs.readFileSync(STORE_PATH, 'utf-8')
    );

    if (!data.users) {
      data.users = {};
    }

    return data;
  } catch (error) {
    return {
      users: {},
    };
  }
}

function writeStore(data) {
  ensureStore();

  fs.writeFileSync(
    STORE_PATH,
    JSON.stringify(data, null, 2)
  );
}

function getUserSettings(userId) {
  const store = readStore();

  return store.users[userId] || null;
}

function setUserSettings(userId, settings) {
  const store = readStore();

  store.users[userId] = {
    ...(store.users[userId] || {}),
    ...settings,
  };

  writeStore(store);
}

function removeUserSettings(userId) {
  const store = readStore();

  if (!store.users[userId]) {
    return false;
  }

  delete store.users[userId];
  writeStore(store);

  return true;
}

module.exports = {
  getUserSettings,
  setUserSettings,
  removeUserSettings,
  readStore,
};
