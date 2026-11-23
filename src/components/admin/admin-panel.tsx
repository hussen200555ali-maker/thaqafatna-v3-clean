"use client";

/**
 * لوحة التحكم الشاملة (Admin Panel Shell)
 * ==========================================
 * الهيكل الموحّد لإدارة المنصة كاملة — المكتبة واللعبة والمجتمع
 * والنظام من قائمة واحدة، مطابقة للوحة الإدارية الموحدة:
 *
 *   • شريط جانبي داكن ثابت يميناً (RTL) — 5 مجموعات × 17 صفحة
 *     وعلى الجوال يتحول إلى Sheet منزلق من اليمين
 *   • ترويسة بيضاء: مسار تنقّل وعنوان الصفحة، بحث سريع في
 *     صفحات اللوحة، جرس إشعارات يلمع بعدد ملاحظات الجودة
 *   • منطقة محتوى بيضاء بعرض مريح — وموجّه صفحات داخلي
 *
 * شارة «مدقّق الجودة» حية من /api/admin/quality — تتحدّث بعد
 * كل تعديل من المحرر (refreshQuality) فلا تكذب على المشرف أبداً.
 */

import { useEffect, useRef, useState } from "react";
import { Bell, LogOut, Menu, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  adminNavGroups,
  adminPageMeta,
  type AdminNavItem,
  type AdminPageId,
} from "./admin-data";
import type { AdminNavigate } from "./admin-types";
import { DashboardPage } from "./pages/dashboard-page";
import { LibraryManagementPage } from "./pages/library-management-page";
import { BooksPage } from "./pages/books-page";
import { BookCategoriesPage } from "./pages/book-categories-page";
import { BookChaptersPage } from "./pages/book-chapters-page";
import { GameChaptersPage } from "./pages/game-chapters-page";
import { LevelEditorPage } from "./pages/level-editor-page";
import { DailyChallengePage } from "./pages/daily-challenge-page";
import { QualityPage } from "./pages/quality-page";
import { DifficultyPage } from "./pages/difficulty-page";
import { SkillTreePage } from "./pages/skill-tree-page";
import { PlayersPage } from "./pages/players-page";
import { ReviewsPage } from "./pages/reviews-page";
import { MessagesPage } from "./pages/messages-page";
import { RolesPage } from "./pages/roles-page";
import { AuditPage } from "./pages/audit-page";
import { ReportsPage } from "./pages/reports-page";
import { AdminSettingsPage } from "./pages/admin-settings-page";

interface AdminPanelProps {
  /** العودة إلى تطبيق اللاعب */
  onExit: () => void;
}

