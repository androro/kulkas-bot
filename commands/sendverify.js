const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sendverify')
    .setDescription('Kirim panel verifikasi ke channel ini')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const verifyEmbed = new EmbedBuilder()
      .setColor(0xfda4af)
      .setAuthor({ name: 'Verify' })
      .setDescription(
        [
          'Verify to get full access and enjoy the server!',
          '—————————————————————'
        ].join('\n')
      )
      .setImage('https://i.giphy.com/vFKqnCdLPNOKc.webp');

    const verifyButton = new ButtonBuilder()
      .setCustomId('verify')
      .setLabel('Press here !')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('1548693975219839166');

    const row = new ActionRowBuilder().addComponents(verifyButton);

    // Kirim panel verify langsung ke channel (bukan lewat reply)
    await interaction.channel.send({
      embeds: [verifyEmbed],
      components: [row],
    });

    // Balesan ephemeral, cuma keliatan sama yang manggil command, dan otomatis "sunyi"
    await interaction.reply({
      content: '✅ Panel verify berhasil dikirim!',
      flags: MessageFlags.Ephemeral,
    });
  },
};