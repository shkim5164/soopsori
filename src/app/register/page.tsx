"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { stringifyPositions, type RankedPosition } from "@/lib/constants";
import PositionPicker from "@/components/PositionPicker";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    password: "",
    passwordConfirm: "",
    name: "",
  });
  const [positions, setPositions] = useState<RankedPosition[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          name: form.name || form.username,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // 포지션 설정 (가입 후)
      if (positions.length > 0 && data.user?.id) {
        await fetch(`/api/members/${data.user.id}/profile`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position: stringifyPositions(positions) }),
        });
      }

      // 자동 로그인
      const result = await signIn("credentials", {
        username: form.username,
        password: form.password,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("회원가입 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-5xl block mb-3">🌲</span>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-forest-300 bg-clip-text text-transparent">
            숲소리 회원가입
          </h1>
          <p className="text-gray-800 font-bold text-sm mt-1">밴드 동호회의 새로운 멤버가 되어주세요</p>
        </div>

        {/* Form */}
        <div className="neo-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black font-bold mb-1.5">
                아이디 *
              </label>
              <input
                type="text"
                required
                minLength={3}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-4 py-2.5 rounded-none bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border border-2 border-black text-black font-black placeholder-neutral-600 focus:outline-none focus:border-3 border-black focus:ring-1 focus:bg-neo-yellow focus:ring-0 transition-all"
                placeholder="3자 이상"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black font-bold mb-1.5">
                비밀번호 *
              </label>
              <input
                type="password"
                required
                minLength={4}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 rounded-none bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border border-2 border-black text-black font-black placeholder-neutral-600 focus:outline-none focus:border-3 border-black focus:ring-1 focus:bg-neo-yellow focus:ring-0 transition-all"
                placeholder="4자 이상"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black font-bold mb-1.5">
                비밀번호 확인 *
              </label>
              <input
                type="password"
                required
                value={form.passwordConfirm}
                onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
                className="w-full px-4 py-2.5 rounded-none bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border border-2 border-black text-black font-black placeholder-neutral-600 focus:outline-none focus:border-3 border-black focus:ring-1 focus:bg-neo-yellow focus:ring-0 transition-all"
                placeholder="비밀번호를 다시 입력하세요"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black font-bold mb-1.5">
                이름 (닉네임)
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-none bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border border-2 border-black text-black font-black placeholder-neutral-600 focus:outline-none focus:border-3 border-black focus:ring-1 focus:bg-neo-yellow focus:ring-0 transition-all"
                placeholder="비워두면 아이디가 이름으로 사용됩니다"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black font-bold mb-2">
                포지션 (나중에 변경 가능)
              </label>
              <PositionPicker value={positions} onChange={setPositions} />
            </div>

            {error && (
              <div className="p-3 rounded-none bg-danger-500/10 border border-danger-500/20">
                <p className="text-sm text-danger-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-none neo-btn neo-btn-primary font-medium text-sm transition-all duration-200 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "가입 중..." : "회원가입"}
            </button>
          </form>

          <div className="mt-4 pt-4 text-center">
            <p className="text-sm text-gray-800 font-bold">
              이미 계정이 있으신가요?{" "}
              <Link
                href="/login"
                className="text-neo-pink font-black hover:text-neo-pink font-black font-medium transition-colors"
              >
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
