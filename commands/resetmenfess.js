const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { resetCounter } = require('../utils/menfessStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetmenfess')
    .setDescription('Reset nomor urut menfess kembali ke #001')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    resetCounter();
    await interaction.reply({
      content: 'Nomor menfess sudah direset. Menfess berikutnya bakal mulai dari #001 lagi.',
      flags: 64, // ephemeral, cuma keliatan buat yang manggil command
    });
  },
};