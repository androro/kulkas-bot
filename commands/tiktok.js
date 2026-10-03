const { sendLiveNotification } = require('../utils/tiktokMonitor');
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags, } = require('discord.js');
const {
  getNotificationChannel,
  setNotificationChannel,
  getNotificationMention,
  setNotificationMention,
  getTrackedUsers,
  addTrackedUser,
  removeTrackedUser,
} = require('../utils/tiktokStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tiktok')
    .setDescription('Kelola fitur TikTok Notification')

    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Tambah akun TikTok untuk dipantau')
        .addStringOption((option) =>
          option
            .setName('username')
            .setDescription('Username TikTok (tanpa atau dengan @)')
            .setRequired(true)
        )
    )

    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Hapus akun TikTok dari daftar pantauan')
        .addStringOption((option) =>
          option
            .setName('username')
            .setDescription('Username TikTok yang ingin dihapus')
            .setRequired(true)
        )
    )

    .addSubcommand((subcommand) =>
      subcommand
        .setName('list')
        .setDescription('Lihat daftar akun TikTok yang sedang dipantau')
    )

    .addSubcommand((subcommand) =>
      subcommand
        .setName('channel')
        .setDescription('Atur channel Discord untuk notifikasi TikTok')
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('Channel teks tujuan notifikasi')
            .setRequired(true)
        )
    )

    .addSubcommand((subcommand) =>
      subcommand
        .setName('mention')
        .setDescription('Atur mention untuk notifikasi TikTok')
        .addStringOption((option) =>
          option
            .setName('mention')
            .setDescription('Pilih mention yang digunakan')
            .setRequired(true)
            .addChoices(
              { name: '@everyone', value: '@everyone' },
              { name: '@here', value: '@here' },
              { name: 'Tanpa mention', value: 'none' }
            )
        )
    )

    .addSubcommand((subcommand) =>
      subcommand
        .setName('status')
        .setDescription('Lihat status konfigurasi TikTok notification')
  )

    .addSubcommand((subcommand) =>
      subcommand
        .setName('test')
        .setDescription('Tes notifikasi LIVE untuk akun tertentu')
        .addStringOption((option) =>
          option
            .setName('username')
            .setDescription('Username TikTok yang ingin dites')
            .setRequired(true)
            .setAutocomplete(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (subcommand === 'add') {
      const username = interaction.options.getString('username');
      const added = addTrackedUser(username);

      const embed = new EmbedBuilder().setColor(0xfda4af);

      if (added) {
        embed
          .setTitle('TikTok Account Added')
          .setDescription(
            `Akun **@${username.replace(/^@/, '')}** berhasil ditambahkan ke daftar pantauan.`
          );
      } else {
        embed
          .setTitle('Already Existed')
          .setDescription(
            `Akun **@${username.replace(/^@/, '')}** sudah ada di dalam daftar pantauan.`
          );
      }

      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral, });
    }

    if (subcommand === 'remove') {
      const username = interaction.options.getString('username');
      const removed = removeTrackedUser(username);

      const embed = new EmbedBuilder().setColor(0xfda4af);

      if (removed) {
        embed
          .setTitle('TikTok Account Removed')
          .setDescription(
            `Akun **@${username.replace(/^@/, '')}** berhasil dihapus dari daftar pantauan.`
          );
      } else {
        embed
          .setTitle('Not Found')
          .setDescription(
            `Akun **@${username.replace(/^@/, '')}** tidak ditemukan di dalam daftar pantauan.`
          );
      }

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === 'list') {
      const users = getTrackedUsers();

      const embed = new EmbedBuilder()
        .setColor(0xfda4af)
        .setTitle('Tracked TikTok Accounts');

      if (users.length === 0) {
        embed.setDescription(
          'Belum ada akun TikTok yang dipantau. Gunakan `/tiktok add <username>` untuk menambah.'
        );
      } else {
        embed.setDescription(
          users.map((u, i) => `${i + 1}. \`@${u}\``).join('\n')
        );
      }

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === 'channel') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({
          content:
            'Kamu butuh permission **Manage Channels** untuk mengubah channel notifikasi TikTok.',
          ephemeral: true,
        });
      }

      const channel = interaction.options.getChannel('channel');
      setNotificationChannel(guildId, channel.id);

      const embed = new EmbedBuilder()
        .setColor(0xfda4af)
        .setTitle('TikTok Notification Channel Set')
        .setDescription(
          `Channel notifikasi TikTok berhasil diatur ke ${channel}.`
        );

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === 'mention') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({
          content:
            'Kamu butuh permission **Manage Channels** untuk mengubah mention notifikasi TikTok.',
          ephemeral: true,
        });
      }

      const mention = interaction.options.getString('mention');

      setNotificationMention(guildId, mention);

      const displayMention =
        mention === 'none' ? 'Tidak ada mention' : mention;

      const embed = new EmbedBuilder()
        .setColor(0xfda4af)
        .setTitle('TikTok Notification Mention Set')
        .setDescription(
          `Mention notifikasi TikTok berhasil diatur ke **${displayMention}**.`
        );

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === 'status') {
      const channelId = getNotificationChannel(guildId);
      const mention = getNotificationMention(guildId);
      const users = getTrackedUsers();

      const channelMention = channelId
        ? `<#${channelId}>`
        : 'Belum diatur';

      const displayMention =
        mention === 'none' ? 'Tidak ada mention' : mention;

      const embed = new EmbedBuilder()
        .setColor(0xfda4af)
        .setTitle('TikTok Notification Status')
        .addFields(
          {
            name: 'Notification Channel',
            value: channelMention,
            inline: false,
          },
          {
            name: 'Notification Mention',
            value: displayMention,
            inline: false,
          },
          {
            name: 'Tracked Accounts Count',
            value: `${users.length} akun`,
            inline: false,
          }
        );

      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }

    if (subcommand === 'test') {
      const users = getTrackedUsers();

      if (users.length === 0) {
        return interaction.reply({
          content:
            'Belum ada akun TikTok yang dipantau. Tambahkan akun dengan `/tiktok add <username>` terlebih dahulu.',
          ephemeral: true,
        });
      }

      const username = interaction.options.getString('username');

      if (!users.includes(username)) {
        return interaction.reply({
          content:
            `**@${username}** belum ada di daftar akun TikTok yang dipantau.`,
          ephemeral: true,
        });
      }

      await interaction.reply({
        content:
          `Mensimulasikan **OFFLINE → LIVE** untuk **@${username}**...`,
        ephemeral: true,
      });

      try {
        await sendLiveNotification(interaction.client, username);

        await interaction.editReply({
          content:
            `Simulasi **OFFLINE → LIVE** untuk **@${username}** berhasil. Cek channel notifikasi TikTok.`,
        });
      } catch (error) {
        console.error(
          `[TikTok Test] Gagal menjalankan simulasi @${username}:`,
          error
        );

        await interaction.editReply({
          content:
            'Simulasi gagal. Cek console/log Railway untuk detail error.',
        });
      }
    }
  },
};
