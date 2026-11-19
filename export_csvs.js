const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'public');
const desktopDir = 'C:/Users/NUNES/Desktop';

const schoolsRaw = JSON.parse(fs.readFileSync(path.join(baseDir, 'Schools_Directory_Dataset.json'), 'utf8'));
const schools = schoolsRaw.allSchools || schoolsRaw;

const transportRaw = JSON.parse(fs.readFileSync(path.join(baseDir, 'Transport_Lorry_Bus_Fleet_Dataset.json'), 'utf8'));
const transport = transportRaw.allTransport || transportRaw;

function toCSV(arr) {
  if (!arr || !arr.length) return '';
  const headers = Object.keys(arr[0]);
  const rows = arr.map(obj => headers.map(h => {
    let val = obj[h] !== undefined && obj[h] !== null ? String(obj[h]) : '';
    val = val.replace(/"/g, '""');
    return `"${val}"`;
  }).join(','));
  return [headers.join(','), ...rows].join('\r\n');
}

fs.writeFileSync(path.join(desktopDir, 'Schools_Directory_Verified.csv'), toCSV(schools), 'utf8');
fs.writeFileSync(path.join(desktopDir, 'Transport_Lorry_Bus_Fleet_Verified.csv'), toCSV(transport), 'utf8');

console.log(`Successfully exported ${schools.length} schools and ${transport.length} transport hubs to CSV on Desktop.`);
