// app/login/page.tsx
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "ログイン",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  // IndexedDB モード（NEXT_PUBLIC_API_MODE が "true" 以外）ではログイン不要なのでトップへ戻す
  if (process.env.NEXT_PUBLIC_API_MODE !== "true") {
    redirect("/");
  }
  return <LoginForm />;
}
