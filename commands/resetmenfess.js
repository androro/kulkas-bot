const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { resetCounter } = require('../utils/menfessStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetmenfess')
    .setDescription('Reset nomor urut menfess')
    .addIntegerOption((option) =>
      option
        .setName('dari')
        .setDescription('Menfess berikutnya mulai dari nomor ini (kosongkan buat reset ke #001)')
        .setRequired(false)
        .setMinValue(0)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const startFrom = interaction.options.getInteger('dari') ?? 0;

    resetCounter(startFrom);

    const nextNumber = String(startFrom + 1).padStart(3, '0');

    await interaction.reply({
      content: `Nomor menfess direset. Menfess berikutnya bakal jadi #${nextNumber}.`,
      flags: 64,
    });
  },
};