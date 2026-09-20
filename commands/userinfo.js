const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Tampilkan informasi user')
    .addUserOption((option) =>
      option.setName('user').setDescription('User yang mau dicek').setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    const infoEmbed = new EmbedBuilder()
      .setColor(0xfda4af)
      .setTitle(targetUser.tag)
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'Mention', value: `${targetUser}`, inline: true },
        { name: 'User ID', value: `${targetUser.id}`, inline: true },
        {
          name: 'Bergabung ke server',
          value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : 'Tidak diketahui',
          inline: true,
        },
        {
          name: 'Akun dibuat',
          value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:D>`,
          inline: true,
        }
      );

    await interaction.reply({ embeds: [infoEmbed] });
  },
};