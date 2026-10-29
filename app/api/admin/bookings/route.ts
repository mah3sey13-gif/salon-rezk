import { NextResponse } from "next/server";
import { getDb, saveDb, MAX_CAPACITY, Booking } from "@/lib/db";
import { formatArabicDate, normalizePhoneNumber, isValidEgyptianPhone, TIME_SLOTS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const isArchive = searchParams.get("archive") === "true" || date === "all";

    const db = getDb();

    if (isArchive) {
      return NextResponse.json({
        bookings: db.bookings || [],
        totalBookings: (db.bookings || []).length,
      });
    }

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }
    const parts = date.split("-").map(Number);
    const dObj = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    const isMondayDefault = dObj.getDay() === 1;

    const daySetting = db.day_settings[date];
    const isClosed = daySetting?.is_closed !== undefined ? daySetting.is_closed : isMondayDefault;
    const closeReason = daySetting?.close_reason || (isClosed && isMondayDefault ? "مغلق أسبوعياً" : null);

    const dayBookings = db.bookings.filter((b) => b.booking_date === date);

    // Map all 10 hourly slots for the barber's schedule view
    const hourlySchedule = TIME_SLOTS.map((slot, index) => {
      const booking = dayBookings.find(
        (b) =>
          b.time_slot === slot.id &&
          (b.status === "active" || b.status === "rescheduled")
      );
      return {
        slot_index: index + 1,
        time_id: slot.id,
        label: slot.label,
        time_ar: slot.time_ar,
        booking: booking || null,
      };
    });

    const totalActive = dayBookings.filter(
      (b) => b.status === "active" || b.status === "rescheduled"
    ).length;

    return NextResponse.json({
      bookings: dayBookings,
      hourlySchedule,
      totalActive,
      maxCapacity: MAX_CAPACITY,
      formattedDateAr: formatArabicDate(date),
      isClosed,
      closeReason,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;
    const db = getDb();

    if (action === "status") {
      const { id, status } = body;
      const booking = db.bookings.find((b) => b.id === id);
      if (!booking) {
        return NextResponse.json({ success: false, error: "الحجز غير موجود" }, { status: 404 });
      }

      booking.status = status;
      saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (action === "edit") {
      const { id, name, phone, timeSlot, adminNotes } = body;
      const booking = db.bookings.find((b) => b.id === id);
      if (!booking) {
        return NextResponse.json({ success: false, error: "الحجز غير موجود" }, { status: 404 });
      }

      const normalizedPhone = normalizePhoneNumber(phone || "");
      if (!name || !name.trim()) {
        return NextResponse.json({ success: false, error: "اسم الزبون مطلوب" }, { status: 400 });
      }
      if (!isValidEgyptianPhone(normalizedPhone)) {
        return NextResponse.json(
          { success: false, error: "رقم الموبايل لازم يكون 11 رقم يا صاحبي 📱" },
          { status: 400 }
        );
      }

      // If timeSlot changed, check if new slot is taken
      if (timeSlot && timeSlot !== booking.time_slot) {
        const slotTaken = db.bookings.find(
          (b) =>
            b.id !== id &&
            b.booking_date === booking.booking_date &&
            b.time_slot === timeSlot &&
            (b.status === "active" || b.status === "rescheduled")
        );
        if (slotTaken) {
          return NextResponse.json(
            { success: false, error: "هذه الساعة محجوزة لزبون آخر بالفعل" },
            { status: 400 }
          );
        }
        const matched = TIME_SLOTS.find((s) => s.id === timeSlot);
        if (matched) {
          booking.time_slot = matched.id;
          booking.time_slot_label = matched.label;
        }
      }

      booking.customer_name = name.trim();
      booking.customer_phone = normalizedPhone;
      if (adminNotes !== undefined) {
        booking.admin_notes = adminNotes;
      }

      saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (action === "move") {
      const { id, targetDate, targetTimeSlot } = body;
      const booking = db.bookings.find((b) => b.id === id);
      if (!booking) {
        return NextResponse.json({ success: false, error: "الحجز غير موجود" }, { status: 404 });
      }

      // Check slot availability in target date
      const slotTaken = db.bookings.find(
        (b) =>
          b.booking_date === targetDate &&
          b.time_slot === (targetTimeSlot || booking.time_slot) &&
          (b.status === "active" || b.status === "rescheduled")
      );

      if (slotTaken) {
        return NextResponse.json(
          { success: false, error: "الساعة المحددة في اليوم الجديد محجوزة بالفعل" },
          { status: 400 }
        );
      }

      booking.booking_date = targetDate;
      if (targetTimeSlot) {
        const matched = TIME_SLOTS.find((s) => s.id === targetTimeSlot);
        if (matched) {
          booking.time_slot = matched.id;
          booking.time_slot_label = matched.label;
        }
      }
      booking.status = "rescheduled";

      saveDb(db);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Action غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("Error updating bookings:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ في الاتصال" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ success: false, error: "Date is required" }, { status: 400 });
    }

    const db = getDb();
    db.bookings = db.bookings.filter((b) => b.booking_date !== date);
    saveDb(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing day:", error);
    return NextResponse.json({ success: false, error: "فشل في تصفير حجوزات اليوم" }, { status: 500 });
  }
}
