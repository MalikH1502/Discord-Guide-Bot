const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('keylist')
    .setDescription('View the list of all assigned keys')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Only admins can use this command
  
  async execute(interaction) {
    // Check if the user has permission to view keys
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
    }
    
    const keysFile = process.env.KEYS_FILE || './keys.json';
    
    // Check if the keys file exists
    if (!fs.existsSync(keysFile)) {
      return interaction.reply({
        content: 'No keys have been assigned yet.',
        ephemeral: true
      });
    }
    
    try {
      // Read the keys file
      const data = fs.readFileSync(keysFile, 'utf8');
      const keys = JSON.parse(data);
      
      // Check if there are any keys
      if (Object.keys(keys).length === 0) {
        return interaction.reply({
          content: 'No keys have been assigned yet.',
          ephemeral: true
        });
      }
      
      // Fetch all users' information to display usernames
      // Create a promise array for fetching user data
      const userFetchPromises = Object.keys(keys).map(async (userId) => {
        try {
          // Fetch user from Discord API
          const user = await interaction.client.users.fetch(userId);
          return {
            id: userId,
            username: user.username,
            key: keys[userId]
          };
        } catch (err) {
          // If user cannot be fetched, return with unknown username
          console.error(`Error fetching user ${userId}:`, err);
          return {
            id: userId,
            username: 'Unknown User',
            key: keys[userId]
          };
        }
      });
      
      // Wait for all user data to be fetched
      const usersData = await Promise.all(userFetchPromises);
      
      // Format the keys into a readable list
      let keyList = '**Key List**\n```\n';
      keyList += 'User ID               | Username             | Key\n';
      keyList += '----------------------|----------------------|--------------------------------\n';
      
      for (const userData of usersData) {
        // Pad the fields to make the table uniform
        const paddedUserId = userData.id.padEnd(22);
        const paddedUsername = userData.username.slice(0, 20).padEnd(22); // Limit username length
        keyList += `${paddedUserId}| ${paddedUsername}| ${userData.key}\n`;
      }
      
      keyList += '```';
      
      // If the message is too long, split it
      if (keyList.length > 2000) {
        // Split into multiple messages as needed
        const chunks = [];
        let currentChunk = '**Key List**\n```\n';
        currentChunk += 'User ID               | Username             | Key\n';
        currentChunk += '----------------------|----------------------|--------------------------------\n';
        
        for (const userData of usersData) {
          const paddedUserId = userData.id.padEnd(22);
          const paddedUsername = userData.username.slice(0, 20).padEnd(22);
          const line = `${paddedUserId}| ${paddedUsername}| ${userData.key}\n`;
          
          // Check if adding this line would exceed Discord's limit
          if (currentChunk.length + line.length + 3 > 1990) {
            currentChunk += '```';
            chunks.push(currentChunk);
            currentChunk = '```\n'; // Start a new code block
          }
          
          currentChunk += line;
        }
        
        currentChunk += '```';
        chunks.push(currentChunk);
        
        // Send the first chunk as a reply
        await interaction.reply({
          content: chunks[0],
          ephemeral: true
        });
        
        // Send the rest as follow-ups
        for (let i = 1; i < chunks.length; i++) {
          await interaction.followUp({
            content: chunks[i],
            ephemeral: true
          });
        }
      } else {
        // If it's short enough, send it as a single message
        await interaction.reply({
          content: keyList,
          ephemeral: true
        });
      }
      
    } catch (err) {
      console.error('Error reading keys file:', err);
      return interaction.reply({
        content: 'An error occurred while reading the keys file.',
        ephemeral: true
      });
    }
  },
};