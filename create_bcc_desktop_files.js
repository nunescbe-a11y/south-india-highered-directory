const fs = require('fs');
const path = require('path');

function parseCSVLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

const csvPath = 'C:\\Users\\NUNES\\.gemini\\antigravity\\scratch\\highered-directory-sales-agent\\public\\Coimbatore_Higher_Education_Colleges_Verified_Directory.csv';
const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split('\n').filter(l => l.trim().length > 0);
const headers = parseCSVLine(lines[0]);
const emailIdx = headers.indexOf('Official Email ID');

const emails = [];
for (let i = 1; i < lines.length; i++) {
  const row = parseCSVLine(lines[i]);
  const email = row[emailIdx];
  if (email && email.includes('@')) {
    emails.push(email.trim());
  }
}

console.log('Total verified emails:', emails.length);

const batch1 = emails.slice(0, 100);
const batch2 = emails.slice(100, 200);
const batch3 = emails.slice(200);

const desktopDir = 'C:\\Users\\NUNES\\Desktop';

fs.writeFileSync(path.join(desktopDir, 'Colleges_BCC_List_Batch_1.txt'), batch1.join(', '), 'utf8');
fs.writeFileSync(path.join(desktopDir, 'Colleges_BCC_List_Batch_2.txt'), batch2.join(', '), 'utf8');
fs.writeFileSync(path.join(desktopDir, 'Colleges_BCC_List_Batch_3.txt'), batch3.join(', '), 'utf8');

console.log('Created 3 BCC batch files on Desktop:');
console.log('  Batch 1:', batch1.length, 'emails');
console.log('  Batch 2:', batch2.length, 'emails');
console.log('  Batch 3:', batch3.length, 'emails');
