require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType, Partials } = require('discord.js');
const { generateCircleAvatar } = require('./utils/generateAvatar');
const { getNextMenfessNumber, logMenfess, markReported } = require('./utils/menfessStore');
const fs = require('node:fs');
const path = require('node:path');

// Bikin instance client Discord dengan intent yang dibutuhkan
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // butuh ini buat deteksi member baru join
    GatewayIntentBits.DirectMessages, // butuh ini buat terima DM
    GatewayIntentBits.MessageContent, // butuh ini buat baca isi pesan
  ],
  partials: [Partials.Channel], // wajib, biar event DM ke-detect walau channel belum ke-cache
});

const welcomeMessages = [
  (mention) => `Selamat datang ${mention}. Jangan bikin masalah.`,
  (mention) => `Oh, ${mention} datang. Selamat datang.`,
  (mention) => `Hah? ${mention} masuk? Ya sudah, selamat datang.`,
  (mention) => `Selamat datang ${mention}. B-bukan berarti aku senang.`,
  (mention) => `${mention}, akhirnya datang juga. Jangan diam saja.`,
  (mention) => `Selamat datang ${mention}. Baca rules dulu.`,
  (mention) => `Oh, penghuni baru. Selamat datang ${mention}.`,
  (mention) => `${mention} telah bergabung. Jangan merepotkan.`,
  (mention) => `Hmph, ${mention} datang juga. Selamat datang.`,
  (mention) => `Selamat datang ${mention}. Jangan sampai bikin masalah.`,
];

const goodbyeMessages = [
  (tag) => `${tag} pergi. Ya sudah.`,
  (tag) => `Hah? ${tag} keluar? Terserah.`,
  (tag) => `${tag} telah pergi. Jangan lupa jalan pulang.`,
  (tag) => `Oh, ${tag} keluar. Ya sudah, hati-hati.`,
  (tag) => `Selamat jalan ${tag}. B-bukan berarti aku akan merindukanmu.`,
  (tag) => `${tag} pergi juga. Server jadi lebih sepi.`,
  (tag) => `Hmph, ${tag} meninggalkan server.`,
  (tag) => `${tag} sudah keluar. Jangan kembali kalau cuma bikin masalah.`,
  (tag) => `Oh, ${tag} pergi. Ya sudah, sana.`,
  (tag) => `${tag} telah meninggalkan **Tongkrongan Tech**.`,
];

// Konfigurasi fitur Menfess
const MENFESS_TIMEOUT_MS = 5 * 60 * 1000; // 5 menit
const MAX_ATTACHMENT_SIZE_MB = 8;
const MAX_TEXT_LENGTH = 2000;

// Nyimpen siapa aja yang lagi dalam sesi menfess (in-memory, hilang kalau bot restart)
const menfessSessions = new Map();

// Load semua command dari folder commands/
client.commands = new Map();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

