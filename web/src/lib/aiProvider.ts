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
  if (typeof window === "undefined") {
    return {
      provider: "OPENAI",
      apiKey: "",
      temperature: 0.7,
      maxTokens: 1024,
      systemPrompt: "You are the EventOS AI Enterprise Co-pilot."
    };
  }
  
  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  
  return {
    provider: "OPENAI",
    apiKey: "sk-proj-mockkey1234567890",
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
      return JSON.parse(saved);
    } catch (e) {}
  }
  return [
    {
      id: "h1",
      module: "CRM Lead Score",
      provider: "OPENAI",
      prompt: "Analyze lead: Rahul Sharma, budget ₹8L, status INQUIRY.",
      response: "Lead Quality Score: 85/100. High conversion probability.",
      tokensConsumed: 320,
      costEstimate: 0.0064,
      timestamp: "2026-06-30T10:12:00Z",
      actor: "Rahul Sharma (Sales)"
    },
    {
      id: "h2",
      module: "Finance Forecast",
      provider: "CLAUDE",
      prompt: "Forecast Q3 revenue from booked weddings.",
      response: "Revenue Forecast: ₹14,20,000 based on 4 confirmed bookings.",
      tokensConsumed: 540,
      costEstimate: 0.0162,
      timestamp: "2026-06-30T10:45:00Z",
      actor: "Roy Wedding Admin"
    }
  ];
};

export const logAIActivity = (module: string, prompt: string, response: string, tokens: number) => {
  if (typeof window === "undefined") return;
  const history = getAIHistory();
  const config = getAIConfig();
  const costPerToken = config.provider === "CLAUDE" ? 0.00003 : 0.00002;
  
  const newLog: AIHistoryLog = {
    id: Math.random().toString(36).substring(7),
    module,
    provider: config.provider,
    prompt,
    response,
    tokensConsumed: tokens,
    costEstimate: parseFloat((tokens * costPerToken).toFixed(6)),
    timestamp: new Date().toISOString(),
    actor: "Roy Wedding Admin"
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

  logAIActivity(moduleName, prompt, reply, Math.floor(reply.length / 3) + 100);
  return reply;
};
