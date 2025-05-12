const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Function to read HWID data
const getHwidData = () => {
  const hwidFile = process.env.HWID_FILE || './hwids.json';
  let hwids = {};
  
  if (fs.existsSync(hwidFile)) {
    try {
      const data = fs.readFileSync(hwidFile, 'utf8');
      hwids = JSON.parse(data);
    } catch (err) {
      console.error('Error reading HWID file:', err);
    }
  }
  
  return hwids;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hwidlist')
    .setDescription('View all registered hardware IDs')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View all registered hardware IDs'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('reset')
        .setDescription('Reset a user\'s HWID')
        .addUserOption(option => 
          option.setName('user')
                .setDescription('The user whose HWID to reset')
                .setRequired(true))),
  
  async execute(interaction) {
    // Check if the user has permission
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
    }
    
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'view') {
      // Get all HWID data
      const hwids = getHwidData();
      
      // Check if there are any registered HWIDs
      if (Object.keys(hwids).length === 0) {
        return interaction.reply({
          content: 'No HWIDs have been registered yet.',
          ephemeral: true
        });
      }
      
      // Fetch all users' information to display usernames
      const userFetchPromises = Object.keys(hwids).map(async (userId) => {
        try {
          // Fetch user from Discord API
          const user = await interaction.client.users.fetch(userId);
          return {
            id: userId,
            username: user.username,
            hwid: hwids[userId].hwid,
            registeredAt: hwids[userId].registeredAt
          };
        } catch (err) {
          // If user cannot be fetched, return with unknown username
          console.error(`Error fetching user ${userId}:`, err);
          return {
            id: userId,
            username: 'Unknown User',
            hwid: hwids[userId].hwid,
            registeredAt: hwids[userId].registeredAt
          };
        }
      });
      
      // Wait for all user data to be fetched
      const usersData = await Promise.all(userFetchPromises);
      
      // Format the HWID list
      let hwidList = '**Registered Hardware IDs**\n```\n';
      hwidList += 'User ID          | Username          | Registration Date       | HWID (First 10 chars)\n';
      hwidList += '-----------------|-------------------|-------------------------|--------------------\n';
      
      for (const userData of usersData) {
        // Format and truncate data for display
        const paddedUserId = userData.id.slice(0, 16).padEnd(18);
        const paddedUsername = userData.username.slice(0, 16).padEnd(19);
        const regDate = new Date(userData.registeredAt).toLocaleString().padEnd(25);
        // Only show first 10 chars of HWID for privacy/display purposes
        const truncatedHwid = userData.hwid.slice(0, 10) + '...';
        
        hwidList += `${paddedUserId}| ${paddedUsername}| ${regDate}| ${truncatedHwid}\n`;
      }
      
      hwidList += '```';
      
      // Send the HWID list
      await interaction.reply({
        content: hwidList,
        ephemeral: true
      });
      
    } else if (subcommand === 'reset') {
      // Get the target user
      const targetUser = interaction.options.getUser('user');
      
      if (!targetUser) {
        return interaction.reply({
          content: 'Invalid user specified.',
          ephemeral: true
        });
      }
      
      // Get all HWID data
      const hwids = getHwidData();
      
      // Check if this user has a registered HWID
      if (!hwids[targetUser.id]) {
        return interaction.reply({
          content: `${targetUser.username} does not have a registered HWID.`,
          ephemeral: true
        });
      }
      
      // Remove the user's HWID
      delete hwids[targetUser.id];
      
      // Save the updated HWID data
      const hwidFile = process.env.HWID_FILE || './hwids.json';
      try {
        fs.writeFileSync(hwidFile, JSON.stringify(hwids, null, 2));
        await interaction.reply({
          content: `Successfully reset HWID for ${targetUser.username}.`,
          ephemeral: true
        });
      } catch (err) {
        console.error('Error writing HWID file:', err);
        await interaction.reply({
          content: 'An error occurred while resetting the HWID.',
          ephemeral: true
        });
      }
    }
  },
};