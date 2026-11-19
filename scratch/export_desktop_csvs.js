const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// 1. Colleges CSV
const collPath = path.join(publicDir, 'SouthIndia_HigherEd_Directory_SourceCode_And_Dataset.json');
if (fs.existsSync(collPath)) {
  const data = JSON.parse(fs.readFileSync(collPath, 'utf8')).allInstitutions || [];
  const headers = ['Institution Name', 'Category', 'AICTE ID', 'Affiliated University', 'Institution Type', 'District', 'State', 'Phone', 'Email', 'Website', 'Address', 'Latitude', 'Longitude', 'Rating', 'Place ID', 'Verified Source'];
  const rows = data.map(c => [
    '"' + (c.name || '').replace(/"/g, '""') + '"',
    '"' + (c.category || '').replace(/"/g, '""') + '"',
    '"' + (c.aicteId || '').replace(/"/g, '""') + '"',
    '"' + (c.university || '').replace(/"/g, '""') + '"',
    '"' + (c.institutionType || '').replace(/"/g, '""') + '"',
    '"' + (c.district || '').replace(/"/g, '""') + '"',
    '"' + (c.state || '').replace(/"/g, '""') + '"',
    '"' + (c.phone || '').replace(/"/g, '""') + '"',
    '"' + (c.email || '').replace(/"/g, '""') + '"',
    '"' + (c.website || '').replace(/"/g, '""') + '"',
    '"' + (c.address || '').replace(/"/g, '""') + '"',
    c.lat || c.location?.lat || '',
    c.lng || c.location?.lng || '',
    c.rating || '',
    '"' + (c.placeId || '').replace(/"/g, '""') + '"',
    '"' + (c.verifiedSource || '').replace(/"/g, '""') + '"'
  ].join(','));
  const target = 'C:/Users/NUNES/Desktop/South_India_Higher_Education_Colleges_Verified_Directory.csv';
  fs.writeFileSync(target, [headers.join(','), ...rows].join('\n'), 'utf8');
  console.log(`[Export] Created ${target} with ${data.length} records.`);
}

// 2. Police Stations CSV
const polPath = path.join(publicDir, 'TamilNadu_Police_Stations_Dataset.json');
if (fs.existsSync(polPath)) {
  const data = JSON.parse(fs.readFileSync(polPath, 'utf8')).allStations || [];
  const headers = ['Station Name', 'Category', 'Division / Sub-Division', 'District', 'State', 'Officer In-Charge', 'Landline', 'Official Email', 'Address', 'Latitude', 'Longitude', 'Station Code / Place ID', 'Verified Source'];
  const rows = data.map(p => [
    '"' + (p.stationName || '').replace(/"/g, '""') + '"',
    '"' + (p.category || '').replace(/"/g, '""') + '"',
    '"' + (p.divisionZone || '').replace(/"/g, '""') + '"',
    '"' + (p.district || '').replace(/"/g, '""') + '"',
    '"' + (p.state || '').replace(/"/g, '""') + '"',
    '"' + (p.officerInCharge || '').replace(/"/g, '""') + '"',
    '"' + (p.landline || '').replace(/"/g, '""') + '"',
    '"' + (p.officialEmail || '').replace(/"/g, '""') + '"',
    '"' + (p.address || p.formattedAddress || '').replace(/"/g, '""') + '"',
    p.lat || p.location?.lat || '',
    p.lng || p.location?.lng || '',
    '"' + (p.stationCode || p.placeId || '').replace(/"/g, '""') + '"',
    '"' + (p.verifiedSource || '').replace(/"/g, '""') + '"'
  ].join(','));
  const target = 'C:/Users/NUNES/Desktop/South_India_Police_Stations_Directory_Verified.csv';
  fs.writeFileSync(target, [headers.join(','), ...rows].join('\n'), 'utf8');
  console.log(`[Export] Created ${target} with ${data.length} records.`);
}

// 3. Schools CSV
const schoolsPath = path.join(publicDir, 'Schools_Directory_Dataset.json');
if (fs.existsSync(schoolsPath)) {
  const data = JSON.parse(fs.readFileSync(schoolsPath, 'utf8')).allSchools || [];
  const headers = ['School Name', 'Category', 'Board / Status', 'Affiliation Number', 'Principal Name', 'District', 'State', 'Phone', 'Email', 'Website', 'Address', 'Latitude', 'Longitude', 'Verified Source'];
  const rows = data.map(s => [
    '"' + (s.name || '').replace(/"/g, '""') + '"',
    '"' + (s.category || '').replace(/"/g, '""') + '"',
    '"' + (s.board || s.status || '').replace(/"/g, '""') + '"',
    '"' + (s.affiliationNumber || '').replace(/"/g, '""') + '"',
    '"' + (s.principalName || '').replace(/"/g, '""') + '"',
    '"' + (s.district || '').replace(/"/g, '""') + '"',
    '"' + (s.state || '').replace(/"/g, '""') + '"',
    '"' + (s.phone || '').replace(/"/g, '""') + '"',
    '"' + (s.email || '').replace(/"/g, '""') + '"',
    '"' + (s.website || '').replace(/"/g, '""') + '"',
    '"' + (s.address || '').replace(/"/g, '""') + '"',
    s.lat || s.location?.lat || '',
    s.lng || s.location?.lng || '',
    '"' + (s.verifiedSource || '').replace(/"/g, '""') + '"'
  ].join(','));
  const target = 'C:/Users/NUNES/Desktop/South_India_Schools_Directory_Verified.csv';
  fs.writeFileSync(target, [headers.join(','), ...rows].join('\n'), 'utf8');
  console.log(`[Export] Created ${target} with ${data.length} records.`);
}

// 4. Transport Fleets CSV
const transportPath = path.join(publicDir, 'Transport_Lorry_Bus_Fleet_Dataset.json');
if (fs.existsSync(transportPath)) {
  const data = JSON.parse(fs.readFileSync(transportPath, 'utf8')).allTransport || [];
  const headers = ['Transport Hub / Fleet', 'Category', 'Fleet Type', 'District', 'State', 'Phone', 'Address', 'Latitude', 'Longitude', 'Google Place ID', 'Verified Source'];
  const rows = data.map(t => [
    '"' + (t.name || '').replace(/"/g, '""') + '"',
    '"' + (t.category || '').replace(/"/g, '""') + '"',
    '"' + (t.type || '').replace(/"/g, '""') + '"',
    '"' + (t.district || '').replace(/"/g, '""') + '"',
    '"' + (t.state || '').replace(/"/g, '""') + '"',
    '"' + (t.phone || '').replace(/"/g, '""') + '"',
    '"' + (t.address || '').replace(/"/g, '""') + '"',
    t.location?.lat || t.lat || '',
    t.location?.lng || t.lng || '',
    '"' + (t.placeId || '').replace(/"/g, '""') + '"',
    '"' + (t.verifiedSource || '').replace(/"/g, '""') + '"'
  ].join(','));
  const target = 'C:/Users/NUNES/Desktop/South_India_Transport_Fleets_Directory_Verified.csv';
  fs.writeFileSync(target, [headers.join(','), ...rows].join('\n'), 'utf8');
  console.log(`[Export] Created ${target} with ${data.length} records.`);
}
