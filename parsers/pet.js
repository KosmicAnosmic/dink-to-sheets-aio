// parsers/pet.js
module.exports = function parsePet(embed) {
  const player    = embed.author?.name || '';
  const timestamp = embed.timestamp || new Date().toISOString();
  const desc      = embed.description || '';

  // Pet name
  const petMatch = desc.match(/received a pet:\s*([^\n]+)/i);
  const petName  = petMatch ? petMatch[1].trim() : '';

  // Boss source
  const sourceMatch = desc.match(/From:\s*\[([^\]]+)\]/i);
  const source = sourceMatch ? sourceMatch[1] : '';

  // Optional KC
  const kcField = embed.fields?.find(f => f.name.toLowerCase().includes('kill count'));
  const kc = kcField?.value.replace(/[`\n]/g, '') || '';

  return [ 'Pet Drop', player, petName, source, kc, timestamp ];
};
