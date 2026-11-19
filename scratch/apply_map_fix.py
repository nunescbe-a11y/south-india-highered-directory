import re

html_path = r"C:\Users\NUNES\.gemini\antigravity\scratch\highered-directory-sales-agent\public\index.html"

with open(html_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update meta description
content = content.replace(
    'content="Verified master census of 415+ Police Stations, 1,650+ Colleges, Schools, and Bus/Lorry Transport Fleets across Tamil Nadu & Kerala with interactive live GIS map and 14-model Nunes Breath Analyser solutions."',
    'content="Verified master census of 14,921+ Police Stations, 54,606+ Colleges, 25,536+ Schools, and 475 Bus/Lorry Transport Fleets across all 28 States & UTs of India with interactive live GIS map and 14-model Nunes Breath Analyser solutions."'
)

# 2. Update navigation tab badges
content = content.replace('<span class="tab-badge" id="badgePoliceCount">415</span>', '<span class="tab-badge" id="badgePoliceCount">14,921</span>')
content = content.replace('<span class="tab-badge" id="badgeCollegesCount">1,654</span>', '<span class="tab-badge" id="badgeCollegesCount">54,606</span>')
content = content.replace('<span class="tab-badge" id="badgeSchoolsCount">26</span>', '<span class="tab-badge" id="badgeSchoolsCount">25,536</span>')
content = content.replace('<span class="tab-badge" id="badgeTransportCount">22</span>', '<span class="tab-badge" id="badgeTransportCount">475</span>')

# 3. Update KPI values
content = content.replace('<div class="kpi-val" id="kpiPoliceCount">415</div>', '<div class="kpi-val" id="kpiPoliceCount">14,921</div>')
content = content.replace('<div class="kpi-val" id="kpiCollegesCount">1,654</div>', '<div class="kpi-val" id="kpiCollegesCount">54,606</div>')
content = content.replace('<div class="kpi-val" id="kpiSchoolsCount">26</div>', '<div class="kpi-val" id="kpiSchoolsCount">25,536</div>')
content = content.replace('<div class="kpi-val" id="kpiTransportCount">22</div>', '<div class="kpi-val" id="kpiTransportCount">475</div>')

# 4. Update map layer toggle buttons
old_map_buttons = """            <button class="layer-toggle-btn active police" id="togglePoliceLayerBtn" onclick="toggleMapLayer('police')">
              <span>🛡️</span> <span>Police (415)</span>
            </button>
            <button class="layer-toggle-btn active college" id="toggleCollegeLayerBtn" onclick="toggleMapLayer('colleges')">
              <span>🎓</span> <span>Colleges (1.6k)</span>
            </button>
            <button class="layer-toggle-btn active school" id="toggleSchoolLayerBtn" onclick="toggleMapLayer('schools')">
              <span>🏫</span> <span>Schools (26)</span>
            </button>
            <button class="layer-toggle-btn active transport" id="toggleTransportLayerBtn" onclick="toggleMapLayer('transport')">
              <span>🚚</span> <span>Bus & Lorry Hubs (22)</span>
            </button>"""

new_map_buttons = """            <button class="layer-toggle-btn active police" id="togglePoliceLayerBtn" onclick="toggleMapLayer('police')">
              <span>🛡️</span> <span id="mapBtnPolice">Police (14,921)</span>
            </button>
            <button class="layer-toggle-btn active college" id="toggleCollegeLayerBtn" onclick="toggleMapLayer('colleges')">
              <span>🎓</span> <span id="mapBtnColleges">Colleges (54,606)</span>
            </button>
            <button class="layer-toggle-btn active school" id="toggleSchoolLayerBtn" onclick="toggleMapLayer('schools')">
              <span>🏫</span> <span id="mapBtnSchools">Schools (25,536)</span>
            </button>
            <button class="layer-toggle-btn active transport" id="toggleTransportLayerBtn" onclick="toggleMapLayer('transport')">
              <span>🚚</span> <span id="mapBtnTransport">Bus & Lorry Hubs (475)</span>
            </button>"""

if old_map_buttons in content:
    content = content.replace(old_map_buttons, new_map_buttons)
    print("Replaced map buttons successfully")
else:
    print("WARNING: old_map_buttons not found directly, trying regex")
    content = re.sub(
        r'<button class="layer-toggle-btn active police" id="togglePoliceLayerBtn".*?<span>Police \(415\)</span>\s*</button>\s*'
        r'<button class="layer-toggle-btn active college" id="toggleCollegeLayerBtn".*?<span>Colleges \(1\.6k\)</span>\s*</button>\s*'
        r'<button class="layer-toggle-btn active school" id="toggleSchoolLayerBtn".*?<span>Schools \(26\)</span>\s*</button>\s*'
        r'<button class="layer-toggle-btn active transport" id="toggleTransportLayerBtn".*?<span>Bus & Lorry Hubs \(22\)</span>\s*</button>',
        new_map_buttons,
        content,
        flags=re.DOTALL
    )

# 5. Map setView([10.5, 77.5], 7) -> setView([22.5, 79.0], 5)
content = content.replace(
    '}).setView([10.5, 77.5], 7); // Center of South India (Tamil Nadu & Kerala)',
    '}).setView([22.5, 79.0], 5); // Center of India (Pan-India 28 States & UTs)'
)

# 6. loadAllDatasets() formatting
old_load_counts = """      // Update Top KPIs
      document.getElementById('kpiPoliceCount').textContent = policeStations.length;
      document.getElementById('badgePoliceCount').textContent = policeStations.length;
      document.getElementById('kpiCollegesCount').textContent = colleges.length;
      document.getElementById('badgeCollegesCount').textContent = colleges.length;
      document.getElementById('kpiSchoolsCount').textContent = schools.length;
      document.getElementById('badgeSchoolsCount').textContent = schools.length;
      document.getElementById('kpiTransportCount').textContent = transportFleets.length;
      document.getElementById('badgeTransportCount').textContent = transportFleets.length;"""

new_load_counts = """      // Update Top KPIs
      document.getElementById('kpiPoliceCount').textContent = policeStations.length.toLocaleString();
      document.getElementById('badgePoliceCount').textContent = policeStations.length.toLocaleString();
      document.getElementById('kpiCollegesCount').textContent = colleges.length.toLocaleString();
      document.getElementById('badgeCollegesCount').textContent = colleges.length.toLocaleString();
      document.getElementById('kpiSchoolsCount').textContent = schools.length.toLocaleString();
      document.getElementById('badgeSchoolsCount').textContent = schools.length.toLocaleString();
      document.getElementById('kpiTransportCount').textContent = transportFleets.length.toLocaleString();
      document.getElementById('badgeTransportCount').textContent = transportFleets.length.toLocaleString();"""

content = content.replace(old_load_counts, new_load_counts)

# 7. resetFilters() flyTo
content = content.replace(
    "map.flyTo([10.5, 77.5], 7, { duration: 1.0 });",
    "map.flyTo([22.5, 79.0], 5, { duration: 1.0 });"
)

# 8. fitMapBounds()
old_fit_bounds = """  function fitMapBounds() {
    map.flyTo([10.5, 77.5], 7, { duration: 1.0 });
  }"""

new_fit_bounds = """  function fitMapBounds() {
    const stateVal = document.getElementById('stateFilter') ? document.getElementById('stateFilter').value : 'ALL';
    if (stateVal !== 'ALL') {
      handleStateChange();
    } else {
      map.flyTo([22.5, 79.0], 5, { duration: 1.0 });
    }
  }"""

content = content.replace(old_fit_bounds, new_fit_bounds)

# 9. Insert getDistributedSample before renderMapMarkers and update renderMapMarkers
old_render_markers = """  // 6. RENDER MAP MARKERS (4 LAYERS)
  function renderMapMarkers() {
    if (!map) return;
    policeLayerGroup.clearLayers();
    collegeLayerGroup.clearLayers();
    schoolLayerGroup.clearLayers();
    transportLayerGroup.clearLayers();

    let visibleMarkers = 0;

    // 1. Police Markers
    if (showPoliceLayer) {
      const policeSubset = currentFilteredPolice.slice(0, 300);"""

new_render_markers = """  // HELPER: Pan-India Balanced Geospatial Sampling (Ensures all 28 states & UTs are represented)
  function getDistributedSample(items, maxCount) {
    if (!items || items.length === 0) return [];
    const valid = items.filter(it => it.lat && it.lng);
    if (valid.length <= maxCount) return valid;

    const stateFilterEl = document.getElementById('stateFilter');
    const stateVal = stateFilterEl ? stateFilterEl.value : 'ALL';

    // If filtered by a specific state, sample evenly within that state
    if (stateVal !== 'ALL') {
      const step = Math.max(1, Math.floor(valid.length / maxCount));
      const sample = [];
      for (let i = 0; i < valid.length && sample.length < maxCount; i += step) {
        sample.push(valid[i]);
      }
      return sample;
    }

    // ALL INDIA: Group by state so EVERY state gets representation
    const byState = {};
    valid.forEach(it => {
      const st = it.state || 'Other';
      if (!byState[st]) byState[st] = [];
      byState[st].push(it);
    });

    const states = Object.keys(byState);
    if (states.length === 0) return [];

    const perStateQuota = Math.max(2, Math.floor(maxCount / states.length));
    const sample = [];

    // Pass 1: Take up to perStateQuota from each state
    states.forEach(st => {
      const list = byState[st];
      const take = Math.min(list.length, perStateQuota);
      const step = Math.max(1, Math.floor(list.length / take));
      for (let i = 0; i < list.length && i < take * step; i += step) {
        sample.push(list[i]);
      }
    });

    // Pass 2: Fill remaining if under maxCount
    if (sample.length < maxCount) {
      const remainingNeeded = maxCount - sample.length;
      const sampleSet = new Set(sample);
      const remainingItems = valid.filter(it => !sampleSet.has(it));
      if (remainingItems.length > 0) {
        const fillStep = Math.max(1, Math.floor(remainingItems.length / remainingNeeded));
        for (let i = 0; i < remainingItems.length && sample.length < maxCount; i += fillStep) {
          sample.push(remainingItems[i]);
        }
      }
    }

    return sample;
  }

  // 6. RENDER MAP MARKERS (4 LAYERS)
  function renderMapMarkers() {
    if (!map) return;
    policeLayerGroup.clearLayers();
    collegeLayerGroup.clearLayers();
    schoolLayerGroup.clearLayers();
    transportLayerGroup.clearLayers();

    // Update layer button counts dynamically
    const elP = document.getElementById('mapBtnPolice');
    const elC = document.getElementById('mapBtnColleges');
    const elS = document.getElementById('mapBtnSchools');
    const elT = document.getElementById('mapBtnTransport');
    if (elP) elP.textContent = `Police (${currentFilteredPolice.length.toLocaleString()})`;
    if (elC) elC.textContent = `Colleges (${currentFilteredColleges.length.toLocaleString()})`;
    if (elS) elS.textContent = `Schools (${currentFilteredSchools.length.toLocaleString()})`;
    if (elT) elT.textContent = `Bus & Lorry Hubs (${currentFilteredTransport.length.toLocaleString()})`;

    let visibleMarkers = 0;

    // 1. Police Markers (Pan-India balanced sample)
    if (showPoliceLayer) {
      const policeSubset = getDistributedSample(currentFilteredPolice, 220);"""

content = content.replace(old_render_markers, new_render_markers)

# Update college, school, transport subsets in renderMapMarkers
content = content.replace(
    "const collegeSubset = currentFilteredColleges.slice(0, 300);",
    "const collegeSubset = getDistributedSample(currentFilteredColleges, 220);"
)
content = content.replace(
    "const schoolSubset = currentFilteredSchools.slice(0, 300);",
    "const schoolSubset = getDistributedSample(currentFilteredSchools, 180);"
)
content = content.replace(
    "const transportSubset = currentFilteredTransport.slice(0, 300);",
    "const transportSubset = getDistributedSample(currentFilteredTransport, 150);"
)

# Update mapVisibleCount text
old_vis_text = "document.getElementById('mapVisibleCount').textContent = `${visibleMarkers} Live Geospatial Pins Active`;"
new_vis_text = "document.getElementById('mapVisibleCount').textContent = `${visibleMarkers} Live Geospatial Pins Active (Filtered from ${(currentFilteredPolice.length + currentFilteredColleges.length + currentFilteredSchools.length + currentFilteredTransport.length).toLocaleString()} Total)`;"
content = content.replace(old_vis_text, new_vis_text)

# 10. Card list formatting with .toLocaleString() and slicing for schools & transport
content = content.replace(
    "document.getElementById('policeFilteredCount').textContent = currentFilteredPolice.length;",
    "document.getElementById('policeFilteredCount').textContent = currentFilteredPolice.length.toLocaleString();"
)
content = content.replace(
    "document.getElementById('collegesFilteredCount').textContent = currentFilteredColleges.length;",
    "document.getElementById('collegesFilteredCount').textContent = currentFilteredColleges.length.toLocaleString();"
)

old_sch_render = """    const grid = document.getElementById('schoolsCardsGrid');
    document.getElementById('schoolsFilteredCount').textContent = currentFilteredSchools.length;
    grid.innerHTML = '';

    currentFilteredSchools.forEach(s => {"""

new_sch_render = """    const grid = document.getElementById('schoolsCardsGrid');
    document.getElementById('schoolsFilteredCount').textContent = currentFilteredSchools.length.toLocaleString();
    grid.innerHTML = '';

    const displayList = currentFilteredSchools.slice(0, 90);
    displayList.forEach(s => {"""

content = content.replace(old_sch_render, new_sch_render)

old_tr_render = """    const grid = document.getElementById('transportCardsGrid');
    document.getElementById('transportFilteredCount').textContent = currentFilteredTransport.length;
    grid.innerHTML = '';

    currentFilteredTransport.forEach(t => {"""

new_tr_render = """    const grid = document.getElementById('transportCardsGrid');
    document.getElementById('transportFilteredCount').textContent = currentFilteredTransport.length.toLocaleString();
    grid.innerHTML = '';

    const displayList = currentFilteredTransport.slice(0, 90);
    displayList.forEach(t => {"""

content = content.replace(old_tr_render, new_tr_render)

with open(html_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated public/index.html successfully!")
