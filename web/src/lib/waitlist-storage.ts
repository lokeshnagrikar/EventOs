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

// File paths
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
  } catch (e) {
    // ignore
  }
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

export async function getAllWaitlistLeads(): Promise<WaitlistRecord[]> {
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
      if (res.rows) {
        memoryStore = res.rows;
        return res.rows;
      }
    } catch (e) {
      console.warn("[WaitlistStorage] DB query error, falling back to file/memory:", e);
    }
  }

  if (memoryStore !== null) {
    return memoryStore;
  }

  const fromFile = readFromFile();
  memoryStore = fromFile;
  return fromFile;
}

export async function saveWaitlistLead(entry: WaitlistRecord): Promise<WaitlistRecord> {
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
      console.warn("[WaitlistStorage] DB insert error, falling back:", e);
    }
  }

  let list = await getAllWaitlistLeads();
  const existingIdx = list.findIndex((w) => w.id === entry.id || w.email === entry.email || w.whatsapp === entry.whatsapp);
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
      console.warn("[WaitlistStorage] DB update error, falling back:", e);
    }
  }

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
  const pool = getPgPool();
  if (pool) {
    try {
      await ensureTableExists(pool);
      await pool.query(`DELETE FROM waitlist_leads WHERE id = $1`, [id]);
    } catch (e) {
      console.warn("[WaitlistStorage] DB delete error, falling back:", e);
    }
  }

  let list = await getAllWaitlistLeads();
  const initialLen = list.length;
  list = list.filter((w) => w.id !== id);

  memoryStore = list;
  writeToFile(list);
  return list.length < initialLen;
}
