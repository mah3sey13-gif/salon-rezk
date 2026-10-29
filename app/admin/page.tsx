"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Scissors,
  Phone,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  PenLine,
  ArrowRightLeft,
  Trash2,
  Megaphone,
  RefreshCw,
  Check,
  KeyRound,
  ShieldCheck,
  RotateCcw,
  Clock,
  Archive,
  CalendarClock,
  Layers,
  Search,
  ChevronRight,
  Home,
  LogOut,
} from "lucide-react";
import {
  normalizePhoneNumber,
  isValidEgyptianPhone,
  TIME_SLOTS,
  formatArabicDate,
  formatDateToIso,
  getNowCairo,
  DAY_NAMES_AR,
  getWhatsAppUrl,
} from "@/lib/utils";

interface DayTabItem {
  date: string;
  day_name_ar: string;
  formatted_date_ar: string;
  is_today: boolean;
  is_closed: boolean;
  total_booked: number;
  can_book: boolean;
}

interface BookingItem {
  id: string;
  booking_date: string;
  time_slot: string;
  time_slot_label: string;
  customer_name: string;
  customer_phone: string;
  queue_position: number;
  status: "active" | "rescheduled" | "completed" | "cancelled";
  admin_notes?: string;
}

interface HourlySlotItem {
  slot_index: number;
  time_id: string;
  label: string;
  time_ar: string;
  booking: BookingItem | null;
}

interface DayData {
  bookings: BookingItem[];
  hourlySchedule: HourlySlotItem[];
  totalActive: number;
  maxCapacity: number;
  formattedDateAr: string;
  isClosed: boolean;
  closeReason?: string | null;
}

interface AnnouncementItem {
  id: string;
  message: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();

