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
      <div className={`flex items-center justify-center bg-forest-900/50 rounded-xl border border-forest-700/30 aspect-video ${className}`}>
        <p className="text-neutral-500 text-sm">유효하지 않은 YouTube URL입니다</p>
      </div>
    );
  }

  return (
    <div className={`relative aspect-video rounded-xl overflow-hidden border border-forest-700/30 ${className}`}>
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
