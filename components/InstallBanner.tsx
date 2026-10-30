"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, Share, PlusSquare, X, Smartphone, Sparkles, Check } from "lucide-react";

export default function InstallBanner() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if already in standalone/PWA mode
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // Check dismissed state (show again after 24 hours if dismissed)
    const dismissedAt = localStorage.getItem("salon_install_dismissed_at");
    if (dismissedAt) {
      const hoursSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 24) {
        return;
      }
    }

    const ua = navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    const isAndroidDevice = /android/.test(ua);

    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);

    // Handler for Android / Desktop PWA install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).__salonDeferredPrompt = e;
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // If it's iOS, show the banner after a short delay (1.5 seconds) for a smooth entrance
    if (isIosDevice) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("salon_install_dismissed_at", Date.now().toString());
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) {
      // Fallback if browser doesn't provide prompt immediately
      alert("اضغط على الثلاث نقاط في متصفحك واختار 'تثبيت التطبيق' (Install App) 📲");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone || !showBanner) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Install Banner */}
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="bg-[#121214] border-2 border-emerald-500/40 shadow-2xl shadow-emerald-950/50 rounded-2xl p-4 text-white relative backdrop-blur-md">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute -top-2 -left-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full p-1 border border-zinc-700 shadow transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5">
            {/* App Icon */}
            <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-lg border border-emerald-500/30 flex-shrink-0 bg-black">
              <img
                src="/icon-192.png"
                alt="تطبيق صالون رزق"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white truncate">تطبيق صالون رزق</span>
                <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-medium border border-emerald-500/30">
                  <Sparkles className="w-2.5 h-2.5" />
                  مجاني
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 leading-snug truncate">
                {isIOS
                  ? "ثبّته على الآيفون لحجز أسرع ومتابعة دورك"
                  : "ثبّته على موبايلك لحجز أسرع بدون متصفح"}
              </p>
            </div>

            {/* Action Button */}
            <div className="flex-shrink-0">
              {isIOS ? (
                <button
                  onClick={() => setShowIOSModal(true)}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-zinc-950 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>تثبيت</span>
                </button>
              ) : (
                <button
                  onClick={handleAndroidInstall}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-zinc-950 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تثبيت</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* iOS Step-by-Step Installation Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-zinc-700 text-white rounded-3xl p-5 max-w-sm w-full shadow-2xl relative animate-in slide-in-from-bottom-6 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/30 bg-black flex-shrink-0">
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

            {/* Steps */}
            <div className="space-y-3.5 my-4">
              {/* Step 1 */}
              <div className="flex items-start gap-3 bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800/80">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                  1
                </div>
                <div className="text-xs">
                  <p className="text-zinc-200 font-medium flex items-center gap-1.5 flex-wrap">
                    اضغط على زرار
                    <span className="inline-flex items-center gap-1 bg-zinc-800 text-emerald-400 px-2 py-0.5 rounded-md font-semibold border border-zinc-700">
                      <Share className="w-3.5 h-3.5" />
                      المشاركة
                    </span>
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    (هتلاقيه في شريط سفاري تحت في نص الشاشة ⬆️)
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800/80">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                  2
                </div>
                <div className="text-xs">
                  <p className="text-zinc-200 font-medium flex items-center gap-1.5 flex-wrap">
                    انزل واختار
                    <span className="inline-flex items-center gap-1 bg-zinc-800 text-emerald-400 px-2 py-0.5 rounded-md font-semibold border border-zinc-700">
                      <PlusSquare className="w-3.5 h-3.5" />
                      إضافة إلى الصفحة الرئيسية
                    </span>
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    (أو Add to Home Screen)
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800/80">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                  3
                </div>
                <div className="text-xs">
                  <p className="text-zinc-200 font-medium">
                    اضغط فوق على اليمين على كلمة <span className="text-emerald-400 font-bold">"إضافة" (Add)</span>
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    مبروك! 🎉 هتلاقي التطبيق نزل على شاشتك زيه زي أي تطبيق رسمي.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <button
              onClick={() => {
                setShowIOSModal(false);
                setShowBanner(false);
                localStorage.setItem("salon_install_dismissed_at", Date.now().toString());
              }}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-zinc-950 font-bold text-sm py-3 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>فهمت يا صاحبي، هثبته دلوقتي!</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
