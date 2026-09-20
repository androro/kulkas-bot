require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { generateCircleAvatar } = require('./utils/generateAvatar');
const fs = require('node:fs');
const path = require('node:path');

// Bikin instance client Discord dengan intent yang dibutuhkan
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // butuh ini buat deteksi member baru join
  ],
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
  }
});

// Login pakai token dari .env
client.login(process.env.DISCORD_TOKEN);