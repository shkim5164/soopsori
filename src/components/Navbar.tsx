"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
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
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

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
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-black bg-white neo-shadow-sm hover:bg-neo-yellow hover:text-black transition-all"
                  aria-label="Toggle Dark Mode"
                >
                  {mounted ? (theme === "dark" ? "☀️" : "🌙") : "🌙"}
                </button>

                {/* Points Badge */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-neo-yellow border-2 border-black neo-shadow-sm">
                  <span className="text-sm">⭐</span>
                  <span className="text-sm font-black text-black">
                    {session.user.points ?? 0}P
                  </span>
                </div>

                {/* Profile Dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-2 p-0.5 rounded-full hover:scale-105 transition-transform duration-200 neo-shadow-sm border-2 border-black bg-white">
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
                  <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-black neo-shadow-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
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
                      className="block px-3 py-2 text-sm font-bold text-black hover:bg-neo-pink hover:text-white rounded-none border-2 border-transparent hover:border-black transition-colors mb-1"
                    >
                      👤 프로필
                    </Link>
                    {session.user.role === "ADMIN" && (
                      <Link
                        href="/admin"
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
              <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-black bg-white neo-shadow-sm hover:bg-neo-yellow hover:text-black transition-all"
                  aria-label="Toggle Dark Mode"
                >
                  {mounted ? (theme === "dark" ? "☀️" : "🌙") : "🌙"}
                </button>
                <Link
                  href="/login"
                  className={getButtonClasses({ variant: "default", size: "sm" })}
                >
                  로그인
                </Link>
                <Link
                  href="/register"
                  className={getButtonClasses({ variant: "primary", size: "sm" })}
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
