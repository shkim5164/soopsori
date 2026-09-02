"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { getButtonClasses } from "@/components/ui/Button";

const navLinks = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/songs", label: "곡 목록", icon: "🎵" },
  { href: "/meetings", label: "모임", icon: "📅" },
  { href: "/members", label: "회원", icon: "👥" },
  { href: "/notices", label: "공지", icon: "📢" },
  { 
    href: "https://drive.google.com/drive/folders/1xmAtHn5z-uEfpKFlc5dt23PakDcHMR16?usp=drive_link", 
    label: "악보 드라이브", 
    icon: "🎼",
    external: true
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Notifications
  const { data: notifications, mutate: mutateNotifications } = useSWR(
    session?.user ? "/api/notifications" : null,
    (url: string) => fetch(url).then((res) => res.json()),
    { refreshInterval: 60000 }
  );

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  useEffect(() => setMounted(true), []);

  return (
    <nav className="sticky top-0 z-50 bg-white neo-divider">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="font-black text-2xl sm:text-3xl tracking-tighter lowercase px-2 sm:px-3 py-1 bg-neo-yellow border-2 border-black neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:neo-shadow-sm transition-all text-black">
              soopsori
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-3">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || 
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className={`px-4 py-2 font-bold text-sm lowercase border-2 border-black rounded-full transition-all ${
                    isActive
                      ? "bg-neo-pink text-white neo-shadow-sm translate-x-[2px] translate-y-[2px]"
                      : "bg-white text-black neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:neo-shadow-sm hover:bg-neo-yellow hover:text-black"
                  }`}
                >
                  <span className="mr-1.5">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* User Area */}
          <div className="flex items-center gap-3">
            {status === "loading" ? (
              <div className="w-10 h-10 rounded-full skeleton" />
            ) : session?.user ? (
              <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <button
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-black bg-white neo-shadow-sm hover:bg-neo-yellow hover:text-black transition-all"
                  aria-label="Toggle Dark Mode"
                >
                  {mounted ? (resolvedTheme === "dark" ? "☀️" : "🌙") : "🌙"}
                </button>

                {/* Points Badge */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-neo-yellow border-2 border-black neo-shadow-sm">
                  <span className="text-sm">⭐</span>
                  <span className="text-sm font-black text-black">
                    {session.user.points ?? 0}P
                  </span>
                </div>

                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button 
                    onClick={() => {
                      setNotifOpen(!notifOpen);
                      setProfileOpen(false);
                    }}
                    className="relative w-10 h-10 flex items-center justify-center rounded-full border-2 border-black bg-white neo-shadow-sm hover:bg-neo-yellow hover:text-black transition-all"
                  >
                    🔔
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-black">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {/* Notification Dropdown */}
                  <div className={`absolute -right-4 sm:right-0 mt-2 w-[260px] sm:w-80 bg-white border-2 border-black neo-shadow-lg p-0 transition-all duration-200 transform max-h-96 overflow-y-auto z-50 ${
                    notifOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-1"
                  }`}>
                    <div className="px-3 py-2 border-b-2 border-black bg-neo-yellow flex justify-between items-center sticky top-0 z-10">
                      <p className="text-sm font-black text-black">알림</p>
                      {unreadCount > 0 && (
                        <button
                          onClick={async () => {
                            await fetch("/api/notifications/read-all", { method: "POST" });
                            mutateNotifications();
                          }}
                          className="text-xs font-bold text-black hover:underline"
                        >
                          모두 읽기
                        </button>
                      )}
                    </div>
                    {notifications && notifications.length > 0 ? (
                      <div className="flex flex-col">
                        {notifications.map((notif: any) => (
                          <div
                            key={notif.id}
                            onClick={async () => {
                              if (!notif.isRead) {
                                await fetch(`/api/notifications/${notif.id}/read`, { method: "PATCH" });
                                mutateNotifications();
                              }
                              if (notif.linkUrl) {
                                router.push(notif.linkUrl);
                              }
                              setNotifOpen(false);
                            }}
                            className={`p-3 border-b-2 border-black last:border-b-0 cursor-pointer hover:bg-neo-pink hover:text-white transition-colors ${
                              notif.isRead ? "opacity-50 text-gray-500" : "bg-white text-black"
                            }`}
                          >
                            <p className="text-sm font-medium line-clamp-2">
                              {notif.message}
                            </p>
                            <span className="text-xs opacity-70 mt-1 block">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm font-bold text-gray-500">
                        알림이 없습니다
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button 
                    onClick={() => {
                      setProfileOpen(!profileOpen);
                      setNotifOpen(false);
                    }}
                    className="flex items-center gap-2 p-0.5 rounded-full hover:scale-105 transition-transform duration-200 neo-shadow-sm border-2 border-black bg-white"
                  >
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name ?? ""}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-neo-blue flex items-center justify-center font-black text-black text-sm border-2 border-black">
                        {session.user.name?.[0] ?? "?"}
                      </div>
                    )}
                  </button>
                  {/* Dropdown */}
                  <div className={`absolute right-0 mt-2 w-48 bg-white border-2 border-black neo-shadow-lg p-2 transition-all duration-200 transform ${
                    profileOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-1"
                  }`}>
                    <div className="px-3 py-2 border-b-2 border-black mb-2 bg-neo-yellow">
                      <p className="text-sm font-black text-black truncate">
                        {session.user.name}
                      </p>
                      <p className="text-xs font-bold text-gray-700 truncate">
                        {session.user.email}
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="block px-3 py-2 text-sm font-bold text-black hover:bg-neo-pink hover:text-white rounded-none border-2 border-transparent hover:border-black transition-colors mb-1"
                    >
                      👤 프로필
                    </Link>
                    {session.user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="block px-3 py-2 text-sm font-bold text-black hover:bg-neo-blue hover:text-black rounded-none border-2 border-transparent hover:border-black transition-colors mb-1"
                      >
                        ⚙️ 관리자
                      </Link>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-3 py-2 text-sm font-bold text-black hover:bg-red-500 hover:text-white rounded-none border-2 border-transparent hover:border-black transition-colors"
                    >
                      🚪 로그아웃
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Theme Toggle */}
                <button
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border-2 border-black bg-white neo-shadow-sm hover:bg-neo-yellow hover:text-black transition-all text-xs sm:text-base"
                  aria-label="Toggle Dark Mode"
                >
                  {mounted ? (resolvedTheme === "dark" ? "☀️" : "🌙") : "🌙"}
                </button>
                <Link
                  href="/login"
                  className={getButtonClasses({ variant: "default", size: "sm", className: "h-8 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm" })}
                >
                  로그인
                </Link>
                <Link
                  href="/register"
                  className={getButtonClasses({ variant: "primary", size: "sm", className: "h-8 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm" })}
                >
                  회원가입
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={getButtonClasses({ variant: "secondary", size: "icon", className: "lg:hidden rounded-none" })}
            >
              <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t-4 border-black bg-white animate-fade-in-up">
          <div className="px-4 py-4 flex flex-col gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  onClick={() => {
                    if (!link.external) setMobileOpen(false);
                  }}
                  className={`block px-4 py-3 border-2 border-black font-bold lowercase transition-all ${
                    isActive
                      ? "bg-neo-pink text-white neo-shadow"
                      : "bg-white text-black neo-shadow hover:bg-neo-yellow hover:text-black hover:translate-x-[2px] hover:translate-y-[2px] hover:neo-shadow-sm"
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
