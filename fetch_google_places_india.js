/**
 * Pan-India Data Harvester using Google Places API (Cloud Console)
 * -------------------------------------------------------------
 * Nunes Instrumentation - Official Pan-India Intelligence Engine
 * 
 * Usage:
 *   node fetch_google_places_india.js --state "Karnataka" --district "Bengaluru" --sector "colleges" --key "AIzaSy..."
 *   node fetch_google_places_india.js --state "Maharashtra" --sector "police" --key "AIzaSy..."
 * 
 * Supported Sectors:
 *   - police       (Police Stations, Commissioner Offices, Traffic Interceptors)
 *   - colleges     (Higher Education, Universities, Autonomous Engineering & Medical)
 *   - schools      (Matriculation, CBSE Senior Secondary with School Bus Fleets)
 *   - transport    (State RTC Bus Terminals, Private Sleeper Fleets, Lorry Transport Hubs)
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const params = {};
for (let i = 0; i < args.length; i += 2) {
  const k = args[i].replace(/^--/, '');
  const v = args[i + 1];
  params[k] = v;
}

const API_KEY = params.key || process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY || '';
const STATE = params.state || 'Tamil Nadu';
const DISTRICT = params.district || 'Coimbatore';
const SECTOR = (params.sector || 'colleges').toLowerCase();

if (!API_KEY) {
  console.error('\n❌ ERROR: Google Maps API Key is required!');
  console.error('Please pass your API key via --key "YOUR_GOOGLE_MAPS_API_KEY" or set GOOGLE_MAPS_API_KEY in .env');
  console.error('\nHow to get your API Key in Google Cloud Console:');
  console.error('1. Visit: https://console.cloud.google.com/');
  console.error('2. Create/Select Project -> "Nunes-Pan-India-Data"');
  console.error('3. Enable "Places API (New)" and "Geocoding API"');
  console.error('4. Go to APIs & Services -> Credentials -> Create API Key\n');
  process.exit(1);
}

const sectorQueries = {
  police: `Police Stations in ${DISTRICT}, ${STATE}`,
  colleges: `Engineering Colleges and Universities in ${DISTRICT}, ${STATE}`,
  schools: `CBSE Senior Secondary Schools with Bus Fleet in ${DISTRICT}, ${STATE}`,
  transport: `Lorry Transport Hubs Bus Stand Depots in ${DISTRICT}, ${STATE}`
};

const query = params.query || sectorQueries[SECTOR] || `${SECTOR} in ${DISTRICT}, ${STATE}`;

console.log('================================================================');
console.log(`🌐 Pan-India Google Places Harvester: ${SECTOR.toUpperCase()}`);
console.log(`📍 Region: ${DISTRICT}, ${STATE}`);
console.log(`🔍 Query: "${query}"`);
console.log('================================================================');

async function harvest() {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY.trim()}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK') {
      console.error(`\n❌ Google Places API Error (${data.status}):`, data.error_message || 'No details returned');
      return;
    }

    const results = (data.results || []).map((p, idx) => ({
      id: `${SECTOR}-${STATE.slice(0,2).toLowerCase()}-${String(idx + 1).padStart(3, '0')}`,
      name: p.name,
      state: STATE,
      district: DISTRICT,
      category: SECTOR.toUpperCase(),
      address: p.formatted_address,
      rating: p.rating || 4.0,
      userRatingsTotal: p.user_ratings_total || 0,
      lat: p.geometry?.location?.lat || null,
      lng: p.geometry?.location?.lng || null,
      placeId: p.place_id,
      verifiedSource: 'Google Cloud Places API'
    }));

    console.log(`\n✅ Successfully harvested ${results.length} verified ${SECTOR} records!`);

    // Output files
    const outJson = path.join(__dirname, 'public', `${STATE}_${DISTRICT}_${SECTOR}_Harvested.json`);
    fs.writeFileSync(outJson, JSON.stringify({ meta: { state: STATE, district: DISTRICT, sector: SECTOR, count: results.length, date: new Date().toISOString() }, items: results }, null, 2), 'utf8');
    console.log(`📄 Saved JSON: ${outJson}`);

    // Output CSV
    if (results.length > 0) {
      const headers = Object.keys(results[0]);
      const csv = [headers.join(','), ...results.map(r => headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(','))].join('\r\n');
      const outCsv = path.join('C:/Users/NUNES/Desktop', `${STATE}_${DISTRICT}_${SECTOR}_Harvested.csv`);
      fs.writeFileSync(outCsv, csv, 'utf8');
      console.log(`📊 Saved CSV on Desktop: ${outCsv}`);
    }

  } catch (err) {
    console.error('Fatal fetch error:', err.message);
  }
}

harvest();
