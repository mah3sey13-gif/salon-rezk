import { NextResponse } from "next/server";
import { getDb, saveDb, MAX_CAPACITY, Booking } from "@/lib/db";
import { isValidEgyptianPhone, normalizePhoneNumber, isWithinSevenDaysWindow, TIME_SLOTS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingDate, timeSlot, customerName, customerPhone } = body;

    const trimmedName = (customerName || "").trim();
    const normalizedPhone = normalizePhoneNumber(customerPhone || "");

    if (!trimmedName) {
      return NextResponse.json({ success: false, error: "اكتب اسمك الأول يا صاحبي." }, { status: 400 });
    }

    if (!isValidEgyptianPhone(normalizedPhone)) {
      return NextResponse.json(
        { success: false, error: "رقم الموبايل لازم يكون 11 رقم يا صاحبي 📱" },
        { status: 400 }
      );
    }

    if (!bookingDate || !isWithinSevenDaysWindow(bookingDate)) {
      return NextResponse.json(
        { success: false, error: "تاريخ الحجز غير متاح حالياً." },
        { status: 400 }
      );
    }

    const matchedSlot = TIME_SLOTS.find((s) => s.id === timeSlot);
    if (!matchedSlot) {
      return NextResponse.json(
        { success: false, error: "برجاء اختيار الساعة المناسبة للحجز." },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if day is closed (Monday is weekly day off by default)
    const parts = bookingDate.split("-").map(Number);
    const dObj = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    const isMondayDefault = dObj.getDay() === 1;

    const daySetting = db.day_settings[bookingDate];
    const isClosed = daySetting?.is_closed !== undefined ? daySetting.is_closed : isMondayDefault;
    if (isClosed) {
      return NextResponse.json(
        { success: false, error: `هذا اليوم مغلق: ${daySetting?.close_reason || (isMondayDefault ? "مغلق أسبوعياً (إجازة الصالون)" : "ظرف طارئ")}` },
        { status: 400 }
      );
    }

    // Active bookings for this date
    const activeBookings = db.bookings.filter(
      (b) => b.booking_date === bookingDate && (b.status === "active" || b.status === "rescheduled")
    );

    if (activeBookings.length >= MAX_CAPACITY) {
      return NextResponse.json(
        { success: false, error: "عذراً، اكتملت حجوزات هذا اليوم بالكامل (10/10 مواعيد)." },
        { status: 400 }
      );
    }

    // Check if this specific hour is already booked
    const slotTaken = activeBookings.find((b) => b.time_slot === timeSlot);
    if (slotTaken) {
      return NextResponse.json(
        { success: false, error: `الساعة ${matchedSlot.label} محجوزة بالفعل، برجاء اختيار ساعة تانية.` },
        { status: 400 }
      );
    }

    const newPosition = activeBookings.length + 1;
    const newBooking: Booking = {
      id: "bk_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      booking_date: bookingDate,
      time_slot: matchedSlot.id,
      time_slot_label: matchedSlot.label,
      customer_name: trimmedName,
      customer_phone: normalizedPhone,
      queue_position: newPosition,
      status: "active",
      created_at: new Date().toISOString(),
    };

    db.bookings.push(newBooking);
    saveDb(db);

    return NextResponse.json({
      success: true,
      booking: newBooking,
    });
  } catch (error) {
    console.error("Error in /api/book:", error);
    return NextResponse.json(
      { success: false, error: "حصلت مشكلة بسيطة في الاتصال، جرّب تاني." },
      { status: 500 }
    );
  }
}
