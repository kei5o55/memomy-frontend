'use server';

import { cookies } from 'next/headers';
import { readJson } from '@/logic/case';

export async function loginAction(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');

  // Next.jsコンテナ -> Railsコンテナへの内部通信
  const apiUrl = process.env.RAILS_API_URL_INTERNAL || 'http://backend:3000';

  try {
    const res = await fetch(`${apiUrl}/api/v1/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',},
      body: JSON.stringify({ user: { email, password } }),
    });

    if (!res.ok) {
      return { error: 'メールアドレスまたはパスワードが違います' };
    }

    // Devise-JWT から返された Authorization ヘッダー（Bearer xxx）を取得
    const authHeader = res.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (token) {
      const cookieStore = await cookies();
      cookieStore.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }

    return { success: true };
  } catch (err) {
    console.error('Login Fetch Error:', err);
    return { error: 'サーバーとの通信に失敗しました' };
  }
}
//今後のrailsログイン機能の準備だよ
/*export const handleLogin = async (credentials: LoginFormData) => {
  const response = await fetch('http://localhost:3001/api/v1/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      user: {
        email: credentials.email,
        password: credentials.password,
      },
    }),
  });

  if (response.ok) {
    const token = response.headers.get('Authorization');
    if (token) {
      localStorage.setItem('token', token);
    }
    // ログイン成功後のページ遷移（ダッシュボード等へ）
  }
};

export const handleSignUp = async (formData: SignUpFormData) => {
  const response = await fetch('http://localhost:3001/api/v1/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      user: {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        passwordConfirmation: formData.passwordConfirmation,
      },
    }),
  });

  if (response.ok) {
    // 成功時: レスポンスヘッダーから JWT トークンを取得
    const token = response.headers.get('Authorization');
    if (token) {
      // トークンを localStorage や Cookie、状態管理（Zustand/Context等）に保存
      localStorage.setItem('token', token);
    }
    const data = await response.json();
    console.log('登録成功:', data);
  } else {
    const errorData = await response.json();
    console.error('登録失敗:', errorData.status.errors);
  }
};*/

export const fetchUserProfile = async () => {
  const token = localStorage.getItem('token'); // 例: "Bearer eyJhbGci..."

  const response = await fetch('http://localhost:3001/api/v1/me', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token || '',
    },
  });

  if (response.ok) {
    const user = await readJson(response);
    return user;
  }
};