// Event: bot berhasil online dan siap
client.once('clientReady', () => {
  console.log(`Kulkas online sebagai ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: 'hmph!', type: 0 }], // type 3 = Watching
    status: 'online', // online | idle | dnd | invisible
  });
});

// Event: ada member baru join server
client.on('guildMemberAdd', async (member) => {
  try {
    const channel = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);

    if (!channel) {
      console.log('Welcome channel tidak ditemukan. Cek WELCOME_CHANNEL_ID di .env');
      return;
    }

        // Generate avatar circle + border
    const avatarBuffer = await generateCircleAvatar(
      member.user.displayAvatarURL({ extension: 'png', size: 512 }),
      '#fda4af'
    );
    const avatarAttachment = new AttachmentBuilder(avatarBuffer, { name: 'avatar.png' });

    const welcomeEmbed = new EmbedBuilder()
      .setColor(0xfda4af)
      .setTitle('Welcome to Tongkrongan Tech! ')
      .setDescription(
        [
          'Tempat nongkrong, ngobrol, belajar, coding, dan sharing seputar teknologi. ',
          '',
          'To get started, please verify yourself first!',
          '',
          '📖 Verify your account:',
          'Head over to <#1547790304776683543> and click the Verify button. Once verified, you\'ll unlock access to the rest of the server.',
          '',
          "That's it! You're ready to explore and hang out."
        ].join('\n')
      )
      .setThumbnail('attachment://avatar.png');

    const randomTemplate = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

    await channel.send({
      content: randomTemplate(member),
      embeds: [welcomeEmbed],
      files: [avatarAttachment],
    });

    console.log(`Welcome message terkirim untuk ${member.user.tag}`);
  } catch (error) {
    console.error('Error saat kirim welcome message:', error);
  }
});

// Event: ada member yang keluar/di-kick dari server
client.on('guildMemberRemove', async (member) => {
  try {
    const channel = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);

    if (!channel) {
      console.log('Welcome channel tidak ditemukan. Cek WELCOME_CHANNEL_ID di .env');
      return;
    }

    // Generate avatar circle + border
    const avatarBuffer = await generateCircleAvatar(
      member.user.displayAvatarURL({ extension: 'png', size: 512 }),
      '#fda4af'
    );
    const avatarAttachment = new AttachmentBuilder(avatarBuffer, { name: 'avatar.png' });

    const goodbyeEmbed = new EmbedBuilder()
      .setColor(0xfda4af)
      .setTitle('Goodbye!')
      .setDescription(
        [
          'Thanks for hanging out, sharing, and being part of the community!',
          '',
          'We hope you had a great time here. Wherever you’re headed next, we hope you’ll be happy and do well in your new place. ',
          '',
          'Take care, and see you around! '
        ].join('\n')
      )
      .setThumbnail('attachment://avatar.png');

    const randomGoodbyeTemplate = goodbyeMessages[Math.floor(Math.random() * goodbyeMessages.length)];

    await channel.send({
      content: randomGoodbyeTemplate(member.user.tag),
      embeds: [goodbyeEmbed],
      files: [avatarAttachment],
    });

    console.log(`Goodbye message terkirim untuk ${member.user.tag}`);
  } catch (error) {
    console.error('Error saat kirim goodbye message:', error);
  }
});

// Proses isi menfess yang dikirim member, lalu post ke Forum Channel
async function handleMenfessSubmission(message) {
  const textContent = message.content.trim();
  const attachments = [...message.attachments.values()];
  const imageAttachments = attachments.filter((att) => att.contentType?.startsWith('image/'));
  const nonImageAttachments = attachments.filter((att) => !att.contentType?.startsWith('image/'));

  // Validasi: harus ada teks atau gambar
  if (!textContent && imageAttachments.length === 0) {
    await message.reply('Menfess kosong. Kirim teks atau gambar dulu.');
    return;
  }

  // Validasi: cuma boleh attachment gambar
  if (nonImageAttachments.length > 0) {
    await message.reply('Menfess cuma bisa pakai attachment gambar.');
    return;
  }

  // Validasi: ukuran gambar
  const maxBytes = MAX_ATTACHMENT_SIZE_MB * 1024 * 1024;
  const oversized = imageAttachments.find((att) => att.size > maxBytes);
  if (oversized) {
    await message.reply(`Ukuran gambar maksimal ${MAX_ATTACHMENT_SIZE_MB}MB.`);
    return;
  }

  // Validasi: panjang teks
  if (textContent.length > MAX_TEXT_LENGTH) {
    await message.reply(`Teksnya kepanjangan. Maksimal ${MAX_TEXT_LENGTH} karakter.`);
    return;
  }

  try {
    const forumChannel = await message.client.channels.fetch(process.env.FORUM_MENFESS_CHANNEL_ID);

    if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) {
      await message.reply('Forum menfess belum ke-setup dengan benar. Hubungi admin.');
      return;
    }

    const menfessId = getNextMenfessNumber();
    const title = `Menfess #${String(menfessId).padStart(3, '0')}`;

    const reportButton = new ButtonBuilder()
      .setCustomId(`menfess_report_${menfessId}`)
      .setLabel('Report')
      .setStyle(ButtonStyle.Danger);

    const reportRow = new ActionRowBuilder().addComponents(reportButton);

    await forumChannel.threads.create({
      name: title,
      message: {
        content: textContent || '\u200b', // zero-width space kalau cuma gambar, biar nggak kosong
        files: imageAttachments.map((att) => att.url), // forward langsung dari URL, tidak disimpan lokal
        components: [reportRow],
      },
    });

    logMenfess({ id: menfessId, userId: message.author.id });

    await message.reply('Menfess kamu sudah dikirim secara anonim.');
  } catch (error) {
    console.error('Error saat proses menfess:', error);
    await message.reply('Ada masalah waktu ngirim menfess. Coba lagi nanti.');
  }
}

// Event: ada pesan masuk (kita cuma peduli DM)
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.type !== ChannelType.DM) return;

  const userId = message.author.id;
  const content = message.content.trim().toLowerCase();

  // Kalau member sedang dalam sesi menfess aktif
  if (menfessSessions.has(userId)) {
    const session = menfessSessions.get(userId);

    if (content === 'cancel') {
      clearTimeout(session.timeout);
      menfessSessions.delete(userId);
      await message.reply('Menfess dibatalkan.');
      return;
    }

    clearTimeout(session.timeout);
    menfessSessions.delete(userId);
    await handleMenfessSubmission(message);
    return;
  }

  // Kalau member baru mulai sesi
  if (content === 'menfess') {
    const timeout = setTimeout(() => {
      menfessSessions.delete(userId);
      message.reply('Sesi menfess dibatalkan karena kelamaan nggak ada respon.').catch(() => {});
    }, MENFESS_TIMEOUT_MS);

    menfessSessions.set(userId, { timeout });
    await message.reply('Silakan kirim pesan menfess kamu.');
  }
});

