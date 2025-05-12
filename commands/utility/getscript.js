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

// Function to get HWID data for a user
const getHwidForUser = (userId) => {
  const hwidFile = process.env.HWID_FILE || './hwids.json';
  
  if (!fs.existsSync(hwidFile)) {
    return null;
  }
  
  try {
    const data = fs.readFileSync(hwidFile, 'utf8');
    const hwids = JSON.parse(data);
    return hwids[userId]?.hwid || null;
  } catch (err) {
    console.error('Error reading HWID file:', err);
    return null;
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('getscript')
    .setDescription('Get the script with your unique key and HWID verification'),
  
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
    
    // Get user's HWID
    const userHwid = getHwidForUser(userId);
    
    // If no HWID exists, prompt them to register one
    if (!userHwid) {
      return interaction.reply({ 
        content: 'You need to register your hardware ID first using `/registerhwid` command.',
        ephemeral: true
      });
    }
    
    // Create script with user's key and HWID verification
    const script = `local player = game.players.localplayer

-- Key and HWID verification
local key = "${userKey}"
local registered_hwid = "${userHwid}"

-- Function to get the current device's HWID
local function getDeviceHWID()
    -- This is a placeholder - in a real script, you would use platform-specific
    -- methods to collect hardware identifiers (MAC address, disk serial, etc.)
    -- and then hash them to create a unique HWID
    
    -- For demonstration, we'll include this function to show where real HWID collection would go
    -- The actual implementation depends on the platform (Windows, Mac, etc.)
    -- and would need to be replaced with real code
    
    -- Example pseudo-code for what this might look like:
    -- local components = {}
    -- table.insert(components, get_cpu_id())  -- CPU identifier
    -- table.insert(components, get_hdd_serial())  -- Hard drive serial
    -- table.insert(components, get_motherboard_serial())  -- Motherboard serial
    -- local combined = table.concat(components, "-")
    -- return generate_md5_hash(combined)
    
    -- For now, return a placeholder value for demonstration
    return "GET_REAL_HWID_HERE"
end

-- Verify HWID before running
local current_hwid = getDeviceHWID()
if current_hwid ~= "GET_REAL_HWID_HERE" then
    -- In production, you would compare with the registered HWID:
    -- if current_hwid ~= registered_hwid then
    print("HWID verification failed! This key is registered to a different device.")
    return
end

-- If verification passes, continue with the script
print("HWID verification successful!")

-- Your script functionality goes here
-- ...

-- Example usage of the key (you would implement your actual functionality here)
print("Script loaded successfully with key: " .. key)
`;
    
    // Send the script privately
    await interaction.reply({ 
      content: `Here's your script with HWID verification:\n\`\`\`lua\n${script}\n\`\`\`\n**Important Instructions:**\n1. Replace \`GET_REAL_HWID_HERE\` with actual code to get the device's HWID.\n2. Use the same HWID generation logic that you used when registering with \`/registerhwid\`.\n3. Keep this script private!`,
      ephemeral: true
    });
  },
};