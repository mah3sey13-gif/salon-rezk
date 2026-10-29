"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  ChevronRight,
  AlertCircle,
  Home,
  PhoneCall,
  Phone,
  User,
  CheckCircle2,
  Clock,
  MessageCircle,
} from "lucide-react";
import {
  formatArabicDate,
  isValidEgyptianPhone,
  normalizePhoneNumber,
  isWithinSevenDaysWindow,
  TIME_SLOTS,
} from "@/lib/utils";

interface SlotItem {
  id: string;
  label: string;
  time_ar: string;
  available: boolean;
}

interface BookingResult {
  id: string;
  time_slot: string;
  time_slot_label: string;
  customer_name: string;
  customer_phone: string;
  booking_date: string;
  status: string;
}

export default function BookDatePage() {
  const params = useParams();
  const dateStr = String(params?.date || "");

  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<BookingResult | null>(null);

  const formattedDate = dateStr ? formatArabicDate(dateStr) : "";

  useEffect(() => {
    if (dateStr && !isWithinSevenDaysWindow(dateStr)) {
      setError("تاريخ الحجز خارج الـ 15 يوماً المتاحة حالياً.");
      setFetchingSlots(false);
      return;
    }
    loadSlots();
  }, [dateStr]);

  const loadSlots = async () => {
    setFetchingSlots(true);
    try {
      const res = await fetch(`/api/days?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots || []);
        // Automatically preselect first available slot
        const firstAvail = (data.slots || []).find((s: SlotItem) => s.available);
        if (firstAvail) {
          setSelectedSlot(firstAvail.id);
        }
      }
    } catch (err) {
      console.error("Error loading slots:", err);
    } finally {
      setFetchingSlots(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedSlot) {
      setError("برجاء اختيار الساعة المناسبة للحجز.");
      return;
    }

    const trimmedName = name.trim();
    const normalizedPhone = normalizePhoneNumber(phone);

    if (!trimmedName) {
      setError("اكتب اسمك الأول يا صاحبي.");
      return;
    }

    if (!isValidEgyptianPhone(normalizedPhone)) {
      setError("رقم الموبايل لازم يكون 11 رقم يا صاحبي 📱");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingDate: dateStr,
          timeSlot: selectedSlot,
          customerName: trimmedName,
          customerPhone: normalizedPhone,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBookingSuccess(data.booking);
      } else {
        setError(data.error || "حصلت مشكلة بسيطة، جرّب تاني.");
        // Refresh slots in case slot was just taken
        loadSlots();
      }
    } catch (err) {
      console.error("Booking submission error:", err);
      setError("حصلت مشكلة بسيطة في الاتصال، جرّب تاني.");
    } finally {
      setLoading(false);
    }
  };

  // Success Confirmation Screen
  if (bookingSuccess) {
    return (
      <div className="space-y-6 pt-4 pb-12 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-950/80 border-2 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-950/50 mb-1">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            خالصة يا صاحبي حجزتلك ✅
          </h1>
        </div>

        {/* Ticket Card */}
        <div className="p-6 rounded-3xl bg-zinc-900 border-2 border-emerald-500/30 text-center space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-1/2 translate-x-1/2 w-40 h-20 bg-emerald-500/10 blur-2xl pointer-events-none" />

          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
              معاد الحجز
            </span>
            <p className="text-xl font-bold text-white">{formattedDate}</p>
          </div>

          <div className="py-4 border-y border-zinc-800 space-y-1">
            <span className="text-sm font-medium text-zinc-400">الساعة المحددة:</span>
            <div className="text-4xl md:text-5xl font-black text-emerald-400 tracking-tight pt-1">
              {bookingSuccess.time_slot_label}
            </div>
            <p className="text-xs text-emerald-300/80 pt-1">ميعادك مؤكد ومحجوز باسمك</p>
          </div>

          <div className="text-sm text-zinc-300 space-y-1 pt-1">
            <p className="font-semibold text-white">{bookingSuccess.customer_name}</p>
            <p className="text-xs text-zinc-400 font-mono" dir="ltr">
              {bookingSuccess.customer_phone}
            </p>
          </div>
        </div>

        {/* Contact info */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2.5 text-center text-sm shadow-sm">
          <p className="font-bold text-emerald-300 flex items-center justify-center gap-2">
            <PhoneCall className="w-4 h-4 text-emerald-400" />
            <span>رزق هيتصل بيك لما ييجي ميعادك</span>
          </p>
          <p className="text-xs text-zinc-400">لو عاوز تلغي الحجز رن على رزق</p>
          <div className="pt-1 flex items-center justify-center gap-2.5 flex-wrap">
            <a
              href="tel:01211292518"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-emerald-400 border border-zinc-800 hover:border-emerald-500/50 font-mono text-sm font-bold transition shadow-xs cursor-pointer"
              dir="ltr"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>01211292518</span>
            </a>
            <a
              href="https://wa.me/201211292518"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-600/50 hover:border-emerald-500 text-sm font-bold transition shadow-xs cursor-pointer group"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
              <span>واتساب رزق</span>
            </a>
          </div>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition text-center"
          >
            <Home className="w-5 h-5" />
            <span>الرجوع للصفحة الرئيسية</span>
          </Link>
        </div>
      </div>
    );
  }

  // Booking Form
  return (
    <div className="space-y-6 pt-2 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition p-1"
        >
          <ChevronRight className="w-5 h-5" />
          <span>رجوع للأيام</span>
        </Link>
      </div>

      {/* Selected Day Info */}
      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400 shrink-0">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs text-zinc-400 font-medium">اليوم المختار للحجز:</span>
          <h2 className="text-lg font-bold text-white">{formattedDate}</h2>
        </div>
      </div>

      {/* Section Title */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-white">اختر ساعتك واحجز دورك</h1>
        <p className="text-xs text-zinc-400">
          اختار الساعة المناسبة ليك من 3 عصراً لحد 12 منتصف الليل.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-sm flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <p className="font-medium leading-normal">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Hourly Slot Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-zinc-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>الساعة المناسبة للحجز</span>
          </label>

          {fetchingSlots ? (
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-zinc-900 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {slots.map((s) => {
                const isSelected = selectedSlot === s.id;
                const isAvail = s.available;

                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={!isAvail}
                    onClick={() => setSelectedSlot(s.id)}
                    className={`h-12 px-3 rounded-xl border font-bold text-sm flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950/50 scale-[1.02]"
                        : isAvail
                        ? "bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-850"
                        : "bg-zinc-950 border-zinc-900 text-zinc-600 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <span>{s.label}</span>
                    <span className="text-[11px] font-medium">
                      {isSelected ? "محدد ✓" : isAvail ? "متاح" : "محجوز"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-zinc-200">الاسم</label>
          <div className="relative">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اكتب اسمك"
              className="w-full h-13 px-4 pl-11 rounded-2xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 font-medium text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              <User className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-zinc-200">رقم الموبايل</label>
          <div className="relative">
            <input
              type="tel"
              inputMode="tel"
              maxLength={11}
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              dir="ltr"
              className="w-full h-13 px-4 pr-11 rounded-2xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 font-mono text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition text-right"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              <Phone className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500">
            الحلاق هيرن على الرقم ده قبل ميعادك على طول (11 رقم).
          </p>
        </div>

        <div className="pt-3">
          <button
            type="submit"
            disabled={loading || !selectedSlot}
            className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition cursor-pointer"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>جاري حجز ميعادك...</span>
              </div>
            ) : (
              <span>احجزلي</span>
            )}
          </button>
        </div>
      </form>

      {/* Info Notice */}
      <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/40 text-center space-y-1 text-xs text-zinc-400">
        <p className="font-semibold text-zinc-300">مفيش أي تعقيد أو تسجيل حساب</p>
        <p className="text-zinc-500">ميعادك بالساعة هيتأكد فوراً ومحفوظ برقم تليفونك.</p>
      </div>
    </div>
  );
}
