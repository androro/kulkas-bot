const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const {
  getNotificationChannel,
  setNotificationChannel,
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
        .setName('status')
        .setDescription('Lihat status konfigurasi TikTok notification')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('test')
        .setDescription('Kirim test notifikasi TikTok ke channel yang diatur')
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
          .setDescription(`Akun **@${username.replace(/^@/, '')}** berhasil ditambahkan ke daftar pantauan.`);
      } else {
        embed
          .setTitle('Already Existed')
          .setDescription(`Akun **@${username.replace(/^@/, '')}** sudah ada di dalam daftar pantauan.`);
      }
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === 'remove') {
      const username = interaction.options.getString('username');
      const removed = removeTrackedUser(username);

      const embed = new EmbedBuilder().setColor(0xfda4af);
      if (removed) {
        embed
          .setTitle('TikTok Account Removed')
          .setDescription(`Akun **@${username.replace(/^@/, '')}** berhasil dihapus dari daftar pantauan.`);
      } else {
        embed
          .setTitle('Not Found')
          .setDescription(`Akun **@${username.replace(/^@/, '')}** tidak ditemukan di dalam daftar pantauan.`);
      }
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === 'list') {
      const users = getTrackedUsers();
      const embed = new EmbedBuilder()
        .setColor(0xfda4af)
        .setTitle('Tracked TikTok Accounts');

      if (users.length === 0) {
        embed.setDescription('Belum ada akun TikTok yang dipantau. Gunakan `/tiktok add <username>` untuk menambah.');
      } else {
        embed.setDescription(users.map((u, i) => `${i + 1}. \`@${u}\``).join('\n'));
      }
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === 'channel') {
      // Cek permission administrator atau manage channels
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({
          content: 'Hmph! Kamu butuh permission **Manage Channels** untuk mengubah channel notifikasi TikTok.',
          ephemeral: true,
        });
      }

      const channel = interaction.options.getChannel('channel');
      setNotificationChannel(guildId, channel.id);

      const embed = new EmbedBuilder()
        .setColor(0xfda4af)
        .setTitle('TikTok Notification Channel Set')
        .setDescription(`Channel notifikasi TikTok berhasil diatur ke ${channel}.`);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === 'status') {
      const channelId = getNotificationChannel(guildId);
      const users = getTrackedUsers();
      const channelMention = channelId ? `<#${channelId}>` : 'Belum diatur';

      const embed = new EmbedBuilder()
        .setColor(0xfda4af)
        .setTitle('TikTok Notification Status')
        .addFields(
          { name: 'Notification Channel', value: channelMention, inline: false },
          { name: 'Tracked Accounts Count', value: `${users.length} akun`, inline: false }
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === 'test') {
      const channelId = getNotificationChannel(guildId);
      if (!channelId) {
        return interaction.reply({
          content: 'Channel notifikasi TikTok belum diatur! Gunakan `/tiktok channel <channel>` terlebih dahulu.',
          ephemeral: true,
        });
      }

      const channel = interaction.guild.channels.cache.get(channelId);
      if (!channel) {
        return interaction.reply({
          content: 'Channel notifikasi yang tersimpan tidak ditemukan di server ini. Silakan atur ulang dengan `/tiktok channel`.',
          ephemeral: true,
        });
      }

      const testEmbed = new EmbedBuilder()
        .setColor(0xfda4af)
        .setTitle('TikTok Notification Test')
        .setDescription('Ini adalah test pesan notifikasi TikTok dari Bot Kulkas. Sistem berjalan normal!');

      await channel.send({ embeds: [testEmbed] });
      return interaction.reply({
        content: `Test notifikasi berhasil dikirim ke ${channel}!`,
        ephemeral: true,
      });
    }
  },
};
