"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Scissors,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pin.trim()) {
      setError("اكتب رمز الدخول (PIN)");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(data.error || "رمز الدخول غير صحيح");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pt-6 pb-12">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition p-1"
        >
          <ChevronRight className="w-5 h-5" />
          <span>رجوع لموقع الزبائن</span>
        </Link>
      </div>

      <div className="text-center space-y-2 pt-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 text-emerald-400 mb-2">
          <Scissors className="w-8 h-8 transform -scale-x-100" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">إدارة الصالون</h1>
        <p className="text-xs text-zinc-400">
          أدخل رمز الدخول السري (PIN) للدخول إلى إدارة الصالون
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-sm flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl"
      >
        <div className="space-y-2">
          <label className="block text-sm font-bold text-zinc-200">رمز الدخول (PIN)</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="اكتب رمز الدخول..."
              className="w-full h-13 px-4 pl-11 rounded-2xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition text-center"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg transition cursor-pointer mt-2"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>جاري التحقق...</span>
            </div>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>تسجيل الدخول</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
