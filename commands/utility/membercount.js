const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('members')
		.setDescription('Replies with the current member count'),
	async execute(interaction) {
		// Get the guild from the interaction
		const guild = interaction.guild;
		
		// Check if guild exists
		if (!guild) {
			return interaction.reply('This command can only be used in a server!');
		}
		
		// Get the member count
		const memberCount = guild.memberCount;
		
		// Reply with the member count
		await interaction.reply(`This server has **${memberCount-1}** members!`);
	},
};