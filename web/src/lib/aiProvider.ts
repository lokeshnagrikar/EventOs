"use client";

export type AIProviderName = "OPENAI" | "CLAUDE" | "GEMINI" | "AZURE" | "OLLAMA";

export interface AIConfig {
  provider: AIProviderName;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface AIHistoryLog {
  id: string;
  module: string;
  provider: AIProviderName;
  prompt: string;
  response: string;
  tokensConsumed: number;
  costEstimate: number;
  timestamp: string;
  actor: string;
}

// Default global config storage keys
const CONFIG_KEY = "eventos_ai_config";
const HISTORY_KEY = "eventos_ai_history";

export const getAIConfig = (): AIConfig => {
  const envGeminiKey = (typeof process !== "undefined" && (process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY)) || "";

  if (typeof window === "undefined") {
    return {
      provider: envGeminiKey ? "GEMINI" : "OPENAI",
      apiKey: envGeminiKey,
      temperature: 0.7,
      maxTokens: 1024,
      systemPrompt: "You are the EventOS AI Enterprise Co-pilot."
    };
  }
  
  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // If user had mock key but env has real key, use real key
      if ((!parsed.apiKey || parsed.apiKey.startsWith("sk-proj-mock")) && envGeminiKey) {
        parsed.apiKey = envGeminiKey;
        parsed.provider = "GEMINI";
      }
      return parsed;
    } catch (e) {}
  }
  
  return {
    provider: envGeminiKey ? "GEMINI" : "OPENAI",
    apiKey: envGeminiKey || "sk-proj-mockkey1234567890",
    temperature: 0.7,
    maxTokens: 1024,
    systemPrompt: "You are the EventOS AI Enterprise Co-pilot."
  };
};

export const saveAIConfig = (config: AIConfig) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }
};

export const getAIHistory = (): AIHistoryLog[] => {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem(HISTORY_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Clean legacy mock IDs if present
      const clean = parsed.filter((h: any) => h.id !== "h1" && h.id !== "h2");
      return clean;
    } catch (e) {}
  }
  return [];
};

export const logAIActivity = (module: string, prompt: string, response: string, tokens: number) => {
  if (typeof window === "undefined") return;
  const history = getAIHistory();
  const config = getAIConfig();
  const costPerToken = config.provider === "CLAUDE" ? 0.00003 : 0.00002;
  
  let currentActor = "Workspace Admin";
  try {
    const authData = localStorage.getItem("auth-storage");
    if (authData) {
      const parsed = JSON.parse(authData);
      const u = parsed?.state?.user;
      if (u?.firstName) currentActor = `${u.firstName} ${u.lastName || ""}`.trim();
      else if (u?.email) currentActor = u.email.split("@")[0];
    }
  } catch {}

  const newLog: AIHistoryLog = {
    id: Math.random().toString(36).substring(7),
    module,
    provider: config.provider,
    prompt,
    response,
    tokensConsumed: tokens,
    costEstimate: parseFloat((tokens * costPerToken).toFixed(6)),
    timestamp: new Date().toISOString(),
    actor: currentActor
  };
  
  localStorage.setItem(HISTORY_KEY, JSON.stringify([newLog, ...history]));
};

// Generates Simulated API Stream / Response under provider abstraction
export const generateAIResponse = async (
  moduleName: string,
  prompt: string,
  context?: any
): Promise<string> => {
  const config = getAIConfig();
  
  // Simulated backend API response generation using Provider Abstraction
  // Delay matches actual network roundtrips
  await new Promise((resolve) => setTimeout(resolve, 800));
  
  const p = prompt.toLowerCase();
  let reply = "";

  // If Gemini provider is active with a real key, invoke Google Generative AI
  const isGoogleKey = config.apiKey && (config.provider === "GEMINI" || config.apiKey.startsWith("AIza"));
  if (isGoogleKey && !config.apiKey.startsWith("sk-proj-mock")) {
    const modelsToTry = ["gemini-flash-latest", "gemini-3.8-flash", "gemma-4-26b-a4b-it", "gemma-4-31b-it"];
    const systemInstruction = 
      "You are EventOS Co-pilot, an intelligent AI operational assistant for wedding planners, event coordinators, and creative agencies on the EventOS platform. " +
      "Give concise, practical, highly relevant answers with markdown bullet points and actionable advice. Never output internal thought blocks or meta-reasoning.";

    for (const modelName of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(config.apiKey)}`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${systemInstruction}\nContext: Module ${moduleName}\nUser Request: ${prompt}`
              }]
            }],
            generationConfig: {
              temperature: config.temperature || 0.7,
              maxOutputTokens: config.maxTokens || 1024
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          let candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidate && candidate.trim().length > 0) {
            candidate = candidate.trim();
            // Clean internal reasoning or meta-markers if present
            if (candidate.includes("Final Version:")) {
              candidate = candidate.split("Final Version:").pop()!.trim();
            } else if (candidate.includes("</thought>")) {
              candidate = candidate.split("</thought>").pop()!.trim();
            }
            reply = candidate;
            break; // Success! Stop trying other models.
          }
        }
      } catch (e) {
        console.warn(`[GEMINI] Model ${modelName} error, attempting fallback:`, e);
      }
    }
  }

  if (!reply) {
    if (moduleName === "CRM AI") {
    reply = `Lead Score Assessment:\n` +
            `• Quality Score: 92/100 (High Priority)\n` +
            `• Win Probability: 85%\n` +
            `• Suggested Action: Send the custom premium pricing menu today. Sentiment analysis shows highly positive wedding planner vibes.`;
  } else if (moduleName === "Quote AI") {
    reply = `AI Quotation Recommendations:\n` +
            `• Service Upsell: Suggest LED Stage backdrop mapping (+₹45,000).\n` +
            `• Price Optimization: Bundle Floral Decor and Lawn AV setup for 12% discount to secure acceptance fast.`;
  } else if (moduleName === "Event Timeline") {
    reply = `Optimized Event Timeline (120 Pax Wedding):\n` +
            `• 09:00 AM - Vendor Ingress Setup\n` +
            `• 04:30 PM - Lawn Guest Reception Welcome Mocktails\n` +
            `• 05:30 PM - Altar Vows Exchange\n` +
            `• 07:00 PM - Buffet Dinner open`;
  } else if (moduleName === "Finance Forecast") {
    reply = `Cash Flow Forecast Insights:\n` +
            `• Predicted Outstanding: ₹2,40,000 due by mid-July.\n` +
            `• Payment Delay Risk: Sangeet ceremony invoice is marked LOW risk due to client's past payment history.`;
  } else if (moduleName === "Gallery Tagging") {
    reply = `Gallery Tagging Audit:\n` +
            `• Generated Tags: #Backdrop, #Marigold, #FloralRing, #BrideSuite\n` +
            `• Duplicate Detection: Identified 4 similar images in album (Recycled recommendations generated).`;
    } else {
      reply = `[Generated via ${config.provider} Abstraction Layer]\n\n` +
              `Here is the executive summary response for your request. Based on EventOS workspace coordinates, we suggest updating CRM notes and securing invoice references to maximize conversion rates.`;
    }
  }

  logAIActivity(moduleName, prompt, reply, Math.floor(reply.length / 3) + 100);
  return reply;
};
