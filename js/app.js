// ============================================================
// FARMER DECISION ENGINE — Main Application Controller
// Handles UI orchestration, voice input, photo upload,
// conversation management, and response rendering.
// ============================================================

const App = {
  conversationHistory: [],
  isProcessing: false,
  toolCallsThisQuery: [],

  // ---- INITIALIZATION ----
  /**
   * Initializes the application, caches DOM elements, and binds events.
   */
  init() {
    this.cacheDOM();
    this.bindEvents();
    this.checkApiKey();
    this.populateStates();
    this.setupVoiceInput();
    this.addExampleQueries();
    
    // Listen for tool calls from Gemini engine
    window.addEventListener("toolCall", (e) => {
      this.handleToolCall(e.detail);
    });
  },

  cacheDOM() {
    // API Key Modal
    this.apiKeyModal = document.getElementById("apiKeyModal");
    this.apiKeyInput = document.getElementById("apiKeyInput");
    this.apiKeySaveBtn = document.getElementById("apiKeySave");
    this.apiKeyError = document.getElementById("apiKeyError");

    // Farmer Profile
    this.stateSelect = document.getElementById("stateSelect");
    this.landSizeInput = document.getElementById("landSize");
    this.cropSelect = document.getElementById("cropSelect");
    this.seasonSelect = document.getElementById("seasonSelect");

    // Input Area
    this.queryInput = document.getElementById("queryInput");
    this.sendBtn = document.getElementById("sendBtn");
    this.voiceBtn = document.getElementById("voiceBtn");
    this.photoInput = document.getElementById("photoInput");
    this.photoBtn = document.getElementById("photoBtn");
    this.photoPreview = document.getElementById("photoPreview");
    this.photoPreviewContainer = document.getElementById("photoPreviewContainer");
    this.removePhotoBtn = document.getElementById("removePhoto");
    this.charCount = document.getElementById("charCount");

    // Response Area
    this.responseArea = document.getElementById("responseArea");
    this.welcomeState = document.getElementById("welcomeState");
    this.loadingState = document.getElementById("loadingState");
    // Removed toolCallsContainer and resultCards to fix UI rendering bug.
    // They are now injected directly into the conversation log.
    this.conversationLog = document.getElementById("conversationLog");

    // Header
    this.settingsBtn = document.getElementById("settingsBtn");
    this.clearBtn = document.getElementById("clearBtn");
  },

  bindEvents() {
    // API Key
    this.apiKeySaveBtn.addEventListener("click", () => this.saveApiKey());
    this.apiKeyInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.saveApiKey();
    });

    // Query input
    this.sendBtn.addEventListener("click", () => this.submitQuery());
    this.queryInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.submitQuery();
      }
    });
    this.queryInput.addEventListener("input", () => {
      this.charCount.textContent = this.queryInput.value.length;
      this.autoResize(this.queryInput);
    });

    // Photo
    this.photoBtn.addEventListener("click", () => this.photoInput.click());
    this.photoInput.addEventListener("change", (e) => this.handlePhotoUpload(e));
    this.removePhotoBtn.addEventListener("click", () => this.removePhoto());

    // Voice
    this.voiceBtn.addEventListener("click", () => this.toggleVoice());

    // Header actions
    this.settingsBtn.addEventListener("click", () => this.showApiKeyModal());
    this.clearBtn.addEventListener("click", () => this.clearConversation());

    // Example queries
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("example-query")) {
        this.queryInput.value = e.target.dataset.query;
        this.charCount.textContent = this.queryInput.value.length;
        this.autoResize(this.queryInput);
        this.queryInput.focus();
      }
    });
  },

  // ---- API KEY MANAGEMENT ----
  checkApiKey() {
    const key = localStorage.getItem("fde_gemini_key");
    if (!key) {
      this.showApiKeyModal();
    } else {
      this.hideApiKeyModal();
    }
  },

  showApiKeyModal() {
    this.apiKeyModal.classList.add("active");
    this.apiKeyInput.value = localStorage.getItem("fde_gemini_key") || "";
    this.apiKeyInput.focus();
  },

  hideApiKeyModal() {
    this.apiKeyModal.classList.remove("active");
  },

  saveApiKey() {
    const key = this.apiKeyInput.value.trim();
    if (!key) {
      this.apiKeyError.textContent = "Please enter your Gemini API key";
      this.apiKeyError.style.display = "block";
      return;
    }
    if (!key.startsWith("AI")) {
      this.apiKeyError.textContent = "That doesn't look like a valid Gemini API key (should start with 'AI')";
      this.apiKeyError.style.display = "block";
      return;
    }
    localStorage.setItem("fde_gemini_key", key);
    this.apiKeyError.style.display = "none";
    this.hideApiKeyModal();
    this.showToast("API key saved ✓", "success");
  },

  // ---- FARMER PROFILE ----
  /**
   * Populates the state select dropdown from the embedded knowledge base.
   */
  populateStates() {
    const states = window.FarmData.INDIAN_STATES;
    states.forEach(state => {
      const opt = document.createElement("option");
      opt.value = state;
      opt.textContent = state;
      this.stateSelect.appendChild(opt);
    });
  },

  /**
   * Builds the context string from the farmer profile.
   * @returns {string} The formatted farmer context string.
   */
  getFarmerContext() {
    const state = this.stateSelect.value;
    const land = this.landSizeInput.value;
    const crop = this.cropSelect.value;
    const season = this.seasonSelect.value;

    let context = "";
    if (state) context += `Location/State: ${state}. `;
    if (land) context += `Land size: ${land} acres. `;
    if (crop) context += `Primary crop: ${crop}. `;
    if (season) context += `Season: ${season}. `;

    return context;
  },

  // ---- VOICE INPUT ----
  setupVoiceInput() {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      this.voiceBtn.style.display = "none";
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = "en-IN"; // Indian English + Hindi support
    this.recognition.interimResults = true;
    this.recognition.continuous = false;

    this.recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      this.queryInput.value = transcript;
      this.charCount.textContent = transcript.length;
      this.autoResize(this.queryInput);
    };

    this.recognition.onend = () => {
      this.voiceBtn.classList.remove("recording");
      this.voiceBtn.title = "Voice input";
    };

    this.recognition.onerror = (e) => {
      console.error("Speech recognition error:", e.error);
      this.voiceBtn.classList.remove("recording");
      if (e.error === "not-allowed") {
        this.showToast("Microphone access denied. Please allow microphone in browser settings.", "error");
      }
    };
  },

  toggleVoice() {
    if (this.voiceBtn.classList.contains("recording")) {
      this.recognition.stop();
    } else {
      this.recognition.start();
      this.voiceBtn.classList.add("recording");
      this.voiceBtn.title = "Listening...";
    }
  },

  // ---- PHOTO UPLOAD ----
  handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      this.showToast("Please upload an image file", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.photoPreview.src = e.target.result;
      this.photoPreviewContainer.classList.add("active");
      // Store base64 data (without the data:image/...;base64, prefix)
      this.uploadedImageBase64 = e.target.result.split(",")[1];
    };
    reader.readAsDataURL(file);
  },

  removePhoto() {
    this.photoPreview.src = "";
    this.photoPreviewContainer.classList.remove("active");
    this.uploadedImageBase64 = null;
    this.photoInput.value = "";
  },

  // ---- QUERY SUBMISSION ----
  /**
   * Handles user query submission, sends to Gemini API, and orchestrates UI updates.
   */
  async submitQuery() {
    const query = this.queryInput.value.trim();
    if (!query && !this.uploadedImageBase64) return;
    if (this.isProcessing) return;

    // Check API key
    if (!localStorage.getItem("fde_gemini_key")) {
      this.showApiKeyModal();
      return;
    }

    this.isProcessing = true;
    this.toolCallsThisQuery = [];

    // Build the full query with farmer context
    const context = this.getFarmerContext();
    const fullQuery = context ? `[Farmer Profile: ${context}]\n\n${query}` : query;

    // Show the user's query in conversation
    this.addToConversation("user", query, this.uploadedImageBase64);

    // Clear input
    this.queryInput.value = "";
    this.charCount.textContent = "0";
    this.autoResize(this.queryInput);

    // Hide welcome, show loading
    this.welcomeState.style.display = "none";
    this.showLoading(true);
    this.sendBtn.disabled = true;

    try {
      const result = await window.GeminiEngine.query(
        fullQuery,
        this.conversationHistory,
        this.uploadedImageBase64
      );

      // Update conversation history
      this.conversationHistory = result.conversationHistory;

      // Render the response text (will be converted to cards inline)
      this.renderResponse(result.response, result.toolCallRounds);

      // Clear photo after sending
      this.removePhoto();

    } catch (error) {
      console.error("Query failed:", error);
      if (error.message === "NO_API_KEY") {
        this.showApiKeyModal();
      } else {
        this.addToConversation("error", `Error: ${error.message}`);
      }
    } finally {
      this.isProcessing = false;
      this.showLoading(false);
      this.sendBtn.disabled = false;
    }
  },

  /**
   * Captures and renders individual tool calls inside the current loading bubble.
   * @param {Object} detail - The details of the tool call.
   */
  handleToolCall(detail) {
    this.toolCallsThisQuery.push(detail);
    this.renderToolCall(detail);
  },

  renderToolCall(detail) {
    const container = document.getElementById("currentToolCalls");
    if (!container) return;
    
    const toolIcons = {
      getWeather: "🌤️",
      getMSPPrice: "💰",
      getSchemeEligibility: "🏛️",
      getCropAdvisory: "🌱",
      getSoilData: "🗺️"
    };

    const toolNames = {
      getWeather: "Weather Data",
      getMSPPrice: "MSP & Mandi Prices",
      getSchemeEligibility: "Government Schemes",
      getCropAdvisory: "Crop Advisory",
      getSoilData: "Soil Analysis"
    };

    const el = document.createElement("div");
    el.className = "tool-call-chip animate-in";
    el.innerHTML = `<span>${toolIcons[detail.name] || "🔧"}</span> ${toolNames[detail.name] || detail.name} <span class="tool-status">✓</span>`;
    container.appendChild(el);
    
    this.responseArea.scrollTop = this.responseArea.scrollHeight;
  },

  // ---- RESPONSE RENDERING ----
  renderResponse(responseText, toolRounds) {
    // We strictly use addToConversation so the UI flows sequentially
    this.addToConversation("assistant", responseText);
  },

  /**
   * Parses the AI response and transforms structured sections into HTML cards.
   * @param {string} responseText - The raw markdown text from Gemini.
   * @returns {string} The HTML formatted string.
   */
  formatAsCardsHTML(responseText) {
    const sectionConfig = {
      "RECOMMENDED ACTION": { icon: "🎯", color: "green", priority: 1 },
      "WEATHER ANALYSIS": { icon: "🌤️", color: "blue", priority: 2 },
      "MARKET INTELLIGENCE": { icon: "💰", color: "gold", priority: 3 },
      "ELIGIBLE SCHEMES": { icon: "🏛️", color: "purple", priority: 4 },
      "CROP ADVISORY": { icon: "🌱", color: "emerald", priority: 5 },
      "STEP-BY-STEP PLAN": { icon: "📋", color: "orange", priority: 6 }
    };

    // Parse sections using regex
    const sections = [];
    const sectionRegex = /\*\*([🎯🌤️💰🏛️🌱📋]\s*(?:[A-Z\s&-]+))\*\*\n([\s\S]*?)(?=\*\*[🎯🌤️💰🏛️🌱📋]|\n*$)/g;
    let match;

    while ((match = sectionRegex.exec(responseText)) !== null) {
      const title = match[1].trim();
      const content = match[2].trim();
      
      let config = { icon: "📄", color: "gray", priority: 99 };
      for (const [key, cfg] of Object.entries(sectionConfig)) {
        if (title.toUpperCase().includes(key)) {
          config = cfg;
          break;
        }
      }

      sections.push({ title, content, ...config });
    }

    if (sections.length > 0) {
      sections.sort((a, b) => a.priority - b.priority);
      
      let html = '<div class="result-cards-inline">';
      sections.forEach((section, index) => {
        html += `
          <div class="result-card card-${section.color}" style="animation-delay: ${index * 0.1}s">
            <div class="card-header">
              <span class="card-icon">${section.icon}</span>
              <h3 class="card-title">${this.cleanTitle(section.title)}</h3>
            </div>
            <div class="card-content">${this.formatMarkdown(section.content)}</div>
          </div>
        `;
      });
      html += '</div>';
      return html;
    } else {
      return this.formatMarkdown(responseText);
    }
  },

  cleanTitle(title) {
    return title.replace(/[🎯🌤️💰🏛️🌱📋]/g, "").trim();
  },

  formatMarkdown(text) {
    return text
      // Bold
      .replace(/\*\*(.*?)\*\*/g, (match, p1) => `<strong>${this.escapeHtml(p1)}</strong>`)
      // Italic
      .replace(/\*(.*?)\*/g, (match, p1) => `<em>${this.escapeHtml(p1)}</em>`)
      // Numbered lists
      .replace(/^(\d+)\.\s+(.+)$/gm, '<div class="list-item"><span class="list-num">$1</span><span>$2</span></div>')
      // Bullet lists
      .replace(/^[-•]\s+(.+)$/gm, '<div class="list-item bullet"><span class="list-bullet">•</span><span>$1</span></div>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  },

  // ---- CONVERSATION LOG ----
  /**
   * Appends a message to the conversation log.
   * @param {string} role - The role of the sender ("user" | "assistant" | "error").
   * @param {string} content - The content of the message.
   * @param {string|null} imageBase64 - Optional image base64.
   */
  addToConversation(role, content, imageBase64 = null) {
    const msgEl = document.createElement("div");
    msgEl.className = `conv-message conv-${role} animate-in`;

    let html = "";
    
    if (role === "user") {
      html += `<div class="conv-avatar user-avatar">👨‍🌾</div>`;
      html += `<div class="conv-bubble user-bubble">`;
      if (imageBase64) {
        // Sanitize base64 (ensure no HTML tags are injected)
        const safeBase64 = this.escapeHtml(imageBase64);
        html += `<img src="data:image/jpeg;base64,${safeBase64}" class="conv-image" alt="Uploaded crop photo">`;
      }
      html += `<p>${this.escapeHtml(content)}</p></div>`;
    } else if (role === "assistant") {
      html += `<div class="conv-avatar ai-avatar">🌾</div>`;
      // We pass content through formatAsCardsHTML which calls formatMarkdown
      const formattedHtml = this.formatAsCardsHTML(content);
      html += `<div class="conv-bubble ai-bubble">${formattedHtml}</div>`;
    } else if (role === "error") {
      html += `<div class="conv-avatar error-avatar">⚠️</div>`;
      html += `<div class="conv-bubble error-bubble"><p>${this.escapeHtml(content)}</p></div>`;
    }

    msgEl.innerHTML = html;
    this.conversationLog.appendChild(msgEl);
    
    // Scroll to bottom
    this.responseArea.scrollTop = this.responseArea.scrollHeight;
  },

  // ---- EXAMPLE QUERIES ----
  addExampleQueries() {
    const examples = [
      { text: "I have 5 acres in Punjab. Should I sow wheat now?", icon: "🌾" },
      { text: "Cotton leaves turning yellow in Gujarat. What's wrong?", icon: "🍂" },
      { text: "What government schemes can help me? 3 acres paddy in UP", icon: "🏛️" },
      { text: "Best crop for black soil in Maharashtra this season?", icon: "🌱" },
      { text: "Wheat MSP this year? Should I sell at mandi or wait?", icon: "💰" },
      { text: "My tomato plants have white spots. How to treat?", icon: "🍅" }
    ];

    const container = document.getElementById("exampleQueries");
    examples.forEach(ex => {
      const btn = document.createElement("button");
      btn.className = "example-query";
      btn.dataset.query = ex.text;
      btn.innerHTML = `<span class="eq-icon">${ex.icon}</span>${ex.text}`;
      container.appendChild(btn);
    });
  },

  // ---- UI HELPERS ----
  showLoading(show) {
    this.loadingState.style.display = show ? "none" : "none"; // Hide standard loading
    
    if (show) {
      // Create a temporary loading bubble in the conversation view
      const loadingEl = document.createElement("div");
      loadingEl.className = "conv-message conv-assistant animate-in";
      loadingEl.id = "currentLoadingBubble";
      loadingEl.innerHTML = `
        <div class="conv-avatar ai-avatar">🌾</div>
        <div class="conv-bubble ai-bubble loading-bubble">
           <div class="loading-animation"><div class="wheat-sprout"></div></div>
           <p style="margin-top: 10px; color: var(--text-200); font-weight: 500;">Analyzing your situation...</p>
           <div class="tool-calls-inline" id="currentToolCalls" style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px;"></div>
        </div>
      `;
      this.conversationLog.appendChild(loadingEl);
      this.responseArea.scrollTop = this.responseArea.scrollHeight;
    } else {
      const loadingEl = document.getElementById("currentLoadingBubble");
      if (loadingEl) loadingEl.remove();
    }
  },

  clearConversation() {
    this.conversationHistory = [];
    this.conversationLog.innerHTML = "";
    this.welcomeState.style.display = "flex";
    this.showToast("Conversation cleared", "success");
  },

  autoResize(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  },

  /**
   * Escapes HTML to prevent XSS.
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  },

  showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => App.init());
