# 🌾 Farmer Decision Engine

> **From soil to strategy — one conversation.**

An AI-powered agricultural decision engine that helps Indian farmers make optimal farming decisions. Describe your land, crop, and problem in natural language — the engine combines weather data, MSP/mandi prices, government scheme eligibility, and crop science to recommend the best action.

**Powered by Google Gemini** with function calling for real-time data synthesis.

---

## ✨ Features

- 🧠 **Gemini-Powered Intelligence** — Natural language understanding + multi-source data synthesis via function calling
- 🌤️ **Weather Analysis** — Live weather data (OpenWeatherMap) or seasonal simulation
- 💰 **Market Intelligence** — Real 2025-26 MSP prices + simulated mandi prices with sell/hold recommendations
- 🏛️ **Government Schemes** — PM-KISAN, PMFBY, e-NAM, KCC eligibility checks
- 🌱 **Crop Advisory** — Sowing windows, water needs, pest management with chemical names & dosages for 10+ crops
- 🗺️ **Soil Analysis** — State-wise soil type, pH, nutrient status, and suitable crop recommendations
- 🎤 **Voice Input** — Speak your question (Web Speech API)
- 📷 **Photo Upload** — Upload crop/leaf photos for disease diagnosis
- 🌍 **Multilingual** — Hindi input supported natively via Gemini
- 📱 **Mobile-First** — Responsive design optimized for farmer smartphones

## 🚀 Getting Started

1. Open `index.html` in a browser (or serve with any HTTP server)
2. Enter your [Gemini API key](https://aistudio.google.com/apikey) (free)
3. Fill in your farmer profile (state, land, crop)
4. Ask any farming question!

### Example Queries
- *"I have 5 acres in Punjab. Should I sow wheat now?"*
- *"Cotton leaves turning yellow in Gujarat. What's wrong?"*
- *"What government schemes can help me? 3 acres paddy in UP"*
- *"Wheat MSP this year? Should I sell at mandi or wait?"*

## 🏗️ Architecture

```
Farmer Input (text/voice/photo)
        ↓
  Gemini Engine (intent + reasoning + function calling)
        ↓
  ┌─────────────┬──────────────┬───────────────┬─────────────┐
  │ Weather API │ MSP/Mandi DB │ Govt Schemes  │ Crop Science│
  └──────┬──────┴──────┬───────┴───────┬───────┴──────┬──────┘
         └─────────────┴───────────────┘              │
                        ↓                             │
              Synthesised Action Plan ←───────────────┘
```

## 📁 File Structure

```
├── index.html          # Main entry point
├── css/
│   └── styles.css      # Earth-toned glassmorphism design system
├── js/
│   ├── data.js         # Embedded DBs (MSP, schemes, crops, soil)
│   ├── tools.js        # Tool functions for Gemini function calling
│   ├── gemini.js       # Gemini API integration (REST + function calling)
│   └── app.js          # App controller (voice, photo, UI)
└── README.md
```

## 🛠️ Tech Stack

- **Frontend**: Pure HTML, CSS, JavaScript (no frameworks)
- **AI**: Google gemini-2.5-flash (REST API with function calling)
- **Voice**: Web Speech API
- **Design**: Glassmorphism, Outfit + Inter fonts, earth-toned palette
