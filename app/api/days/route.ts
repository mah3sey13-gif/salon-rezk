import { NextResponse } from "next/server";
import { getDb, MAX_CAPACITY } from "@/lib/db";
import { getNext15Days, formatArabicDate, DAY_NAMES_AR, TIME_SLOTS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const db = getDb();

    // If a specific date is requested, return the available/booked hourly slots for that day
    if (dateParam) {
      const parts = dateParam.split("-").map(Number);
      const dObj = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
      const isMondayDefault = dObj.getDay() === 1;

      const daySetting = db.day_settings[dateParam];
      const isClosed = daySetting?.is_closed !== undefined ? daySetting.is_closed : isMondayDefault;
      const closeReason = daySetting?.close_reason || (isClosed && isMondayDefault ? "مغلق أسبوعياً" : null);

      const activeBookings = db.bookings.filter(
        (b) =>
          b.booking_date === dateParam &&
          (b.status === "active" || b.status === "rescheduled")
      );

      const slots = TIME_SLOTS.map((slot) => {
        const isBooked = activeBookings.some((b) => b.time_slot === slot.id);
        return {
          id: slot.id,
          label: slot.label,
          time_ar: slot.time_ar,
          available: !isClosed && !isBooked,
        };
      });

      return NextResponse.json({
        date: dateParam,
        is_closed: isClosed,
        close_reason: closeReason,
        slots,
      });
    }

    const nextDays = getNext15Days();
    const datesSet = new Set(nextDays.map((d) => d.date));

    // Include past dates that have existing bookings so they are never lost from Admin view
    const pastDatesWithBookings: string[] = [];
    (db.bookings || []).forEach((b) => {
      if (b.booking_date && !datesSet.has(b.booking_date)) {
        datesSet.add(b.booking_date);
        pastDatesWithBookings.push(b.booking_date);
      }
    });

    pastDatesWithBookings.sort();

    const pastDayItems = pastDatesWithBookings.map((dateStr) => {
      const parts = dateStr.split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
      const daySetting = db.day_settings[dateStr];
      const isClosed = daySetting?.is_closed ?? false;
      const closeReason = daySetting?.close_reason || null;
      const totalBooked = db.bookings.filter(
        (b) => b.booking_date === dateStr && (b.status === "active" || b.status === "rescheduled")
      ).length;

      return {
        date: dateStr,
        day_name_ar: DAY_NAMES_AR[d.getDay()] || "",
        formatted_date_ar: formatArabicDate(dateStr),
        is_today: false,
        is_past: true,
        is_closed: isClosed,
        close_reason: closeReason,
        can_book: false,
        status_key: "past",
        status_label_ar: "سابق",
        total_booked: totalBooked,
      };
    });

    const activeDays = nextDays.map((d) => {
      const setting = db.day_settings[d.date];
      const isMondayDefault = d.dayOfWeek === 1 || d.isMonday;
      const isClosed = setting?.is_closed !== undefined ? setting.is_closed : isMondayDefault;
      const closeReason = setting?.close_reason || (isClosed && isMondayDefault ? "مغلق أسبوعياً" : null);

      const dayBookings = db.bookings.filter(
        (b) => b.booking_date === d.date && (b.status === "active" || b.status === "rescheduled")
      );
      const totalBooked = dayBookings.length;

      let statusKey = "available";
      let statusLabelAr = "متاح";
      let canBook = true;

      if (isClosed) {
        statusKey = "closed";
        statusLabelAr = "مغلق";
        canBook = false;
      } else if (totalBooked >= MAX_CAPACITY) {
        statusKey = "full";
        statusLabelAr = "مكتمل";
        canBook = false;
      }

      return {
        date: d.date,
        day_name_ar: d.dayNameAr,
        formatted_date_ar: d.formattedDateAr,
        is_today: d.isToday,
        is_past: false,
        is_closed: isClosed,
        close_reason: closeReason,
        can_book: canBook,
        status_key: statusKey,
        status_label_ar: statusLabelAr,
        total_booked: totalBooked,
      };
    });

    const activeAnnouncement = db.announcements.find((a) => a.is_active) || null;

    return NextResponse.json({
      days: [...pastDayItems, ...activeDays],
      announcement: activeAnnouncement,
    });
  } catch (error) {
    console.error("Error in /api/days:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
