// ============================================================
// FARMER DECISION ENGINE — Tool Functions
// These are the functions that Gemini can invoke via function calling.
// Each tool reads from the embedded databases or calls external APIs.
// ============================================================

const FarmTools = {

  // ---- TOOL 1: Get Weather Data ----
  getWeather: async function({ location, state }) {
    const loc = location || state || "India";
    
    // Try OpenWeatherMap first if key is available
    const weatherKey = localStorage.getItem("fde_weather_key");
    if (weatherKey) {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(loc)},IN&units=metric&appid=${weatherKey}`
        );
        if (res.ok) {
          const data = await res.json();
          return {
            source: "OpenWeatherMap (Live)",
            location: data.name,
            temperature: data.main.temp,
            feelsLike: data.main.feels_like,
            tempMin: data.main.temp_min,
            tempMax: data.main.temp_max,
            humidity: data.main.humidity,
            conditions: data.weather[0].description,
            windSpeed: data.wind.speed,
            rainfall: data.rain ? data.rain["1h"] || data.rain["3h"] || 0 : 0,
            advisory: getWeatherAdvisory(data.main.temp, data.main.humidity, data.weather[0].main)
          };
        }
      } catch (e) {
        console.warn("Weather API failed, using simulation:", e.message);
      }
    }

    // Fallback: simulated seasonal weather
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const currentMonth = months[new Date().getMonth()];
    const simData = window.FarmData.SIMULATED_WEATHER[currentMonth];
    
    return {
      source: "Seasonal Estimate (simulated)",
      location: loc,
      temperature: Math.round((simData.tempMin + simData.tempMax) / 2),
      tempMin: simData.tempMin,
      tempMax: simData.tempMax,
      humidity: simData.humidity,
      conditions: simData.conditions,
      rainfall: simData.rainfall,
      advisory: simData.advisory,
      month: currentMonth
    };
  },

  // ---- TOOL 2: Get MSP & Mandi Prices ----
  getMSPPrice: function({ crop, season }) {
    const cropLower = (crop || "").toLowerCase().replace(/[^a-z]/g, "");
    const seasonLower = (season || "").toLowerCase();
    
    // Determine season
    let seasonKey = seasonLower.includes("kharif") ? "kharif" : 
                    seasonLower.includes("rabi") ? "rabi" : null;
    
    // If no season specified, try both
    if (!seasonKey) {
      const currentMonth = new Date().getMonth();
      // Jun-Nov → Kharif, Oct-Mar → Rabi
      seasonKey = (currentMonth >= 5 && currentMonth <= 10) ? "kharif" : "rabi";
    }

    // Search for matching crop
    const db = window.FarmData.MSP_DATABASE[seasonKey];
    if (!db) return { error: "Season not found", availableSeasons: ["kharif", "rabi"] };

    let bestMatch = null;
    let bestKey = null;
    for (const [key, val] of Object.entries(db)) {
      const cropName = val.crop.toLowerCase();
      if (key.includes(cropLower) || cropName.includes(cropLower) || cropLower.includes(key.replace(/_/g, ""))) {
        bestMatch = val;
        bestKey = key;
        break;
      }
    }

    if (!bestMatch) {
      // Return all available crops for this season
      return { 
        error: `Crop '${crop}' not found in ${seasonKey} MSP list`,
        availableCrops: Object.values(db).map(c => c.crop),
        season: seasonKey
      };
    }

    // Get mandi price (simulated)
    const mandiData = window.FarmData.getMandiPrice(bestKey, seasonKey);
    return mandiData;
  },

  // ---- TOOL 3: Get Government Scheme Eligibility ----
  getSchemeEligibility: function({ landSize, state, crop, farmerType }) {
    const eligible = [];
    const landAcres = parseFloat(landSize) || 2;
    const stateStr = (state || "").toLowerCase();
    const cropStr = (crop || "").toLowerCase();

    for (const scheme of window.FarmData.SCHEMES_DATABASE) {
      const entry = { ...scheme, eligible: true, reason: "" };

      // PM-KISAN: exclude if large institutional holder (we assume family farmer)
      if (scheme.id === "pm_kisan") {
        entry.reason = `Landholding of ${landAcres} acres qualifies`;
        if (farmerType === "institutional") {
          entry.eligible = false;
          entry.reason = "Institutional landholders are excluded";
        }
      }

      // PMFBY: relevant if farmer has crops
      if (scheme.id === "pmfby") {
        entry.reason = cropStr 
          ? `Insurance available for ${crop} at low premium`
          : "Insurance available for all notified crops";
      }

      // e-NAM: relevant if selling produce
      if (scheme.id === "enam") {
        entry.reason = "Can sell produce online across state mandis";
      }

      // KCC
      if (scheme.id === "kcc") {
        entry.reason = `Credit up to ₹5,00,000 at subsidized 4% interest for ${landAcres} acres`;
      }

      // PM Dhan-Dhaanya
      if (scheme.id === "pm_dhan_dhaanya") {
        entry.reason = "Check if your district is in the 100 identified low-productivity districts";
      }

      // Soil Health Card
      if (scheme.id === "soil_health_card") {
        entry.reason = "Free soil testing — contact nearest KVK";
      }

      eligible.push(entry);
    }

    return {
      farmerProfile: { landSize: landAcres, state, crop, farmerType: farmerType || "individual" },
      eligibleSchemes: eligible.filter(s => s.eligible),
      totalSchemes: eligible.filter(s => s.eligible).length,
      totalPotentialBenefit: "₹6,000/year (PM-KISAN) + crop insurance + ₹5L credit line"
    };
  },

  // ---- TOOL 4: Get Crop Advisory ----
  getCropAdvisory: function({ crop, state, season }) {
    const cropLower = (crop || "").toLowerCase().replace(/[^a-z]/g, "");
    
    // Find matching crop
    let cropData = null;
    for (const [key, val] of Object.entries(window.FarmData.CROP_DATABASE)) {
      if (key.includes(cropLower) || val.name.toLowerCase().includes(cropLower) || cropLower.includes(key)) {
        cropData = { key, ...val };
        break;
      }
    }

    if (!cropData) {
      return {
        error: `Crop '${crop}' not found in database`,
        availableCrops: Object.values(window.FarmData.CROP_DATABASE).map(c => c.name),
        suggestion: "Try: wheat, paddy, cotton, soybean, mustard, gram, maize, onion, tomato, sugarcane"
      };
    }

    // Check if current month is in sowing window
    const currentMonth = new Date().getMonth();
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

    // Check state suitability
    const stateSuitable = state ? cropData.states.some(s => s.toLowerCase().includes(state.toLowerCase())) : null;

    return {
      crop: cropData.name,
      season: cropData.season,
      sowingWindow: cropData.sowingWindow,
      harvestWindow: cropData.harvestWindow,
      currentMonth: months[currentMonth],
      idealTemperature: cropData.temperature.ideal,
      waterRequirement: cropData.waterRequirement,
      soilType: cropData.soilType,
      seedRate: cropData.seedRate,
      expectedYield: cropData.expectedYield,
      majorPests: cropData.majorPests,
      pestSolutions: cropData.pestSolutions,
      suitableForState: stateSuitable,
      topProducingStates: cropData.states.slice(0, 5)
    };
  },

  // ---- TOOL 5: Get Soil Data ----
  getSoilData: function({ state }) {
    const stateStr = (state || "").trim();
    
    // Find matching state
    let soilData = null;
    let matchedState = null;
    for (const [key, val] of Object.entries(window.FarmData.SOIL_DATABASE)) {
      if (key.toLowerCase().includes(stateStr.toLowerCase()) || stateStr.toLowerCase().includes(key.toLowerCase())) {
        soilData = val;
        matchedState = key;
        break;
      }
    }

    if (!soilData) {
      return {
        error: `Soil data for '${state}' not found`,
        availableStates: Object.keys(window.FarmData.SOIL_DATABASE),
        generalAdvice: "Get your soil tested at the nearest Krishi Vigyan Kendra (KVK) for personalized recommendations"
      };
    }

    return {
      state: matchedState,
      ...soilData
    };
  }
};

// Helper: Generate weather advisory based on conditions
function getWeatherAdvisory(temp, humidity, weatherMain) {
  const advisories = [];
  
  if (temp > 40) advisories.push("⚠️ Extreme heat — irrigate crops early morning/late evening; provide shade for livestock");
  else if (temp > 35) advisories.push("High temperature — ensure adequate irrigation; mulch to retain moisture");
  else if (temp < 10) advisories.push("⚠️ Cold conditions — protect crops from frost with straw mulch or smoke");
  else if (temp < 5) advisories.push("🥶 Frost risk — cover nurseries; delay irrigation (wet soil increases frost damage)");
  
  if (humidity > 85) advisories.push("High humidity — watch for fungal diseases; ensure good air circulation");
  if (humidity < 30) advisories.push("Very dry conditions — increase irrigation frequency");
  
  if (weatherMain === "Rain" || weatherMain === "Thunderstorm") {
    advisories.push("Rain expected — postpone spraying; ensure drainage channels are clear");
  }
  
  return advisories.length > 0 ? advisories.join(". ") : "Weather conditions are favorable for farming activities";
}

// ---- TOOL DECLARATIONS (for Gemini function calling) ----
const TOOL_DECLARATIONS = [
  {
    name: "getWeather",
    description: "Get current weather conditions and agricultural advisory for a location in India. Returns temperature, humidity, rainfall, and farming-specific weather advice.",
    parameters: {
      type: "object",
      properties: {
        location: { type: "string", description: "City or district name in India, e.g. 'Pune', 'Ludhiana', 'Varanasi'" },
        state: { type: "string", description: "Indian state name, e.g. 'Maharashtra', 'Punjab'" }
      },
      required: ["location"]
    }
  },
  {
    name: "getMSPPrice",
    description: "Get the government Minimum Support Price (MSP) and current estimated mandi (market) price for a crop in India. Returns MSP, mandi price, and sell recommendation.",
    parameters: {
      type: "object",
      properties: {
        crop: { type: "string", description: "Name of the crop, e.g. 'wheat', 'paddy', 'cotton', 'soybean', 'gram'" },
        season: { type: "string", description: "Agricultural season: 'kharif' (Jun-Oct) or 'rabi' (Nov-Mar)", enum: ["kharif", "rabi"] }
      },
      required: ["crop"]
    }
  },
  {
    name: "getSchemeEligibility",
    description: "Check which Indian government agricultural schemes a farmer is eligible for based on their profile. Returns eligible schemes with benefits and how to apply.",
    parameters: {
      type: "object",
      properties: {
        landSize: { type: "string", description: "Size of farmer's land in acres, e.g. '5'" },
        state: { type: "string", description: "Indian state where the farm is located" },
        crop: { type: "string", description: "Crop the farmer is growing or planning to grow" },
        farmerType: { type: "string", description: "Type of farmer: 'individual', 'institutional'", enum: ["individual", "institutional"] }
      },
      required: ["landSize", "state"]
    }
  },
  {
    name: "getCropAdvisory",
    description: "Get comprehensive crop-specific agricultural advisory including sowing/harvest windows, water requirements, pest management, expected yield, and suitable soil types.",
    parameters: {
      type: "object",
      properties: {
        crop: { type: "string", description: "Name of the crop, e.g. 'wheat', 'cotton', 'tomato'" },
        state: { type: "string", description: "Indian state to check crop suitability" },
        season: { type: "string", description: "Season: 'kharif', 'rabi', or 'zaid'" }
      },
      required: ["crop"]
    }
  },
  {
    name: "getSoilData",
    description: "Get soil type, nutrient status, pH range, suitable crops, and soil improvement recommendations for a given Indian state.",
    parameters: {
      type: "object",
      properties: {
        state: { type: "string", description: "Indian state name, e.g. 'Maharashtra', 'Punjab'" }
      },
      required: ["state"]
    }
  }
];

window.FarmTools = FarmTools;
window.TOOL_DECLARATIONS = TOOL_DECLARATIONS;
