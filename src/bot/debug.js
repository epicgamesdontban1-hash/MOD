require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

console.log('===== DISCORD ENV CHECK =====');
console.log('TOKEN exists:', !!process.env.DISCORD_BOT_TOKEN);
console.log('TOKEN length:', process.env.DISCORD_BOT_TOKEN ? process.env.DISCORD_BOT_TOKEN.length : 0);
console.log('TOKEN starts with:', process.env.DISCORD_BOT_TOKEN ? process.env.DISCORD_BOT_TOKEN.substring(0, 10) + '...' : 'MISSING');
console.log('CLIENT_ID:', process.env.DISCORD_CLIENT_ID || 'MISSING');
console.log('GUILD_ID:', process.env.DISCORD_GUILD_ID || 'MISSING');
console.log('OWNER_ID:', process.env.DISCORD_OWNER_ID || 'MISSING');
console.log('=============================');
