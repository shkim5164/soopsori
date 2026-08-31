"use client";

import { getYouTubeEmbedUrl } from "@/lib/constants";

interface YouTubeEmbedProps {
  url: string;
  title?: string;
  className?: string;
}

export default function YouTubeEmbed({ url, title, className = "" }: YouTubeEmbedProps) {
  const embedUrl = getYouTubeEmbedUrl(url);

  if (!embedUrl) {
    return (
      <div className={`flex items-center justify-center bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none border border-2 border-black aspect-video ${className}`}>
        <p className="text-gray-800 font-bold text-sm">유효하지 않은 YouTube URL입니다</p>
      </div>
    );
  }

  return (
    <div className={`relative aspect-video rounded-none overflow-hidden border border-2 border-black ${className}`}>
      <iframe
        src={embedUrl}
        title={title ?? "YouTube video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
