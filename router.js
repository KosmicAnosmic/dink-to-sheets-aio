// router.js
module.exports = function routeEmbed(embed) {
  const title  = embed.title?.toLowerCase() || '';
  const footer = embed.footer?.text?.toLowerCase() || '';

  if (title.includes('loot drop')) {
    return { parser: require('./parsers/loot'),      tab: 'Loot Log' };
  }
  if (footer.includes('pet')) {
    return { parser: require('./parsers/pet'),       tab: 'Pets' };
  }
  if (title.includes('collection log')) {
    return { parser: require('./parsers/collection'), tab: 'Collection Log' };
  }
  return null; // no matching parser
};
