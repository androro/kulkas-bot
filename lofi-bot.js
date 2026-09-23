require('dotenv').config();
const ffmpegPath = require('ffmpeg-static');
process.env.FFMPEG_PATH = ffmpegPath;

const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const path = require('node:path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const DAY_TRACK = path.join(__dirname, 'music', 'lofi.mp3');
const NIGHT_TRACK = path.join(__dirname, 'music', 'lofi-night.mp3');
const NIGHT_INTRO_TRACK = path.join(__dirname, 'music', 'brahms-lullaby.mp3');

// Cek apakah sekarang termasuk jam malam (22:00 - 05:00 WIB)
function isNightTime() {
  const hourWIB = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Jakarta',
    hour: 'numeric',
    hour12: false,
  });
  const hour = Number(hourWIB);
  return hour >= 22 || hour < 5;
}

function getCurrentTrack() {
  return isNightTime() ? NIGHT_TRACK : DAY_TRACK;
}

// Nyimpen player & track aktif per channel, biar bisa dikelola satu-satu
const activeRadios = new Map();

function updatePresence(trackPath) {
  const trackNames = {
    'lofi.mp3': 'Lofi Day (05:00 - 22:00)',
    'lofi-night.mp3': 'Lofi Night (22:00 - 05:00)',
    'brahms-lullaby.mp3': "Time for Sleep! (Intro)",
  };
  const fileName = path.basename(trackPath);
  const trackName = trackNames[fileName] || 'Lofi Radio';

  if (client.user) {
    client.user.setPresence({
      activities: [{ name: trackName, type: 2 }], // type 2 = Listening
      status: 'online',
    });
  }
}

function playLofi(channelId) {
  const radio = activeRadios.get(channelId);
  if (!radio) return;

  const trackPath = getCurrentTrack();
  radio.currentTrackPath = trackPath;
  radio.lastKnownIsNight = isNightTime();
  const resource = createAudioResource(trackPath);
  radio.player.play(resource);
  updatePresence(trackPath);
}

function playNightIntro(channelId) {
  const radio = activeRadios.get(channelId);
  if (!radio) return;

  radio.currentTrackPath = NIGHT_INTRO_TRACK;
  radio.lastKnownIsNight = true;
  const resource = createAudioResource(NIGHT_INTRO_TRACK);
  radio.player.play(resource);
  updatePresence(NIGHT_INTRO_TRACK);
  console.log(`Muterin Brahms Lullaby dulu sebelum lofi malam di channel ${channelId}.`);
}

function startLofiRadio(channelId) {
  const channel = client.channels.cache.get(channelId);

  if (!channel) {
    console.log(`Voice channel ${channelId} tidak ditemukan. Cek LOFI_VOICE_CHANNEL_IDS di .env`);
    return;
  }

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: true,
  });

  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play,
    },
  });

  activeRadios.set(channelId, {
    player,
    connection,
    currentTrackPath: null,
    lastKnownIsNight: isNightTime(),
  });

  // Kalau pas start udah malam, mulai dengan Brahms dulu; kalau siang, langsung track siang
  if (isNightTime()) {
    playNightIntro(channelId);
  } else {
    playLofi(channelId);
  }

  connection.subscribe(player);

  player.on(AudioPlayerStatus.Idle, () => {
    playLofi(channelId);
  });

  player.on('error', (error) => {
    console.error(`Error di audio player lofi (channel ${channelId}):`, error);
  });

  connection.on(VoiceConnectionStatus.Disconnected, () => {
    console.log(`Koneksi voice lofi terputus (channel ${channelId}), mencoba reconnect...`);
    activeRadios.delete(channelId);
    setTimeout(() => startLofiRadio(channelId), 5000);
  });

  console.log(`Kulkas Radio mulai muterin lofi di ${channel.guild.name} (${isNightTime() ? 'malam' : 'siang'}).`);
}

// Cek tiap 5 menit — kalau ternyata udah ganti waktu, switch track (dan mainkan intro kalau baru masuk malam)
setInterval(() => {
  const nowIsNight = isNightTime();

  for (const [channelId, radio] of activeRadios) {
    const justEnteredNight = nowIsNight && !radio.lastKnownIsNight;

    if (justEnteredNight) {
      console.log(`Waktu berubah jadi malam di channel ${channelId}, muterin intro dulu.`);
      playNightIntro(channelId);
    } else if (nowIsNight !== radio.lastKnownIsNight) {
      console.log(`Waktu berubah, ganti ke track ${nowIsNight ? 'malam' : 'siang'} di channel ${channelId}.`);
      playLofi(channelId);
    }
  }
}, 5 * 60 * 1000);

client.once('clientReady', () => {
  console.log(`Kulkas Radio online sebagai ${client.user.tag}`);

  const channelIds = (process.env.LOFI_VOICE_CHANNEL_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  if (channelIds.length === 0) {
    console.log('Tidak ada voice channel yang dikonfigurasi. Cek LOFI_VOICE_CHANNEL_IDS di .env');
    return;
  }

  for (const channelId of channelIds) {
    startLofiRadio(channelId);
  }
});

client.login(process.env.LOFI_BOT_TOKEN);