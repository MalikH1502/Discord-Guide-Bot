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

// Function to save HWID data
const saveHwidData = (hwids) => {
  const hwidFile = process.env.HWID_FILE || './hwids.json';
  
  try {
    fs.writeFileSync(hwidFile, JSON.stringify(hwids, null, 2));
    return true;
  } catch (err) {
    console.error('Error writing HWID file:', err);
    return false;
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('registerhwid')
    .setDescription('Register your hardware ID (HWID) for your key')
    .addStringOption(option => 
      option.setName('hwid')
            .setDescription('Your hardware ID')
            .setRequired(true)),
  
  async execute(interaction) {
    // Get the user ID
    const userId = interaction.user.id;
    
    // Check if user has a key
    const userKey = getKeyForUser(userId);
    if (!userKey) {
      return interaction.reply({ 
        content: 'You need to get a key first using `/getkey` command.',
        ephemeral: true
      });
    }
    
    // Get the HWID from the command
    const hwid = interaction.options.getString('hwid');
    
    // Validate HWID format (basic validation for a hex string)
    if (!hwid.match(/^[0-9a-fA-F-]{8,64}$/)) {
      return interaction.reply({ 
        content: 'Invalid HWID format. Please provide a valid hardware identifier.',
        ephemeral: true
      });
    }
    
    // Get current HWID data
    const hwids = getHwidData();
    
    // Check if this HWID is already registered to another user
    for (const [existingUserId, userData] of Object.entries(hwids)) {
      if (existingUserId !== userId && userData.hwid === hwid) {
        return interaction.reply({ 
          content: 'This HWID is already registered to another user.',
          ephemeral: true
        });
      }
    }
    
    // Update or add the HWID for this user
    hwids[userId] = {
      hwid: hwid,
      key: userKey,
      registeredAt: new Date().toISOString()
    };
    
    // Save the updated HWID data
    if (saveHwidData(hwids)) {
      await interaction.reply({ 
        content: 'Your HWID has been successfully registered! You can now use the script on this device.',
        ephemeral: true
      });
    } else {
      await interaction.reply({ 
        content: 'An error occurred while registering your HWID. Please try again later.',
        ephemeral: true
      });
    }
  },
};