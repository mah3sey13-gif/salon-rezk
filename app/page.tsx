"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Scissors,
  Calendar,
  AlertTriangle,
  Search,
  ChevronLeft,
  PhoneCall,
  Phone,
  XCircle,
  MessageCircle,
} from "lucide-react";
import AppDownloadButtons from "@/components/AppDownloadButtons";

interface DayItem {
  date: string;
  day_name_ar: string;
  formatted_date_ar: string;
  is_today: boolean;
  is_closed: boolean;
  close_reason: string | null;
  can_book: boolean;
  status_key: "available" | "full" | "closed";
  status_label_ar: string;
}

interface Announcement {
  id: string;
  message: string;
  is_active: boolean;
}

export default function HomePage() {
  const [days, setDays] = useState<DayItem[]>([]);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDays = async () => {
    try {
      const res = await fetch("/api/days");
      if (res.ok) {
        const data = await res.json();
        setDays(data.days || []);
        setAnnouncement(data.announcement || null);
      }
    } catch (err) {
      console.error("Error loading days:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDays();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="text-center pt-2 pb-4 space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-inner mb-2 text-emerald-400">
          <Scissors className="w-7 h-7 transform -scale-x-100" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">صالون رزق</h1>
        <p className="text-zinc-400 text-sm md:text-base font-medium">احجز ميعادك يا صاحبي بالساعة</p>
      </header>

      {/* Emergency Announcement */}
      {announcement && announcement.is_active && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-600/40 text-rose-200 flex items-center gap-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="text-sm font-medium leading-relaxed flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-rose-300">تنبيه طارئ من رزق:</span>
            <span className="text-rose-100 font-semibold">{announcement.message}</span>
          </div>
        </div>
      )}

      {/* Track Booking Button */}
      <Link
        href="/track"
        className="w-full flex items-center justify-between p-3.5 px-4 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800/80 transition shadow-sm group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 group-hover:bg-zinc-700 transition">
            <Search className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm">متابعة حجزي</span>
        </div>
        <ChevronLeft className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition" />
      </Link>

      {/* Days List Header */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-400" />
          <span>اختر اليوم المناسب</span>
        </h2>
      </div>

      {/* Days List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7].map((item) => (
            <div
              key={item}
              className="h-24 rounded-2xl bg-zinc-900/50 border border-zinc-800/60 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {days.filter((d) => !(d as any).is_past).map((item) => {
            const canBook = item.can_book;
            let badgeStyle = "bg-emerald-950/50 text-emerald-400 border-emerald-800/50";
            let cardStyle = "border-zinc-800/80 hover:border-zinc-700 bg-zinc-900/80";

            if (item.status_key === "closed") {
              badgeStyle = "bg-rose-950/40 text-rose-300 border-rose-800/50";
              cardStyle = "border-rose-900/30 bg-zinc-950/60 opacity-85 cursor-not-allowed";
            } else if (item.status_key === "full") {
              badgeStyle = "bg-rose-950/50 text-rose-400 border-rose-800/50";
              cardStyle = "border-zinc-800/50 bg-zinc-950/60 opacity-85 cursor-not-allowed";
            }

            const cardContent = (
              <div
                className={`w-full p-4 rounded-2xl border ${cardStyle} transition flex items-center justify-between shadow-sm relative overflow-hidden`}
              >
                <div className="space-y-1.5 max-w-[70%]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base md:text-lg text-white">
                      {item.day_name_ar}
                    </span>
                    {item.is_today && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                        النهاردة
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 font-medium">{item.formatted_date_ar}</p>
                  {item.is_closed && (
                    <p className="text-xs text-rose-300 font-bold flex items-center gap-1 pt-0.5">
                      <span>⚠️ مغلق</span>
                      {item.close_reason && <span>— السبب: {item.close_reason}</span>}
                    </p>
                  )}
                </div>

                <div className="text-left">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border ${badgeStyle}`}
                  >
                    {item.is_closed ? (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>مغلق</span>
                      </>
                    ) : (
                      <span>{item.status_label_ar}</span>
                    )}
                  </div>
                </div>
              </div>
            );

            return canBook ? (
              <Link
                key={item.date}
                href={`/book/${item.date}`}
                className="block focus:outline-none focus:ring-2 focus:ring-emerald-500/40 rounded-2xl cursor-pointer"
              >
                {cardContent}
              </Link>
            ) : (
              <div key={item.date}>{cardContent}</div>
            );
          })}
        </div>
      )}

      {/* App Download Buttons for Apple iOS and Android */}
      <AppDownloadButtons />

      {/* Footer */}
      <footer className="pt-6 border-t border-zinc-900 text-center space-y-4">
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
            href="/admin"
            className="text-[11px] text-zinc-600 hover:text-zinc-400 transition underline underline-offset-4"
          >
            إدارة الصالون
          </Link>
        </div>
      </footer>
    </div>
  );
}
