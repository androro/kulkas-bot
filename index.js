require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType, Partials } = require('discord.js');
const { generateCircleAvatar } = require('./utils/generateAvatar');
const { getNextMenfessNumber, logMenfess, getMenfessEntry, addReport, freeNumber, logComment, getCommentEntry, getMenfessEntryByThreadId } = require('./utils/menfessStore');
const { startTikTokMonitor } = require('./utils/tiktokMonitor');
const { startShalatScheduler } = require('./utils/shalatScheduler');
const fs = require('node:fs');
const path = require('node:path');

// Bikin instance client Discord dengan intent yang dibutuhkan
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // butuh ini buat deteksi member baru join
    GatewayIntentBits.DirectMessages, // butuh ini buat terima DM
    GatewayIntentBits.MessageContent, // butuh ini buat baca isi pesan
    GatewayIntentBits.GuildMessages, // butuh ini buat baca pesan di server (termasuk thread forum)
  ],
  partials: [Partials.Channel],
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
const MAX_TITLE_LENGTH = 80; // dikurangi karena bakal digabung sama "Menfess #001 - "

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
    activities: [{ name: 'hmph!', type: 0 }],
    status: 'online',
  });

  startTikTokMonitor(client);
  startShalatScheduler(client);
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
async function handleMenfessSubmission(message, title) {
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
    const threadTitle = title
      ? `#${String(menfessId).padStart(3, '0')} - ${title}`.slice(0, 100)
      : `Menfess #${String(menfessId).padStart(3, '0')}`;

    const reportButton = new ButtonBuilder()
      .setCustomId(`menfess_report_${menfessId}`)
      .setLabel('Report')
      .setStyle(ButtonStyle.Danger);

    const reportRow = new ActionRowBuilder().addComponents(reportButton);

    const thread = await forumChannel.threads.create({
      name: threadTitle,
      message: {
        content: textContent || '\u200b', // zero-width space kalau cuma gambar, biar nggak kosong
        files: imageAttachments.map((att) => att.url), // forward langsung dari URL, tidak disimpan lokal
        components: [reportRow],
      },
    });

    logMenfess({ id: menfessId, userId: message.author.id, threadId: thread.id });

    await message.reply(
      `Menfess kamu sudah dikirim secara anonim dengan nomor #${String(menfessId).padStart(3, '0')}.\n\n` +
      `**Perintah yang bisa dipakai:**\n` +
      `\`hapus <nomor>\` — hapus menfess kamu (contoh: \`hapus ${menfessId}\`)\n` +
      `\`balas <nomor> <pesan>\` — balas komentar di menfess manapun secara anonim (contoh: \`balas ${menfessId} setuju banget\`)\n` +
      `\`hapuskomen <id komentar>\` — hapus komentar kamu sendiri\n` +
      `\`cancel\` — batalkan sesi menfess yang lagi berjalan`
    );
  } catch (error) {
    console.error('Error saat proses menfess:', error);
    await message.reply('Ada masalah waktu ngirim menfess. Coba lagi nanti.');
  }
}

