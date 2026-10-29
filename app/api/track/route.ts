import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isValidEgyptianPhone, normalizePhoneNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const normalizedPhone = normalizePhoneNumber(body.customerPhone || "");

    if (!isValidEgyptianPhone(normalizedPhone)) {
      return NextResponse.json(
        { found: false, error: "رقم الموبايل لازم يكون 11 رقم يا صاحبي 📱" },
        { status: 400 }
      );
    }

    const db = getDb();
    const customerBookings = db.bookings
      .filter((b) => b.customer_phone === normalizedPhone)
      .sort((a, b) => b.booking_date.localeCompare(a.booking_date));

    if (customerBookings.length === 0) {
      return NextResponse.json(
        {
          found: false,
          error: "مش لاقيين حجز بالرقم ده يا صاحبي. راجع الرقم وجرّب تاني.",
        },
        { status: 200 }
      );
    }

    const enriched = customerBookings.map((b) => {
      const daySetting = db.day_settings[b.booking_date];
      return {
        ...b,
        is_day_closed: daySetting?.is_closed ?? false,
        day_close_reason: daySetting?.close_reason || null,
      };
    });

    return NextResponse.json({
      found: true,
      bookings: enriched,
    });
  } catch (error) {
    console.error("Error in /api/track:", error);
    return NextResponse.json(
      { found: false, error: "حصلت مشكلة أثناء البحث، جرّب تاني." },
      { status: 500 }
    );
  }
}
