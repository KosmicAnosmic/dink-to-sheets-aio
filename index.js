// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const { appendRow } = require('./sheets/googleSheetsClient');
const config = require('./pointsConfig.json');
const { addPoints } = require('./pointsManager');

const DINK_BOT_ID = process.env.DINK_BOT_ID;
const TARGET_CHANNEL_IDS = (process.env.CHANNEL_IDS || '')
  .split(',')
  .map(id => id.trim())
  .filter(Boolean);
const SHEET_TAB_NAME = 'Loot Log';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// helper to extract items as { qty, name }
function extractItems(desc) {
  const regex = /(\d+)\s*x\s*\[([^\]]+)\]/g;
  const items = [];
  let m;
  while ((m = regex.exec(desc)) !== null) {
    items.push({ qty: Number(m[1]), name: m[2] });
  }
  return items;
}

// strip markdown and gp suffix
function cleanValue(raw) {
  if (!raw) return '';
  return raw
    .replace(/```[\s\S]*?\n/, '')
    .replace(/```/g, '')
    .replace(/\s*gp$/i, '')
    .replace(/,/g, '')
    .trim();
}

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on(Events.MessageCreate, async (message) => {
  console.log(`[${message.channel.id}] [${message.author.id}] ${message.content || '[embed]'}`);

  if (
    TARGET_CHANNEL_IDS.includes(message.channel.id) &&
    message.author.id === DINK_BOT_ID &&
    message.embeds.length > 0
  ) {
    try {
      const embed = message.embeds[0];
      console.log('Embed object:', JSON.stringify(embed, null, 2));

      const title = embed.title || '';
      const player = embed.author?.name || '';
      const desc = embed.description || '';
      const timestamp = new Date().toISOString();

      // parse items and fields
      const items = extractItems(desc);
      const vf = embed.fields.find(f => /total value/i.test(f.name));
      const kcF = embed.fields.find(f => /kill count/i.test(f.name));
      const value = vf ? cleanValue(vf.value) : '';
      const kc = kcF ? cleanValue(kcF.value) : '';

      // append to Loot Log
      const row = [
        title,
        player,
        items.map(i => `${i.qty} x ${i.name}`).join(' + '),
        value,
        desc.match(/From:\s*\[([^\]]+)\]/i)?.[1] || '',
        kc,
        timestamp,
      ];
      console.log('Parsed embed:', row);
      await appendRow(SHEET_TAB_NAME, row);
      console.log(`Row appended to "${SHEET_TAB_NAME}" tab.`);

      // ── points calculation with whitelist and threshold ──
      let earned = 0;

      if (title === 'Loot Drop') {
        // 1) Whitelist-based points
        for (const { qty, name } of items) {
          if (config.itemWhitelist.items[name] != null) {
            earned += config.itemWhitelist.items[name] * qty;
          } else if (config.itemWhitelist.genericPoints != null) {
            earned += config.itemWhitelist.genericPoints * qty;
          }
        }

        // 2) Fallback GP-based points (only if none from whitelist)
        if (earned === 0 && value) {
          const gp = Number(value);
          if (gp >= config.loot.minValueThreshold) {
            const millions = Math.round(gp / config.loot.fallbackUnitValue);
            earned = millions * config.loot.fallbackPointsPerUnit;
            // Cap per-drop
            earned = Math.min(earned, config.loot.maxPointsPerDrop);
          }
        }

      } else if (title === 'Pet Drop') {
        earned = config.pet.points;
      }

      if (earned > 0) {
        const { total, rank, leveledUp } = await addPoints(player, earned);
        console.log(`${player} earned ${earned} points (total: ${total}).`);
        if (leveledUp) {
          console.log(`${player} just ranked up to ${rank}!`);
          // Optional: assign Discord role here…
        }
      }
      // ───────────────────────────────────────────────

    } catch (err) {
      console.error('Error parsing/saving embed:', err);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