// Event: ada pesan masuk (kita cuma peduli DM)
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Kalau ini pesan di thread forum menfess, forward ke pengirim asli
  if (message.channel.isThread() && message.channel.parentId === process.env.FORUM_MENFESS_CHANNEL_ID) {
    const entry = getMenfessEntryByThreadId(message.channel.id);

    if (entry && entry.userId !== message.author.id) {
      try {
        const originalPoster = await message.client.users.fetch(entry.userId);
        const contentPreview = message.content || '(gambar/attachment tanpa teks)';

        await originalPoster.send(
          `Ada komentar baru di Menfess #${String(entry.id).padStart(3, '0')} kamu:\n\n` +
          `> ${contentPreview}`
        );
      } catch (error) {
        console.log(`Gagal kirim notif komentar thread ke pengirim asli Menfess #${entry.id} (mungkin DM ketutup).`);
      }
    }
    return;
  }

  if (message.channel.type !== ChannelType.DM) return;

  const userId = message.author.id;
  const rawContent = message.content.trim();
  const content = rawContent.toLowerCase();

  // Kalau member sedang dalam sesi menfess aktif
  if (menfessSessions.has(userId)) {
    const session = menfessSessions.get(userId);

    if (content === 'cancel') {
      clearTimeout(session.timeout);
      menfessSessions.delete(userId);
      await message.reply('Menfess dibatalkan.');
      return;
    }

    // Tahap 1: sedang nunggu judul
    if (session.stage === 'title') {
      const isSkip = content === 'skip';

      if (!isSkip && rawContent.length > MAX_TITLE_LENGTH) {
        await message.reply(`Judul kepanjangan. Maksimal ${MAX_TITLE_LENGTH} karakter. Atau ketik \`skip\` buat lewati.`);
        return;
      }

      clearTimeout(session.timeout);

      const newTimeout = setTimeout(() => {
        menfessSessions.delete(userId);
        message.reply('Sesi menfess dibatalkan karena kelamaan nggak ada respon.').catch(() => {});
      }, MENFESS_TIMEOUT_MS);

      const titleValue = isSkip ? null : rawContent;
      menfessSessions.set(userId, { stage: 'content', title: titleValue, timeout: newTimeout });
      await message.reply('Judul diterima. Sekarang kirim isi menfess kamu.');
      return;
    }

    // Tahap 2: sedang nunggu isi pesan
    clearTimeout(session.timeout);
    const title = session.title;
    menfessSessions.delete(userId);
    await handleMenfessSubmission(message, title);
    return;
  }

  // Kalau member baru mulai sesi
  if (content === 'menfess') {
    const timeout = setTimeout(() => {
      menfessSessions.delete(userId);
      message.reply('Sesi menfess dibatalkan karena kelamaan nggak ada respon.').catch(() => {});
    }, MENFESS_TIMEOUT_MS);

    menfessSessions.set(userId, { stage: 'title', title: null, timeout });
    await message.reply('Judul menfess kamu apa? (ketik `skip` kalau nggak mau pakai judul)');
    return;
  }

  // Handle "hapus <nomor>"
  if (content.startsWith('hapus ')) {
    const menfessId = Number(content.replace('hapus ', '').trim());

    if (!menfessId || Number.isNaN(menfessId)) {
      await message.reply('Format salah. Contoh: `hapus 5` buat hapus menfess #005.');
      return;
    }

    const entry = getMenfessEntry(menfessId);

    if (!entry) {
      await message.reply(`Menfess #${String(menfessId).padStart(3, '0')} nggak ketemu di data.`);
      return;
    }

    if (entry.userId !== userId) {
      await message.reply('Itu bukan menfess kamu. Nggak bisa dihapus.');
      return;
    }

        try {
      const thread = await message.client.channels.fetch(entry.threadId).catch(() => null);

      if (thread) {
        await thread.delete();
      }

      freeNumber(menfessId);

      await message.reply(`Menfess #${String(menfessId).padStart(3, '0')} kamu udah dihapus.`);
      console.log(`Menfess #${menfessId} dihapus sendiri oleh pengirim lewat DM.`);
    } catch (error) {
      console.error('Gagal hapus menfess sendiri:', error);
      await message.reply('Gagal hapus. Mungkin post-nya udah dihapus duluan.');
    }
  }

    // Handle "balas <nomor> <isi pesan>"
  if (content.startsWith('balas ')) {
    const withoutPrefix = rawContent.slice('balas '.length).trim();
    const spaceIndex = withoutPrefix.indexOf(' ');

    if (spaceIndex === -1) {
      await message.reply('Format salah. Contoh: `balas 5 setuju banget sih`.');
      return;
    }

    const menfessId = Number(withoutPrefix.slice(0, spaceIndex));
    const replyText = withoutPrefix.slice(spaceIndex + 1).trim();

    if (!menfessId || Number.isNaN(menfessId)) {
      await message.reply('Nomor menfess-nya salah. Contoh: `balas 5 setuju banget sih`.');
      return;
    }

    if (!replyText) {
      await message.reply('Isi balasannya kosong. Contoh: `balas 5 setuju banget sih`.');
      return;
    }

    if (replyText.length > MAX_TEXT_LENGTH) {
      await message.reply(`Balasan kepanjangan. Maksimal ${MAX_TEXT_LENGTH} karakter.`);
      return;
    }

    const entry = getMenfessEntry(menfessId);

    if (!entry) {
      await message.reply(`Menfess #${String(menfessId).padStart(3, '0')} nggak ketemu.`);
      return;
    }

        try {
      const thread = await message.client.channels.fetch(entry.threadId).catch(() => null);

      if (!thread) {
        await message.reply('Thread menfess ini udah nggak ada.');
        return;
      }

      const recentMessages = await thread.messages.fetch({ limit: 1 }).catch(() => null);
      const lastMessage = recentMessages?.first();

      const sentMessage = await thread.send({
        content: `💬 **Balasan anonim:**\n${replyText}`,
        reply: lastMessage ? { messageReference: lastMessage.id } : undefined,
      });

      const commentId = logComment({
        menfessId,
        userId,
        messageId: sentMessage.id,
        threadId: thread.id,
      });

      const previewSource = lastMessage?.content || '(tidak ada teks / cuma gambar)';
      const preview = previewSource.length > 100 ? `${previewSource.slice(0, 100)}...` : previewSource;

      await message.reply(
        `Balasan kamu (Komentar #${commentId}) udah dikirim secara anonim ke Menfess #${String(menfessId).padStart(3, '0')}.\n\n` +
        `**Kamu membalas:**\n> ${preview}\n\n` +
        `Hapus komentarmu dengan \`hapuskomen ${commentId}\`.`
      );

      console.log(`Balasan anonim dikirim ke Menfess #${menfessId} (Komentar #${commentId}).`);

      // Kasih tau pengirim asli menfess, kalau yang komentar bukan dia sendiri
      if (entry.userId !== userId) {
        try {
          const originalPoster = await message.client.users.fetch(entry.userId);
          await originalPoster.send(
            `Ada komentar baru di Menfess #${String(menfessId).padStart(3, '0')} kamu:\n\n` +
            `> ${replyText}`
          );
        } catch (error) {
          console.log(`Gagal kirim notif ke pengirim asli Menfess #${menfessId} (mungkin DM ketutup).`);
        }
      }
    } catch (error) {
      console.error('Gagal kirim balasan anonim:', error);
      await message.reply('Gagal kirim balasan. Coba lagi nanti.');
    }
  }

    // Handle "hapuskomen <id>"
  if (content.startsWith('hapuskomen ')) {
    const commentId = Number(content.replace('hapuskomen ', '').trim());

    if (!commentId || Number.isNaN(commentId)) {
      await message.reply('Format salah. Contoh: `hapuskomen 12`.');
      return;
    }

    const commentEntry = getCommentEntry(commentId);

    if (!commentEntry) {
      await message.reply(`Komentar #${commentId} nggak ketemu.`);
      return;
    }

    if (commentEntry.userId !== userId) {
      await message.reply('Itu bukan komentar kamu. Nggak bisa dihapus.');
      return;
    }

    try {
      const thread = await message.client.channels.fetch(commentEntry.threadId).catch(() => null);

      if (thread) {
        const msg = await thread.messages.fetch(commentEntry.messageId).catch(() => null);
        if (msg) {
          await msg.delete();
        }
      }

      await message.reply(`Komentar #${commentId} kamu udah dihapus.`);
      console.log(`Komentar #${commentId} dihapus sendiri oleh pengirim.`);
    } catch (error) {
      console.error('Gagal hapus komentar:', error);
      await message.reply('Gagal hapus. Mungkin komentarnya udah dihapus duluan.');
    }
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
    if (
      interaction.customId === 'shalat_enable' ||
      interaction.customId === 'shalat_change_location' ||
      interaction.customId === 'shalat_disable'
    ) {
      const shalatCommand = client.commands.get('shalat');

      if (!shalatCommand?.handleButton) {
        return interaction.reply({
          content: 'Fitur Shalat Reminder sedang bermasalah.',
          flags: MessageFlags.Ephemeral,
        });
      }

      return shalatCommand.handleButton(interaction);
    }

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
    } else if (interaction.customId.startsWith('menfess_report_')) {
      const menfessId = Number(interaction.customId.replace('menfess_report_', ''));
      const { entry, alreadyReported } = addReport(menfessId, interaction.user.id);

      if (!entry) {
        await interaction.reply({
          content: 'Menfess ini nggak ketemu di data.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (alreadyReported) {
        await interaction.reply({
          content: 'Kamu udah pernah report menfess ini.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await interaction.reply({
        content: 'Laporan diterima. Admin bakal ninjau menfess ini.',
        flags: MessageFlags.Ephemeral,
      });

      // Ubah tombol di post jadi "Sudah dilaporkan" (disabled)
      try {
        const disabledButton = new ButtonBuilder()
          .setCustomId(`menfess_reported_${menfessId}`)
          .setLabel('Sudah dilaporkan')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true);

        const disabledRow = new ActionRowBuilder().addComponents(disabledButton);
        await interaction.message.edit({ components: [disabledRow] });
      } catch (error) {
        console.error('Gagal update tombol report:', error);
      }

      // Kirim detail ke channel log khusus admin, dengan tombol Delete Post
      try {
        const logChannel = await interaction.client.channels.fetch(process.env.MOD_LOG_CHANNEL_ID);

        if (logChannel) {
          const reportedUser = await interaction.client.users.fetch(entry.userId).catch(() => null);

          const logEmbed = new EmbedBuilder()
            .setColor(0xfda4af)
            .setTitle(`Menfess #${String(menfessId).padStart(3, '0')} dilaporkan`)
            .addFields(
              { name: 'Pengirim menfess', value: reportedUser ? `${reportedUser.tag} (${entry.userId})` : entry.userId, inline: false },
              { name: 'Dikirim pada', value: `<t:${Math.floor(entry.timestamp / 1000)}:f>`, inline: true },
              { name: 'Dilaporkan oleh', value: `${interaction.user.tag}`, inline: true }
            );

          const deleteButton = new ButtonBuilder()
            .setCustomId(`menfess_delete_${menfessId}`)
            .setLabel('Delete Post')
            .setStyle(ButtonStyle.Danger);

          const deleteRow = new ActionRowBuilder().addComponents(deleteButton);

          await logChannel.send({ embeds: [logEmbed], components: [deleteRow] });
        }
      } catch (error) {
        console.error('Gagal kirim log report ke mod channel:', error);
      }

      console.log(`Menfess #${menfessId} dilaporkan oleh ${interaction.user.tag}`);
    } else if (interaction.customId.startsWith('menfess_delete_')) {
      const menfessId = Number(interaction.customId.replace('menfess_delete_', ''));
      const entry = getMenfessEntry(menfessId);

      if (!entry || !entry.threadId) {
        await interaction.reply({
          content: 'Data thread menfess ini nggak ketemu.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      try {
        const thread = await interaction.client.channels.fetch(entry.threadId).catch(() => null);

        if (thread) {
          await thread.delete();
        }

        freeNumber(menfessId);

        await interaction.reply({
          content: `Post Menfess #${String(menfessId).padStart(3, '0')} berhasil dihapus.`,
          flags: MessageFlags.Ephemeral,
        });

        // Disable tombol delete biar nggak ke-klik dobel
        const disabledDeleteButton = new ButtonBuilder()
          .setCustomId(`menfess_deleted_${menfessId}`)
          .setLabel('Post sudah dihapus')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true);

        const disabledDeleteRow = new ActionRowBuilder().addComponents(disabledDeleteButton);
        await interaction.message.edit({ components: [disabledDeleteRow] });
      } catch (error) {
        console.error('Gagal hapus thread menfess:', error);
        await interaction.reply({
          content: 'Gagal hapus post. Mungkin sudah dihapus manual.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  }

  // Kalau yang terjadi adalah pilihan dropdown
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'shalat_select_city') {
      const shalatCommand = client.commands.get('shalat');

      if (!shalatCommand?.handleSelectMenu) {
        return interaction.reply({
          content: 'Fitur Shalat Reminder sedang bermasalah.',
          flags: MessageFlags.Ephemeral,
        });
      }

      return shalatCommand.handleSelectMenu(interaction);
    }
  }

  if (interaction.isModalSubmit()) {
    if (
      interaction.customId === 'shalat_location_modal' ||
      interaction.customId === 'shalat_change_location_modal'
    ) {
      const shalatCommand = client.commands.get('shalat');

      if (!shalatCommand?.handleModalSubmit) {
        return interaction.reply({
          content: 'Fitur Shalat Reminder sedang bermasalah.',
          flags: MessageFlags.Ephemeral,
        });
      }

      return shalatCommand.handleModalSubmit(interaction);
    }
  }
});

// Login pakai token dari .env
client.login(process.env.DISCORD_TOKEN);
