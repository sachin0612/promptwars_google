// ============================================================
// FARMER DECISION ENGINE — Embedded Knowledge Databases
// Real 2025-26 MSP prices, Government schemes, Crop science,
// Soil data, and simulated Mandi prices for Indian agriculture.
// ============================================================

// ---- MSP PRICES (2025-26 Marketing Season) ----
const MSP_DATABASE = {
  kharif: {
    paddy_common:   { crop: "Paddy (Common)", msp: 2369, unit: "₹/quintal", season: "Kharif 2025-26" },
    paddy_grade_a:  { crop: "Paddy (Grade A)", msp: 2409, unit: "₹/quintal", season: "Kharif 2025-26" },
    jowar_hybrid:   { crop: "Jowar (Hybrid)", msp: 3371, unit: "₹/quintal", season: "Kharif 2025-26" },
    jowar_maldandi: { crop: "Jowar (Maldandi)", msp: 3421, unit: "₹/quintal", season: "Kharif 2025-26" },
    bajra:          { crop: "Bajra", msp: 2625, unit: "₹/quintal", season: "Kharif 2025-26" },
    ragi:           { crop: "Ragi", msp: 4290, unit: "₹/quintal", season: "Kharif 2025-26" },
    maize:          { crop: "Maize", msp: 2225, unit: "₹/quintal", season: "Kharif 2025-26" },
    tur:            { crop: "Tur (Arhar)", msp: 7550, unit: "₹/quintal", season: "Kharif 2025-26" },
    moong:          { crop: "Moong", msp: 8682, unit: "₹/quintal", season: "Kharif 2025-26" },
    urad:           { crop: "Urad", msp: 7400, unit: "₹/quintal", season: "Kharif 2025-26" },
    groundnut:      { crop: "Groundnut", msp: 6783, unit: "₹/quintal", season: "Kharif 2025-26" },
    sunflower:      { crop: "Sunflower Seed", msp: 7280, unit: "₹/quintal", season: "Kharif 2025-26" },
    soybean_yellow: { crop: "Soybean (Yellow)", msp: 4892, unit: "₹/quintal", season: "Kharif 2025-26" },
    sesame:         { crop: "Sesamum", msp: 9267, unit: "₹/quintal", season: "Kharif 2025-26" },
    nigerseed:      { crop: "Nigerseed", msp: 8717, unit: "₹/quintal", season: "Kharif 2025-26" },
    cotton_medium:  { crop: "Cotton (Medium Staple)", msp: 7710, unit: "₹/quintal", season: "Kharif 2025-26" },
    cotton_long:    { crop: "Cotton (Long Staple)", msp: 8110, unit: "₹/quintal", season: "Kharif 2025-26" },
  },
  rabi: {
    wheat:          { crop: "Wheat", msp: 2425, unit: "₹/quintal", season: "Rabi 2025-26" },
    barley:         { crop: "Barley", msp: 1980, unit: "₹/quintal", season: "Rabi 2025-26" },
    gram:           { crop: "Gram (Chana)", msp: 5650, unit: "₹/quintal", season: "Rabi 2025-26" },
    masoor:         { crop: "Masoor (Lentil)", msp: 6425, unit: "₹/quintal", season: "Rabi 2025-26" },
    rapeseed:       { crop: "Rapeseed & Mustard", msp: 5950, unit: "₹/quintal", season: "Rabi 2025-26" },
    safflower:      { crop: "Safflower", msp: 5940, unit: "₹/quintal", season: "Rabi 2025-26" },
  }
};

// ---- SIMULATED MANDI PRICES (vary around MSP) ----
function getMandiPrice(cropKey, season) {
  const db = MSP_DATABASE[season];
  if (!db || !db[cropKey]) return null;
  const msp = db[cropKey].msp;
  // Simulate mandi price: -8% to +15% of MSP
  const variance = (Math.random() * 0.23 - 0.08);
  const mandiPrice = Math.round(msp * (1 + variance));
  return {
    ...db[cropKey],
    mandiPrice,
    mandiVsMsp: mandiPrice > msp ? "above" : "below",
    difference: Math.abs(mandiPrice - msp),
    recommendation: mandiPrice > msp * 1.05
      ? "Sell at mandi — price is significantly above MSP"
      : mandiPrice < msp
        ? "Sell at MSP procurement center — mandi price is below MSP"
        : "Either option is fine — prices are close to MSP"
  };
}

