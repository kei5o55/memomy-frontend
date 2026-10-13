// app/login/page.tsx
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  // IndexedDB モード（NEXT_PUBLIC_API_MODE が "true" 以外）ではログイン不要なのでトップへ戻す
  if (process.env.NEXT_PUBLIC_API_MODE !== "true") {
    redirect("/");
  }
  return <LoginForm />;
}
