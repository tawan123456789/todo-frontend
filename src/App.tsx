import React, { useEffect, useMemo, useState } from "react";

type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

type Styles = {
  page: React.CSSProperties;
  header: React.CSSProperties;
  card: React.CSSProperties;

  topRow: React.CSSProperties;
  input: React.CSSProperties;
  btn: React.CSSProperties;
  btnPrimary: React.CSSProperties;

  grid: React.CSSProperties;
  col: React.CSSProperties;
  colHeader: React.CSSProperties;
  colTitle: React.CSSProperties;
  colCount: React.CSSProperties;

  list: React.CSSProperties;
  item: React.CSSProperties;
  itemMain: React.CSSProperties;
  itemTitle: React.CSSProperties;
  itemMeta: React.CSSProperties;
  actions: React.CSSProperties;

  badge: (kind: "err" | "info") => React.CSSProperties;
  small: React.CSSProperties;
};

export default function App() {
  // ===== State =====
  const [text, setText] = useState("");
  const [items, setItems] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const canAdd = useMemo(() => text.trim().length > 0 && !loading, [text, loading]);

  // ===== Helpers =====
  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  // ===== API =====
  const apiGetTodos = async () => {
    resetMessages();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/todos`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`GET /todos failed (${res.status}) ${t}`);
      }

      const data = (await res.json()) as Todo[];
      setItems(Array.isArray(data) ? data : []);
      setInfo("โหลดรายการสำเร็จ ✅");
    } catch (e: any) {
      setError(e?.message || "โหลดรายการไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const apiAddTodo = async () => {
    const title = text.trim();
    if (!title) return;

    resetMessages();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ title }), // docs: { title: string }
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`POST /todos failed (${res.status}) ${t}`);
      }

      // ปกติควรได้ Todo ที่สร้างใหม่กลับมา
      const created = (await res.json()) as Todo;

      setItems((prev) => [created, ...prev]);
      setText("");
      setInfo(`เพิ่ม "${title}" สำเร็จ`);
    } catch (e: any) {
      setError(e?.message || "เพิ่มรายการไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  // docs: PUT /todos/:id with { title?, completed? }
  const apiUpdateTodo = async (id: number, patch: Partial<Pick<Todo, "title" | "completed">>) => {
    resetMessages();
    setBusyId(id);
    try {
      const res = await fetch(`${API_BASE}/todos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(patch),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`PUT /todos/${id} failed (${res.status}) ${t}`);
      }

      // บาง backend จะคืน Todo ที่อัปเดตแล้วกลับมา
      // แต่เพื่อให้ชัวร์ ทำ optimistic update ด้วย
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, ...patch } as Todo : x))
      );
    } catch (e: any) {
      setError(e?.message || "อัปเดตไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  const apiDeleteTodo = async (id: number) => {
    resetMessages();
    setBusyId(id);
    try {
      const res = await fetch(`${API_BASE}/todos/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`DELETE /todos/${id} failed (${res.status}) ${t}`);
      }

      // docs: 204 No Content
      setItems((prev) => prev.filter((x) => x.id !== id));
      setInfo("ลบสำเร็จ");
    } catch (e: any) {
      setError(e?.message || "ลบไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  // ===== Load once =====
  useEffect(() => {
    apiGetTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Split lists =====
  const notDoneItems = useMemo(() => items.filter((x) => !x.completed), [items]);
  const doneItems = useMemo(() => items.filter((x) => x.completed), [items]);

  // ===== Events =====
  const onKeyDownAdd: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") apiAddTodo();
  };

  const styles: Styles = {
    page: {
      minHeight: "100vh",
      minWidth: "100vw",
      background: "#f8fafc",
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
      padding: "24px 16px",
    },
    header: {
      maxWidth: 1500,
      margin: "0 auto 14px auto",
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      alignItems: "flex-end",
      flexWrap: "wrap",
    },
    card: {
      maxWidth: 1500,
      minHeight: 500,
      margin: "0 auto",
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      background: "#fff",
      padding: 16,
      boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
    },
    topRow: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      flexWrap: "wrap",
    },
    input: {
      minWidth: 320,
      padding: "10px 12px",
      borderRadius: 10,
      border: "1px solid #d1d5db",
      outline: "none",
      fontSize: 14,
      background: "#fff",
    },
    btn: {
      padding: "10px 12px",
      borderRadius: 10,
      border: "1px solid #d1d5db",
      background: "#fff",
      cursor: "pointer",
      fontSize: 14,
    },
    btnPrimary: {
      padding: "10px 12px",
      borderRadius: 10,
      border: "1px solid #111827",
      background: "#111827",
      color: "#fff",
      cursor: "pointer",
      fontSize: 14,
      opacity: canAdd ? 1 : 0.6,
    },

    grid: {
      marginTop: 14,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14,
    },
    col: {
      border: "1px solid #e5e7eb",
      borderRadius: 14,
      overflow: "hidden",
      background: "#fff",
      minHeight: 460,
      display: "flex",
      flexDirection: "column",
    },
    colHeader: {
      padding: "12px 12px",
      background: "#f9fafb",
      borderBottom: "1px solid #e5e7eb",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
    },
    colTitle: { fontSize: 14, fontWeight: 700, color: "#111827" },
    colCount: { fontSize: 12, color: "#6b7280" },

    list: {
      padding: 12,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      overflow: "auto",
    },
    item: {
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: 12,
      display: "flex",
      gap: 12,
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    itemMain: { minWidth: 0, flex: 1 },
    itemTitle: { fontSize: 14, fontWeight: 700, color: "#111827", wordBreak: "break-word" },
    itemMeta: { fontSize: 12, color: "#6b7280", marginTop: 6, lineHeight: 1.4 },
    actions: { display: "flex", gap: 8, flexWrap: "wrap" },

    badge: (kind) => ({
      marginTop: 10,
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid " + (kind === "err" ? "#fecaca" : "#bfdbfe"),
      background: kind === "err" ? "#fef2f2" : "#eff6ff",
      color: kind === "err" ? "#991b1b" : "#1e3a8a",
      fontSize: 14,
      whiteSpace: "pre-wrap",
    }),
    small: { color: "#6b7280", fontSize: 13 },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Todo Board</h1>
          <div style={{ marginTop: 6, ...styles.small }}>
            Backend: <b>{API_BASE}</b>
          </div>
        </div>

        <div style={styles.topRow}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDownAdd}
            placeholder="พิมพ์งาน แล้วกด Enter หรือกด Add"
            style={styles.input}
            disabled={loading}
          />

          <button onClick={apiAddTodo} style={styles.btnPrimary} disabled={!canAdd}>
            Add
          </button>

          <button onClick={apiGetTodos} style={styles.btn} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      <div style={styles.card}>
        {error && <div style={styles.badge("err")}>{error}</div>}
        {info && <div style={styles.badge("info")}>{info}</div>}

        <div style={styles.grid}>
          {/* ยังไม่ทำ */}
          <div style={styles.col}>
            <div style={styles.colHeader}>
              <div style={styles.colTitle}>ยังไม่ทำ</div>
              <div style={styles.colCount}>{notDoneItems.length} รายการ</div>
            </div>

            <div style={styles.list}>
              {notDoneItems.length === 0 ? (
                <div style={styles.small}>ไม่มีรายการ</div>
              ) : (
                notDoneItems.map((x) => (
                  <div key={x.id} style={styles.item}>
                    <div style={styles.itemMain}>
                      <div style={styles.itemTitle}>{x.title}</div>
                      <div style={styles.itemMeta}>ID: {x.id}</div>
                    </div>

                    <div style={styles.actions}>
                      <button
                        style={styles.btn}
                        onClick={() => apiUpdateTodo(x.id, { completed: true })}
                        disabled={busyId === x.id}
                      >
                        {busyId === x.id ? "..." : "Mark Done"}
                      </button>

                      <button
                        style={styles.btn}
                        onClick={() => apiDeleteTodo(x.id)}
                        disabled={busyId === x.id}
                      >
                        {busyId === x.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ทำแล้ว */}
          <div style={styles.col}>
            <div style={styles.colHeader}>
              <div style={styles.colTitle}>ทำแล้ว</div>
              <div style={styles.colCount}>{doneItems.length} รายการ</div>
            </div>

            <div style={styles.list}>
              {doneItems.length === 0 ? (
                <div style={styles.small}>ยังไม่มีรายการที่ทำเสร็จ</div>
              ) : (
                doneItems.map((x) => (
                  <div key={x.id} style={styles.item}>
                    <div style={styles.itemMain}>
                      <div style={styles.itemTitle}>{x.title}</div>
                      <div style={styles.itemMeta}>ID: {x.id}</div>
                    </div>

                    <div style={styles.actions}>
                      <button
                        style={styles.btn}
                        onClick={() => apiUpdateTodo(x.id, { completed: false })}
                        disabled={busyId === x.id}
                      >
                        {busyId === x.id ? "..." : "Undo"}
                      </button>

                      <button
                        style={styles.btn}
                        onClick={() => apiDeleteTodo(x.id)}
                        disabled={busyId === x.id}
                      >
                        {busyId === x.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