// ---- GOVERNMENT SCHEMES DATABASE ----
const SCHEMES_DATABASE = [
  {
    id: "pm_kisan",
    name: "PM-KISAN",
    fullName: "Pradhan Mantri Kisan Samman Nidhi",
    benefit: "₹6,000/year (3 installments of ₹2,000)",
    eligibility: "All landholding farmer families",
    exclusions: "Income tax payers, government employees, institutional landholders",
    howToApply: "Visit pmkisan.gov.in or nearest CSC center with Aadhaar & land records",
    status: "Active — 22nd installment disbursed (March 2026)",
    website: "https://pmkisan.gov.in"
  },
  {
    id: "pmfby",
    name: "PMFBY",
    fullName: "Pradhan Mantri Fasal Bima Yojana",
    benefit: "Crop insurance against natural calamities, pests & diseases",
    premium: "Kharif: 2% | Rabi: 1.5% | Commercial/Horticulture: 5%",
    eligibility: "All farmers (loanee farmers auto-enrolled, non-loanee voluntary)",
    newUpdates: "Now covers wild animal attacks; paddy inundation added as localized calamity",
    claimProcess: "Report crop loss within 72 hours via Crop Insurance App with geo-tagged photos",
    website: "https://pmfby.gov.in"
  },
  {
    id: "enam",
    name: "e-NAM",
    fullName: "National Agriculture Market",
    benefit: "Sell produce online across state borders; transparent price discovery",
    eligibility: "All farmers with produce to sell; 240+ commodities supported",
    howToUse: "Register at enam.gov.in; link bank account; find nearest e-NAM mandi",
    update: "e-NAM 2.0 upgrade underway with logistics integration",
    website: "https://enam.gov.in"
  },
  {
    id: "kcc",
    name: "KCC",
    fullName: "Kisan Credit Card",
    benefit: "Credit up to ₹5,00,000 at 4% interest (with subvention)",
    eligibility: "All farmers, fishermen, animal husbandry farmers",
    howToApply: "Apply at any bank branch with land records, Aadhaar, and passport photo",
    update: "Loan limit raised from ₹3L to ₹5L under Modified Interest Subvention Scheme",
    website: "Contact nearest bank branch"
  },
  {
    id: "pm_dhan_dhaanya",
    name: "PM Dhan-Dhaanya Krishi Yojana",
    fullName: "PM Dhan-Dhaanya Krishi Yojana",
    benefit: "Targeted support for 100 low-productivity districts — irrigation, storage, credit",
    eligibility: "Farmers in identified low-productivity districts",
    status: "Launched in Budget 2025-26",
    website: "Contact District Agriculture Office"
  },
  {
    id: "soil_health_card",
    name: "Soil Health Card Scheme",
    fullName: "Soil Health Card Scheme",
    benefit: "Free soil testing and nutrient recommendation for each farm",
    eligibility: "All farmers",
    howToApply: "Contact nearest Krishi Vigyan Kendra (KVK) or Agriculture Dept",
    website: "https://soilhealth.dac.gov.in"
  }
];

