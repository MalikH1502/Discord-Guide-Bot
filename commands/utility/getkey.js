const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const dotenv = require('dotenv');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

// Parse whitelist from environment variable
const getWhitelist = () => {
  const whitelistStr = process.env.WHITELIST || '';
  return whitelistStr.split(',').map(id => id.trim()).filter(id => id);
};

// Function to generate a unique key for a user
const generateKey = (userId) => {
  // Generate an MD5-style key
  const randomInput = userId + Date.now() + Math.random().toString();
  return crypto.createHash('md5').update(randomInput).digest('hex');
};

// Function to save a key for a user
const saveKey = (userId, key) => {
  const keysFile = process.env.KEYS_FILE || './keys.json';
  let keys = {};
  
  // Try to load existing keys
  if (fs.existsSync(keysFile)) {
    try {
      const data = fs.readFileSync(keysFile, 'utf8');
      keys = JSON.parse(data);
    } catch (err) {
      console.error('Error reading keys file:', err);
    }
  }
  
  // Save the new key
  keys[userId] = key;
  
  try {
    fs.writeFileSync(keysFile, JSON.stringify(keys, null, 2));
    return true;
  } catch (err) {
    console.error('Error writing keys file:', err);
    return false;
  }
};

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
    .setName('getkey')
    .setDescription('Get your unique access key if you are whitelisted'),
  
  async execute(interaction) {
    // Get the user ID
    const userId = interaction.user.id;
    
    // Check if user is whitelisted
    const whitelist = getWhitelist();
    if (!whitelist.includes(userId)) {
      return interaction.reply({ 
        content: 'You are not on the whitelist. Please contact an administrator.',
        ephemeral: true
      });
    }
    
    // Check if user already has a key
    let userKey = getKeyForUser(userId);
    
    // If no key exists, generate one
    if (!userKey) {
      userKey = generateKey(userId);
      if (!saveKey(userId, userKey)) {
        return interaction.reply({ 
          content: 'Error generating your key. Please try again later.',
          ephemeral: true
        });
      }
    }
    
    // Send the key privately
    await interaction.reply({ 
      content: `Your unique access key is: \`${userKey}\`\nDo not share this key with anyone!`,
      ephemeral: true
    });
  },
};