// ============================================================
// FARMER DECISION ENGINE — Groq API Integration (LLaMA 3.1)
// Handles communication with Groq API using OpenAI-compatible
// chat completions format with tool/function calling support.
// ============================================================

const GroqEngine = {
  API_BASE: "https://api.groq.com/openai/v1/chat/completions",
  MODEL: "llama-3.1-8b-instant",
  MAX_FUNCTION_ROUNDS: 6,

  // System prompt that defines the agricultural advisory persona
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
- You can respond in Hindi if the farmer writes in Hindi`,

  // Get API key from storage
  getApiKey() {
    return localStorage.getItem("fde_groq_key");
  },

  // Build tools array in OpenAI format
  getTools() {
    return window.TOOL_DECLARATIONS.map(tool => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  },

  // Send a query to Groq with function calling
  async query(userMessage, conversationHistory = [], imageBase64 = null) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("NO_API_KEY");
    }

    // Build the messages array
    const messages = [
      { role: "system", content: this.SYSTEM_PROMPT }
    ];

    // Add conversation history
    for (const msg of conversationHistory) {
      messages.push(msg);
    }

    // Build user message
    let userContent = userMessage;
    if (imageBase64) {
      // Groq/LLaMA text-only — describe that a photo was uploaded
      userContent = `[The farmer has uploaded a photo of their crop/field for diagnosis]\n\n${userMessage || "Please analyze the crop issue visible in the photo and provide treatment advice."}`;
    }

    messages.push({ role: "user", content: userContent });

    // Function calling loop
    let rounds = 0;
    let currentMessages = [...messages];

    while (rounds < this.MAX_FUNCTION_ROUNDS) {
      rounds++;

      const requestBody = {
        model: this.MODEL,
        messages: currentMessages,
        tools: this.getTools(),
        tool_choice: "auto",
        temperature: 0.7,
        max_completion_tokens: 4096,
        stream: false
      };

      const res = await fetch(this.API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData?.error?.message || `API error: ${res.status}`;
        throw new Error(errMsg);
      }

      const data = await res.json();
      const choice = data.choices?.[0];

      if (!choice || !choice.message) {
        throw new Error("No response from Groq");
      }

      const assistantMessage = choice.message;

      // Check if the model wants to call tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // Add the assistant's response (with tool calls) to messages
        currentMessages.push(assistantMessage);

        // Execute each tool call
        for (const toolCall of assistantMessage.tool_calls) {
          const fnName = toolCall.function.name;
          let fnArgs = {};
          try {
            fnArgs = JSON.parse(toolCall.function.arguments);
          } catch (e) {
            fnArgs = {};
          }

          console.log(`🔧 Groq calling tool: ${fnName}(${JSON.stringify(fnArgs)})`);

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

          // Add tool result to messages
          currentMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result)
          });

          // Dispatch event for UI to show tool calls
          window.dispatchEvent(new CustomEvent("toolCall", {
            detail: { name: fnName, args: fnArgs, result, round: rounds }
          }));
        }

        // Continue the loop — model may call more tools or give final response
        continue;
      }

      // No tool calls — this is the final text response
      const finalResponse = assistantMessage.content || "I've gathered the data but had trouble synthesizing the recommendation. Please try rephrasing your question.";

      // Build updated conversation history for follow-ups
      const updatedHistory = [...conversationHistory];
      updatedHistory.push({ role: "user", content: userContent });
      updatedHistory.push({ role: "assistant", content: finalResponse });

      return {
        response: finalResponse,
        conversationHistory: updatedHistory,
        toolCallRounds: rounds - 1
      };
    }

    // If we exhausted all rounds
    return {
      response: "I've gathered extensive data but need a simpler question to provide a clear recommendation. Please try again.",
      conversationHistory: [...conversationHistory, { role: "user", content: userContent }],
      toolCallRounds: rounds
    };
  }
};

// Expose as the same interface name the app expects
window.GeminiEngine = GroqEngine;
