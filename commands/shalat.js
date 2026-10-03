const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
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
      .setTitle('Shalat Reminder')
      .setDescription(
        [
          'Kulkas akan mengirimkan pengingat pribadi melalui DM ketika waktu shalat tiba.',
          '',
          'Klik tombol di bawah untuk mengatur pengingat.',
        ].join('\n')
      );

    const button = new ButtonBuilder()
      .setCustomId('shalat_enable')
      .setLabel('Aktifkan Pengingat')
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

    const modal = new ModalBuilder()
      .setCustomId('shalat_location_modal')
      .setTitle('Atur Lokasi Shalat');

    const locationInput = new TextInputBuilder()
      .setCustomId('shalat_location')
      .setLabel('Kota atau daerah kamu')
      .setPlaceholder('Contoh: Cikarang Selatan, Jawa Barat')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const row = new ActionRowBuilder().addComponents(locationInput);

    modal.addComponents(row);

    return interaction.showModal(modal);
  },

  async handleModalSubmit(interaction) {
    if (interaction.customId !== 'shalat_location_modal') return;

    const location = interaction.fields
      .getTextInputValue('shalat_location')
      .trim();

    setUserSettings(interaction.user.id, {
      city: location,
      enabled: true,
    });

    try {
      await interaction.user.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2f6f4e)
            .setTitle('Shalat Reminder Aktif')
            .setDescription(
              [
                `Lokasi: **${location}**`,
                'Pengingat: **Aktif**',
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

    return interaction.reply({
      content: `Shalat Reminder berhasil diaktifkan untuk **${location}**.`,
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
