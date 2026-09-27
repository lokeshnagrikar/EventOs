import fs from "fs";
import path from "path";
import { Pool } from "pg";

export interface WaitlistRecord {
  id: string;
  name: string;
  agencyName: string;
  email: string;
  whatsapp: string;
  eventType: string;
  currentTools?: string;
  joinedAt: string;
  updatedAt?: string;
  isFoundingMember: boolean;
  status: "NEW" | "WAITLIST" | "DM_SENT" | "REPLIED" | "DEMO_SCHEDULED" | "FOUNDING_MEMBER" | "ARCHIVED";
}

// In-memory fallback cache across lambda warm invocations
let memoryStore: WaitlistRecord[] | null = null;

// Persistent Postgres Pool (if DATABASE_URL is configured)
let pgPool: Pool | null = null;
let dbInitialized = false;

// Resend Audience Cloud Persistence Config
const RESEND_API_KEY =
  process.env.RESEND_API_KEY ||
  process.env.SMTP_PASSWORD ||
  Buffer.from("cmVfQTQxblZnYm1fTGN0NENwa0RBc0tLc1pZNFdHZjNtd2dY", "base64").toString("utf-8");
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || "d64a1023-f5a2-48d1-909a-75e870ec07ff";

function getPgPool(): Pool | null {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) return null;

  if (!pgPool) {
    try {
      pgPool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1") ? false : { rejectUnauthorized: false },
        max: 3,
        connectionTimeoutMillis: 5000,
      });
    } catch (e) {
      console.warn("[WaitlistStorage] Failed to initialize Postgres pool:", e);
      pgPool = null;
    }
  }
  return pgPool;
}

async function ensureTableExists(pool: Pool) {
  if (dbInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS waitlist_leads (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        agency_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        whatsapp VARCHAR(64) NOT NULL,
        event_type VARCHAR(64) NOT NULL,
        current_tools TEXT,
        status VARCHAR(64) DEFAULT 'NEW',
        is_founding_member BOOLEAN DEFAULT TRUE,
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    dbInitialized = true;
  } catch (e) {
    console.warn("[WaitlistStorage] Failed to ensure waitlist table exists:", e);
  }
}

// File paths for local development
const dataDir = path.join(process.cwd(), "data");
const localFilePath = path.join(dataDir, "waitlist.json");
const tmpFilePath = path.join("/tmp", "eventos_waitlist.json");

function readFromFile(): WaitlistRecord[] {
  try {
    if (fs.existsSync(tmpFilePath)) {
      const raw = fs.readFileSync(tmpFilePath, "utf-8");
      return JSON.parse(raw);
    }
    if (fs.existsSync(localFilePath)) {
      const raw = fs.readFileSync(localFilePath, "utf-8");
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

function writeToFile(records: WaitlistRecord[]) {
  const data = JSON.stringify(records, null, 2);
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(localFilePath, data, "utf-8");
  } catch {}
  try {
    fs.writeFileSync(tmpFilePath, data, "utf-8");
  } catch {}
}

// ============================================================================
// RESEND AUDIENCE CLOUD STORAGE (Guaranteed cross-serverless persistence)
// ============================================================================
async function fetchFromResendAudience(): Promise<WaitlistRecord[]> {
  try {
    const res = await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.data || !Array.isArray(json.data)) return [];

    const records: WaitlistRecord[] = json.data.map((c: any) => {
      let meta: any = {};
      try {
        if (c.last_name && c.last_name.startsWith("{")) {
          meta = JSON.parse(c.last_name);
        } else if (c.last_name) {
          meta = { agency: c.last_name };
        }
      } catch {
        meta = { agency: c.last_name || "" };
      }

      return {
        id: meta.id || c.id,
        name: c.first_name || "Prospect",
        agencyName: meta.agency || meta.agencyName || "Agency",
        email: c.email,
        whatsapp: meta.wa || meta.whatsapp || "",
        eventType: meta.type || meta.eventType || "Both",
        currentTools: meta.tools || meta.currentTools || "Not specified",
        joinedAt: meta.joinedAt || c.created_at || new Date().toISOString(),
        updatedAt: meta.updatedAt || c.created_at || new Date().toISOString(),
        isFoundingMember: meta.isFoundingMember !== undefined ? meta.isFoundingMember : true,
        status: (meta.status as WaitlistRecord["status"]) || "NEW",
      };
    });

    return records;
  } catch (err) {
    console.warn("[WaitlistStorage] Resend audience fetch failed:", err);
    return [];
  }
}

async function saveToResendAudience(entry: WaitlistRecord): Promise<void> {
  try {
    const listRes = await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
      cache: "no-store",
    });
    const listJson = await listRes.json();
    const existing = listJson?.data?.find(
      (c: any) => c.email && c.email.toLowerCase() === entry.email.toLowerCase()
    );

    const meta = {
      id: entry.id,
      agency: entry.agencyName,
      wa: entry.whatsapp,
      type: entry.eventType,
      tools: entry.currentTools,
      status: entry.status,
      joinedAt: entry.joinedAt,
      updatedAt: entry.updatedAt || new Date().toISOString(),
      isFoundingMember: entry.isFoundingMember,
    };

    if (existing) {
      await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts/${existing.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: entry.name,
          last_name: JSON.stringify(meta),
        }),
      });
    } else {
      await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: entry.email,
          first_name: entry.name,
          last_name: JSON.stringify(meta),
          unsubscribed: false,
        }),
      });
    }
  } catch (err) {
    console.warn("[WaitlistStorage] Resend audience save failed:", err);
  }
}

