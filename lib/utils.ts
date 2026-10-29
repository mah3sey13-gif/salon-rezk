export const DAY_NAMES_AR: Record<number, string> = {
  0: "الأحد",
  1: "الاثنين",
  2: "الثلاثاء",
  3: "الأربعاء",
  4: "الخميس",
  5: "الجمعة",
  6: "السبت",
};

export const MONTH_NAMES_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export function getNowCairo(): Date {
  try {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
  } catch {
    return new Date();
  }
}

export function formatDateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatArabicDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    const fallback = getNowCairo();
    return `${DAY_NAMES_AR[fallback.getDay()] || ""} ${fallback.getDate()} ${MONTH_NAMES_AR[fallback.getMonth()] || ""}`;
  }
  const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  const dayName = DAY_NAMES_AR[d.getDay()] || "";
  const dayNum = d.getDate();
  const monthName = MONTH_NAMES_AR[d.getMonth()] || "";
  return `${dayName} ${dayNum} ${monthName}`;
}

export function normalizePhoneNumber(phone: string): string {
  let cleaned = (phone || "").replace(/[^\d+]/g, "").trim();
  if (cleaned.startsWith("+20")) {
    cleaned = "0" + cleaned.slice(3);
  } else if (cleaned.startsWith("20") && cleaned.length === 12) {
    cleaned = "0" + cleaned.slice(2);
  }
  return cleaned;
}

export function isValidEgyptianPhone(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return /^01[0125][0-9]{8}$/.test(normalized) || /^\d{11}$/.test(normalized);
}

export function getWhatsAppUrl(phone: string): string {
  const norm = normalizePhoneNumber(phone);
  let clean = norm.replace(/\D/g, "");
  if (clean.startsWith("0")) {
    clean = "2" + clean;
  } else if (!clean.startsWith("20") && clean.length === 10) {
    clean = "20" + clean;
  }
  return `https://wa.me/${clean}`;
}

export interface DayInfo {
  date: string;
  dayOfWeek: number;
  dayNameAr: string;
  formattedDateAr: string;
  isToday: boolean;
  isMonday: boolean;
}

export function getNext15Days(): DayInfo[] {
  const now = getNowCairo();
  const days: DayInfo[] = [];

  for (let i = 0; i < 15; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 12, 0, 0);
    const iso = formatDateToIso(d);
    const dayOfWeek = d.getDay();
    days.push({
      date: iso,
      dayOfWeek,
      dayNameAr: DAY_NAMES_AR[dayOfWeek] || "",
      formattedDateAr: formatArabicDate(iso),
      isToday: i === 0,
      isMonday: dayOfWeek === 1,
    });
  }

  return days;
}

export const TIME_SLOTS = [
  { id: "15:00", label: "03:00 م", time_ar: "03:00 مساءً" },
  { id: "16:00", label: "04:00 م", time_ar: "04:00 مساءً" },
  { id: "17:00", label: "05:00 م", time_ar: "05:00 مساءً" },
  { id: "18:00", label: "06:00 م", time_ar: "06:00 مساءً" },
  { id: "19:00", label: "07:00 م", time_ar: "07:00 مساءً" },
  { id: "20:00", label: "08:00 م", time_ar: "08:00 مساءً" },
  { id: "21:00", label: "09:00 م", time_ar: "09:00 مساءً" },
  { id: "22:00", label: "10:00 م", time_ar: "10:00 مساءً" },
  { id: "23:00", label: "11:00 م", time_ar: "11:00 مساءً" },
  { id: "00:00", label: "12:00 ص", time_ar: "12:00 منتصف الليل" },
];

export const MAX_DAILY_SLOTS = 10;

export function isWithinSevenDaysWindow(dateStr: string): boolean {
  const days = getNext15Days();
  return days.some((d) => d.date === dateStr);
}
