// pointsManager.js
const { readRows, updateCell, appendRow } = require('./sheets/googleSheetsClient');
const config = require('./pointsConfig.json');

// Ensures you have a "Points" tab with headers: Player | Points | Rank
async function addPoints(player, pointsToAdd) {
  const rows = await readRows('Points');
  const idx  = rows.findIndex(r => r[0] === player);
  let total = pointsToAdd;

  if (idx !== -1) {
    total += Number(rows[idx][1] || 0);
    await updateCell('Points', idx + 1, 2, total);
  } else {
    await appendRow('Points', [player, total, '']);
  }

  // Determine which rank they now qualify for
  const rank = config.ranks
    .slice().reverse()
    .find(r => total >= r.minPoints)?.name || '';

  // Update rank cell if it changed (or set it for new players)
  if ((idx !== -1 && rows[idx][2] !== rank) || idx === -1) {
    const rowIndex = idx !== -1 ? idx + 1 : rows.length + 1;
    await updateCell('Points', rowIndex, 3, rank);
    return { total, rank, leveledUp: true };
  }

  return { total, rank, leveledUp: false };
}

module.exports = { addPoints };