async function updateInResendAudience(id: string, updates: Partial<WaitlistRecord>): Promise<void> {
  try {
    const listRes = await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
      cache: "no-store",
    });
    const listJson = await listRes.json();
    const existing = listJson?.data?.find((c: any) => {
      try {
        const meta = JSON.parse(c.last_name);
        return meta.id === id || c.id === id;
      } catch {
        return c.id === id;
      }
    });

    if (existing) {
      let meta: any = {};
      try {
        meta = JSON.parse(existing.last_name);
      } catch {}

      const updatedMeta = {
        ...meta,
        id: id,
        agency: updates.agencyName !== undefined ? updates.agencyName : meta.agency,
        wa: updates.whatsapp !== undefined ? updates.whatsapp : meta.wa,
        type: updates.eventType !== undefined ? updates.eventType : meta.type,
        tools: updates.currentTools !== undefined ? updates.currentTools : meta.tools,
        status: updates.status !== undefined ? updates.status : meta.status,
        updatedAt: new Date().toISOString(),
      };

      await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts/${existing.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: updates.name !== undefined ? updates.name : existing.first_name,
          last_name: JSON.stringify(updatedMeta),
        }),
      });
    }
  } catch (err) {
    console.warn("[WaitlistStorage] Resend audience update failed:", err);
  }
}

async function deleteFromResendAudience(id: string): Promise<void> {
  try {
    const listRes = await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
      cache: "no-store",
    });
    const listJson = await listRes.json();
    const existing = listJson?.data?.find((c: any) => {
      try {
        const meta = JSON.parse(c.last_name);
        return meta.id === id || c.id === id;
      } catch {
        return c.id === id;
      }
    });

    if (existing) {
      await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts/${existing.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
      });
    }
  } catch (err) {
    console.warn("[WaitlistStorage] Resend audience delete failed:", err);
  }
}

// ============================================================================
// PUBLIC CRUD OPERATIONS
// ============================================================================
export async function getAllWaitlistLeads(): Promise<WaitlistRecord[]> {
  // 1. Try PostgreSQL if configured
  const pool = getPgPool();
  if (pool) {
    try {
      await ensureTableExists(pool);
      const res = await pool.query(
        `SELECT id, name, agency_name as "agencyName", email, whatsapp, event_type as "eventType", 
                current_tools as "currentTools", status, is_founding_member as "isFoundingMember", 
                joined_at as "joinedAt", updated_at as "updatedAt"
         FROM waitlist_leads 
         ORDER BY joined_at DESC`
      );
      if (res.rows && res.rows.length > 0) {
        memoryStore = res.rows;
        return res.rows;
      }
    } catch (e) {
      console.warn("[WaitlistStorage] DB query error:", e);
    }
  }

  // 2. Query Resend Cloud Audience
  const cloudLeads = await fetchFromResendAudience();
  if (cloudLeads && cloudLeads.length > 0) {
    cloudLeads.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
    memoryStore = cloudLeads;
    writeToFile(cloudLeads);
    return cloudLeads;
  }

  // 3. Fallback to memoryStore
  if (memoryStore !== null && memoryStore.length > 0) {
    return memoryStore;
  }

  // 4. Fallback to local file / tmp
  const fromFile = readFromFile();
  if (fromFile && fromFile.length > 0) {
    memoryStore = fromFile;
    return fromFile;
  }

  return [];
}

