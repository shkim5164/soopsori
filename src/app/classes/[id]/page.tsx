import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import JoinClassButton from "./JoinClassButton";
import { auth } from "@/auth";

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const classItem = await prisma.class.findUnique({
    where: { id },
    include: {
      creator: true,
      participants: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!classItem) {
    notFound();
  }

  const isFull = classItem.participants.length >= classItem.capacity;
  const isJoined = session?.user?.id 
    ? classItem.participants.some(p => p.userId === session.user.id)
    : false;
  const isCreator = session?.user?.id === classItem.creatorId;

  let buttonLabel = "클래스 참가하기";
  let buttonDisabled = false;

  if (!session?.user) {
    buttonLabel = "로그인 후 참가 가능";
    buttonDisabled = true;
  } else if (isCreator) {
    buttonLabel = "내가 개설한 클래스입니다";
    buttonDisabled = true;
  } else if (isJoined) {
    buttonLabel = "이미 참가 신청완료";
    buttonDisabled = true;
  } else if (isFull) {
    buttonLabel = "모집 마감 (정원 초과)";
    buttonDisabled = true;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/classes" className="text-sm font-bold hover:underline mb-6 inline-block">
        &larr; 목록으로 돌아가기
      </Link>

      <div className="neo-card overflow-hidden bg-white mb-8">
        {/* Header Section */}
        <div className="p-6 md:p-8 border-b-2 border-black bg-neo-yellow">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`text-xs px-3 py-1 border-2 border-black font-black bg-white ${isFull ? "text-danger-500" : "text-black"}`}>
              {isFull ? "모집 마감" : "모집 중"}
            </span>
            <span className="text-xs px-3 py-1 border-2 border-black font-black bg-white">
              정원 {classItem.capacity}명
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-black text-black mb-4 leading-tight">
            {classItem.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-gray-900">
            <div className="flex items-center gap-2">
              <span className="opacity-70">개설자:</span>
              <div className="flex items-center gap-1.5">
                {classItem.creator.image ? (
                  <img src={classItem.creator.image} alt="" className="w-6 h-6 border border-black rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 bg-black rounded-full" />
                )}
                <span>{classItem.creator.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="opacity-70">마감일:</span>
              <span>{new Date(classItem.deadline).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="opacity-70">작성일:</span>
              <span>{new Date(classItem.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Main Content */}
          <div className="flex-1 p-6 md:p-8 border-b-2 md:border-b-0 md:border-r-2 border-black prose max-w-none prose-img:border-2 prose-img:border-black prose-img:rounded-md">
            <div dangerouslySetInnerHTML={{ __html: classItem.content }} />
          </div>

          {/* Sidebar / Participants */}
          <div className="w-full md:w-80 bg-gray-50 flex flex-col">
            <div className="p-6 flex-1">
              <h3 className="text-lg font-black mb-4 flex items-center justify-between">
                <span>참가자 목록</span>
                <span className="text-sm bg-black text-white px-2 py-0.5 rounded-full">
                  {classItem.participants.length}/{classItem.capacity}
                </span>
              </h3>
              
              <ul className="space-y-3">
                {classItem.participants.length > 0 ? (
                  classItem.participants.map((p, index) => (
                    <li key={p.id} className="flex items-center gap-3 p-2 bg-white border-2 border-black rounded-none shadow-[2px_2px_0px_black]">
                      <span className="font-mono text-xs w-4 text-center opacity-50">{index + 1}</span>
                      {p.user.image ? (
                        <img src={p.user.image} alt="" className="w-8 h-8 rounded-full border border-black object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-black rounded-full" />
                      )}
                      <span className="font-bold text-sm truncate">{p.user.name}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-sm font-bold text-gray-500 text-center py-4">아직 참가자가 없습니다.</p>
                )}
              </ul>
            </div>
            
            {/* Sticky bottom action area */}
            <div className="p-4 border-t-2 border-black bg-white">
              <JoinClassButton classId={classItem.id} disabled={buttonDisabled} label={buttonLabel} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
