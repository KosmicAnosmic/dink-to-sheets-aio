// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const { appendRow } = require('./sheets/googleSheetsClient');
const routeEmbed = require('./router');

// Dink bot user ID and channels to monitor
const DINK_BOT_ID = '1380796448207278142';
const TARGET_CHANNEL_IDS = [
  '1380796083520671814',
  '1381147284871577640',
  '1382283615085264977',
  '1271184883041042473'
];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on(Events.MessageCreate, async (message) => {
  // Debug log
  console.log(`[${message.channel.id}] [${message.author.id}] ${message.content || '[embed]'}`);

  // Only process embeds from Dink in the target channels
  if (
    TARGET_CHANNEL_IDS.includes(message.channel.id) &&
    message.author.id === DINK_BOT_ID &&
    message.embeds.length > 0
  ) {
    const embed = message.embeds[0];
    console.log('Embed object:', JSON.stringify(embed, null, 2));

    // Route to the correct parser/tab
    const route = routeEmbed(embed);
    if (!route) {
      console.warn('No parser found for this embed. Skipping.');
      return;
    }

    try {
      // Parse and append row
      const row = route.parser(embed);
      console.log(`Parsed row for "${route.tab}":`, row);
      await appendRow(route.tab, row);
      console.log(`Row appended to "${route.tab}" tab.`);
    } catch (error) {
      console.error('Error parsing or saving embed:', error);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
