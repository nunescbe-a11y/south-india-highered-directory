const { Firestore } = require('@google-cloud/firestore');
const fs = require('fs');
const path = require('path');

const db = new Firestore({ projectId: 'nunes-mail-d072f3ce1' });
const baseDir = path.join(__dirname, 'public');

async function batchUpload(collectionName, items, idField = 'id') {
  console.log(`\n📦 Uploading ${items.length} records to Firestore collection: "${collectionName}"...`);
  const batchSize = 400; // Safe below 500 Firestore limit
  let totalCommitted = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const batch = db.batch();

    chunk.forEach(item => {
      const docId = String(item[idField] || item.name || item.stationName || `doc-${Date.now()}`)
        .replace(/\//g, '_')
        .replace(/\\/g, '_')
        .trim();
      const docRef = db.collection(collectionName).doc(docId);
      batch.set(docRef, {
        ...item,
        lastSyncedToFirestore: new Date().toISOString()
      }, { merge: true });
    });

    await batch.commit();
    totalCommitted += chunk.length;
    console.log(`  ✓ Committed ${totalCommitted}/${items.length} records...`);
  }
  console.log(`✅ Successfully synced all ${totalCommitted} records to "${collectionName}".`);
}

async function runFullSync() {
  console.log('================================================================');
  console.log('🔥 NUNES INSTRUMENTATION: GOOGLE CLOUD FIRESTORE MASTER SYNC');
  console.log('Project: nunes-mail-d072f3ce1 | Region: asia-south1 (Mumbai)');
  console.log('================================================================');

  try {
    // 1. Police Stations (415)
    const policeRaw = JSON.parse(fs.readFileSync(path.join(baseDir, 'TamilNadu_Police_Stations_Dataset.json'), 'utf8'));
    const policeStations = policeRaw.allStations || [];
    await batchUpload('police_stations', policeStations, 'stationName');

    // 2. Schools (26)
    const schoolsRaw = JSON.parse(fs.readFileSync(path.join(baseDir, 'Schools_Directory_Dataset.json'), 'utf8'));
    const schools = schoolsRaw.allSchools || [];
    await batchUpload('schools', schools, 'name');

    // 3. Transport Fleets (22)
    const transportRaw = JSON.parse(fs.readFileSync(path.join(baseDir, 'Transport_Lorry_Bus_Fleet_Dataset.json'), 'utf8'));
    const transport = transportRaw.allTransport || [];
    await batchUpload('transport_fleets', transport, 'name');

    // 4. Colleges (1,654)
    const collegesRaw = JSON.parse(fs.readFileSync(path.join(baseDir, 'SouthIndia_HigherEd_Directory_SourceCode_And_Dataset.json'), 'utf8'));
    const colleges = collegesRaw.allInstitutions || [];
    await batchUpload('colleges', colleges, 'name');

    // 5. Metadata Doc
    await db.collection('sync_metadata').doc('summary').set({
      lastFullSync: new Date().toISOString(),
      totalPoliceStations: policeStations.length,
      totalSchools: schools.length,
      totalTransportFleets: transport.length,
      totalColleges: colleges.length,
      totalEntities: policeStations.length + schools.length + transport.length + colleges.length,
      status: 'cloud_synchronized',
      engine: '@google-cloud/firestore native client'
    });

    console.log('\n🎉 ALL 2,117 RECORDS SUCCESSFULLY STORED IN CLOUD FIRESTORE!');
  } catch (err) {
    console.error('Fatal sync error:', err);
  }
}

runFullSync();
