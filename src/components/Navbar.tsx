"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

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

  return (
    <nav className="sticky top-0 z-50 glass-card-static border-b border-forest-700/30 rounded-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
              🌲
            </span>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-forest-300 bg-clip-text text-transparent">
              숲소리
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || 
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-forest-600/40 text-emerald-300 shadow-lg shadow-emerald-500/10"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-forest-800/40"
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
              <div className="w-8 h-8 rounded-full skeleton" />
            ) : session?.user ? (
              <div className="flex items-center gap-3">
                {/* Points Badge */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20">
                  <span className="text-sm">⭐</span>
                  <span className="text-sm font-semibold text-gold-400">
                    {session.user.points ?? 0}P
                  </span>
                </div>

                {/* Profile Dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-2 p-1 rounded-full hover:ring-2 ring-emerald-500/30 transition-all duration-200">
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name ?? ""}
                        className="w-8 h-8 rounded-full border border-forest-600"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-forest-700 flex items-center justify-center text-sm">
                        {session.user.name?.[0] ?? "?"}
                      </div>
                    )}
                  </button>
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-48 glass-card-static p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
                    <div className="px-3 py-2 border-b border-forest-700/30 mb-1">
                      <p className="text-sm font-medium text-neutral-200 truncate">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {session.user.email}
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-3 py-2 text-sm text-neutral-400 hover:text-neutral-200 hover:bg-forest-800/40 rounded-lg transition-colors"
                    >
                      👤 프로필
                    </Link>
                    {session.user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        className="block px-3 py-2 text-sm text-neutral-400 hover:text-neutral-200 hover:bg-forest-800/40 rounded-lg transition-colors"
                      >
                        ⚙️ 관리자
                      </Link>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-3 py-2 text-sm text-danger-400 hover:bg-danger-500/10 rounded-lg transition-colors"
                    >
                      🚪 로그아웃
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-forest-800/40 text-sm font-medium transition-all duration-200"
                >
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-forest-500 hover:from-emerald-400 hover:to-forest-400 text-white text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/10"
                >
                  회원가입
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-forest-800/40 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-forest-700/30 animate-fade-in-up">
          <div className="px-4 py-3 space-y-1">
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
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-forest-600/40 text-emerald-300"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-forest-800/40"
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