export function AdminPanel({ onExit }: AdminPanelProps) {
  const [activePage, setActivePage] = useState<AdminPageId>("dashboard");
  /** المرحلة المفتوحة في المحرر — تنتقل مع التنقل من صفحات أخرى */
  const [editorLevelId, setEditorLevelId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  /** عدد ملاحظات الجودة — يغذي الشارة والجرس */
  const [qualityTotal, setQualityTotal] = useState<number | null>(null);
  const [qualityTick, setQualityTick] = useState(0);
  /** عدد الرسائل الجديدة — يغذي شارة الرسائل */
  const [newMessages, setNewMessages] = useState<number | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  /* جلب ملخص الجودة — عند الفتح وبعد كل تعديل في المحرر */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/admin/quality");
        const data = (await response.json()) as {
          ok: boolean;
          summary?: { total: number };
        };
        if (!cancelled && data.ok && data.summary) {
          setQualityTotal(data.summary.total);
        }
      } catch {
        /* الجرس صامت عند تعذر الاتصال — لا يزعج المشرف */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [qualityTick]);

  /* جلب عدد الرسائل الجديدة — مرة عند فتح اللوحة (يخفي الشارة إن صفر) */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/admin/messages");
        const data = (await response.json()) as {
          ok: boolean;
          counts?: { new: number };
        };
        if (!cancelled && data.ok && data.counts) {
          setNewMessages(data.counts.new);
        }
      } catch {
        /* الشارة تختفي عند تعذر الاتصال — لا يزعج المشرف */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** التنقل الموحّد — يغلق القوائم ويحمل معرّف المرحلة للمحرر */
  const navigate: AdminNavigate = (page, levelId) => {
    if (page === "level-editor") {
      setEditorLevelId(levelId ?? null);
    }
    setActivePage(page as AdminPageId);
    setMobileNavOpen(false);
    setQuery("");
    setSearchOpen(false);
  };

  /** طلب إعادة فحص الجودة — تستدعيه الصفحات بعد كل تعديل */
  const refreshQuality = () => setQualityTick((tick) => tick + 1);

  /* نتائج البحث السريع — صفحات اللوحة المطابقة */
  const trimmedQuery = query.trim();
  const searchMatches: AdminNavItem[] = trimmedQuery
    ? adminNavGroups.flatMap((group) =>
        group.items.filter((item) => item.title.includes(trimmedQuery)),
      )
    : [];

  const meta = adminPageMeta[activePage];
  const groupLabel =
    adminNavGroups.find((group) =>
      group.items.some((item) => item.id === activePage),
    )?.label ?? "";

  /* ===== محتوى الشريط الجانبي — يتشاركه سطح المكتب والجوال ===== */
  const navContent = (onNavigate: (page: AdminPageId) => void) => (
    <AdminNavContent
      activePage={activePage}
      qualityTotal={qualityTotal}
      newMessages={newMessages}
      onNavigate={onNavigate}
      onExit={onExit}
    />
  );

  return (
    <div
      className="fixed inset-0 z-[70] flex bg-sand"
      role="dialog"
      aria-modal="true"
      aria-label="لوحة التحكم الشاملة"
    >
      {/* الشريط الجانبي — ثابت يميناً على الشاشات الكبيرة */}
      <aside className="fixed bottom-0 right-0 top-0 z-30 hidden w-72 flex-col bg-heritage-950 lg:flex">
        {navContent(navigate)}
      </aside>

      {/* العمود الرئيسي — مزاح بعرض الشريط على الشاشات الكبيرة */}
      <div className="flex h-dvh min-w-0 flex-1 flex-col lg:pr-72">
        {/* الترويسة */}
        <header className="sticky top-0 z-20 shrink-0 border-b border-heritage-900/8 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 lg:px-8">
            {/* المسار والعنوان */}
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                aria-label="فتح قائمة التنقل"
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-sand text-heritage-800 transition-transform duration-150 active:scale-90 lg:hidden"
              >
                <Menu className="size-4.5" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-medium text-muted-foreground">
                  لوحة التحكم الشاملة
                  <span className="mx-1" aria-hidden="true">
                    •
                  </span>
                  {groupLabel}
                </p>
                <h1 className="truncate font-heading text-base font-extrabold text-heritage-900 lg:text-lg">
                  {meta.title}
                </h1>
              </div>
            </div>

            {/* البحث والإشعارات والخروج */}
            <div className="flex shrink-0 items-center gap-2">
              <div className="relative" ref={searchRef}>
                <Input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSearchOpen(Boolean(event.target.value.trim()));
                  }}
                  onFocus={() => {
                    if (query.trim()) setSearchOpen(true);
                  }}
                  onBlur={() =>
                    setTimeout(() => setSearchOpen(false), 150)
                  }
                  placeholder="ابحث سريعاً..."
                  aria-label="بحث في صفحات اللوحة"
                  className="h-9 w-36 pl-8 text-xs lg:w-60"
                />
                <Search
                  className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                {searchOpen && searchMatches.length > 0 && (
                  <div className="absolute left-0 top-11 z-30 w-60 overflow-hidden rounded-xl border border-heritage-900/10 bg-white py-1 shadow-card">
                    {searchMatches.slice(0, 6).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        /* onMouseDown يسبق onBlur فلا تُغلق القائمة قبل النقر */
                        onMouseDown={() => navigate(item.id)}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-heritage-900 transition-colors hover:bg-sand"
                      >
                        <item.icon
                          className="size-4 text-heritage-600"
                          aria-hidden="true"
                        />
                        {item.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate("quality")}
                aria-label={`الإشعارات — ${qualityTotal ?? 0} ملاحظة جودة`}
                className="relative grid size-9 place-items-center rounded-xl bg-white text-heritage-700 shadow-card transition-transform duration-150 hover:bg-sand active:scale-90"
              >
                <Bell className="size-4" aria-hidden="true" />
                {qualityTotal != null && qualityTotal > 0 && (
                  <span
                    className="absolute -left-1 -top-1 grid min-w-4.5 place-items-center rounded-full bg-flame-500 px-1 text-[9px] font-bold leading-4 text-white"
                    aria-hidden="true"
                  >
                    {qualityTotal.toLocaleString("ar-EG")}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={onExit}
                className="hidden items-center gap-2 rounded-xl bg-heritage-900 px-4 py-2 font-heading text-xs font-bold text-white shadow-card transition-all duration-150 hover:bg-heritage-800 active:scale-95 lg:flex"
              >
                <LogOut className="size-3.5" aria-hidden="true" />
                العودة للتطبيق
              </button>
            </div>
          </div>
        </header>

        {/* المحتوى */}
        <main className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <AdminPageRouter
            activePage={activePage}
            editorLevelId={editorLevelId}
            onPickLevel={setEditorLevelId}
            navigate={navigate}
            refreshQuality={refreshQuality}
            onExit={onExit}
          />
        </main>
      </div>

      {/* الشريط الجانبي على الجوال — Sheet من اليمين */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="right"
          aria-describedby={undefined}
          className="w-80 gap-0 border-l-0 bg-heritage-950 p-0 [&>button]:text-white/70 [&>button:hover]:text-white"
        >
          {/* عنوان مخفي — وصول قارئ الشاشة إلى قائمة التنقل */}
          <SheetTitle className="sr-only">قائمة تنقل لوحة التحكم</SheetTitle>
          {navContent(navigate)}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ============================================================
   محتوى الشريط الجانبي — العلامة والمجموعات وملف المشرف
   ============================================================ */

interface AdminNavContentProps {
  activePage: AdminPageId;
  qualityTotal: number | null;
  newMessages: number | null;
  onNavigate: (page: AdminPageId) => void;
  onExit: () => void;
}

function AdminNavContent({
  activePage,
  qualityTotal,
  newMessages,
  onNavigate,
  onExit,
}: AdminNavContentProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* العلامة — ثقافتنا */}
      <div className="flex items-center gap-3 px-5 pb-5 pt-6">
        <div
          className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-heritage-800 to-heritage-600 shadow-card"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 7v14" stroke="#D4AF37" />
            <path
              d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"
              stroke="rgba(255,255,255,0.95)"
            />
          </svg>
        </div>
        <div className="leading-tight">
          <p className="font-heading text-lg font-extrabold text-white">
            ثقافتنا
          </p>
          <p className="text-[10px] font-medium text-gold-500/80">
            لوحة التحكم الشاملة
          </p>
        </div>
      </div>

      {/* المجموعات */}
      <nav
        aria-label="تنقل لوحة التحكم"
        className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 pb-4"
      >
        {adminNavGroups.map((group) => (
          <div key={group.id}>
            <p className="px-3 pb-1.5 text-[10px] font-bold tracking-wide text-gold-500/70">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = item.id === activePage;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(item.id)}
                      aria-current={isActive ? "page" : undefined}
                      className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150 ${
                        isActive
                          ? "bg-heritage-800/80 font-bold text-white"
                          : "font-medium text-heritage-100/60 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {/* شريط التمييز الذهبي — يمين العنصر النشط */}
                      {isActive && (
                        <span
                          className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-gold-500"
                          aria-hidden="true"
                        />
                      )}
                      <item.icon
                        className={`size-4.5 shrink-0 ${
                          isActive ? "text-gold-400" : ""
                        }`}
                        aria-hidden="true"
                      />
                      <span className="flex-1 text-start">{item.title}</span>
                      {/* شارة مدقّق الجودة — حية من الفحص الفعلي */}
                      {item.id === "quality" &&
                        qualityTotal != null &&
                        qualityTotal > 0 && (
                          <span
                            className="grid min-w-5 place-items-center rounded-full bg-flame-500 px-1.5 text-[10px] font-bold leading-5 text-white"
                            aria-label={`${qualityTotal} ملاحظة جودة`}
                          >
                            {qualityTotal.toLocaleString("ar-EG")}
                          </span>
                        )}
                      {/* شارة الرسائل — حية من صندوق الوارد */}
                      {item.id === "messages" &&
                        newMessages != null &&
                        newMessages > 0 && (
                          <span
                            className="grid min-w-5 place-items-center rounded-full bg-flame-500 px-1.5 text-[10px] font-bold leading-5 text-white"
                            aria-label={`${newMessages} رسائل غير مقروءة`}
                          >
                            {newMessages.toLocaleString("ar-EG")}
                          </span>
                        )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ملف المشرف + العودة للتطبيق */}
      <div className="shrink-0 space-y-3 border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 font-heading text-xs font-extrabold text-heritage-950"
            aria-hidden="true"
          >
            م
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-bold text-white">مدير النظام</p>
            <p className="truncate text-[10px] text-heritage-100/50">
              صلاحيات كاملة
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 font-heading text-xs font-bold text-white transition-colors duration-150 hover:bg-white/20 active:scale-[0.98]"
        >
          <LogOut className="size-3.5" aria-hidden="true" />
          العودة إلى التطبيق
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   موجّه الصفحات — الصفحة النشطة حسب معرّفها
   ============================================================ */

interface AdminPageRouterProps {
  activePage: AdminPageId;
  editorLevelId: string | null;
  onPickLevel: (levelId: string) => void;
  navigate: AdminNavigate;
  refreshQuality: () => void;
  onExit: () => void;
}

function AdminPageRouter({
  activePage,
  editorLevelId,
  onPickLevel,
  navigate,
  refreshQuality,
  onExit,
}: AdminPageRouterProps) {
  switch (activePage) {
    case "dashboard":
      return <DashboardPage navigate={navigate} />;
    case "library-management":
      return <LibraryManagementPage navigate={navigate} />;
    case "books":
      return <BooksPage />;
    case "book-categories":
      return <BookCategoriesPage />;
    case "book-chapters":
      return <BookChaptersPage />;
    case "game-chapters":
      return <GameChaptersPage navigate={navigate} />;
    case "level-editor":
      return (
        <LevelEditorPage
          levelId={editorLevelId}
          onPickLevel={onPickLevel}
          refreshQuality={refreshQuality}
        />
      );
    case "daily-challenge":
      return <DailyChallengePage />;
    case "quality":
      return <QualityPage navigate={navigate} refreshQuality={refreshQuality} />;
    case "difficulty":
      return <DifficultyPage />;
    case "skill-tree":
      return <SkillTreePage />;
    case "players":
      return <PlayersPage />;
    case "reviews":
      return <ReviewsPage />;
    case "messages":
      return <MessagesPage />;
    case "roles":
      return <RolesPage />;
    case "audit":
      return <AuditPage />;
    case "reports":
      return <ReportsPage />;
    case "admin-settings":
      return <AdminSettingsPage onExit={onExit} />;
    default:
      return <DashboardPage navigate={navigate} />;
  }
}
