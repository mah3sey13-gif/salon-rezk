import fs from "fs";
import path from "path";

export interface Booking {
  id: string;
  booking_date: string;
  time_slot: string; // e.g. "15:00"
  time_slot_label: string; // e.g. "03:00 م"
  customer_name: string;
  customer_phone: string;
  queue_position: number;
  status: "active" | "rescheduled" | "completed" | "cancelled";
  admin_notes?: string;
  created_at: string;
}

export interface DaySetting {
  date: string;
  is_closed: boolean;
  close_reason?: string;
}

export interface Announcement {
  id: string;
  message: string;
  is_active: boolean;
  created_at: string;
}

export interface SalonDatabase {
  admin_pin: string;
  phone_number: string;
  salon_name: string;
  bookings: Booking[];
  day_settings: Record<string, DaySetting>;
  announcements: Announcement[];
}

const DB_DIR = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "salon.json");
const SEED_FILE = path.join(process.cwd(), "data", "salon.json");

export const DEFAULT_DB: SalonDatabase = {
  admin_pin: "1991",
  phone_number: "01211292518",
  salon_name: "صالون رزق",
  bookings: [],
  day_settings: {},
  announcements: [],
};

// In-memory cache to reduce external roundtrips and ensure fast response
let memoryCache: SalonDatabase | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 1500; // 1.5 seconds cache during bursts

function getKvConfig() {
  const directUrl =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.STORAGE_REST_API_URL ||
    process.env.STORAGE_URL;
  const directToken =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.STORAGE_REST_API_TOKEN ||
    process.env.STORAGE_TOKEN;

  if (directUrl && directToken) {
    return { url: directUrl.replace(/\/$/, ""), token: directToken };
  }

  // Auto-discover any environment variable created by Upstash / Vercel integrations
  const envKeys = Object.keys(process.env);
  const urlKey = envKeys.find(
    (k) =>
      (k.endsWith("_REST_API_URL") || k.endsWith("_URL")) &&
      typeof process.env[k] === "string" &&
      process.env[k]?.startsWith("http")
  );
  if (urlKey) {
    const prefix = urlKey.replace(/_(REST_API_)?URL$/, "");
    const tokenKey = envKeys.find(
      (k) =>
        (k === `${prefix}_REST_API_TOKEN` || k === `${prefix}_TOKEN`) &&
        !k.includes("READ_ONLY") &&
        Boolean(process.env[k])
    );
    if (tokenKey && process.env[urlKey] && process.env[tokenKey]) {
      return {
        url: (process.env[urlKey] as string).replace(/\/$/, ""),
        token: process.env[tokenKey] as string,
      };
    }
  }

  return null;
}

function ensureDbDirectory() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("Could not create DB directory, fallback to memory", err);
  }
}

function readLocalDb(): SalonDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return { ...DEFAULT_DB, ...JSON.parse(content) };
    } else if (fs.existsSync(SEED_FILE)) {
      const content = fs.readFileSync(SEED_FILE, "utf-8");
      return { ...DEFAULT_DB, ...JSON.parse(content) };
    }
  } catch (err) {
    console.warn("Error reading local db file:", err);
  }
  return { ...DEFAULT_DB };
}

function writeLocalDb(data: SalonDatabase): void {
  try {
    ensureDbDirectory();
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.warn("Could not write local db file:", err);
  }
}

export async function getDb(): Promise<SalonDatabase> {
  const kv = getKvConfig();

  if (kv) {
    // If we have a fresh cache in memory, return it
    if (memoryCache && Date.now() - lastCacheTime < CACHE_TTL_MS) {
      return memoryCache;
    }

    try {
      // Upstash / Vercel KV REST GET endpoint: GET /get/salon_rezk_db
      const res = await fetch(`${kv.url}/get/salon_rezk_db`, {
        headers: {
          Authorization: `Bearer ${kv.token}`,
        },
        cache: "no-store",
      });

      if (res.ok) {
        const json = await res.json();
        let val = json.result;

        if (typeof val === "string") {
          try {
            val = JSON.parse(val);
          } catch {
            // Already parsed or raw string
          }
        }

        if (val && typeof val === "object") {
          const loaded: SalonDatabase = {
            ...DEFAULT_DB,
            ...val,
            bookings: Array.isArray(val.bookings) ? val.bookings : [],
            day_settings: val.day_settings || {},
            announcements: Array.isArray(val.announcements) ? val.announcements : [],
          };
          memoryCache = loaded;
          lastCacheTime = Date.now();
          return loaded;
        } else if (val === null) {
          // Key doesn't exist in KV yet, seed it with default/local data
          const seed = readLocalDb();
          await saveDb(seed);
          return seed;
        }
      }
    } catch (err) {
      console.error("KV read error, falling back to local storage:", err);
    }
  }

  // Fallback to local disk or memory cache
  if (memoryCache && Date.now() - lastCacheTime < CACHE_TTL_MS) {
    return memoryCache;
  }

  const local = readLocalDb();
  memoryCache = local;
  lastCacheTime = Date.now();
  return local;
}

export async function saveDb(data: SalonDatabase): Promise<void> {
  memoryCache = data;
  lastCacheTime = Date.now();

  const kv = getKvConfig();
  if (kv) {
    try {
      // Upstash / Vercel KV command endpoint: POST / with ["SET", "salon_rezk_db", JSON.stringify(data)]
      const res = await fetch(kv.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${kv.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(["SET", "salon_rezk_db", JSON.stringify(data)]),
        cache: "no-store",
      });

      if (!res.ok) {
        console.error("KV write failed with HTTP status:", res.status);
      }
    } catch (err) {
      console.error("KV save error:", err);
    }
  }

  // Always write local file as well (for local development or offline fallback)
  writeLocalDb(data);
}

export const MAX_CAPACITY = 10;