// ---- CROP KNOWLEDGE DATABASE ----
const CROP_DATABASE = {
  wheat: {
    name: "Wheat",
    season: "Rabi",
    sowingWindow: "October end — December (ideal: November)",
    harvestWindow: "March — April",
    temperature: { ideal: "20-25°C (sowing), 14-18°C (growth)", max: 35, min: 5 },
    waterRequirement: "4-5 irrigations (Crown root, Tillering, Late jointing, Flowering, Milking)",
    soilType: "Well-drained loamy or clay-loam soil, pH 6.0-7.5",
    seedRate: "100-125 kg/ha",
    expectedYield: "40-50 quintals/ha (irrigated), 15-25 (rainfed)",
    majorPests: ["Aphids", "Termites", "Brown rust", "Yellow rust", "Karnal bunt", "Loose smut"],
    pestSolutions: {
      "Aphids": "Spray Imidacloprid 17.8 SL @ 0.5ml/L or Dimethoate 30 EC @ 1.5ml/L",
      "Termites": "Soil treatment with Chlorpyriphos 20 EC @ 5L/ha before sowing",
      "Yellow rust": "Spray Propiconazole 25 EC @ 1ml/L at first sight of pustules",
      "Karnal bunt": "Seed treatment with Vitavax @ 2.5g/kg seed"
    },
    states: ["Punjab", "Haryana", "Uttar Pradesh", "Madhya Pradesh", "Rajasthan", "Bihar", "Gujarat"]
  },
  paddy: {
    name: "Paddy (Rice)",
    season: "Kharif",
    sowingWindow: "June — July (nursery), Transplanting: July — August",
    harvestWindow: "October — November",
    temperature: { ideal: "25-30°C", max: 40, min: 15 },
    waterRequirement: "Continuous flooding (5-7cm) until 2 weeks before harvest; 1200-1400mm total",
    soilType: "Clayey or clay-loam soil with good water retention, pH 5.5-6.5",
    seedRate: "20-25 kg/ha (transplanted), 80-100 kg/ha (direct seeded)",
    expectedYield: "50-70 quintals/ha (irrigated), 20-35 (rainfed)",
    majorPests: ["Stem borer", "Brown plant hopper", "Leaf folder", "Blast", "Bacterial leaf blight", "Sheath blight"],
    pestSolutions: {
      "Stem borer": "Apply Cartap hydrochloride 4G @ 25 kg/ha or spray Chlorantraniliprole 18.5 SC @ 0.3ml/L",
      "Brown plant hopper": "Spray Pymetrozine 50 WG @ 0.6g/L; avoid excess nitrogen",
      "Blast": "Spray Tricyclazole 75 WP @ 0.6g/L; use resistant varieties",
      "Bacterial leaf blight": "No effective chemical control; use resistant varieties and balanced fertilization"
    },
    states: ["West Bengal", "Uttar Pradesh", "Punjab", "Andhra Pradesh", "Tamil Nadu", "Bihar", "Assam", "Odisha"]
  },
  cotton: {
    name: "Cotton",
    season: "Kharif",
    sowingWindow: "April — May (irrigated), June — July (rainfed)",
    harvestWindow: "October — January (multiple pickings)",
    temperature: { ideal: "25-35°C", max: 42, min: 15 },
    waterRequirement: "6-8 irrigations; 700-1200mm total; drip irrigation recommended",
    soilType: "Black cotton soil (vertisol) or deep alluvial; pH 6.0-8.0",
    seedRate: "2-2.5 kg/ha (Bt hybrid), spacing 90×60 cm",
    expectedYield: "20-25 quintals/ha (lint)",
    majorPests: ["Bollworm (Pink & American)", "Whitefly", "Jassids", "Thrips", "Leaf curl virus"],
    pestSolutions: {
      "Pink bollworm": "Pheromone traps (5/acre); spray Profenofos 50 EC @ 2ml/L at ETL",
      "Whitefly": "Spray Diafenthiuron 50 WP @ 1.2g/L; avoid synthetic pyrethroids",
      "Jassids": "Spray Flonicamid 50 WG @ 0.3g/L or neem oil 5ml/L",
      "Leaf curl virus": "Control whitefly vector; remove infected plants"
    },
    states: ["Gujarat", "Maharashtra", "Telangana", "Andhra Pradesh", "Rajasthan", "Madhya Pradesh", "Haryana", "Punjab", "Karnataka"]
  },
  sugarcane: {
    name: "Sugarcane",
    season: "Kharif/Annual",
    sowingWindow: "October — March (autumn: Oct, spring: Feb-Mar)",
    harvestWindow: "November — April (12-14 months after planting)",
    temperature: { ideal: "25-32°C", max: 45, min: 10 },
    waterRequirement: "25-30 irrigations; 1500-2500mm total; most critical at tillering",
    soilType: "Deep, well-drained loam or clay-loam, pH 6.5-7.5",
    seedRate: "40,000-45,000 three-budded setts/ha",
    expectedYield: "700-1000 quintals/ha",
    majorPests: ["Early shoot borer", "Top borer", "Pyrilla", "Red rot", "Smut", "Wilt"],
    pestSolutions: {
      "Early shoot borer": "Release Trichogramma chilonis @ 50,000/ha at 30 & 45 days",
      "Top borer": "Remove affected shoots; spray Coragen @ 0.4ml/L",
      "Red rot": "Use resistant varieties; hot water treatment of setts at 52°C for 30 min",
      "Pyrilla": "Conserve natural enemy Epiricania melanoleuca; spray Acephate 75 SP @ 1g/L if severe"
    },
    states: ["Uttar Pradesh", "Maharashtra", "Karnataka", "Tamil Nadu", "Bihar", "Gujarat", "Andhra Pradesh", "Punjab", "Haryana"]
  },
  soybean: {
    name: "Soybean",
    season: "Kharif",
    sowingWindow: "June (with onset of monsoon) — July first week",
    harvestWindow: "September — October",
    temperature: { ideal: "25-30°C", max: 38, min: 15 },
    waterRequirement: "Mostly rainfed; 1-2 irrigations if dry spells; 450-650mm total",
    soilType: "Well-drained clay-loam or medium black soil, pH 6.0-7.5",
    seedRate: "60-80 kg/ha; spacing 30-45 cm rows",
    expectedYield: "15-25 quintals/ha",
    majorPests: ["Stem fly", "Girdle beetle", "Tobacco caterpillar", "Yellow mosaic virus", "Rust", "Charcoal rot"],
    pestSolutions: {
      "Stem fly": "Seed treatment with Thiamethoxam 30 FS @ 10ml/kg; early sowing helps",
      "Girdle beetle": "Spray Profenofos 50 EC @ 2ml/L at pod formation",
      "Tobacco caterpillar": "Pheromone traps; spray Nomuraea rileyi or Chlorantraniliprole",
      "Yellow mosaic virus": "Grow resistant varieties (e.g., JS 335, JS 9560); control whitefly"
    },
    states: ["Madhya Pradesh", "Maharashtra", "Rajasthan", "Karnataka", "Telangana"]
  },
  mustard: {
    name: "Mustard / Rapeseed",
    season: "Rabi",
    sowingWindow: "October — November (ideal: mid-October in North India)",
    harvestWindow: "February — March",
    temperature: { ideal: "15-25°C", max: 32, min: 5 },
    waterRequirement: "2-3 irrigations (pre-flowering, pod formation); 250-400mm total",
    soilType: "Sandy loam to clay loam, well-drained, pH 6.0-7.5",
    seedRate: "3-5 kg/ha; spacing 30-45 cm rows",
    expectedYield: "15-20 quintals/ha (irrigated), 8-12 (rainfed)",
    majorPests: ["Aphids (mustard aphid)", "Painted bug", "Alternaria blight", "White rust", "Sclerotinia rot"],
    pestSolutions: {
      "Aphids": "Spray Dimethoate 30 EC @ 1ml/L or use yellow sticky traps; neem oil 5ml/L",
      "Alternaria blight": "Spray Mancozeb 75 WP @ 2.5g/L at first symptoms; repeat after 15 days",
      "White rust": "Spray Metalaxyl + Mancozeb 72 WP @ 2.5g/L",
      "Painted bug": "Dust with Malathion 5% WP @ 25 kg/ha in morning"
    },
    states: ["Rajasthan", "Madhya Pradesh", "Uttar Pradesh", "Haryana", "Gujarat", "West Bengal"]
  },
  gram: {
    name: "Gram (Chana / Chickpea)",
    season: "Rabi",
    sowingWindow: "October — November",
    harvestWindow: "February — March",
    temperature: { ideal: "15-25°C", max: 33, min: 5 },
    waterRequirement: "1-2 light irrigations (pre-flowering, pod filling); mostly rainfed",
    soilType: "Well-drained sandy loam or loam, pH 6.0-8.0",
    seedRate: "Desi: 60-80 kg/ha, Kabuli: 100-120 kg/ha",
    expectedYield: "15-20 quintals/ha (irrigated), 8-12 (rainfed)",
    majorPests: ["Pod borer (Helicoverpa)", "Cutworm", "Wilt (Fusarium)", "Ascochyta blight", "Dry root rot"],
    pestSolutions: {
      "Pod borer": "Pheromone traps + NPV spray; Emamectin benzoate 5 SG @ 0.4g/L at 50% flowering",
      "Wilt (Fusarium)": "Seed treatment with Trichoderma viride @ 5g/kg; use wilt-resistant varieties",
      "Ascochyta blight": "Spray Mancozeb 75 WP @ 2.5g/L; avoid excess irrigation",
      "Cutworm": "Soil drenching with Chlorpyriphos 20 EC @ 5ml/L"
    },
    states: ["Madhya Pradesh", "Rajasthan", "Maharashtra", "Uttar Pradesh", "Karnataka", "Andhra Pradesh"]
  },
  maize: {
    name: "Maize (Corn)",
    season: "Kharif",
    sowingWindow: "June — July (Kharif), Oct-Nov (Rabi in South)",
    harvestWindow: "September — October",
    temperature: { ideal: "25-32°C", max: 40, min: 12 },
    waterRequirement: "4-6 irrigations; critical at knee-high, tasseling, and grain filling; 500-800mm total",
    soilType: "Well-drained sandy loam to loam, pH 5.5-7.5",
    seedRate: "20-25 kg/ha (hybrid); spacing 60×20 cm",
    expectedYield: "50-80 quintals/ha (hybrid irrigated)",
    majorPests: ["Fall armyworm", "Stem borer", "Shoot fly", "Turcicum leaf blight", "Maydis leaf blight"],
    pestSolutions: {
      "Fall armyworm": "Spray Emamectin benzoate 5 SG @ 0.4g/L or Spinetoram 11.7 SC; apply in whorl",
      "Stem borer": "Release Trichogramma chilonis 1.5 lakh/ha; spray Chlorantraniliprole on whorl",
      "Turcicum leaf blight": "Spray Mancozeb 75 WP @ 2.5g/L; use resistant hybrids"
    },
    states: ["Karnataka", "Madhya Pradesh", "Bihar", "Tamil Nadu", "Rajasthan", "Andhra Pradesh", "Uttar Pradesh"]
  },
  onion: {
    name: "Onion",
    season: "Rabi/Kharif",
    sowingWindow: "Rabi: Oct-Nov (transplant Dec-Jan), Kharif: May-Jun (transplant Jul-Aug)",
    harvestWindow: "Rabi: April-May, Kharif: Oct-Nov",
    temperature: { ideal: "15-25°C", max: 35, min: 10 },
    waterRequirement: "10-12 irrigations; stop 10 days before harvest; 350-550mm total",
    soilType: "Well-drained sandy loam to loam, pH 6.0-7.0; rich in organic matter",
    seedRate: "8-10 kg/ha (nursery); 2.5 lakh seedlings/ha (transplanting)",
    expectedYield: "200-300 quintals/ha",
    majorPests: ["Thrips", "Purple blotch", "Stemphylium blight", "Downy mildew", "Basal rot"],
    pestSolutions: {
      "Thrips": "Spray Fipronil 5 SC @ 1.5ml/L or Spinetoram 11.7 SC for resistant populations",
      "Purple blotch": "Spray Mancozeb 75 WP @ 2.5g/L alternated with Tebuconazole + Trifloxystrobin",
      "Downy mildew": "Spray Metalaxyl + Mancozeb 72 WP @ 2.5g/L preventively",
      "Basal rot": "Dip seedling roots in Carbendazim 2g/L for 30 min before transplanting"
    },
    states: ["Maharashtra", "Karnataka", "Madhya Pradesh", "Gujarat", "Bihar", "Rajasthan", "Andhra Pradesh"]
  },
  tomato: {
    name: "Tomato",
    season: "Rabi/Kharif",
    sowingWindow: "Winter: Sep-Oct (transplant Oct-Nov), Summer: Jan-Feb, Kharif: Jun-Jul",
    harvestWindow: "60-80 days after transplanting; multiple pickings",
    temperature: { ideal: "20-27°C", max: 38, min: 10 },
    waterRequirement: "Drip irrigation recommended; 8-10 irrigations; 400-600mm total",
    soilType: "Well-drained sandy loam to loam, rich in organic matter, pH 6.0-7.0",
    seedRate: "200-250g/ha (nursery); 18,000-20,000 plants/ha",
    expectedYield: "400-600 quintals/ha (hybrid)",
    majorPests: ["Tuta absoluta (leaf miner)", "Fruit borer (Helicoverpa)", "Whitefly", "Early blight", "Late blight", "Leaf curl virus"],
    pestSolutions: {
      "Tuta absoluta": "Pheromone traps; spray Chlorantraniliprole 18.5 SC @ 0.3ml/L; water traps with light",
      "Fruit borer": "Spray Emamectin benzoate 5 SG @ 0.4g/L; use pheromone traps 5/acre",
      "Early blight": "Spray Mancozeb 75 WP @ 2.5g/L or Azoxystrobin 23 SC @ 1ml/L",
      "Leaf curl virus": "Control whitefly; rogue out infected plants; use resistant varieties (Arka Rakshak)"
    },
    states: ["Andhra Pradesh", "Karnataka", "Madhya Pradesh", "Odisha", "West Bengal", "Bihar", "Maharashtra", "Gujarat"]
  }
};

