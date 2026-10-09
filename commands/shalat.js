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

    const disableButton = new ButtonBuilder()
      .setCustomId('shalat_disable')
      .setLabel('Nonaktifkan')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(
      enableButton,
      changeLocationButton,
      disableButton
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
      interaction.customId !== 'shalat_change_location' &&
      interaction.customId !== 'shalat_disable'
    ) {
      return;
    }

    const settings = getUserSettings(interaction.user.id);

    // Aktifkan kembali menggunakan lokasi yang tersimpan
    if (interaction.customId === 'shalat_enable') {
      if (settings?.enabled) {
        return interaction.reply({
          content: 'Shalat Reminder kamu sudah aktif.',
          flags: MessageFlags.Ephemeral,
        });
      }

      if (settings?.city) {
        setUserSettings(interaction.user.id, {
          enabled: true,
        });

        try {
          await interaction.user.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0x2f6f4e)
                .setTitle('Shalat Reminder Aktif Kembali')
                .setDescription(
                  [
                    `Lokasi: **${settings.city}**`,
                    'Pengingat: **Aktif**',
                    '',
                    'Kulkas akan kembali mengirimkan pengingat melalui DM ketika waktu shalat tiba.',
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
          content: `Shalat Reminder berhasil diaktifkan kembali untuk **${settings.city}**.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    // Nonaktifkan
    if (interaction.customId === 'shalat_disable') {
      if (!settings?.enabled) {
        return interaction.reply({
          content: 'Shalat Reminder kamu memang sedang tidak aktif.',
          flags: MessageFlags.Ephemeral,
        });
      }

      setUserSettings(interaction.user.id, {
        enabled: false,
      });

      try {
        await interaction.user.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0x6b7280)
              .setTitle('Shalat Reminder Dinonaktifkan')
              .setDescription(
                [
                  'Pengingat shalat kamu berhasil dinonaktifkan.',
                  '',
                  `Lokasi tersimpan: **${settings.city}**`,
                  'Pengingat: **Nonaktif**',
                  '',
                  'Lokasi kamu tetap disimpan. Kamu bisa mengaktifkan kembali pengingat kapan saja.',
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
        content: 'Shalat Reminder berhasil dinonaktifkan.',
        flags: MessageFlags.Ephemeral,
      });
    }

    // Ubah lokasi hanya untuk user yang sudah aktif
    if (interaction.customId === 'shalat_change_location') {
      if (!settings?.enabled || !settings.city) {
        return interaction.reply({
          content:
            'Kamu belum mengaktifkan Shalat Reminder. Gunakan **Aktifkan Pengingat** terlebih dahulu.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    // Modal lokasi
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
