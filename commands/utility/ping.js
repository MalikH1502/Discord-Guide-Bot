const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong and shows API latency!'),
	async execute(interaction) {
		// Send initial response
		const sent = await interaction.reply({ content: 'Pong!', fetchReply: true });
		
		// Calculate the latency
		const latency = sent.createdTimestamp - interaction.createdTimestamp;
		
		// Edit the message to include latency information
		await interaction.editReply(`Pong!\nLatency: ${latency}ms`);
	},
};