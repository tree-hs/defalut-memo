"use client";

import { useCallback, useEffect, useState } from "react";

type Memo = {
  id: string;
  content: string;
  createdAt: string;
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function Page() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("memo-dark-mode") === "true";
    setIsDarkMode(saved);
    document.documentElement.setAttribute("data-theme", saved ? "dark" : "light");
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDarkMode ? "dark" : "light");
    localStorage.setItem("memo-dark-mode", String(isDarkMode));
  }, [isDarkMode]);

  const loadMemos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/memos");
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        await res.text();
        throw new Error(
          `서버가 JSON이 아닌 응답을 반환했습니다 (${res.status}). DB 설정 확인: npx prisma generate && npx prisma db push`
        );
      }
      const data = await res.json().catch(() => {
        throw new Error("응답 파싱 실패. API와 DB 설정을 확인하세요.");
      });
      if (!res.ok) throw new Error(data?.error ?? "Failed to load");
      setMemos(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load memos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMemos();
  }, [loadMemos]);

  useEffect(() => {
    console.log("memos:", memos);
  }, [memos]);

  const deleteMemo = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/memos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to delete");
      }
      setMemos((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete memo");
    }
  }, []);

  const submit = useCallback(async () => {
    const content = input.trim();
    if (!content || saving) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/memos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error(
          `서버가 JSON이 아닌 응답을 반환했습니다 (${res.status}). DB 설정 확인: npx prisma generate && npx prisma db push`
        );
      }
      const data = await res.json().catch(() => {
        throw new Error("응답 파싱 실패. API와 DB 설정을 확인하세요.");
      });
      if (!res.ok) throw new Error(data?.error ?? "Failed to save");
      setMemos((prev) => [data, ...prev]);
      setInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save memo");
    } finally {
      setSaving(false);
    }
  }, [input, saving]);

  return (
    <div className="app">
      <header className="header">
        <h1>메모</h1>
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setIsDarkMode((prev) => !prev)}
          title={isDarkMode ? "라이트 모드" : "다크 모드"}
          aria-label={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
        >
          {isDarkMode ? "☀️" : "🌙"}
        </button>
      </header>

      <main className="memo-list">
        {loading && <div className="loading">불러오는 중...</div>}
        {!loading && memos.length === 0 && (
          <div className="empty-state">메모를 입력하면 여기에 날짜/시간과 함께 표시됩니다.</div>
        )}
        {!loading &&
          memos.map((m) => (
            <article key={m.id} className="memo-item">
              <p className="content">{m.content}</p>
              <div className="memo-item-footer">
                <p className="meta">{formatDateTime(m.createdAt)}</p>
                <button
                  type="button"
                  className="memo-delete-btn"
                  onClick={() => deleteMemo(m.id)}
                  title="삭제"
                  aria-label="메모 삭제"
                >
                  삭제
                </button>
              </div>
            </article>
          ))}
      </main>

      <section className="input-area">
        <div className="input-row">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="메모를 입력하세요..."
            rows={3}
          />
          <button type="button" onClick={submit} disabled={saving || !input.trim()}>
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </section>
    </div>
  );
}
