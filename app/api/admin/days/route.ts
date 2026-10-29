import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingDate, isClosed, reason } = body;

    if (!bookingDate) {
      return NextResponse.json({ success: false, error: "التاريخ مطلوب" }, { status: 400 });
    }

    const db = await getDb();
    db.day_settings[bookingDate] = {
      date: bookingDate,
      is_closed: Boolean(isClosed),
      close_reason: reason || undefined,
    };

    await saveDb(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting day:", error);
    return NextResponse.json({ success: false, error: "فشل في تغيير حالة اليوم" }, { status: 500 });
  }
}
