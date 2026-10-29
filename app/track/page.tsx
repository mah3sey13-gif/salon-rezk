"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Phone,
  Search,
  AlertCircle,
  Sparkles,
  XCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  PhoneCall,
  Home,
  MessageCircle,
} from "lucide-react";
import {
  formatArabicDate,
  isValidEgyptianPhone,
  normalizePhoneNumber,
} from "@/lib/utils";

interface TrackedBooking {
  id: string;
  booking_date: string;
  time_slot?: string;
  time_slot_label?: string;
  customer_name: string;
  customer_phone: string;
  queue_position: number;
  status: "active" | "rescheduled" | "completed" | "cancelled";
  is_day_closed?: boolean;
  day_close_reason?: string | null;
}

export default function TrackPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<TrackedBooking[] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBookings(null);

    const normalized = normalizePhoneNumber(phone);
    if (!isValidEgyptianPhone(normalized)) {
      setError("رقم الموبايل لازم يكون 11 رقم يا صاحبي 📱");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerPhone: normalized }),
      });

      const data = await res.json();
      if (res.ok && data.found) {
        setBookings(data.bookings || []);
      } else {
        setError(data.error || "مش لاقيين حجز بالرقم ده يا صاحبي. راجع الرقم وجرّب تاني.");
      }
    } catch (err) {
      console.error("Tracking error:", err);
      setError("حصلت مشكلة أثناء البحث، جرّب تاني.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pt-2 pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition p-1"
        >
          <ChevronRight className="w-5 h-5" />
          <span>الرئيسية</span>
        </Link>
        <span className="text-xs text-zinc-500 font-semibold">متابعة الحجز</span>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-white">تابع حجزك</h1>
        <p className="text-xs text-zinc-400">
          اكتب رقم موبايلك وهنطلعلك مواعيد حجوزاتك بالساعة فوراً.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-sm"
      >
        <div className="space-y-2">
          <label className="block text-sm font-bold text-zinc-200">اكتب رقم الموبايل</label>
          <div className="relative">
            <input
              type="tel"
              inputMode="tel"
              maxLength={11}
              required
              autoFocus
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              dir="ltr"
              className="w-full h-13 px-4 pr-10 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 font-mono text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition text-right"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              <Phone className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500">رقم الموبايل المكون من 11 رقماً الذي حجزت به.</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-13 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-base flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>جاري البحث...</span>
            </div>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>شوف حجزي</span>
            </>
          )}
        </button>
      </form>

      {/* Error / Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-zinc-900 border border-rose-800/40 text-rose-300 text-sm space-y-1 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>تنبيه</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed font-medium">{error}</p>
        </div>
      )}

      {/* Results */}
      {bookings && bookings.length > 0 && (
        <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>
                لقينا {bookings.length}{" "}
                {bookings.length === 1 ? "حجز" : bookings.length === 2 ? "حجزين" : "حجوزات"}{" "}
                لرقمك:
              </span>
            </span>
          </div>

          <div className="space-y-4">
            {bookings.map((item) => (
              <div
                key={item.id}
                className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 text-center space-y-4 shadow-xl relative overflow-hidden"
              >
                {/* Closed day alert */}
                {item.is_day_closed && (
                  <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-rose-200 space-y-1 text-right shadow-inner animate-in fade-in">
                    <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>⚠️ تنبيه: اليوم ده مغلق</span>
                    </div>
                    <p className="text-xs text-rose-200/90 leading-relaxed font-medium">
                      الصالون مغلق في هذا اليوم{" "}
                      {item.day_close_reason ? `(السبب: ${item.day_close_reason})` : ""}. تواصل مع
                      الحلاق لمعرفة التفاصيل.
                    </p>
                  </div>
                )}

                {/* Rescheduled alert */}
                {item.status === "rescheduled" && (
                  <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-200 space-y-1 text-right shadow-inner">
                    <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>⚠️ حصل تعديل على ميعادك</span>
                    </div>
                    <p className="text-xs text-amber-200/90 leading-relaxed">
                      حصل ظرف طارئ وتم تعديل معاد حجزك. تواصل مع الحلاق لمعرفة التفاصيل.
                    </p>
                  </div>
                )}

                {/* Name & Date */}
                <div className="space-y-1">
                  <span className="text-xs text-emerald-400 font-semibold">
                    حجز باسم: <strong className="text-white text-sm">{item.customer_name}</strong>
                  </span>
                  <p className="text-lg font-bold text-white">
                    {formatArabicDate(item.booking_date)}
                  </p>
                </div>

                {/* Time Slot Display */}
                <div className="py-4 border-y border-zinc-800 space-y-1">
                  {item.status === "completed" ? (
                    <div className="space-y-1">
                      <div className="text-5xl font-black text-blue-400">✓</div>
                      <p className="text-xs text-blue-300/90 font-bold pt-1">
                        تمت الحلاقة بنجاح
                      </p>
                    </div>
                  ) : item.status === "cancelled" ? (
                    <div className="space-y-1">
                      <div className="text-5xl font-black text-rose-400">✕</div>
                      <p className="text-xs text-rose-400/90 font-bold pt-1">الحجز ملغي</p>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs text-zinc-400">الساعة المحددة:</span>
                      <div className="text-4xl md:text-5xl font-black text-emerald-400 pt-1">
                        {item.time_slot_label || `الدور #${item.queue_position}`}
                      </div>
                      <p className="text-xs text-emerald-300/80 pt-1">ميعادك مؤكد في صالون رزق</p>
                    </>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-center">
                  {item.is_day_closed ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/40">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>
                        اليوم مغلق {item.day_close_reason ? `(${item.day_close_reason})` : ""}
                      </span>
                    </div>
                  ) : item.status === "active" ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                      <Clock className="w-3.5 h-3.5" />
                      <span>حجزك نشط ومؤكد بالساعة</span>
                    </div>
                  ) : item.status === "completed" ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/60 text-blue-400 border border-blue-800/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تم الحلاقة بنجاح ونورتنا يا صاحبي 🎉</span>
                    </div>
                  ) : item.status === "cancelled" ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/40">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>تم إلغاء الحجز من قبل الحلاق</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/40">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>تم تعديل الميعاد</span>
                    </div>
                  )}
                </div>

                {/* Contact Box */}
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/50 space-y-2.5 text-center text-xs text-zinc-400 shadow-sm">
                  <p className="font-bold text-emerald-300 flex items-center justify-center gap-2">
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                    <span>رزق هيتصل بيك لما ييجي ميعادك</span>
                  </p>
                  <p className="text-zinc-500">لو عاوز تلغي الحجز رن على رزق</p>
                  <div className="pt-1 flex items-center justify-center gap-2 flex-wrap">
                    <a
                      href="tel:01211292518"
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-800 hover:border-emerald-500/50 font-mono text-xs font-bold transition shadow-xs cursor-pointer"
                      dir="ltr"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>01211292518</span>
                    </a>
                    <a
                      href="https://wa.me/201211292518"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-600/50 hover:border-emerald-500 text-xs font-bold transition shadow-xs cursor-pointer group"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition" />
                      <span>واتساب رزق</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/"
            className="w-full h-12 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-sm flex items-center justify-center gap-2 border border-zinc-700 transition"
          >
            <Home className="w-4 h-4" />
            <span>الرجوع للرئيسية</span>
          </Link>
        </div>
      )}
    </div>
  );
}
