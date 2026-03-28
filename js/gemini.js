// ============================================================
// FARMER DECISION ENGINE — Gemini API Integration
// Handles communication with Google Gemini via REST API
// with full function calling support (multi-turn loop).
// ============================================================

const GeminiEngine = {
  API_BASE: "https://generativelanguage.googleapis.com/v1beta/models",
  MODEL: "gemini-2.5-flash",
  MAX_FUNCTION_ROUNDS: 6,

  // System prompt that defines Gemini's agricultural advisory persona
  SYSTEM_PROMPT: `You are the **Farmer Decision Engine**, an expert agricultural advisor for Indian farmers. Your role is to synthesize weather, market prices, government schemes, crop science, and soil data to provide specific, actionable farming advice.

## Your Capabilities
You have access to the following tools/functions:
1. **getWeather** — Get current weather and agricultural advisory for any Indian location
2. **getMSPPrice** — Get government MSP and current mandi prices for crops
3. **getSchemeEligibility** — Check which government schemes a farmer qualifies for
4. **getCropAdvisory** — Get crop-specific guidance (sowing, pests, yield, water needs)
5. **getSoilData** — Get soil type and recommendations for any Indian state

## How to Respond
1. **ALWAYS call relevant tools** to gather data before giving advice. Never guess prices, weather, or scheme details.
2. If the farmer mentions a crop, call getCropAdvisory AND getMSPPrice.
3. If they mention a location/state, call getWeather AND getSoilData.
4. If they mention land size or ask about help, call getSchemeEligibility.
5. After gathering data from tools, synthesize everything into a clear recommendation.

## Response Format
Structure your final response in this exact format using these section headers:

**🎯 RECOMMENDED ACTION**
[One clear, specific action the farmer should take right now]

**🌤️ WEATHER ANALYSIS**
[Current weather impact on their farming decision]

**💰 MARKET INTELLIGENCE**
[MSP price, mandi price, sell/hold recommendation]

**🏛️ ELIGIBLE SCHEMES**
[Government schemes they should apply for, with benefits]

**🌱 CROP ADVISORY**
[Sowing window, water needs, pest warnings, yield expectation]

**📋 STEP-BY-STEP PLAN**
[3-5 numbered steps the farmer should follow, starting today]

Only include sections that are relevant to the farmer's question. For simple questions, you can be brief.

## Important Rules
- Be specific with numbers: exact prices, exact dates, exact quantities
- Mention specific pest solutions with chemical names and dosages when relevant
- Always mention if a scheme deadline is approaching
- Be encouraging and supportive — farming is hard work
- If the farmer uploads a photo of a crop problem, analyze it for disease/pest identification
- You can respond in Hindi if the farmer writes in Hindi

## Strict Guardrails
If the user asks a question that is COMPLETELY UNRELATED to agriculture, farming, weather, crops, soil, rural schemes, or agricultural markets (e.g., asking to write code, tell jokes, solve math, or asking about politics), you MUST immediately refuse.
Do not apologize. Do not explain. Just output this exact string and absolutely nothing else:
[ERROR_IRRELEVANT_QUERY]`,

  // Get API key from storage
  getApiKey() {
    return localStorage.getItem("fde_gemini_key");
  },

  // Send a query to Gemini with function calling
  async query(userMessage, conversationHistory = [], imageBase64 = null) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("NO_API_KEY");
    }

    // Build the contents array
    const contents = [];

    // Add conversation history
    for (const msg of conversationHistory) {
      contents.push(msg);
    }

    // Build user message parts
    const userParts = [];

    // Add image if provided
    if (imageBase64) {
      userParts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64
        }
      });
      userParts.push({ text: userMessage || "Please analyze this crop image and identify any disease, pest, or issue. Then provide treatment advice." });
    } else {
      userParts.push({ text: userMessage });
    }

    contents.push({ role: "user", parts: userParts });

    // Build request body
    const requestBody = {
      system_instruction: {
        parts: [{ text: this.SYSTEM_PROMPT }]
      },
      contents: contents,
      tools: [{
        functionDeclarations: window.TOOL_DECLARATIONS
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096
      }
    };

    // Function calling loop
    let rounds = 0;
    let finalResponse = null;

    while (rounds < this.MAX_FUNCTION_ROUNDS) {
      rounds++;

      const url = `${this.API_BASE}/${this.MODEL}:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData?.error?.message || `API error: ${res.status}`;
        throw new Error(errMsg);
      }

      const data = await res.json();
      const candidate = data.candidates?.[0];

      if (!candidate || !candidate.content) {
        throw new Error("No response from Gemini");
      }

      const parts = candidate.content.parts || [];

      // Check if any part is a function call
      const functionCalls = parts.filter(p => p.functionCall);

      if (functionCalls.length > 0) {
        // Add model's function call to conversation
        requestBody.contents.push({
          role: "model",
          parts: parts
        });

        // Execute each function call
        const responseParts = [];
        for (const fc of functionCalls) {
          const fnName = fc.functionCall.name;
          const fnArgs = fc.functionCall.args || {};

          console.log(`🔧 Gemini calling tool: ${fnName}(${JSON.stringify(fnArgs)})`);

          // Execute the tool
          let result;
          try {
            if (window.FarmTools[fnName]) {
              result = await window.FarmTools[fnName](fnArgs);
            } else {
              result = { error: `Unknown function: ${fnName}` };
            }
          } catch (e) {
            result = { error: `Tool execution failed: ${e.message}` };
          }

          responseParts.push({
            functionResponse: {
              name: fnName,
              response: result
            }
          });

          // Dispatch event for UI to show tool calls
          window.dispatchEvent(new CustomEvent("toolCall", {
            detail: { name: fnName, args: fnArgs, result, round: rounds }
          }));
        }

        // Add function responses back to conversation
        requestBody.contents.push({
          role: "user",
          parts: responseParts
        });

        // Continue the loop — Gemini may call more functions or give final response
        continue;
      }

      // No function calls — this is the final text response
      const textParts = parts.filter(p => p.text);
      finalResponse = textParts.map(p => p.text).join("\n");
      break;
    }

    if (!finalResponse) {
      finalResponse = "I've gathered the data but ran into an issue synthesizing the recommendation. Please try rephrasing your question.";
    }

    // Build updated conversation history for follow-ups
    const updatedHistory = [...conversationHistory];
    updatedHistory.push({ role: "user", parts: userParts });
    updatedHistory.push({ role: "model", parts: [{ text: finalResponse }] });

    return {
      response: finalResponse,
      conversationHistory: updatedHistory,
      toolCallRounds: rounds - 1
    };
  }
};

window.GeminiEngine = GeminiEngine;
