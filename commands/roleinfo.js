const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('Tampilkan informasi sebuah role')
    .addRoleOption((option) =>
      option.setName('role').setDescription('Role yang mau dicek').setRequired(true)
    ),

  async execute(interaction) {
    const role = interaction.options.getRole('role');

    const infoEmbed = new EmbedBuilder()
      .setColor(role.color || 0xfda4af)
      .setTitle(role.name)
      .addFields(
        { name: 'Role ID', value: `${role.id}`, inline: true },
        { name: 'Jumlah Member', value: `${role.members.size}`, inline: true },
        { name: 'Posisi', value: `${role.position}`, inline: true },
        { name: 'Warna', value: role.hexColor !== '#000000' ? role.hexColor : 'Default', inline: true }
      );

    await interaction.reply({ embeds: [infoEmbed] });
  },
};