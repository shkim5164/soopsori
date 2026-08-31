import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "soopsori | band crew",
  description: "soopsori band crew - get ready to rock",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      className="h-full antialiased"
    >
      <head>
        <link rel="stylesheet" as="style" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-white text-black border-8 border-black">
        <div className="marquee-container">
          <div className="marquee-content">
            🎵 WELCOME TO SOOPSORI 🎵 GET READY TO ROCK 🎵 JOIN THE CREW 🎵 WELCOME TO SOOPSORI 🎵 GET READY TO ROCK 🎵 JOIN THE CREW 🎵
          </div>
        </div>
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          {/* Footer */}
          <footer className="neo-divider py-6 mt-auto bg-neo-yellow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-lg font-black uppercase">
                soopsori crew © {new Date().getFullYear()}
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
