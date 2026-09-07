"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminRequest } from "./admin-request";
export function CategoryCreate() {
  const [code, setCode] = useState(""),
    [name, setName] = useState(""),
    [color, setColor] = useState("#57c5d9"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <details className="card">
      <summary>Thêm danh mục</summary>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await adminRequest("/api/admin/categories", "POST", {
              code,
              name,
              color,
            });
            setMessage("Đã tạo danh mục.");
            setCode("");
            setName("");
            router.refresh();
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : "Không tạo được danh mục.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Mã danh mục
          <input
            required
            pattern="[A-Z][A-Z_0-9]{1,60}"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="VIEWPOINT"
          />
        </label>
        <label>
          Tên danh mục
          <input
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Màu marker
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>
        <button disabled={busy}>Tạo danh mục</button>
      </form>
      {message && <p role="status">{message}</p>}
    </details>
  );
}
