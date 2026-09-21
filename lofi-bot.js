require('dotenv').config();
const ffmpegPath = require('ffmpeg-static');
process.env.FFMPEG_PATH = ffmpegPath;

const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const path = require('node:path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates, // wajib buat voice/audio
  ],
});

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

  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play,
    },
  });

  function playLofi() {
    const resource = createAudioResource(path.join(__dirname, 'music', 'lofi.mp3'));
    player.play(resource);
  }

  playLofi();
  connection.subscribe(player);

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

  console.log('Kulkas Radio mulai muterin lofi.');
}

client.once('clientReady', () => {
  console.log(`Kulkas Radio online sebagai ${client.user.tag}`);
  startLofiRadio();
});

client.login(process.env.LOFI_BOT_TOKEN);