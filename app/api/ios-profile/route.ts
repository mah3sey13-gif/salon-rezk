import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "salon-rezk.mobileconfig");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Type": "application/x-apple-aspen-config; charset=utf-8",
        "Content-Disposition": 'attachment; filename="salon-rezk.mobileconfig"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error serving mobileconfig:", error);
    return NextResponse.json({ error: "Failed to load iOS profile" }, { status: 500 });
  }
}
