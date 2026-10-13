// app/login/LoginForm.tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { login, signup } from "@/logic/auth";

type Mode = "login" | "signup";

const inputClass =
  "mt-1 w-full text-sm p-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === "signup";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const result = isSignup
      ? await signup({ name, email, password, passwordConfirmation })
      : await login(email, password);

    if (result.ok) {
      router.push("/");
      return;
    }
    setError(result.error);
    setIsSubmitting(false);
  };

  const switchMode = () => {
    setMode(isSignup ? "login" : "signup");
    setError("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <span className="text-[11px] font-semibold text-sky-600 uppercase tracking-wider block">
            memomy
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            {isSignup ? "新規登録" : "ログイン"}
          </h1>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="block text-xs font-semibold text-slate-500">ユーザー名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="nickname"
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isSignup ? "new-password" : "current-password"}
              className={inputClass}
            />
          </div>

          {isSignup && (
            <div>
              <label className="block text-xs font-semibold text-slate-500">パスワード（確認）</label>
              <input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm py-3 rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "送信中..." : isSignup ? "登録してはじめる" : "ログイン"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          {isSignup ? "アカウントをお持ちの方は" : "はじめての方は"}
          <button
            type="button"
            onClick={switchMode}
            className="ml-1 font-semibold text-sky-600 hover:underline cursor-pointer"
          >
            {isSignup ? "ログイン" : "新規登録"}
          </button>
        </p>
      </div>
    </div>
  );
}
