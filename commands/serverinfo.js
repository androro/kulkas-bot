const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Tampilkan informasi server'),

  async execute(interaction) {
    const guild = interaction.guild;
    const owner = await guild.fetchOwner().catch(() => null);

    const infoEmbed = new EmbedBuilder()
      .setColor(0xfda4af)
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: 'Member', value: `${guild.memberCount}`, inline: true },
        { name: 'Channel', value: `${guild.channels.cache.size}`, inline: true },
        { name: 'Role', value: `${guild.roles.cache.size}`, inline: true },
        { name: 'Owner', value: owner ? `${owner.user.tag}` : 'Tidak diketahui', inline: true },
        { name: 'Dibuat pada', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true }
      )
      .setFooter({ text: 'Hmph, server juga perlu dijaga rapi.' });

    await interaction.reply({ embeds: [infoEmbed] });
  },
};