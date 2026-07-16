// ─── Developer & Webhook Utility Data Layer ──────────────────────────────────

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPreview: string; // e.g. "evos_live_...4A7B"
  environment: "development" | "production";
  scopes: string[];
  lastUsed: string;
  createdAt: string;
}

export interface WebhookEndpointItem {
  id: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  createdAt: string;
}

export interface WebhookLogItem {
  id: string;
  endpointUrl: string;
  event: string;
  statusCode: number;
  latencyMs: number;
  retries: number;
  timestamp: string;
  payload: string;
  responseBody: string;
}

export interface MarketplaceApp {
  id: string;
  name: string;
  description: string;
  category: "Communication" | "Automation" | "CRM" | "Accounting" | "Payment" | "Media" | "Analytics";
  logoColor: string; // Tailwind background gradient e.g. "from-purple-500 to-indigo-500"
  icon: string; // lucide icon identifier
  isInstalled: boolean;
}

export interface PlaygroundEndpoint {
  path: string;
  method: "GET" | "POST" | "DELETE";
  description: string;
  requestBody?: string;
  responseBody: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API KEYS
// ═══════════════════════════════════════════════════════════════════════════════

export const INITIAL_API_KEYS: ApiKeyItem[] = [
  { id: "key-1", name: "Production Lead Syncer", keyPreview: "evos_prod_a98f...e2a9", environment: "production", scopes: ["crm.read", "crm.write", "events.read"], lastUsed: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), createdAt: "2026-05-12T10:00:00Z" },
  { id: "key-2", name: "Development Sandbox Token", keyPreview: "evos_dev_29ba...d4f1", environment: "development", scopes: ["crm.read", "crm.write", "events.read", "events.write", "invoices.read", "invoices.write"], lastUsed: new Date(Date.now() - 10 * 60 * 1000).toISOString(), createdAt: "2026-07-01T08:30:00Z" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// WEBHOOK ENDPOINTS & LOGS
// ═══════════════════════════════════════════════════════════════════════════════

export const INITIAL_WEBHOOK_ENDPOINTS: WebhookEndpointItem[] = [
  { id: "wh-1", url: "https://api.yourstudio.com/v1/eventos-hook", secret: "whsec_A8B9C10D11E12", events: ["lead.created", "invoice.paid", "booking.created"], active: true, createdAt: "2026-06-20T12:00:00Z" },
];

export const INITIAL_WEBHOOK_LOGS: WebhookLogItem[] = [
  {
    id: "evt_lead_created_1",
    endpointUrl: "https://api.yourstudio.com/v1/eventos-hook",
    event: "lead.created",
    statusCode: 200,
    latencyMs: 145,
    retries: 0,
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    payload: JSON.stringify({ event: "lead.created", timestamp: Date.now(), data: { leadId: "lead-298", name: "Siddharth Wedding", budget: 450000, status: "WON" } }, null, 2),
    responseBody: JSON.stringify({ success: true, message: "Webhook acknowledged" }, null, 2),
  },
  {
    id: "evt_invoice_paid_1",
    endpointUrl: "https://api.yourstudio.com/v1/eventos-hook",
    event: "invoice.paid",
    statusCode: 502,
    latencyMs: 1200,
    retries: 2,
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    payload: JSON.stringify({ event: "invoice.paid", timestamp: Date.now(), data: { invoiceId: "inv-2026-045", amount: 180000, status: "PAID" } }, null, 2),
    responseBody: "502 Bad Gateway - Nginx error gateway response",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MARKETPLACE APPS
// ═══════════════════════════════════════════════════════════════════════════════

export const MARKETPLACE_APPS_INITIAL: MarketplaceApp[] = [
  { id: "app-slack", name: "Slack Alerts", description: "Send lead conversions and event scheduling timelines directly to your team channels.", category: "Communication", logoColor: "from-purple-500 to-indigo-500", icon: "MessageSquare", isInstalled: true },
  { id: "app-gcal", name: "Google Calendar", description: "Sync confirmed event timings and staff meetings automatically to Google accounts.", category: "Communication", logoColor: "from-blue-500 to-cyan-500", icon: "Calendar", isInstalled: false },
  { id: "app-stripe", name: "Stripe Checkout", description: "Generate invoice payment checkout links, accept global cards, and track payouts.", category: "Payment", logoColor: "from-purple-650 to-pink-500", icon: "CreditCard", isInstalled: true },
  { id: "app-zapier", name: "Zapier Automator", description: "Connect EventOS leads to 5000+ CRM, productivity, and document tools via Zap templates.", category: "Automation", logoColor: "from-orange-550 to-red-500", icon: "GitBranch", isInstalled: false },
  { id: "app-cloudinary", name: "Cloudinary CDN", description: "Store event gallery media albums on Cloudinary CDN for blazing fast media rendering.", category: "Media", logoColor: "from-blue-600 to-indigo-500", icon: "Image", isInstalled: false },
  { id: "app-hubspot", name: "HubSpot CRM", description: "Sync contacts, sales budgets, and billing invoice logs directly with your HubSpot accounts.", category: "CRM", logoColor: "from-orange-500 to-amber-500", icon: "Users", isInstalled: false },
  { id: "app-posthog", name: "PostHog Analytics", description: "Analyze user behaviors, screen flows, and client portal conversions inside dashboards.", category: "Analytics", logoColor: "from-zinc-700 to-zinc-900", icon: "TrendingUp", isInstalled: false },
];

// ═══════════════════════════════════════════════════════════════════════════════
// API PLAYGROUND ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

export const PLAYGROUND_ENDPOINTS: PlaygroundEndpoint[] = [
  {
    path: "/v1/crm/leads",
    method: "POST",
    description: "Acquire a new pipeline lead in the workspace",
    requestBody: JSON.stringify({ name: "Riya Malhotra Engagement", email: "riya@gmail.com", eventType: "Wedding", budget: 350000 }, null, 2),
    responseBody: JSON.stringify({ success: true, leadId: "lead_9921a", message: "Pipeline lead created" }, null, 2),
  },
  {
    path: "/v1/events",
    method: "GET",
    description: "Retrieve a list of active event catalogs",
    responseBody: JSON.stringify({
      events: [
        { id: "evt_1", name: "Siddharth & Ananya sangeet", eventType: "Wedding", venue: "Grand Hyatt", budget: 450000, status: "CONFIRMED" },
        { id: "evt_2", name: "Kunal & Riya reception", eventType: "Wedding", venue: "Taj Palace", budget: 850000, status: "IN_PROGRESS" }
      ]
    }, null, 2),
  },
  {
    path: "/v1/invoices",
    method: "POST",
    description: "Generate a draft billing invoice",
    requestBody: JSON.stringify({ clientName: "Siddharth Malhotra", amount: 180000, taxRate: 18, dueDate: "2026-07-25" }, null, 2),
    responseBody: JSON.stringify({ success: true, invoiceNumber: "INV-2026-092", amount: 180000, status: "DRAFT" }, null, 2),
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CODE SNIPPET GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════

export function generateSnippet(lang: "curl" | "js" | "python" | "go", method: string, path: string, body?: string): string {
  const url = `https://api.eventos.dev${path}`;
  
  if (lang === "curl") {
    let base = `curl -X ${method} "${url}" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`;
    if (body) {
      base += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${body.replace(/\n/g, "")}'`;
    }
    return base;
  }
  
  if (lang === "js") {
    let fetchOptions: any = {
      method,
      headers: {
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json"
      }
    };
    if (body) fetchOptions.body = JSON.parse(body);
    
    return `fetch("${url}", ${JSON.stringify(fetchOptions, null, 2)})
  .then(res => res.json())
  .then(data => console.log(data));`;
  }
  
  if (lang === "python") {
    let pythonSnippet = `import requests

url = "${url}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
`;
    if (body) {
      pythonSnippet += `payload = ${body}
response = requests.request("${method}", url, headers=headers, json=payload)
`;
    } else {
      pythonSnippet += `response = requests.request("${method}", url, headers=headers)
`;
    }
    pythonSnippet += `print(response.json())`;
    return pythonSnippet;
  }
  
  // Go
  let goBody = body ? `strings.NewReader(\`${body.replace(/\n/g, "")}\`)` : "nil";
  return `package main

import (
	"fmt"
	"net/http"
	"io"
	"strings"
)

func main() {
	url := "${url}"
	method := "${method}"
	
	req, _ := http.NewRequest(method, url, ${goBody})
	req.Header.Add("Authorization", "Bearer YOUR_API_KEY")
	req.Header.Add("Content-Type", "application/json")
	
	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()
	
	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))
}`;
}
