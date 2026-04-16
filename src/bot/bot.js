require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function registerCommands() {
    const commands = [
        new SlashCommandBuilder().setName('track').setDescription('Track a package').addStringOption(o => o.setName('id').setDescription('ID').setRequired(true)),
        new SlashCommandBuilder().setName('help').setDescription('Show help')
    ].map(c => c.toJSON());

    const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
    try {
        console.log('🔄 Attempting to register commands for Guild: ' + GUILD_ID);
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        console.log('✅ Slash commands registered!');
    } catch (err) {
        console.error('❌ COMMAND REGISTRATION ERROR:', err.message);
    }
}

client.once('ready', () => {
    console.log(`🐾 MOD Bot online as ${client.user.tag}`);
    registerCommands();
});

console.log('🔌 Attempting Discord Login...');
client.login(BOT_TOKEN).catch(err => {
    console.error('❌ DISCORD LOGIN ERROR:', err.message);
});

module.exports = client;
