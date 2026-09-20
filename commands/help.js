const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Tampilkan daftar command Kulkas'),

  async execute(interaction) {
    const helpEmbed = new EmbedBuilder()
      .setColor(0xfda4af)
      .setTitle('Daftar Command Kulkas')
      .addFields(
        {
          name: 'Umum',
          value: '`/ping` — cek latency\n`/help` — tampilkan menu ini',
        },
        {
          name: 'Server Utility',
          value:
            '`/serverinfo` — info server\n`/userinfo [user]` — info user\n`/avatar [user]` — avatar user\n`/roleinfo [role]` — info role\n`/uptime` — lama Kulkas online',
        }
      )
      .setFooter({ text: 'Jangan spam command, ya.' });

    await interaction.reply({ embeds: [helpEmbed] });
  },
};