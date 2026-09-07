"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main className="login">
      <Link href="/">TÀ XÙA LAND</Link>
      <h1>Đăng nhập Admin</h1>
      <p>Quản lý và kiểm tra dữ liệu không gian.</p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          const fields = new FormData(event.currentTarget);
          try {
            const response = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: fields.get("email"),
                password: fields.get("password"),
              }),
            });
            const data = await response.json();
            if (response.ok) {
              router.replace("/admin");
              router.refresh();
            } else setError(data.error?.message ?? "Không thể đăng nhập.");
          } catch {
            setError("Không kết nối được dịch vụ.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Email
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            maxLength={254}
          />
        </label>
        <label>
          Mật khẩu
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={256}
          />
        </label>
        <button disabled={busy}>
          {busy ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
        <p role="alert">{error}</p>
      </form>
    </main>
  );
}
