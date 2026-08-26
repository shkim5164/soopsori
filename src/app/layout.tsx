import type { Metadata } from "next";
import { Noto_Sans_KR, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Navbar from "@/components/Navbar";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "숲소리 | 밴드 동호회",
  description: "숲소리 밴드 동호회 - 함께 만드는 음악, 함께 나누는 즐거움",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      className={`${notoSansKR.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[var(--font-noto-sans-kr)]">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          {/* Footer */}
          <footer className="border-t border-forest-700/20 py-6 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <p className="text-sm text-neutral-600">
                🌲 숲소리 밴드 동호회 © {new Date().getFullYear()}
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