  // Auth & loading
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Day selection & data
  const [days, setDays] = useState<DayTabItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  // Notifications
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Modals
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [newAnnouncementText, setNewAnnouncementText] = useState("");

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const [editingBooking, setEditingBooking] = useState<BookingItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSlot, setEditSlot] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const [movingBooking, setMovingBooking] = useState<BookingItem | null>(null);
  const [targetMoveDate, setTargetMoveDate] = useState("");
  const [targetMoveSlot, setTargetMoveSlot] = useState("");

  const [closingDayDate, setClosingDayDate] = useState<string | null>(null);
  const [closeReasonInput, setCloseReasonInput] = useState("");

  // Archive state
  const [currentView, setCurrentView] = useState<"dashboard" | "archive">("dashboard");
  const [allArchiveBookings, setAllArchiveBookings] = useState<BookingItem[]>([]);
  const [selectedArchiveDate, setSelectedArchiveDate] = useState<string>("all");
  const [archiveFilter, setArchiveFilter] = useState<"all" | "active" | "completed" | "cancelled">("all");
  const [archiveSearch, setArchiveSearch] = useState<string>("");
  const [archiveLoading, setArchiveLoading] = useState<boolean>(false);

  const loadArchiveData = async () => {
    setArchiveLoading(true);
    try {
      const res = await fetch("/api/admin/bookings?archive=true");
      if (res.ok) {
        const data = await res.json();
        setAllArchiveBookings(data.bookings || []);
      }
    } catch (err) {
      console.error("Error loading archive bookings:", err);
    } finally {
      setArchiveLoading(false);
    }
  };

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorToast(msg);
      setSuccessToast(null);
    } else {
      setSuccessToast(msg);
      setErrorToast(null);
    }
    setTimeout(() => {
      setErrorToast(null);
      setSuccessToast(null);
    }, 4000);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/auth");
      const data = await res.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
        loadInitialData();
      } else {
        router.push("/admin/login");
      }
    } catch {
      router.push("/admin/login");
    }
  };

  const loadInitialData = async () => {
    setInitialLoading(true);
    try {
      const res = await fetch("/api/days");
      const data = await res.json();
      const loadedDays = data.days || [];
      setDays(loadedDays);

      if (loadedDays.length > 0) {
        const first = loadedDays[0].date;
        setSelectedDate(first);
        await fetchDayBookings(first);
      }

      await fetchAnnouncements();
    } catch (err) {
      console.error("Error loading initial data:", err);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchDayBookings = async (date: string) => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/bookings?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setDayData(data);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const refreshDaysTabs = async () => {
    try {
      const res = await fetch("/api/days");
      const data = await res.json();
      setDays(data.days || []);
    } catch (err) {
      console.error("Error refreshing days tabs:", err);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/admin/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
    }
  };

  // Status toggle
  const handleUpdateStatus = async (id: string, status: "active" | "completed" | "cancelled") => {
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", id, status }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          status === "completed"
            ? "تم تعليم الحجز كمكتمل ✅"
            : "تم تحديث حالة الحجز"
        );
        fetchDayBookings(selectedDate);
        refreshDaysTabs();
      } else {
        showToast(data.error || "فشل في تحديث الحالة", true);
      }
    } catch {
      showToast("حدث خطأ في الاتصال", true);
    }
  };

  // Reset Day
  const handleResetDay = async () => {
    if (!dayData) return;
    const confirmed = window.confirm(
      `هل أنت متأكد من تصفير ومسح جميع مواعيد يوم (${dayData.formattedDateAr}) بالكامل؟\nسيتم فتح الـ 10 ساعات للحجز من جديد.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/bookings?date=${selectedDate}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast("تم تصفير ومسح جميع مواعيد اليوم بنجاح 🧹");
        fetchDayBookings(selectedDate);
        refreshDaysTabs();
      } else {
        showToast(data.error || "فشل في تصفير مواعيد اليوم", true);
      }
    } catch {
      showToast("حدث خطأ في الاتصال بالسيرفر", true);
    }
  };

  // Edit Booking
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    const normPhone = normalizePhoneNumber(editPhone);
    if (!editName.trim()) {
      showToast("اسم الزبون مطلوب", true);
      return;
    }
    if (!isValidEgyptianPhone(normPhone)) {
      showToast("رقم الموبايل لازم يكون 11 رقم يا صاحبي 📱", true);
      return;
    }

    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit",
          id: editingBooking.id,
          name: editName.trim(),
          phone: normPhone,
          timeSlot: editSlot,
          adminNotes: editNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("تم حفظ التعديلات بنجاح");
        setEditingBooking(null);
        fetchDayBookings(selectedDate);
      } else {
        showToast(data.error || "فشل في التعديل", true);
      }
    } catch {
      showToast("حدث خطأ في الاتصال", true);
    }
  };

  // Move Booking
  const handleConfirmMove = async () => {
    if (!movingBooking || !targetMoveDate) return;

    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "move",
          id: movingBooking.id,
          targetDate: targetMoveDate,
          targetTimeSlot: targetMoveSlot || movingBooking.time_slot,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("تم نقل الحجز بنجاح");
        setMovingBooking(null);
        fetchDayBookings(selectedDate);
        refreshDaysTabs();
      } else {
        showToast(data.error || "فشل في نقل الحجز", true);
      }
    } catch {
      showToast("حدث خطأ في الاتصال", true);
    }
  };

  // Day Closed Status
  const handleToggleDayClosed = async (isClosed: boolean, reason?: string) => {
    try {
      const res = await fetch("/api/admin/days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingDate: selectedDate,
          isClosed,
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(isClosed ? "تم إغلاق اليوم" : "تم فتح اليوم للحجوزات");
        setClosingDayDate(null);
        setCloseReasonInput("");
        fetchDayBookings(selectedDate);
        refreshDaysTabs();
      } else {
        showToast(data.error || "فشل في تغيير حالة اليوم", true);
      }
    } catch {
      showToast("حدث خطأ في الاتصال", true);
    }
  };

  // Announcements
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncementText.trim()) return;

    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newAnnouncementText.trim(),
          isActive: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewAnnouncementText("");
        fetchAnnouncements();
        showToast("تم نشر التنبيه للزبائن");
      }
    } catch {
      showToast("فشل في حفظ التنبيه", true);
    }
  };

  const handleToggleAnnouncement = async (id: string, currentStatus: boolean) => {
    const item = announcements.find((a) => a.id === id);
    if (!item) return;

    try {
      await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          message: item.message,
          isActive: !currentStatus,
        }),
      });
      fetchAnnouncements();
    } catch {
      showToast("فشل في تحديث حالة التنبيه", true);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" });
      fetchAnnouncements();
      showToast("تم حذف التنبيه");
    } catch {
      showToast("فشل في حذف التنبيه", true);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ text: "برجاء ملء جميع حقول كلمة السر", isError: true });
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setPasswordMsg({ text: "كلمة السر الجديدة وتأكيدها غير متطابقين", isError: true });
      return;
    }

    if (newPassword.trim().length < 3) {
      setPasswordMsg({ text: "كلمة السر يجب أن تكون 3 خانات على الأقل", isError: true });
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currPassword.trim(),
          newPassword: newPassword.trim(),
          confirmPassword: confirmPassword.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordMsg({ text: "تم تغيير كلمة السر بنجاح ✅", isError: false });
        setCurrPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordMsg(null);
        }, 1500);
      } else {
        setPasswordMsg({ text: data.error || "فشل في تغيير كلمة السر", isError: true });
      }
    } catch {
      setPasswordMsg({ text: "حدث خطأ في الاتصال بالسيرفر", isError: true });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  };

  if (isAuthenticated === null || initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-sm text-zinc-400 font-medium">جاري تحميل لوحة التحكم...</p>
      </div>
    );
  }

  const hourlySchedule = dayData?.hourlySchedule || [];
  const completedBookings =
    dayData?.bookings.filter((b) => b.status === "completed") || [];
  const cancelledBookings =
    dayData?.bookings.filter((b) => b.status === "cancelled") || [];

  // Archive calculations
  const now = getNowCairo();
  const todayIso = formatDateToIso(now);
  const allPastBookings = allArchiveBookings.filter((b) => b.booking_date < todayIso);

  const pastDatesSet = new Set<string>();
  allPastBookings.forEach((b) => {
    if (b.booking_date) pastDatesSet.add(b.booking_date);
  });
  for (let i = 1; i <= 15; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 12, 0, 0);
    pastDatesSet.add(formatDateToIso(d));
  }
  const sortedPastDates = Array.from(pastDatesSet).sort((a, b) => b.localeCompare(a));

  const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12, 0, 0);
  const yesterdayIso = formatDateToIso(yesterdayDate);

  const pastDaysList = sortedPastDates.map((dateStr) => {
    const parts = dateStr.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    const dayBookings = allArchiveBookings.filter((b) => b.booking_date === dateStr);
    return {
      date: dateStr,
      dayNameAr: DAY_NAMES_AR[d.getDay()] || "",
      formattedDateAr: formatArabicDate(dateStr),
      isYesterday: dateStr === yesterdayIso,
      totalBooked: dayBookings.length,
      bookings: dayBookings,
    };
  });

  const selectedDayObj = pastDaysList.find((d) => d.date === selectedArchiveDate);

  let currentArchiveBookings: BookingItem[] = [];
  if (selectedArchiveDate === "all") {
    currentArchiveBookings = [...allPastBookings].reverse();
  } else {
    currentArchiveBookings = allArchiveBookings
      .filter((b) => b.booking_date === selectedArchiveDate)
      .sort((a, b) => (a.time_slot || "").localeCompare(b.time_slot || ""));
  }

  const q = archiveSearch.trim().toLowerCase();
  const filteredArchiveBookings = currentArchiveBookings.filter((b) => {
    if (archiveFilter === "active" && !(b.status === "active" || b.status === "rescheduled")) return false;
    if (archiveFilter === "completed" && b.status !== "completed") return false;
    if (archiveFilter === "cancelled" && b.status !== "cancelled") return false;

    if (q) {
      const matchName = (b.customer_name || "").toLowerCase().includes(q);
      const matchPhone = (b.customer_phone || "").includes(q);
      const matchSlot = (b.time_slot_label || "").includes(q);
      return matchName || matchPhone || matchSlot;
    }
    return true;
  });

  if (currentView === "archive") {
    return (
      <div className="space-y-6 pb-20 max-w-2xl mx-auto animate-in fade-in duration-200">
        {/* Archive Header */}
        <header className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <button
            onClick={() => setCurrentView("dashboard")}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs md:text-sm font-bold transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-emerald-400" />
            <span>الرجوع لجدول اليوم</span>
          </button>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition cursor-pointer"
              title="زيارة موقع الزبائن"
            >
              <Home className="w-5 h-5" />
            </Link>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-rose-400 hover:text-rose-300 border border-zinc-800 hover:border-rose-800/50 transition cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Archive Banner */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Archive className="w-4 h-4" />
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white">أرشيف الأيام السابقة</h1>
            </div>
            <p className="text-xs text-zinc-400">اختر أي يوم سابق من القائمة بالأعلى لعرض مواعيده وحجوزاته</p>
          </div>
          <div className="text-left relative z-10">
            <span className="text-2xl md:text-3xl font-black text-emerald-400 font-mono">{allPastBookings.length}</span>
            <p className="text-[10px] text-zinc-400 font-semibold">حجوزات سابقة</p>
          </div>
        </div>

        {/* Past Days Horizontal Scroll Bar (الأيام اللي ورا) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold px-1">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <CalendarClock className="w-3.5 h-3.5 text-emerald-400" />
              <span>قائمة الأيام السابقة (اضغط على اليوم):</span>
            </span>
            <span className="text-xs text-zinc-400 font-mono">{pastDaysList.length} يوم</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
            {pastDaysList.map((d) => {
              const isSel = selectedArchiveDate === d.date;
              return (
                <button
                  key={d.date}
                  onClick={() => {
                    setSelectedArchiveDate(d.date);
                    setArchiveSearch("");
                  }}
                  className={`flex-shrink-0 px-4 py-3 rounded-2xl border text-right transition cursor-pointer min-w-[115px] ${
                    isSel
                      ? "bg-emerald-950/70 border-emerald-500 text-white shadow-md shadow-emerald-950/50 ring-1 ring-emerald-500/40"
                      : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-white">{d.dayNameAr}</span>
                    {d.isYesterday ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-800 font-bold">
                        أمس
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 font-medium">سابق</span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 mb-1.5">
                    {d.formattedDateAr.split(" ").slice(1).join(" ")}
                  </div>
                  <div className="text-[11px] font-bold">
                    {d.totalBooked > 0 ? (
                      <span className={isSel ? "text-emerald-300" : "text-emerald-400"}>
                        {d.totalBooked} حجز
                      </span>
                    ) : (
                      <span className="text-zinc-600">فاضي (0)</span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* All Past Days Tab */}
            <button
              onClick={() => {
                setSelectedArchiveDate("all");
                setArchiveSearch("");
              }}
              className={`flex-shrink-0 px-4 py-3 rounded-2xl border text-right transition cursor-pointer min-w-[115px] ${
                selectedArchiveDate === "all"
                  ? "bg-emerald-950/70 border-emerald-500 text-white shadow-md shadow-emerald-950/50 ring-1 ring-emerald-500/40"
                  : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-white">كل الأيام</span>
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-[11px] text-zinc-400 mb-1.5">أرشيف مجمع</div>
              <div className="text-[11px] font-bold text-emerald-400">
                {allPastBookings.length} حجز
              </div>
            </button>
          </div>
        </div>

        {/* Selected Day Overview Card */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <span>
                  {selectedArchiveDate === "all"
                    ? "عرض كل الأيام السابقة مجمعة"
                    : selectedDayObj?.formattedDateAr || selectedArchiveDate}
                </span>
                {selectedDayObj?.isYesterday && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800">
                    أمس
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400">
                {selectedArchiveDate === "all"
                  ? `إجمالي الحجوزات السابقة: ${allPastBookings.length} حجز`
                  : `الحجوزات المسجلة في هذا اليوم: ${currentArchiveBookings.length} حجز`}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-emerald-400 font-mono font-bold">
                {currentArchiveBookings.length} حجز
              </span>
            </div>
          </div>

          {/* Search Bar inside Selected Day */}
          <div className="relative pt-1 border-t border-zinc-800/80">
            <input
              type="text"
              value={archiveSearch}
              onChange={(e) => setArchiveSearch(e.target.value)}
              placeholder="ابحث باسم الزبون أو رقم التليفون أو الساعة..."
              className="w-full h-11 pr-10 pl-16 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
            />
            <div className="absolute right-3 top-[17px] text-zinc-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            {archiveSearch && (
              <button
                onClick={() => setArchiveSearch("")}
                className="absolute left-2.5 top-[14px] text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded-lg cursor-pointer"
              >
                مسح
              </button>
            )}
          </div>

          {/* Quick Filter Badges */}
          <div className="flex gap-2 text-xs font-semibold overflow-x-auto pb-0.5 no-scrollbar">
            <button
              onClick={() => setArchiveFilter("all")}
              className={`px-3 py-1 rounded-lg border transition cursor-pointer ${
                archiveFilter === "all"
                  ? "bg-emerald-600 text-white border-emerald-500"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              الكل ({currentArchiveBookings.length})
            </button>
            <button
              onClick={() => setArchiveFilter("completed")}
              className={`px-3 py-1 rounded-lg border transition cursor-pointer ${
                archiveFilter === "completed"
                  ? "bg-blue-950 text-blue-300 border-blue-600 font-bold"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              تم الحلاقة ({currentArchiveBookings.filter((b) => b.status === "completed").length})
            </button>
            <button
              onClick={() => setArchiveFilter("active")}
              className={`px-3 py-1 rounded-lg border transition cursor-pointer ${
                archiveFilter === "active"
                  ? "bg-emerald-950 text-emerald-300 border-emerald-600 font-bold"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              نشط ({currentArchiveBookings.filter((b) => b.status === "active" || b.status === "rescheduled").length})
            </button>
            <button
              onClick={() => setArchiveFilter("cancelled")}
              className={`px-3 py-1 rounded-lg border transition cursor-pointer ${
                archiveFilter === "cancelled"
                  ? "bg-rose-950 text-rose-300 border-rose-600 font-bold"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              ملغي ({currentArchiveBookings.filter((b) => b.status === "cancelled").length})
            </button>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-2.5">
          {archiveLoading ? (
            <div className="p-8 text-center text-zinc-400 text-xs">جاري تحميل الأرشيف...</div>
          ) : filteredArchiveBookings.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/60 text-zinc-500 text-sm">
              {archiveSearch
                ? "مفيش نتائج بحث مطابقة يا صاحبي"
                : "لا توجد حجوزات مسجلة في هذا اليوم"}
            </div>
          ) : (
            filteredArchiveBookings.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-2xl border bg-zinc-900/80 border-zinc-800 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-16 text-center font-bold font-mono text-xs px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-emerald-400 shrink-0">
                    {b.time_slot_label || b.time_slot}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{b.customer_name}</span>
                      {selectedArchiveDate === "all" && (
                        <span className="text-[10px] text-zinc-400 font-mono">
                          ({formatArabicDate(b.booking_date)})
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-zinc-400" dir="ltr">
                      {b.customer_phone}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {b.status === "completed" && (
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-950/80 text-blue-300 border border-blue-800 font-semibold">
                      تم الحلاقة ✓
                    </span>
                  )}
                  {(b.status === "active" || b.status === "rescheduled") && (
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-semibold">
                      حجز مؤكد
                    </span>
                  )}
                  {b.status === "cancelled" && (
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-rose-950/80 text-rose-300 border border-rose-800 font-semibold">
                      ملغي ✕
                    </span>
                  )}
                  <a
                    href={getWhatsAppUrl(b.customer_phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/50 hover:border-emerald-500 transition group"
                    title="مراسلة واتساب"
                  >
                    <svg className="w-4 h-4 fill-emerald-400 group-hover:scale-110 transition shrink-0" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                  </a>
                  <a
                    href={`tel:${b.customer_phone}`}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 transition"
                    title="اتصال بالزبون"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shadow-inner">
            <Scissors className="w-6 h-6 transform -scale-x-100" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">إدارة صالون رزق</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Change PIN button */}
          <button
            onClick={() => {
              setShowPasswordModal(true);
              setPasswordMsg(null);
            }}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 transition cursor-pointer"
            title="تغيير كلمة السر"
          >
            <KeyRound className="w-5 h-5" />
          </button>

          {/* Archive button */}
          <button
            onClick={() => {
              setCurrentView("archive");
              loadArchiveData();
            }}
            className="p-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/50 transition cursor-pointer"
            title="الأرشيف الكامل للحجوزات"
          >
            <Archive className="w-5 h-5" />
          </button>

          {/* Announcements modal button */}
          <button
            onClick={() => setShowAnnouncementsModal(true)}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 transition relative cursor-pointer"
            title="التنبيهات الطارئة"
          >
            <Megaphone className="w-5 h-5" />
            {announcements.some((a) => a.is_active) && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-rose-400 hover:text-rose-300 border border-zinc-800 hover:border-rose-800/50 transition cursor-pointer"
            title="تسجيل الخروج"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Toast Notifications */}
      {successToast && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-sm font-medium flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {errorToast && (
        <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-sm font-medium flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Days Tabs Horizontal Scroll */}
      <div className="space-y-2">
        <div className="flex items-center justify-end text-xs text-zinc-400 font-semibold px-1">
          <span>{dayData?.totalActive || 0} من 10 مواعيد محجوزة</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
          {days.map((item) => {
            const isSelected = item.date === selectedDate;
            return (
              <button
                key={item.date}
                onClick={() => {
                  setSelectedDate(item.date);
                  fetchDayBookings(item.date);
                  setSuccessToast(null);
                  setErrorToast(null);
                }}
                className={`flex-shrink-0 px-4 py-3 rounded-2xl border text-right transition cursor-pointer min-w-[110px] ${
                  isSelected
                    ? "bg-emerald-950/60 border-emerald-500 text-white shadow-md shadow-emerald-950/40"
                    : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-white">{item.day_name_ar}</span>
                  {item.is_today && (
                    <span className="text-[10px] text-emerald-400 font-bold">اليوم</span>
                  )}
                </div>
                <div className="text-[11px] text-zinc-400 mb-1.5">
                  {item.formatted_date_ar.split(" ").slice(1).join(" ")}
                </div>
                <div className="text-[11px] font-bold">
                  {item.is_closed ? (
                    <span className="text-zinc-500">مغلق</span>
                  ) : item.total_booked >= 10 ? (
                    <span className="text-rose-400">10/10 مكتمل</span>
                  ) : (
                    <span className={isSelected ? "text-emerald-300" : "text-zinc-300"}>
                      {item.total_booked} / 10
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Overview Card */}
      {dayData && (
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <span>{dayData.formattedDateAr}</span>
                {dayData.isClosed && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800">
                    مغلق
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400">
                {dayData.closeReason
                  ? dayData.closeReason
                  : `المواعيد النشطة: ${dayData.totalActive} من ${dayData.maxCapacity}`}
              </p>
            </div>
            <button
              onClick={() => fetchDayBookings(selectedDate)}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/80">
            {dayData.isClosed ? (
              <button
                onClick={() => handleToggleDayClosed(false)}
                className="w-full py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs md:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>فتح اليوم للحجز</span>
              </button>
            ) : (
              <button
                onClick={() => setClosingDayDate(selectedDate)}
                className="w-full py-3 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 text-rose-300 border border-rose-800/40 text-xs md:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>إغلاق اليوم للطوارئ ⚠️</span>
              </button>
            )}

            <button
              onClick={handleResetDay}
              disabled={dayData.bookings.length === 0}
              className="w-full py-3 rounded-xl bg-zinc-800/90 hover:bg-rose-950/60 disabled:opacity-40 text-rose-300 hover:text-rose-200 border border-zinc-700 hover:border-rose-800/50 text-xs md:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              title="مسح وتصفير كل مواعيد هذا اليوم"
            >
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <span>تصفير اليوم</span>
            </button>
          </div>
        </div>
      )}

      {/* Hourly Schedule Timeline (10 Slots: 3 PM - 12 AM) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>جدول المواعيد بالساعة (10 مواعيد)</span>
          </h3>
          <span className="text-xs text-zinc-400">{dayData?.totalActive || 0} محجوز</span>
        </div>

        <div className="space-y-2.5">
          {hourlySchedule.map((slot) => {
            const b = slot.booking;

            if (!b) {
              // Empty Slot
              return (
                <div
                  key={slot.time_id}
                  className="p-3.5 rounded-2xl border border-zinc-800/60 bg-zinc-950/50 flex items-center justify-between text-zinc-400"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 text-center font-bold font-mono text-sm px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                      {slot.label}
                    </div>
                    <span className="text-xs text-zinc-500 font-medium">ساعة متاحة للحجز</span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-xl bg-emerald-950/40 text-emerald-400 border border-emerald-800/30 font-semibold">
                    فاضية 🟢
                  </span>
                </div>
              );
            }

            // Booked Slot
            return (
              <div
                key={slot.time_id}
                className="p-4 rounded-2xl border transition shadow-sm space-y-3 bg-zinc-900 border-emerald-500/30 hover:border-emerald-500/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-16 text-center font-black font-mono text-sm px-2 py-2 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 shrink-0">
                      {slot.label}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-white">{b.customer_name}</span>
                        {b.status === "rescheduled" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                            معدل
                          </span>
                        )}
                      </div>
                      <a
                        href={`tel:${b.customer_phone}`}
                        className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-emerald-400 font-mono transition"
                        dir="ltr"
                      >
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{b.customer_phone}</span>
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={getWhatsAppUrl(b.customer_phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/50 hover:border-emerald-500 transition group flex items-center justify-center shadow-xs"
                      title="مراسلة الزبون على واتساب"
                    >
                      <svg className="w-4 h-4 fill-emerald-400 group-hover:scale-110 transition shrink-0" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                      </svg>
                    </a>

                    <a
                      href={`tel:${b.customer_phone}`}
                      className="p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition shrink-0"
                      title="اتصال بالزبون"
                    >
                      <PhoneCall className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {b.admin_notes && (
                  <div className="text-xs text-zinc-400 bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/40">
                    📝 {b.admin_notes}
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex items-center justify-end pt-2 border-t border-zinc-800/60 gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleUpdateStatus(b.id, "completed")}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تم الحلاقة</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingBooking(b);
                      setEditName(b.customer_name);
                      setEditPhone(b.customer_phone);
                      setEditSlot(b.time_slot);
                      setEditNotes(b.admin_notes || "");
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                  >
                    <PenLine className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>

                  <button
                    onClick={() => {
                      setMovingBooking(b);
                      setTargetMoveDate(
                        days.find((d) => d.date !== selectedDate && d.can_book)?.date || ""
                      );
                      setTargetMoveSlot(b.time_slot);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>نقل</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من إلغاء حجز ${b.customer_name}؟`)) {
                        handleUpdateStatus(b.id, "cancelled");
                      }
                    }}
                    className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 transition cursor-pointer"
                    title="إلغاء الحجز"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed Bookings Section */}
      {completedBookings.length > 0 && (
        <div className="pt-4 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span>المواعيد المكتملة اليوم (تمت الحلاقة بنجاح)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-950 text-blue-400 border border-blue-800">
                {completedBookings.length}
              </span>
            </h3>
          </div>

          <div className="space-y-2">
            {completedBookings.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl border bg-zinc-950/80 border-blue-900/30 text-zinc-300 flex items-center justify-between gap-3 shadow-inner"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800/50 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">
                    ✓
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-zinc-200 line-through opacity-80">
                        {item.customer_name}
                      </span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                        الساعة {item.time_slot_label}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-zinc-500" dir="ltr">
                      {item.customer_phone}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={getWhatsAppUrl(item.customer_phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/50 hover:border-emerald-500 transition group flex items-center justify-center"
                    title="مراسلة واتساب"
                  >
                    <svg className="w-3.5 h-3.5 fill-emerald-400 group-hover:scale-110 transition shrink-0" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                  </a>
                  <a
                    href={`tel:${item.customer_phone}`}
                    className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 transition"
                    title="اتصال"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => handleUpdateStatus(item.id, "active")}
                    className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs transition cursor-pointer"
                    title="إعادة للجدول النشط"
                  >
                    إرجاع للجدول
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancelled Bookings Accordion */}
      {cancelledBookings.length > 0 && (
        <div className="pt-2">
          <details className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/50 text-xs text-zinc-400 space-y-2">
            <summary className="font-semibold cursor-pointer text-zinc-400 hover:text-zinc-300">
              المواعيد الملغاة لهذا اليوم ({cancelledBookings.length})
            </summary>
            <div className="space-y-2 pt-2">
              {cancelledBookings.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800/60"
                >
                  <span className="line-through text-zinc-500">{item.customer_name} ({item.time_slot_label})</span>
                  <span className="font-mono text-zinc-500" dir="ltr">
                    {item.customer_phone}
                  </span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* MODAL 1: Change PIN */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-400" />
                <span>تغيير كلمة السر</span>
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordMsg(null);
                }}
                className="text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <p className="text-xs text-zinc-400">
                تغيير كلمة السر الخاصة بالدخول إلى لوحة التحكم (الافتراضية: 1991).
              </p>

              {passwordMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    passwordMsg.isError
                      ? "bg-rose-950/70 text-rose-300 border border-rose-800/50"
                      : "bg-emerald-950/70 text-emerald-300 border border-emerald-800/50"
                  }`}
                >
                  {passwordMsg.isError ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">كلمة السر الحالية</label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  placeholder="اكتب كلمة السر الحالية..."
                  className="w-full h-11 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">كلمة السر الجديدة</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="كلمة السر الجديدة..."
                  className="w-full h-11 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">تأكيد كلمة السر الجديدة</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد كتابة كلمة السر..."
                  className="w-full h-11 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {passwordLoading ? (
                    <span>جاري الحفظ...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-white" />
                      <span>حفظ كلمة السر</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordMsg(null);
                  }}
                  className="px-5 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Booking */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PenLine className="w-5 h-5 text-emerald-400" />
                <span>تعديل حجز: {editingBooking.customer_name}</span>
              </h3>
              <button
                onClick={() => setEditingBooking(null)}
                className="text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">الاسم</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">رقم الموبايل (11 رقماً)</label>
                <input
                  type="tel"
                  inputMode="tel"
                  maxLength={11}
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  dir="ltr"
                  className="w-full h-11 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-right"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">الساعة المحددة</label>
                <select
                  value={editSlot}
                  onChange={(e) => setEditSlot(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {TIME_SLOTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} ({s.time_ar})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">ملاحظات الحلاق</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="ملاحظات..."
                  className="w-full h-11 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition cursor-pointer"
                >
                  حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="px-5 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Move Booking */}
      {movingBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
                <span>نقل حجز: {movingBooking.customer_name}</span>
              </h3>
              <button
                onClick={() => setMovingBooking(null)}
                className="text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              اختر اليوم والساعة الجديدة لنقل الزبون إليها.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">اختر اليوم</label>
              <select
                value={targetMoveDate}
                onChange={(e) => setTargetMoveDate(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm"
              >
                {days.filter((d) => !d.is_closed).map((d) => (
                  <option key={d.date} value={d.date}>
                    {d.day_name_ar} ({d.formatted_date_ar})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">اختر الساعة</label>
              <select
                value={targetMoveSlot}
                onChange={(e) => setTargetMoveSlot(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm"
              >
                {TIME_SLOTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({s.time_ar})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                disabled={!targetMoveDate}
                onClick={handleConfirmMove}
                className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-sm transition cursor-pointer"
              >
                تأكيد النقل
              </button>
              <button
                onClick={() => setMovingBooking(null)}
                className="px-5 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm transition cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Emergency Announcements */}
      {showAnnouncementsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <span>إدارة التنبيهات الطارئة للزبائن</span>
              </h3>
              <button
                onClick={() => setShowAnnouncementsModal(false)}
                className="text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              أي تنبيه مفعل يظهر فوراً في أعلى صفحة الزبائن الرئيسية باللون الأحمر.
            </p>

            <form onSubmit={handlePostAnnouncement} className="space-y-2">
              <textarea
                rows={3}
                required
                value={newAnnouncementText}
                onChange={(e) => setNewAnnouncementText(e.target.value)}
                placeholder="اكتب التنبيه الطارئ... مثلاً: ⚠️ حصل ظرف طارئ وتم تعديل الحجوزات. تواصل مع الحلاق لمعرفة التفاصيل."
                className="w-full p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
              />
              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm transition cursor-pointer"
              >
                نشر تنبيه جديد
              </button>
            </form>

            <div className="space-y-2.5 pt-2 border-t border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-300">التنبيهات السابقة</h4>
              {announcements.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-3">لا توجد تنبيهات حالياً</p>
              ) : (
                announcements.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 ${
                      item.is_active
                        ? "bg-rose-950/30 border-rose-500/40 text-rose-200"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400"
                    }`}
                  >
                    <div className="space-y-1 text-xs leading-relaxed">
                      <p className="font-medium">{item.message}</p>
                      <span className="text-[10px] text-zinc-500">
                        {item.is_active ? "✅ مفعل ويظهر للزبائن" : "مغلق"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleToggleAnnouncement(item.id, item.is_active)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition cursor-pointer"
                      >
                        {item.is_active ? "إخفاء" : "تفعيل"}
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(item.id)}
                        className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Emergency Day Close */}
      {closingDayDate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-rose-800/40 rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>إغلاق اليوم للطوارئ</span>
              </h3>
              <button
                onClick={() => setClosingDayDate(null)}
                className="text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              سيتم إيقاف الحجوزات لهذا اليوم ويظهر للزبائن أنه مغلق.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">سبب الإغلاق (اختياري)</label>
              <input
                type="text"
                value={closeReasonInput}
                onChange={(e) => setCloseReasonInput(e.target.value)}
                placeholder="مثال: ظرف طارئ / صيانة"
                className="w-full h-11 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => handleToggleDayClosed(true, closeReasonInput.trim() || undefined)}
                className="flex-1 h-12 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition cursor-pointer"
              >
                تأكيد الإغلاق
              </button>
              <button
                onClick={() => setClosingDayDate(null)}
                className="px-5 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm transition cursor-pointer"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