// ---- SOIL DATABASE (State/Region → Soil type → Suitable crops) ----
const SOIL_DATABASE = {
  "Punjab":           { soilType: "Alluvial (sandy loam to clay loam)", ph: "7.0-8.5", nutrientStatus: "Rich in potash, medium nitrogen, low phosphorus", suitableCrops: ["Wheat", "Paddy", "Cotton", "Sugarcane", "Maize"], waterTable: "High (2-5m)", recommendation: "Avoid over-irrigation; diversify from paddy-wheat; add phosphatic fertilizers" },
  "Haryana":          { soilType: "Alluvial / Sandy loam", ph: "7.5-8.5", nutrientStatus: "Medium fertility, saline patches in south", suitableCrops: ["Wheat", "Paddy", "Mustard", "Cotton", "Bajra"], waterTable: "Variable (3-15m)", recommendation: "Manage salinity with gypsum; adopt micro-irrigation; grow bajra/mustard in sandy areas" },
  "Uttar Pradesh":    { soilType: "Alluvial (Gangetic plains)", ph: "6.5-8.0", nutrientStatus: "Fertile, good organic matter", suitableCrops: ["Wheat", "Paddy", "Sugarcane", "Mustard", "Potato"], waterTable: "Moderate (5-10m)", recommendation: "Balanced NPK application; green manuring between seasons; avoid monocropping" },
  "Madhya Pradesh":   { soilType: "Black cotton soil (Vertisol) / Mixed", ph: "7.0-8.5", nutrientStatus: "Rich in calcium & magnesium, low nitrogen", suitableCrops: ["Soybean", "Wheat", "Gram", "Cotton", "Maize"], waterTable: "Deep (10-20m)", recommendation: "Deep planting in black soil; add nitrogen sources; broad-bed-furrow technique for soybean" },
  "Rajasthan":        { soilType: "Sandy / Desert (Aridisol) with patches of alluvial", ph: "7.5-9.0", nutrientStatus: "Low organic matter, low nitrogen", suitableCrops: ["Bajra", "Mustard", "Gram", "Groundnut", "Guar"], waterTable: "Very deep (15-40m)", recommendation: "Drip irrigation essential; grow drought-resistant varieties; add organic matter (FYM)" },
  "Maharashtra":      { soilType: "Black cotton soil (Vertisol) / Laterite", ph: "6.5-8.0", nutrientStatus: "Rich in iron, medium potash, low phosphorus", suitableCrops: ["Cotton", "Soybean", "Sugarcane", "Onion", "Jowar"], waterTable: "Variable", recommendation: "Use broad-bed furrow for cotton; micro-irrigation for sugarcane; add phosphorus" },
  "Gujarat":          { soilType: "Black / Alluvial / Coastal sandy", ph: "7.0-8.5", nutrientStatus: "Variable — rich black soils to poor sandy", suitableCrops: ["Cotton", "Groundnut", "Wheat", "Cumin", "Castor"], waterTable: "Variable", recommendation: "Drip for cotton and castor; salt-tolerant crops near coast; vermicompost addition" },
  "Karnataka":        { soilType: "Red laterite / Black / Alluvial", ph: "5.5-7.5", nutrientStatus: "Acidic red soils, poor nitrogen; black soils better", suitableCrops: ["Paddy", "Maize", "Sugarcane", "Cotton", "Onion", "Tomato"], waterTable: "Moderate", recommendation: "Lime acidic red soils; rainwater harvesting; mulching in dry zones" },
  "Andhra Pradesh":   { soilType: "Red / Black / Alluvial / Coastal", ph: "6.0-8.0", nutrientStatus: "Red soils low in N & P; delta soils fertile", suitableCrops: ["Paddy", "Cotton", "Maize", "Groundnut", "Chilli", "Tomato"], waterTable: "Variable", recommendation: "Micro-irrigation in Rayalaseema; balanced fertilization in delta; use acid-tolerant varieties" },
  "Tamil Nadu":       { soilType: "Red / Alluvial / Black / Laterite", ph: "6.0-7.5", nutrientStatus: "Variable, generally low nitrogen", suitableCrops: ["Paddy", "Sugarcane", "Groundnut", "Cotton", "Banana"], waterTable: "Moderate (5-15m)", recommendation: "SRI method for paddy; drip for sugarcane and banana; neem cake for pest control" },
  "West Bengal":      { soilType: "Alluvial / Terai", ph: "5.5-7.0", nutrientStatus: "Fertile, good organic matter, acidic in north", suitableCrops: ["Paddy", "Jute", "Mustard", "Potato", "Tea"], waterTable: "High (1-5m)", recommendation: "Lime application in acidic zones; avoid waterlogging; crop diversification" },
  "Bihar":            { soilType: "Alluvial (Gangetic)", ph: "6.5-8.0", nutrientStatus: "Fertile; flood-prone areas have silt deposits", suitableCrops: ["Paddy", "Wheat", "Maize", "Lentil", "Onion"], waterTable: "High (2-5m)", recommendation: "Flood-resistant paddy varieties; timely wheat sowing; zero tillage wheat" },
  "Odisha":           { soilType: "Laterite / Alluvial / Red", ph: "5.5-7.0", nutrientStatus: "Acidic laterite, low P & K", suitableCrops: ["Paddy", "Groundnut", "Maize", "Tomato", "Vegetables"], waterTable: "Variable", recommendation: "Add lime to laterite soils; farm ponds for water storage; integrated nutrient management" },
  "Telangana":        { soilType: "Red / Black / Alluvial", ph: "6.5-8.0", nutrientStatus: "Medium fertility", suitableCrops: ["Paddy", "Cotton", "Maize", "Soybean", "Groundnut"], waterTable: "Deep (10-20m)", recommendation: "Drip irrigation for cotton; zero budget natural farming; borewells regulation" },
  "Assam":            { soilType: "Alluvial / Laterite / Acidic", ph: "4.5-6.5", nutrientStatus: "High organic matter but acidic, low phosphorus", suitableCrops: ["Paddy", "Tea", "Jute", "Mustard", "Potato"], waterTable: "High", recommendation: "Heavy liming needed; flood-protected paddy varieties; SRI cultivation" },
};

