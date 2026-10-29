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

const DEFAULT_DB: SalonDatabase = {
  admin_pin: "1991",
  phone_number: "01211292518",
  salon_name: "صالون رزق",
  bookings: [],
  day_settings: {},
  announcements: [],
};

// In-memory fallback if filesystem write is restricted (e.g. read-only serverless)
let inMemoryDb: SalonDatabase | null = null;

function ensureDbDirectory() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("Could not create DB directory, fallback to memory", err);
  }
}

export function getDb(): SalonDatabase {
  if (inMemoryDb) {
    return inMemoryDb;
  }

  ensureDbDirectory();

  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const data = JSON.parse(content);
      return {
        ...DEFAULT_DB,
        ...data,
      };
    } else if (fs.existsSync(SEED_FILE)) {
      const content = fs.readFileSync(SEED_FILE, "utf-8");
      const data = JSON.parse(content);
      const initial = { ...DEFAULT_DB, ...data };
      saveDb(initial);
      return initial;
    } else {
      saveDb(DEFAULT_DB);
      return DEFAULT_DB;
    }
  } catch (err) {
    console.error("Error reading database file, using default:", err);
    inMemoryDb = { ...DEFAULT_DB };
    return inMemoryDb;
  }
}

export function saveDb(data: SalonDatabase): void {
  inMemoryDb = data;
  try {
    ensureDbDirectory();
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.warn("Could not persist to disk, data kept in memory:", err);
  }
}

export const MAX_CAPACITY = 10;
