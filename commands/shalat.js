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

const { setUserSettings, getUserSettings } = require('../utils/shalatStore');

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

    const enableButton = new ButtonBuilder()
      .setCustomId('shalat_enable')
      .setLabel('Aktifkan Pengingat')
      .setStyle(ButtonStyle.Success);

    const changeLocationButton = new ButtonBuilder()
      .setCustomId('shalat_change_location')
      .setLabel('Ubah Lokasi')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(
      enableButton,
      changeLocationButton
    );

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
    if (
      interaction.customId !== 'shalat_enable' &&
      interaction.customId !== 'shalat_change_location'
    ) {
      return;
    }

    if (interaction.customId === 'shalat_change_location') {
      const settings = getUserSettings(interaction.user.id);

      if (!settings?.enabled || !settings.city) {
        return interaction.reply({
          content:
            '⚠️ Kamu belum mengaktifkan Shalat Reminder. Gunakan **🔔 Aktifkan Pengingat** terlebih dahulu.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    const isChangingLocation =
      interaction.customId === 'shalat_change_location';

    const modal = new ModalBuilder()
      .setCustomId(
        isChangingLocation
          ? 'shalat_change_location_modal'
          : 'shalat_location_modal'
      )
      .setTitle(
        isChangingLocation
          ? 'Ubah Lokasi Shalat'
          : 'Atur Lokasi Shalat'
      );

    const locationInput = new TextInputBuilder()
      .setCustomId('shalat_location')
      .setLabel(
        isChangingLocation
          ? 'Lokasi baru'
          : 'Kota atau daerah kamu'
      )
      .setPlaceholder('Contoh: Cikarang Selatan, Jawa Barat')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const row = new ActionRowBuilder().addComponents(locationInput);

    modal.addComponents(row);

    return interaction.showModal(modal);
  },

  async handleModalSubmit(interaction) {
    if (
      interaction.customId !== 'shalat_location_modal' &&
      interaction.customId !== 'shalat_change_location_modal'
    ) {
      return;
    }

    const isChangingLocation =
      interaction.customId === 'shalat_change_location_modal';

    const location = interaction.fields
      .getTextInputValue('shalat_location')
      .trim();

    // Validasi lokasi sebelum disimpan
    try {
      const { getPrayerTimes } = require('../utils/shalatApi');

      await getPrayerTimes(location);
    } catch (error) {
      return interaction.reply({
        content: [
          '❌ **Lokasi tidak ditemukan.**',
          '',
          'Coba masukkan lokasi yang lebih spesifik.',
          '',
          'Contoh:',
          '• `Cikarang Selatan, Jawa Barat`',
          '• `Jakarta, Indonesia`',
          '• `Tokyo, Japan`',
        ].join('\n'),
        flags: MessageFlags.Ephemeral,
      });
    }

    setUserSettings(interaction.user.id, {
      city: location,
      enabled: true,
    });

    try {
      await interaction.user.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2f6f4e)
            .setTitle(
              isChangingLocation
                ? 'Lokasi Shalat Diperbarui'
                : 'Shalat Reminder Aktif'
            )
            .setDescription(
              [
                `Lokasi: **${location}**`,
                'Pengingat: **Aktif**',
                '',
                isChangingLocation
                  ? 'Lokasi Shalat Reminder kamu berhasil diperbarui.'
                  : 'Kulkas akan mengirimkan pengingat melalui DM ketika waktu shalat tiba.',
              ].join('\n')
            )
            .setFooter({
              text: 'Shalat Reminder • Kulkas',
            }),
        ],
      });
    } catch (error) {
      console.error(
        `[Shalat] Gagal mengirim DM ke ${interaction.user.tag}:`,
        error.message
      );
    }

    return interaction.reply({
      content: isChangingLocation
        ? `Lokasi Shalat Reminder berhasil diubah menjadi **${location}**.`
        : `Shalat Reminder berhasil diaktifkan untuk **${location}**.`,
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
