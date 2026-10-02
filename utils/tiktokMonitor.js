const { TikTokLiveConnection } = require('tiktok-live-connector');
const { EmbedBuilder } = require('discord.js');
const { getTrackedUsers, getNotificationChannel } = require('./tiktokStore');

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 menit

// username -> { isLive, lastChecked }
const states = new Map();

// username yang sedang diproses supaya polling tidak tumpang tindih
const checking = new Set();

async function checkUser(client, username) {
  if (checking.has(username)) return;

  checking.add(username);

  try {
    const connection = new TikTokLiveConnection(username, {
      processInitialData: false,
    });

    const isLive = await connection.fetchIsLive();

    const previousState = states.get(username);

    states.set(username, {
      isLive,
      lastChecked: Date.now(),
    });

    console.log(
      `[TikTok] @${username}: ${isLive ? 'LIVE 🔴' : 'OFFLINE'}`
    );

    // Pertama kali ditemukan:
    // simpan state saja supaya bot restart tidak langsung spam notif.
    if (!previousState) {
      return;
    }

    // Hanya notif ketika berubah OFFLINE -> LIVE
    if (!previousState.isLive && isLive) {
      await sendLiveNotification(client, username);
    }
  } catch (error) {
    console.error(
      `[TikTok] Gagal mengecek @${username}:`,
      error.message
    );
  } finally {
    checking.delete(username);
  }
}

async function sendLiveNotification(client, username) {
  const trackedUsers = getTrackedUsers();

  // Pastikan username masih terdaftar
  if (!trackedUsers.includes(username)) return;

  for (const guild of client.guilds.cache.values()) {
    const channelId = getNotificationChannel(guild.id);

    if (!channelId) continue;

    try {
      const channel = await client.channels.fetch(channelId).catch(() => null);

      if (!channel || !channel.isTextBased()) {
        console.log(
          `[TikTok] Channel notif tidak ditemukan untuk guild ${guild.id}`
        );
        continue;
      }

      const embed = new EmbedBuilder()
        .setColor(0xff0050)
        .setTitle('🔴 TikTok LIVE')
        .setDescription(
          `**@${username}** sedang LIVE di TikTok!`
        )
        .setURL(`https://www.tiktok.com/@${username}/live`)
        .setTimestamp();

      await channel.send({
        content: `🔴 **@${username} sedang LIVE!**`,
        embeds: [embed],
      });

      console.log(
        `[TikTok] Notifikasi LIVE @${username} dikirim ke ${guild.name}`
      );
    } catch (error) {
      console.error(
        `[TikTok] Gagal kirim notif @${username} ke ${guild.id}:`,
        error.message
      );
    }
  }
}

async function checkAllUsers(client) {
  const users = getTrackedUsers();

  if (!users.length) {
    console.log('[TikTok] Tidak ada akun yang sedang dipantau.');
    return;
  }

  console.log(`[TikTok] Mengecek ${users.length} akun...`);

  for (const username of users) {
    await checkUser(client, username);
  }
}

function startTikTokMonitor(client) {
  console.log(
    `[TikTok] Monitor aktif. Interval: ${POLL_INTERVAL_MS / 60000} menit.`
  );

  // Cek pertama setelah bot siap
  checkAllUsers(client).catch((error) => {
    console.error('[TikTok] Error saat initial check:', error);
  });

  // Polling berikutnya
  setInterval(() => {
    checkAllUsers(client).catch((error) => {
      console.error('[TikTok] Error saat polling:', error);
    });
  }, POLL_INTERVAL_MS);
}

module.exports = {
  startTikTokMonitor,
};
