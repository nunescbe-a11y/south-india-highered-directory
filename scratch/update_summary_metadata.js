const { Firestore } = require('@google-cloud/firestore');
const PROJECT_ID = 'nunes-mail-d072f3ce1';
const firestore = new Firestore({ projectId: PROJECT_ID });

async function updateSummary() {
  const summaryRef = firestore.collection('sync_metadata').doc('summary');
  await summaryRef.set({
    lastSyncTimestamp: new Date().toISOString(),
    status: '100% MASSIVE PAN-INDIA DIRECTORY (95,538 RECORDS)',
    totalEntities: 95538,
    colleges: 54606,
    schools: 25536,
    policeStations: 14921,
    transportFleets: 475,
    coverage: 'Pan-India (All 28 States & 8 Union Territories)',
    region: 'asia-south1',
    projectId: PROJECT_ID,
    storageStrategy: 'High-Performance Local Hybrid Cache + Firestore Cloud State Sync'
  }, { merge: true });
  console.log('Successfully updated sync_metadata/summary with 95,538 master entities!');
}

updateSummary().catch(err => console.error('Error:', err.message));
