// parsers/loot.js
module.exports = function parseLoot(embed) {
  const player    = embed.author?.name || '';
  const timestamp = embed.timestamp || new Date().toISOString();
  const title     = embed.title || 'Loot Drop';
  const desc      = embed.description || '';
  const fields    = embed.fields || [];

  // Value & KC
  const valueField = fields.find(f => f.name.toLowerCase().includes('value'));
  const kcField    = fields.find(f => f.name.toLowerCase().includes('kill count'));
  const value = valueField?.value.replace(/[`\n]/g, '').replace(/\D/g, '') || '';
  const kc    = kcField?.value.replace(/[`\n]/g, '') || '';

  // Item(s)
  const regex = /(\d+)\s*x\s*\[([^\]]+)\]/g;
  let items = [], m;
  while ((m = regex.exec(desc)) !== null) {
    items.push(`${m[1]} x ${m[2]}`);
  }
  const item = items.join(' + ');

  // Monster source
  const sourceMatch = desc.match(/From:\s*\[([^\]]+)\]/i);
  const source = sourceMatch ? sourceMatch[1] : '';

  return [ title, player, item, value, source, kc, timestamp ];
};
