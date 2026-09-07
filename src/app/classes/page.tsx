import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDateTime } from "@/lib/constants";
import { auth } from "@/auth";

export default async function ClassesPage() {
  const session = await auth();
  const classes = await prisma.class.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      creator: true,
      participants: true,
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-black font-black">🎓 클래스</h1>
          <p className="text-gray-800 font-bold mt-1">새로운 스킬을 배우고 나눠보세요!</p>
        </div>
        {session?.user && (
          <Link
            href="/classes/new"
            className="px-5 py-2.5 rounded-none neo-btn neo-btn-primary font-medium text-sm transition-all duration-200 hover:neo-shadow-lg hover:neo-shadow hover:-translate-y-0.5"
          >
            + 클래스 개설
          </Link>
        )}
      </div>

      {/* Classes List */}
      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          {classes.map((c) => {
            const isFull = c.participants.length >= c.capacity;
            return (
              <Link
                key={c.id}
                href={`/classes/${c.id}`}
                className="block neo-card overflow-hidden hover:-translate-y-1 transition-transform"
              >
                {/* Thumbnail */}
                <div className="aspect-video w-full border-b-2 border-black bg-neo-yellow relative flex items-center justify-center">
                  {c.thumbnail ? (
                    <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">🎓</span>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`text-xs px-2 py-1 border-2 border-black font-black bg-white ${
                        isFull ? "text-danger-500" : "text-black"
                      }`}
                    >
                      {isFull ? "모집 마감" : "모집 중"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h2 className="text-xl font-bold text-black font-black mb-2 line-clamp-1">
                    {c.title}
                  </h2>
                  <div className="flex items-center gap-2 mb-3">
                    {c.creator.image ? (
                      <img src={c.creator.image} alt={c.creator.name || ""} className="w-5 h-5 border border-black rounded-full" />
                    ) : (
                      <div className="w-5 h-5 bg-black rounded-full" />
                    )}
                    <span className="text-xs font-bold text-gray-800">{c.creator.name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm font-bold text-gray-800">
                    <span>마감: {new Date(c.deadline).toLocaleDateString()}</span>
                    <span>
                      👥 {c.participants.length} / {c.capacity}명
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 neo-card">
          <span className="text-5xl mb-4 block">🎓</span>
          <p className="text-black font-bold text-lg">
            개설된 클래스가 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}