// Event: ada interaction (slash command dipanggil, tombol diklik, dll)
client.on('interactionCreate', async (interaction) => {
  // Kalau yang terjadi adalah slash command
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.log(`Command ${interaction.commandName} tidak ditemukan.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error saat menjalankan command ${interaction.commandName}:`, error);
    }
  }

  // Kalau yang terjadi adalah klik tombol
  if (interaction.isButton()) {
    if (interaction.customId === 'verify') {
      // Langsung "defer" dulu, kasih Discord lebih banyak waktu (sampai 15 menit)
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      try {
        const role = interaction.guild.roles.cache.get(process.env.VERIFY_ROLE_ID);

        if (!role) {
          await interaction.editReply({
            content: 'Role verify tidak ditemukan. Hubungi admin server.',
          });
          return;
        }

        if (interaction.member.roles.cache.has(role.id)) {
          await interaction.editReply({
            content: 'Hmph, kamu udah verified. Nggak usah klik-klik lagi!',
          });
          return;
        }

        await interaction.member.roles.add(role);

        const successEmbed = new EmbedBuilder()
          .setColor(0xfda4af)
          .setAuthor({ name: 'Verification successful !' })
          .setDescription('Please check <#1547806565086535720>  before doing anything else.')
          .setThumbnail('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHodnXgfROfvy7s-f7sX-iTSm4c5Jty9QQGWEPspRBtPKMqpqFeEfSTE2s&s=10');

        const rulesButton = new ButtonBuilder()
          .setLabel('│rules')
          .setStyle(ButtonStyle.Link)
          .setURL('https://discord.com/channels/1544373829038637066/1547806565086535720/1550541935243173891')
          .setEmoji('📜');

        const successRow = new ActionRowBuilder().addComponents(rulesButton);

        await interaction.editReply({
          embeds: [successEmbed],
          components: [successRow],
        });

        console.log(`${interaction.user.tag} berhasil verify.`);
      } catch (error) {
        console.error('Error saat proses verify:', error);

        // Cek dulu apakah masih bisa di-reply sebelum coba kirim error message
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({
            content: 'Ada masalah waktu verifikasi. Coba lagi atau hubungi admin.',
          }).catch(() => {}); // kalau gagal lagi, diamkan aja, jangan crash
        }
      }
    } 
    else if (interaction.customId.startsWith('menfess_report_')) {
      const menfessId = Number(interaction.customId.replace('menfess_report_', ''));
      const entry = markReported(menfessId);

      await interaction.reply({
        content: entry
          ? 'Laporan diterima. Admin bakal ninjau menfess ini.'
          : 'Menfess ini nggak ketemu di data.',
        flags: MessageFlags.Ephemeral,
      });

      console.log(`Menfess #${menfessId} dilaporkan oleh ${interaction.user.tag}`);
    }
  }
});

// Login pakai token dari .env
client.login(process.env.DISCORD_TOKEN);