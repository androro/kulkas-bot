const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Tampilkan avatar user')
    .addUserOption((option) =>
      option.setName('user').setDescription('User yang mau dicek avatarnya').setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const avatarUrl = targetUser.displayAvatarURL({ size: 1024, extension: 'png' });

    const avatarEmbed = new EmbedBuilder()
      .setColor(0xfda4af)
      .setTitle(`Avatar ${targetUser.username}`)
      .setImage(avatarUrl)
      .setDescription(`[Link avatar](${avatarUrl})`);

    await interaction.reply({ embeds: [avatarEmbed] });
  },
};