// ---- SEASONAL WEATHER SIMULATION (when no live API available) ----
const SIMULATED_WEATHER = {
  "January":   { tempMin: 5, tempMax: 20, humidity: 60, rainfall: "Low (10-20mm)", conditions: "Cool & dry", advisory: "Good for Rabi crops; protect from frost" },
  "February":  { tempMin: 8, tempMax: 24, humidity: 55, rainfall: "Low (5-15mm)", conditions: "Warming up", advisory: "Irrigate wheat at heading stage; prepare for mustard harvest" },
  "March":     { tempMin: 14, tempMax: 32, humidity: 45, rainfall: "Minimal", conditions: "Getting hot", advisory: "Harvest Rabi crops; prepare land for summer vegetables; watch for heat stress" },
  "April":     { tempMin: 20, tempMax: 38, humidity: 35, rainfall: "Very low", conditions: "Hot & dry", advisory: "Irrigate summer crops; prepare seedbeds for Kharif; mulch to conserve moisture" },
  "May":       { tempMin: 25, tempMax: 42, humidity: 30, rainfall: "Pre-monsoon showers possible", conditions: "Peak heat", advisory: "Pre-monsoon field preparation; sow cotton in irrigated areas; protect livestock from heat" },
  "June":      { tempMin: 26, tempMax: 40, humidity: 55, rainfall: "Moderate (100-150mm)", conditions: "Monsoon onset", advisory: "Begin Kharif sowing — paddy nursery, soybean, maize; apply basal fertilizer" },
  "July":      { tempMin: 25, tempMax: 35, humidity: 80, rainfall: "Heavy (200-350mm)", conditions: "Active monsoon", advisory: "Transplant paddy; weed management critical; watch for pest buildup" },
  "August":    { tempMin: 24, tempMax: 33, humidity: 85, rainfall: "Heavy (250-300mm)", conditions: "Peak monsoon", advisory: "Waterloging management; top-dress nitrogen; IPM for pests" },
  "September": { tempMin: 23, tempMax: 33, humidity: 75, rainfall: "Moderate (150-200mm)", conditions: "Monsoon retreat", advisory: "Kharif crops maturing; prepare for Rabi sowing; pest monitoring" },
  "October":   { tempMin: 18, tempMax: 32, humidity: 60, rainfall: "Low (30-50mm)", conditions: "Post-monsoon", advisory: "Begin Rabi sowing — wheat, gram, mustard; harvest Kharif crops; soil testing" },
  "November":  { tempMin: 10, tempMax: 28, humidity: 55, rainfall: "Very low", conditions: "Cool", advisory: "Sow wheat & gram; irrigate newly sown Rabi crops; sugarcane autumn planting" },
  "December":  { tempMin: 5, tempMax: 22, humidity: 60, rainfall: "Minimal", conditions: "Cold", advisory: "Protect Rabi crops from frost; irrigate wheat at crown root stage" },
};

// ---- INDIAN STATES LIST ----
const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Gujarat", "Haryana",
  "Karnataka", "Madhya Pradesh", "Maharashtra", "Odisha",
  "Punjab", "Rajasthan", "Tamil Nadu", "Telangana",
  "Uttar Pradesh", "West Bengal"
];

// ---- CROP NAMES LIST (for quick lookup) ----
const CROP_NAMES = Object.keys(CROP_DATABASE);

// Export for use in other modules
window.FarmData = {
  MSP_DATABASE,
  SCHEMES_DATABASE,
  CROP_DATABASE,
  SOIL_DATABASE,
  SIMULATED_WEATHER,
  INDIAN_STATES,
  CROP_NAMES,
  getMandiPrice
};
