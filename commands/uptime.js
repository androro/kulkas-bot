const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days} hari`);
  if (hours > 0) parts.push(`${hours} jam`);
  parts.push(`${minutes} menit`);

  return parts.join(', ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Cek sudah berapa lama Kulkas online'),

  async execute(interaction) {
    const uptimeText = formatUptime(process.uptime());

    const uptimeEmbed = new EmbedBuilder()
      .setColor(0xfda4af)
      .setTitle('Uptime Kulkas')
      .setDescription(`Sudah online selama ${uptimeText}. Bukan berarti aku kecapean.`);

    await interaction.reply({ embeds: [uptimeEmbed] });
  },
};