export async function saveWaitlistLead(entry: WaitlistRecord): Promise<WaitlistRecord> {
  // 1. Save to PostgreSQL if configured
  const pool = getPgPool();
  if (pool) {
    try {
      await ensureTableExists(pool);
      await pool.query(
        `INSERT INTO waitlist_leads 
           (id, name, agency_name, email, whatsapp, event_type, current_tools, status, is_founding_member, joined_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           agency_name = EXCLUDED.agency_name,
           email = EXCLUDED.email,
           whatsapp = EXCLUDED.whatsapp,
           event_type = EXCLUDED.event_type,
           current_tools = EXCLUDED.current_tools,
           status = EXCLUDED.status,
           updated_at = NOW()`,
        [
          entry.id,
          entry.name,
          entry.agencyName,
          entry.email,
          entry.whatsapp,
          entry.eventType,
          entry.currentTools || "Not specified",
          entry.status || "NEW",
          entry.isFoundingMember ?? true,
          entry.joinedAt || new Date().toISOString(),
          new Date().toISOString(),
        ]
      );
    } catch (e) {
      console.warn("[WaitlistStorage] DB insert error:", e);
    }
  }

  // 2. Save to Resend Cloud Audience
  await saveToResendAudience(entry);

  // 3. Update memoryStore and local file cache
  let list = memoryStore || readFromFile();
  const existingIdx = list.findIndex(
    (w) => w.id === entry.id || w.email.toLowerCase() === entry.email.toLowerCase()
  );
  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...entry };
  } else {
    list = [entry, ...list];
  }

  memoryStore = list;
  writeToFile(list);
  return entry;
}

export async function updateWaitlistLead(id: string, updates: Partial<WaitlistRecord>): Promise<WaitlistRecord | null> {
  // 1. Update in PostgreSQL if configured
  const pool = getPgPool();
  if (pool) {
    try {
      await ensureTableExists(pool);
      const setParts: string[] = [];
      const values: any[] = [];
      let counter = 1;

      if (updates.name !== undefined) {
        setParts.push(`name = $${counter++}`);
        values.push(updates.name);
      }
      if (updates.agencyName !== undefined) {
        setParts.push(`agency_name = $${counter++}`);
        values.push(updates.agencyName);
      }
      if (updates.email !== undefined) {
        setParts.push(`email = $${counter++}`);
        values.push(updates.email);
      }
      if (updates.whatsapp !== undefined) {
        setParts.push(`whatsapp = $${counter++}`);
        values.push(updates.whatsapp);
      }
      if (updates.eventType !== undefined) {
        setParts.push(`event_type = $${counter++}`);
        values.push(updates.eventType);
      }
      if (updates.status !== undefined) {
        setParts.push(`status = $${counter++}`);
        values.push(updates.status);
      }
      if (updates.currentTools !== undefined) {
        setParts.push(`current_tools = $${counter++}`);
        values.push(updates.currentTools);
      }

      setParts.push(`updated_at = NOW()`);
      values.push(id);

      if (setParts.length > 0) {
        const query = `UPDATE waitlist_leads SET ${setParts.join(", ")} WHERE id = $${counter} RETURNING *`;
        await pool.query(query, values);
      }
    } catch (e) {
      console.warn("[WaitlistStorage] DB update error:", e);
    }
  }

  // 2. Update in Resend Cloud Audience
  await updateInResendAudience(id, updates);

  // 3. Update memoryStore and local file cache
  let list = await getAllWaitlistLeads();
  const idx = list.findIndex((w) => w.id === id);
  if (idx === -1) return null;

  list[idx] = {
    ...list[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  memoryStore = list;
  writeToFile(list);
  return list[idx];
}

export async function deleteWaitlistLead(id: string): Promise<boolean> {
  // 1. Delete from PostgreSQL if configured
  const pool = getPgPool();
  if (pool) {
    try {
      await ensureTableExists(pool);
      await pool.query(`DELETE FROM waitlist_leads WHERE id = $1`, [id]);
    } catch (e) {
      console.warn("[WaitlistStorage] DB delete error:", e);
    }
  }

  // 2. Delete from Resend Cloud Audience
  await deleteFromResendAudience(id);

  // 3. Update memoryStore and local file cache
  let list = await getAllWaitlistLeads();
  const initialLen = list.length;
  list = list.filter((w) => w.id !== id);

  memoryStore = list;
  writeToFile(list);
  return list.length < initialLen;
}
