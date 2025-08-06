// pointsManager.js
const { readRows, updateCell, appendRow } = require('./sheets/googleSheetsClient');
const config = require('./pointsConfig.json');

// Reads/updates the "Points" tab: headers are [Player, Points, Rank]
async function addPoints(player, pointsToAdd) {
  const rows = await readRows('Points');
  const idx = rows.findIndex(r => r[0] === player);
  let total = pointsToAdd;

  if (idx !== -1) {
    total += Number(rows[idx][1] || 0);
    await updateCell('Points', idx + 1, 2, total);
  } else {
    await appendRow('Points', [player, total, '']);
  }

  // Determine new rank
  const rank = config.ranks
    .slice().reverse()
    .find(r => total >= r.minPoints)?.name || '';
  
  // Update rank cell if it changed
  if (idx !== -1 && rows[idx][2] !== rank) {
    await updateCell('Points', idx + 1, 3, rank);
    return { total, rank, leveledUp: true };
  }
  if (idx === -1) {
    const newRow = rows.length + 1;
    await updateCell('Points', newRow, 3, rank);
    return { total, rank, leveledUp: true };
  }
  return { total, rank, leveledUp: false };
}

module.exports = { addPoints };
