// parsers/collection.js
module.exports = function parseCollection(embed) {
  const player    = embed.author?.name || '';
  const timestamp = embed.timestamp || new Date().toISOString();
  const desc      = embed.description || '';

  // First line = new collection item
  const firstLine = desc.split('\n')[0] || '';
  const item = firstLine
    .replace(/\[|\]/g, '')
    .replace(/\(.*?\)/g, '')
    .trim();

  // Source often in footer
  const sourceMatch = embed.footer?.text.match(/from:\s*(.*)/i);
  const source = sourceMatch ? sourceMatch[1] : '';

  return [ 'Collection Log', player, item, source, timestamp ];
};
