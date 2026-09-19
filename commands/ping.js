const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Cek apakah Kulkas online dan berapa latency-nya'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: 'Ngukur...', withResponse: true });

    const latency = sent.resource.message.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    const pingEmbed = new EmbedBuilder()
      .setColor(0xfda4af)
      .setTitle('Pong!')
      .addFields(
        { name: 'Latency', value: `${latency}ms`, inline: true },
        { name: 'API Latency', value: `${apiLatency}ms`, inline: true }
      )
      .setFooter({ text: 'Hmph, bukan berarti aku niat jawab cepet ya!' });

    await interaction.editReply({ content: null, embeds: [pingEmbed] });
  },
};