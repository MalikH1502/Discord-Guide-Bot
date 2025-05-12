const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Function to read whitelist from environment file
const getWhitelist = () => {
  const whitelistStr = process.env.WHITELIST || '';
  return whitelistStr.split(',').map(id => id.trim()).filter(id => id);
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('View the current whitelist')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    // Check if the user has permission
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
    }
    
    // Get current whitelist
    const whitelist = getWhitelist();
    
    // Check if whitelist is empty
    if (whitelist.length === 0) {
      return interaction.reply({
        content: 'The whitelist is currently empty.',
        ephemeral: true
      });
    }
    
    // Fetch all users' information to display usernames
    const userFetchPromises = whitelist.map(async (userId) => {
      try {
        // Fetch user from Discord API
        const user = await interaction.client.users.fetch(userId);
        return {
          id: userId,
          username: user.username
        };
      } catch (err) {
        // If user cannot be fetched, return with unknown username
        console.error(`Error fetching user ${userId}:`, err);
        return {
          id: userId,
          username: 'Unknown User'
        };
      }
    });
    
    // Wait for all user data to be fetched
    const usersData = await Promise.all(userFetchPromises);
    
    // Format the whitelist into a readable list
    let whitelistContent = '**Current Whitelist**\n```\n';
    whitelistContent += 'User ID               | Username\n';
    whitelistContent += '----------------------|----------------------\n';
    
    for (const userData of usersData) {
      // Pad the fields to make the table uniform
      const paddedUserId = userData.id.padEnd(22);
      const paddedUsername = userData.username.slice(0, 20).padEnd(22); // Limit username length
      whitelistContent += `${paddedUserId}| ${paddedUsername}\n`;
    }
    
    whitelistContent += '```';
    
    // Send the whitelist
    await interaction.reply({
      content: whitelistContent,
      ephemeral: true
    });
  },
};