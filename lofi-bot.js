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

let player;
let currentTrackPath;

function playLofi() {
  const trackPath = getCurrentTrack();
  currentTrackPath = trackPath;
  const resource = createAudioResource(trackPath);
  player.play(resource);
}

function startLofiRadio() {
  const channelId = process.env.LOFI_VOICE_CHANNEL_ID;
  const channel = client.channels.cache.get(channelId);

  if (!channel) {
    console.log('Voice channel lofi tidak ditemukan. Cek LOFI_VOICE_CHANNEL_ID di .env');
    return;
  }

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: true,
  });

  player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play,
    },
  });

  playLofi();
  connection.subscribe(player);

  // Begitu lagu selesai, cek lagi jam berapa sekarang, baru main ulang (bisa jadi track beda)
  player.on(AudioPlayerStatus.Idle, () => {
    playLofi();
  });

  player.on('error', (error) => {
    console.error('Error di audio player lofi:', error);
  });

  connection.on(VoiceConnectionStatus.Disconnected, () => {
    console.log('Koneksi voice lofi terputus, mencoba reconnect...');
    setTimeout(() => startLofiRadio(), 5000);
  });

  console.log(`Kulkas Radio mulai muterin lofi (${isNightTime() ? 'malam' : 'siang'}).`);
}

// Cek tiap 5 menit — kalau ternyata udah ganti waktu (siang↔malam) di tengah lagu, langsung switch track
setInterval(() => {
  if (!player) return;

  const expectedTrack = getCurrentTrack();
  if (expectedTrack !== currentTrackPath) {
    console.log(`Waktu berubah, ganti ke track ${isNightTime() ? 'malam' : 'siang'}.`);
    playLofi();
  }
}, 5 * 60 * 1000);

client.once('clientReady', () => {
  console.log(`Kulkas Radio online sebagai ${client.user.tag}`);
  startLofiRadio();
});

client.login(process.env.LOFI_BOT_TOKEN);