const { EmbedBuilder } = require('discord.js');
const { getUserSettings } = require('./shalatStore');
const { getPrayerTimes } = require('./shalatApi');

const CHECK_INTERVAL = 60 * 1000;

const PRAYERS = [
  { key: 'Fajr', name: 'Subuh' },
  { key: 'Dhuhr', name: 'Dzuhur' },
  { key: 'Asr', name: 'Ashar' },
  { key: 'Maghrib', name: 'Maghrib' },
  { key: 'Isha', name: 'Isya' },
];

const sentReminders = new Map();

function getWIBDateTime() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
}

function getTodayKey() {
  const parts = getWIBDateTime();

  const year = parts.find((part) => part.type === 'year').value;
  const month = parts.find((part) => part.type === 'month').value;
  const day = parts.find((part) => part.type === 'day').value;

  return `${year}-${month}-${day}`;
}

function getCurrentTime() {
  const parts = getWIBDateTime();

  const hour = parts.find((part) => part.type === 'hour').value;
  const minute = parts.find((part) => part.type === 'minute').value;

  return `${hour}:${minute}`;
}

async function checkPrayerTimes(client) {
  const store = require('./shalatStore');

  const today = getTodayKey();
  const currentTime = getCurrentTime();

  for (const userId of Object.keys(
    store.readStore ? store.readStore().users : {}
  )) {
    const settings = getUserSettings(userId);

    if (!settings?.enabled || !settings.city) {
      continue;
    }

    try {
      const data = await getPrayerTimes(settings.city);

      const prayer = PRAYERS.find(
        (item) => data.timings[item.key] === currentTime
      );

      console.log(
        `[Shalat] Cek ${userId} | ${settings.city} | sekarang ${currentTime}`
      );

      if (!prayer) {
        continue;
      }

      const reminderKey = `${userId}:${today}:${prayer.key}`;

      if (sentReminders.has(reminderKey)) {
        continue;
      }

      sentReminders.set(reminderKey, true);

      console.log(
        `[Shalat] ${prayer.name} untuk ${userId} - ${settings.city}`
      );

      try {
        const user = await client.users.fetch(userId);

        await user.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0x2f6f4e)
              .setTitle(`🕌 Waktu ${prayer.name} Telah Tiba`)
              .setDescription(
                [
                  `Saatnya menunaikan shalat **${prayer.name}**.`,
                  '',
                  `📍 **Lokasi**`,
                  settings.city,
                  '',
                  `⏰ **Waktu**`,
                  `${currentTime} WIB`,
                ].join('\n')
              )
              .setFooter({
                text: 'Shalat Reminder • Kulkas',
              }),
          ],
        });

        console.log(
          `[Shalat] DM ${prayer.name} berhasil dikirim ke ${userId}`
        );
      } catch (error) {
        console.error(
          `[Shalat] Gagal mengirim DM ke ${userId}:`,
          error.message
        );
      }
    } catch (error) {
      console.error(
        `[Shalat] Gagal mengecek ${settings.city}:`,
        error.message
      );
    }
  }
}

function startShalatScheduler(client) {
  console.log('[Shalat] Scheduler aktif.');

  checkPrayerTimes(client);

  setInterval(() => {
    checkPrayerTimes(client);
  }, CHECK_INTERVAL);
}

module.exports = {
  startShalatScheduler,
};
