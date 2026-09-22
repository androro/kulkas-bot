const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getMenfessEntry } = require('../utils/menfessStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('menfesslookup')
    .setDescription('Cek siapa pengirim sebuah menfess (khusus admin)')
    .addIntegerOption((option) =>
      option.setName('nomor').setDescription('Nomor menfess, misal 1 untuk #001').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const menfessId = interaction.options.getInteger('nomor');
    const entry = getMenfessEntry(menfessId);

    if (!entry) {
      await interaction.reply({
        content: `Menfess #${String(menfessId).padStart(3, '0')} nggak ketemu di data.`,
        flags: 64,
      });
      return;
    }

    const sender = await interaction.client.users.fetch(entry.userId).catch(() => null);

    const lookupEmbed = new EmbedBuilder()
      .setColor(0xfda4af)
      .setTitle(`Menfess #${String(menfessId).padStart(3, '0')}`)
      .addFields(
        { name: 'Pengirim', value: sender ? `${sender.tag} (${entry.userId})` : entry.userId, inline: false },
        { name: 'Dikirim pada', value: `<t:${Math.floor(entry.timestamp / 1000)}:f>`, inline: true },
        { name: 'Status', value: entry.reported ? `Dilaporkan (${entry.reporters.length}x)` : 'Belum dilaporkan', inline: true }
      );

    await interaction.reply({ embeds: [lookupEmbed], flags: 64 });
  },
};