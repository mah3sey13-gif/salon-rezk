"use client";

import { useState, useEffect } from "react";
import { Sparkles, Check, X, Share, PlusSquare, Smartphone, Download, ArrowDown } from "lucide-react";

export default function AppDownloadButtons() {
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua) && !(window as any).MSStream);
    setIsAndroid(/android/.test(ua));
  }, []);

  const handleAndroidClick = () => {
    if ((window as any).__salonDeferredPrompt) {
      (window as any).__salonDeferredPrompt.prompt();
    } else {
      setShowAndroidModal(true);
    }
  };

  const handleIOSClick = () => {
    setShowIOSModal(true);
  };

  return (
    <div className="pt-2 pb-4">
      {/* Container Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-b from-[#141417] to-[#0c0c0e] border border-zinc-800/90 shadow-xl relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 right-1/4 w-32 h-20 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-3.5 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>تطبيق صالون رزق الرسمي</span>
          </div>
          <h4 className="font-bold text-white text-sm">نزّل التطبيق على تليفونك لحجز أسرع</h4>
          <p className="text-[11px] text-zinc-400">بدون لف ودوران، يشتغل على الآيفون والأندرويد بضغطة واحدة</p>
        </div>

        {/* The Two Download Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* 🍏 Apple (iOS) Button */}
          <button
            onClick={handleIOSClick}
            type="button"
            className={`group relative flex items-center justify-center gap-2.5 px-3.5 py-3 rounded-2xl border transition-all duration-200 active:scale-95 ${
              isIOS
                ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-600 text-white shadow-lg ring-2 ring-emerald-500/40"
                : "bg-zinc-900/90 hover:bg-zinc-800/90 border-zinc-800 text-zinc-200 hover:text-white"
            }`}
          >
            {/* Apple Logo SVG */}
            <svg
              className="w-6 h-6 fill-current text-white flex-shrink-0 group-hover:scale-110 transition-transform"
              viewBox="0 0 24 24"
            >
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.92.04-2.02.62-2.67 1.38-.58.67-1.09 1.74-0.96 2.78 1.03.08 2.08-.53 2.71-1.29z" />
            </svg>
            <div className="text-right min-w-0">
              <span className="block text-[10px] text-zinc-400 font-medium leading-none">تحميل لـ</span>
              <span className="block text-xs font-bold text-white mt-1">الآيفون (iOS)</span>
            </div>
          </button>

          {/* 🤖 Android Button */}
          <button
            onClick={handleAndroidClick}
            type="button"
            className={`group relative flex items-center justify-center gap-2.5 px-3.5 py-3 rounded-2xl border transition-all duration-200 active:scale-95 ${
              isAndroid
                ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-600 text-white shadow-lg ring-2 ring-emerald-500/40"
                : "bg-zinc-900/90 hover:bg-zinc-800/90 border-zinc-800 text-zinc-200 hover:text-white"
            }`}
          >
            {/* Android Robot SVG */}
            <svg
              className="w-6 h-6 fill-current text-emerald-400 flex-shrink-0 group-hover:scale-110 transition-transform"
              viewBox="0 0 24 24"
            >
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8 12 8s-3.5902.4116-5.1368.9507L4.841 5.4477a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396" />
            </svg>
            <div className="text-right min-w-0">
              <span className="block text-[10px] text-zinc-400 font-medium leading-none">تحميل لـ</span>
              <span className="block text-xs font-bold text-white mt-1">الأندرويد</span>
            </div>
          </button>
        </div>
      </div>

      {/* 🍏 iOS Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-zinc-700 text-white rounded-3xl p-5 max-w-sm w-full shadow-2xl relative animate-in slide-in-from-bottom-6 duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/30 bg-black flex items-center justify-center flex-shrink-0">
                  <img src="/icon-192.png" alt="صالون رزق" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">تثبيت تطبيق صالون رزق على الآيفون</h3>
                  <p className="text-[11px] text-zinc-400">في ثانيتين فقط وبدون App Store</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 my-4">
              <div className="flex items-start gap-3 bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800/80">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                  1
                </div>
                <div className="text-xs">
                  <p className="text-zinc-200 font-medium">
                    اضغط زرار <span className="bg-zinc-800 text-emerald-400 px-1.5 py-0.5 rounded font-semibold border border-zinc-700">المشاركة ⬆️</span> في أسفل سفاري
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">علامة المربع اللي طالع منه سهم في نص الشاشة تحت</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800/80">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                  2
                </div>
                <div className="text-xs">
                  <p className="text-zinc-200 font-medium">
                    انزل واختار <span className="bg-zinc-800 text-emerald-400 px-1.5 py-0.5 rounded font-semibold border border-zinc-700">إضافة إلى الصفحة الرئيسية ➕</span>
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">(أو Add to Home Screen)</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800/80">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                  3
                </div>
                <div className="text-xs">
                  <p className="text-zinc-200 font-medium">
                    اضغط فوق على اليمين كلمة <span className="text-emerald-400 font-bold">"إضافة" (Add)</span>
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">مبروك! 🎉 التطبيق هينزل على شاشة موبايلك كبرنامج كامل بالأيقونة الملكية.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-zinc-950 font-bold text-sm py-3 rounded-xl shadow-lg transition-all active:scale-[0.98]"
            >
              فهمت يا صاحبي، هثبته دلوقتي! ✅
            </button>
          </div>
        </div>
      )}

      {/* 🤖 Android Modal */}
      {showAndroidModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-zinc-700 text-white rounded-3xl p-5 max-w-sm w-full shadow-2xl relative animate-in slide-in-from-bottom-6 duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/30 bg-black flex items-center justify-center flex-shrink-0">
                  <img src="/icon-192.png" alt="صالون رزق" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">تثبيت تطبيق صالون رزق للأندرويد</h3>
                  <p className="text-[11px] text-zinc-400">تثبيت فوري وخفيف على جهازك</p>
                </div>
              </div>
              <button
                onClick={() => setShowAndroidModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 my-4">
              <div className="flex items-start gap-3 bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800/80">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                  1
                </div>
                <div className="text-xs">
                  <p className="text-zinc-200 font-medium">
                    اضغط على <span className="bg-zinc-800 text-emerald-400 px-1.5 py-0.5 rounded font-semibold border border-zinc-700">الثلاث نقاط ⋮</span> أعلى يمين أو يسار المتصفح
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800/80">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                  2
                </div>
                <div className="text-xs">
                  <p className="text-zinc-200 font-medium">
                    اختار <span className="bg-zinc-800 text-emerald-400 px-1.5 py-0.5 rounded font-semibold border border-zinc-700">تثبيت التطبيق 📲 (Install App)</span>
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">أو "إضافة إلى الشاشة الرئيسية" (Add to Home screen)</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800/80">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                  3
                </div>
                <div className="text-xs">
                  <p className="text-zinc-200 font-medium">
                    اضغط <span className="text-emerald-400 font-bold">"تثبيت" (Install)</span>
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">مبروك! 🎉 التطبيق هيتثبت على تليفونك ويفتح شاشة كاملة بدون متصفح.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAndroidModal(false)}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-zinc-950 font-bold text-sm py-3 rounded-xl shadow-lg transition-all active:scale-[0.98]"
            >
              تمام يا صاحبي، هثبته دلوقتي! ✅
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
