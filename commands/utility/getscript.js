const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Function to get a key for a user
const getKeyForUser = (userId) => {
  const keysFile = process.env.KEYS_FILE || './keys.json';
  
  if (!fs.existsSync(keysFile)) {
    return null;
  }
  
  try {
    const data = fs.readFileSync(keysFile, 'utf8');
    const keys = JSON.parse(data);
    return keys[userId] || null;
  } catch (err) {
    console.error('Error reading keys file:', err);
    return null;
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('getscript')
    .setDescription('Get the script with your unique key'),
  
  async execute(interaction) {
    // Get the user ID
    const userId = interaction.user.id;
    
    // Get user's key
    const userKey = getKeyForUser(userId);
    
    // If no key exists, prompt them to get one
    if (!userKey) {
      return interaction.reply({ 
        content: 'You need to get a key first using `/getkey` command.',
        ephemeral: true
      });
    }
    
    // Create script with user's key
    const script = `local player = game.players.localplayer
key = "${userKey}"`;
    
    // Send the script privately
    await interaction.reply({ 
      content: `Here's your script:\n\`\`\`lua\n${script}\n\`\`\`\nRemember to keep this private!`,
      ephemeral: true
    });
  },
};