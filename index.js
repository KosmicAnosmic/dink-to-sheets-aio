require('dotenv').config();
const config = require('./pointsConfig.json');
const { addPoints } = require('./pointsManager');

const { Client, GatewayIntentBits, Events } = require('discord.js');
const { appendRow } = require('./sheets/googleSheetsClient');

const DINK_BOT_ID = '1380796448207278142';
const TARGET_CHANNEL_IDS = [
  '1380796083520671814',
  '1381147284871577640',
  '1382283615085264977',
  '1271184883041042473'
];
const SHEET_TAB_NAME = 'Loot Log';

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

function cleanValue(raw) {
  if (!raw) return '';
  const stripped = raw.replace(/```[\s\S]*?\n/, '').replace(/```/g, '').trim();
  return stripped.replace(/\s*gp$/i, '').replace(/,/g, '');
}

function extractItem(description) {
  const regex = /(\d+)\s*x\s*\[([^\]]+)\]/g;
  let items = [];
  let match;
  while ((match = regex.exec(description)) !== null) {
    items.push(`${match[1]} x ${match[2]}`);
  }
  return items.length ? items.join(' + ') : '';
}

function extractMonster(description) {
  const match = description?.match(/From:\s*\[([^\]]+)\]/i);
  return match ? match[1] : '';
}

client.on(Events.MessageCreate, async (message) => {
  console.log(`[${message.channel.id}] [${message.author.id}] ${message.content || '[embed]'}`);

  if (
    TARGET_CHANNEL_IDS.includes(message.channel.id) &&
    message.author.id === DINK_BOT_ID &&
    message.embeds.length
  ) {
    try {
      const embed = message.embeds[0];
      console.log('Embed object:', JSON.stringify(embed, null, 2));

      const title = embed.title || '';
      const player = embed.author?.name || '';
      const itemName = extractItem(embed.description || '');
      const source = extractMonster(embed.description || '');

      let value = '';
      let kc = '';

      if (Array.isArray(embed.fields)) {
        const valueField = embed.fields.find(f => f.name.toLowerCase().includes('total value'));
        const kcField = embed.fields.find(f => f.name.toLowerCase().includes('kill count'));
        if (valueField) value = cleanValue(valueField.value);
        if (kcField) kc = cleanValue(kcField.value);
      }

      const timestamp = new Date().toISOString();

      const parsed = [title, player, itemName, value, source, kc, timestamp];
      console.log('Parsed embed:', parsed);

      await appendRow(SHEET_TAB_NAME, parsed);
      console.log('Row appended to Google Sheet.');
    } catch (error) {
      console.error('Error parsing/saving embed:', error);
    }
    // Award clan points
    let earned = 0;
    if (embed.title === 'Loot Drop') {
      const gp = Number(value);  // from your parser
      earned = Math.floor(gp / config.loot.unitValue) * config.loot.pointsPerUnit;
      if (gp >= config.loot.bigDropThreshold) earned += config.loot.bigDropBonus;
    } else if (embed.title === 'Pet Drop') {
      earned = config.pet.points;
    }

    if (earned > 0) {
      const { total, rank, leveledUp } = await addPoints(player, earned);
      console.log(`${player} earned ${earned} pts (total: ${total})`);
      if (leveledUp) {
        console.log(`${player} ranked up to ${rank}!`);
        // Optional: assign Discord role here
      }
    }

  }
});

client.login(process.env.DISCORD_TOKEN);
