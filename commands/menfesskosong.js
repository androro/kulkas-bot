const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getFreedNumbers } = require('../utils/menfessStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('menfesskosong')
    .setDescription('Lihat nomor menfess yang kosong (bisa dipakai ulang)'),

  async execute(interaction) {
    const freedNumbers = getFreedNumbers();

    const listText =
      freedNumbers.length > 0
        ? freedNumbers.map((num) => `#${String(num).padStart(3, '0')}`).join(', ')
        : 'Nggak ada nomor kosong. Semua nomor lagi kepake.';

    const embed = new EmbedBuilder()
      .setColor(0xfda4af)
      .setTitle('Nomor Menfess Kosong')
      .setDescription(listText);

    await interaction.reply({ embeds: [embed] });
  },
};