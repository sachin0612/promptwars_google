// ==========================================
// FARMER DECISION ENGINE — Unit Tests
// ==========================================

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    tests.push({ name, status: 'pass' });
    passed++;
  } catch (error) {
    tests.push({ name, status: 'fail', error: error.message });
    failed++;
  }
}

function assertStrictEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected} but got ${actual}`);
  }
}

function assertDefined(actual, message) {
  if (actual === undefined || actual === null) {
    throw new Error(message || `Value should be defined, got ${actual}`);
  }
}

// ---- RUN TEST CASES ----

// 1. Data Layer Tests
test('Data Layer: Indian States loaded', () => {
  assertDefined(window.FarmData.INDIAN_STATES, "States not found");
  assertStrictEqual(window.FarmData.INDIAN_STATES.includes('Punjab'), true, "Punjab should be in states list");
});

test('Data Layer: Schemes loaded properly', () => {
  assertDefined(window.FarmData.SCHEMES_DATABASE, "Schemes not found");
  assertStrictEqual(window.FarmData.SCHEMES_DATABASE.length > 0, true, "Schemes list is empty");
});

// 2. Tools Tests
test('Tools: getMSPPrice for Wheat Rabi', () => {
  const result = window.FarmTools.getMSPPrice({ crop: 'wheat', season: 'rabi' });
  assertDefined(result.msp, "MSP not returned");
  assertStrictEqual(result.crop, 'Wheat', "Crop name mismatch");
});

test('Tools: getCropAdvisory for Cotton', () => {
  const result = window.FarmTools.getCropAdvisory({ crop: 'cotton', state: 'Gujarat', season: 'kharif' });
  assertDefined(result.sowingWindow, "Sowing window missing");
  assertStrictEqual(result.crop, 'Cotton', "Crop name mismatch");
});

test('Tools: getSoilData for Maharashtra', () => {
  const result = window.FarmTools.getSoilData({ state: 'Maharashtra' });
  assertDefined(result.ph, "pH range missing");
  assertStrictEqual(result.state, 'Maharashtra', "State mismatch");
});

test('Tools: getSchemeEligibility for small farmer', () => {
  const result = window.FarmTools.getSchemeEligibility({ landSize: 2, state: 'UP', crop: 'Paddy', farmerType: 'individual' });
  assertDefined(result.eligibleSchemes, "Eligible schemes missing");
  const pmKisan = result.eligibleSchemes.find(s => s.id === 'pm_kisan');
  assertDefined(pmKisan, "PM-KISAN should be eligible for 2 acres");
});

test('Tools: getSchemeEligibility institutional bypass', () => {
  const result = window.FarmTools.getSchemeEligibility({ landSize: 200, state: 'Punjab', farmerType: 'institutional' });
  const pmKisan = result.eligibleSchemes.find(s => s.id === 'pm_kisan');
  assertStrictEqual(pmKisan, undefined, "Institutional shouldn't get PM KISAN");
});


// ---- RENDER RESULTS ----
function renderResults() {
  const container = document.getElementById('results');
  const summary = document.getElementById('summary');

  tests.forEach(t => {
    const el = document.createElement('div');
    el.className = `test-case ${t.status === 'fail' ? 'failed' : ''}`;
    el.innerHTML = `<strong>${t.name}</strong>: <span class="${t.status}">${t.status.toUpperCase()}</span>`;
    if (t.error) {
      el.innerHTML += `<div style="color:red; font-size: 0.9em;">↳ ${t.error}</div>`;
    }
    container.appendChild(el);
  });

  summary.innerHTML = `<span class="pass">${passed} passed</span>, <span class="fail">${failed} failed</span>`;
  if(failed === 0) summary.innerHTML += " 🎉 All systems go for Hackathon!";
}

window.onload = renderResults;
