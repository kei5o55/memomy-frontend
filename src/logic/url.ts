// logic/url.ts

/**
 * 1. ホスト（ドメイン）直下の BASE URL を取得
 * 画像（Active Storage）やルートリソースで使用
 * 例: http://localhost:3001 / https://xxxx.onrender.com
 * アクティブレコードにアクセスるる時は
 */
const getHostUrl = (): string => {
  const rawUrl = process.env.NEXT_PUBLIC_API_URL || '';
  // クォーテーション除去、空白除去、末尾スラッシュ除去
  const cleanUrl = rawUrl.replace(/['"]/g, '').trim().replace(/\/+$/, '');
  
  // もし環境変数側に /api/v1 が入っていたら除去してホスト部分だけ取り出す
  return cleanUrl.replace(/\/api\/v1$/, '');
};

export const HOST_URL = getHostUrl();//アクティブレコードにアクセスるる時はこっち

/**
 * 2. API エンドポイント用の BASE URL
 * fetch などの API リクエストで使用
 * 例: http://localhost:3001/api/v1 / https://xxxx.onrender.com/api/v1
 */
export const BASE_URL = `${HOST_URL}/api/v1`;//apiリクエストなどはこっち（更新時v2とかになってきたらここだけ変える）