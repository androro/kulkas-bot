const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageFlags,
} = require('discord.js');

const { setUserSettings } = require('../utils/shalatStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shalat')
    .setDescription('Kelola Shalat Reminder')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('setup')
        .setDescription('Kirim panel Shalat Reminder')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand !== 'setup') return;

    const embed = new EmbedBuilder()
      .setColor(0x2f6f4e)
      .setTitle('🕌 Shalat Reminder')
      .setDescription(
        [
          'Kulkas akan mengirimkan pengingat pribadi melalui DM ketika waktu shalat tiba.',
          '',
          'Klik tombol di bawah untuk mengatur pengingat.',
        ].join('\n')
      );

    const button = new ButtonBuilder()
      .setCustomId('shalat_enable')
      .setLabel('🔔 Aktifkan Pengingat')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.channel.send({
      embeds: [embed],
      components: [row],
    });

    return interaction.reply({
      content: 'Panel Shalat Reminder berhasil dikirim.',
      flags: MessageFlags.Ephemeral,
    });
  },

  async handleButton(interaction) {
    if (interaction.customId !== 'shalat_enable') return;

    const menu = new StringSelectMenuBuilder()
      .setCustomId('shalat_select_city')
      .setPlaceholder('📍 Pilih kota kamu')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Jakarta')
          .setValue('jakarta'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Bogor')
          .setValue('bogor'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Bekasi')
          .setValue('bekasi'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Bandung')
          .setValue('bandung')
      );

    const row = new ActionRowBuilder().addComponents(menu);

    return interaction.reply({
      content: '📍 **Pilih kota tempat kamu berada untuk mengaktifkan Shalat Reminder.**',
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
  },

  async handleSelectMenu(interaction) {
    if (interaction.customId !== 'shalat_select_city') return;

    const city = interaction.values[0];

    setUserSettings(interaction.user.id, {
      city,
      enabled: true,
    });

    try {
      await interaction.user.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2f6f4e)
            .setTitle('🕌 Shalat Reminder Aktif')
            .setDescription(
              [
                `📍 Lokasi: **${city}**`,
                '🔔 Pengingat: **Aktif**',
                '',
                'Kulkas akan mengirimkan pengingat melalui DM ketika waktu shalat tiba.',
              ].join('\n')
            ),
        ],
      });
    } catch (error) {
      console.error(
        `[Shalat] Gagal mengirim DM ke ${interaction.user.tag}:`,
        error.message
      );
    }

    return interaction.update({
      content: `✅ Shalat Reminder berhasil diaktifkan untuk **${city}**.`,
      components: [],
    });
  },
};
