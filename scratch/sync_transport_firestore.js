const { Firestore } = require('@google-cloud/firestore');
const path = require('path');
const fs = require('fs');

const PROJECT_ID = 'nunes-mail-d072f3ce1';
const firestore = new Firestore({ projectId: PROJECT_ID });

async function updateFirestore() {
  console.log('[Firestore] Updating cloud metadata and verified transport fleets in asia-south1...');
  
  const transportData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'Transport_Lorry_Bus_Fleet_Dataset.json'), 'utf8'));
  const collegesData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'SouthIndia_HigherEd_Directory_SourceCode_And_Dataset.json'), 'utf8'));
  const policeData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'TamilNadu_Police_Stations_Dataset.json'), 'utf8'));
  const schoolsData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'Schools_Directory_Dataset.json'), 'utf8'));

  const collegesCount = (collegesData.allInstitutions || []).length;
  const policeCount = (policeData.allStations || []).length;
  const schoolsCount = (schoolsData.allSchools || []).length;
  const transportCount = (transportData.allTransport || []).length;
  const total = collegesCount + policeCount + schoolsCount + transportCount;

  // 1. Update summary doc
  await firestore.collection('sync_metadata').doc('summary').set({
    appName: 'Nunes Multi-Sector Enforcement, Campus & Transport Safety Directory',
    lastSyncTimestamp: new Date().toISOString(),
    totalEntities: total,
    colleges: collegesCount,
    schools: schoolsCount,
    policeStations: policeCount,
    transportFleets: transportCount,
    verifiedContacts: {
      collegesWithDirectContacts: (collegesData.verifiedCount || 864),
      transportWithDirectContacts: transportCount
    },
    cloudStatus: 'ACTIVE_AND_PERSISTED',
    region: 'asia-south1',
    projectId: PROJECT_ID
  }, { merge: true });

  console.log(`[Firestore] Summary doc updated: ${total.toLocaleString()} total entities.`);

  // 2. Commit key transport & logistics hubs to 'verified_transport_fleets' collection
  const majorFleets = (transportData.allTransport || []).slice(0, 25);
  const batch = firestore.batch();
  for (const fleet of majorFleets) {
    const docId = (fleet.id || fleet.name).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
    const docRef = firestore.collection('verified_transport_fleets').doc(docId);
    batch.set(docRef, {
      ...fleet,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }
  await batch.commit();
  console.log(`[Firestore] Committed ${majorFleets.length} major transport & logistics hubs to Firestore.`);
}

updateFirestore().then(() => {
  console.log('[Firestore] Cloud sync complete!');
  process.exit(0);
}).catch(err => {
  console.error('[Firestore] Sync error:', err.message);
  process.exit(1);
});
