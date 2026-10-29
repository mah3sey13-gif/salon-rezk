import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const AUTH_COOKIE = "rezk_admin_token";
const SESSION_SECRET = "rezk_barber_auth_token_secret_1991";

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;

  if (token === SESSION_SECRET) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pin = (body.pin || "").trim();

    const db = await getDb();

    if (pin === db.admin_pin) {
      const response = NextResponse.json({ success: true });
      response.cookies.set(AUTH_COOKIE, SESSION_SECRET, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return response;
    }

    return NextResponse.json({ success: false, error: "رمز الدخول غير صحيح" }, { status: 401 });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ أثناء تسجيل الدخول" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(AUTH_COOKIE);
  return response;
}
