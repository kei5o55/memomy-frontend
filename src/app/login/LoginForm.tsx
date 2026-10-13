// app/login/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkApiHealth, saveAuthCredentials } from '../../../lib/apiClient';

export default function LoginPage() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // 入力された値で Base64 文字列を一時作成して疎通確認
    const testCredentials = btoa(`${user}:${pass}`);
    const isValid = await checkApiHealth(testCredentials);

    if (isValid) {
      // 成功した場合のみ localStorage に保存
      saveAuthCredentials(user, pass);
      router.push('/'); // メイン画面へリダイレクト
    } else {
      setError('ユーザー名またはパスワードが正しくないか、サーバーに接続できません。');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-slate-800">API モード ログイン</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">ユーザー名</label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">パスワード</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? '認証中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}