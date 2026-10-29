import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    const db = await getDb();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: "برجاء ملء جميع حقول كلمة السر" },
        { status: 400 }
      );
    }

    if (currentPassword.trim() !== db.admin_pin) {
      return NextResponse.json(
        { success: false, error: "كلمة السر الحالية غير صحيحة" },
        { status: 400 }
      );
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      return NextResponse.json(
        { success: false, error: "كلمة السر الجديدة وتأكيدها غير متطابقين" },
        { status: 400 }
      );
    }

    if (newPassword.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "كلمة السر يجب أن تكون 3 خانات على الأقل" },
        { status: 400 }
      );
    }

    db.admin_pin = newPassword.trim();
    await saveDb(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ في الاتصال بالسيرفر" },
      { status: 500 }
    );
  }
}
