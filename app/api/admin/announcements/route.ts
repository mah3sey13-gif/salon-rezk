import { NextResponse } from "next/server";
import { getDb, saveDb, Announcement } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    return NextResponse.json({
      announcements: db.announcements || [],
    });
  } catch (error) {
    console.error("Error getting announcements:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, message, isActive } = body;
    const db = getDb();

    if (!db.announcements) {
      db.announcements = [];
    }

    if (id) {
      const existing = db.announcements.find((a) => a.id === id);
      if (existing) {
        if (message !== undefined) existing.message = message;
        if (isActive !== undefined) existing.is_active = isActive;
        saveDb(db);
        return NextResponse.json({ success: true, announcement: existing });
      }
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: "نص التنبيه مطلوب" }, { status: 400 });
    }

    // If new announcement is active, make it active
    const newAnnouncement: Announcement = {
      id: "ann_" + Date.now().toString(36),
      message: message.trim(),
      is_active: isActive !== undefined ? isActive : true,
      created_at: new Date().toISOString(),
    };

    db.announcements.unshift(newAnnouncement);
    saveDb(db);

    return NextResponse.json({ success: true, announcement: newAnnouncement });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json({ success: false, error: "فشل في حفظ التنبيه" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID مطلوب" }, { status: 400 });
    }

    const db = getDb();
    db.announcements = db.announcements.filter((a) => a.id !== id);
    saveDb(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json({ success: false, error: "فشل في حذف التنبيه" }, { status: 500 });
  }
}
