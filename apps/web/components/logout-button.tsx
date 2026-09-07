"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  return (
    <>
      <button
        onClick={async () => {
          try {
            const result = await fetch("/api/auth/logout", { method: "POST" });
            if (result.ok) {
              router.replace("/admin/login");
              router.refresh();
            } else setError("Không thể đăng xuất.");
          } catch {
            setError("Không kết nối được dịch vụ.");
          }
        }}
      >
        Đăng xuất
      </button>
      <span role="alert">{error}</span>
    </>
  );
}
