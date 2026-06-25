import { useState, useEffect, useCallback } from "react";

async function fetchData() {
  const res = await fetch("/api/notion");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch data");
  return data;
}

// ── Ring Progress ────────────────────────────────────────────────────────────
function RingProgress({ pct, size = 140, stroke = 10, color = "#00E5BE", label, sublabel }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - Math.min(pct / 100, 1) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e2630" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 2,
      }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{Math.round(pct)}%</span>
        {label && <span style={{ fontSize: 11, color: "#6b7a8d", fontWeight: 500, letterSpacing: "0.04em" }}>{label}</span>}
      </div>
    </div>
  );
}

// ── Bar Chart ────────────────────────────────────────────────────────────────
function BarChart({ data, color = "#00E5BE" }) {
  if (!data?.length) return <div style={{ color: "#6b7a8d", fontSize: 13, padding: "20px 0" }}>No data yet</div>;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, width: "100%" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 10, color: "#6b7a8d" }}>{d.count}</span>
          <div style={{
            width: "100%", background: color,
            height: Math.max((d.count / max) * 60, d.count > 0 ? 4 : 0),
            borderRadius: 3, opacity: i === data.length - 1 ? 1 : 0.45,
            transition: "height 0.8s ease",
          }} />
          <span style={{ fontSize: 9, color: "#6b7a8d", whiteSpace: "nowrap" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Word Row ─────────────────────────────────────────────────────────────────
function WordRow({ word, translation, category, date, example, phrase }) {
  const [open, setOpen] = useState(false);
  const catColor = {
    Business: "#3b82f6", Everyday: "#22c55e", "Phrasal Verb": "#f97316",
    Idiom: "#a855f7", Slang: "#ec4899", Academic: "#94a3b8",
    Phrase: "#eab308", Other: "#78716c",
  }[category] || "#6b7a8d";

  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        padding: "12px 16px", borderRadius: 10, background: "#111820",
        border: "1px solid #1e2630", cursor: "pointer",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#2a3540"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#1e2630"}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontWeight: 600, color: "#e2e8f0", fontSize: 15, minWidth: 120 }}>{word}</span>
        <span style={{ color: "#6b7a8d", fontSize: 13, flex: 1 }}>{translation}</span>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
          background: catColor + "22", color: catColor, letterSpacing: "0.04em",
          whiteSpace: "nowrap",
        }}>{category || "—"}</span>
        <span style={{ fontSize: 11, color: "#3a4a5a", whiteSpace: "nowrap" }}>{date}</span>
        <span style={{ color: "#3a4a5a", fontSize: 12, marginLeft: 4 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #1e2630" }}>
          {example && <p style={{ margin: "0 0 6px", fontSize: 13, color: "#8899aa", fontStyle: "italic" }}>📝 {example}</p>}
          {phrase && <p style={{ margin: 0, fontSize: 13, color: "#00E5BE" }}>💡 {phrase}</p>}
        </div>
      )}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent = "#00E5BE" }) {
  return (
    <div style={{
      background: "#111820", border: "1px solid #1e2630", borderRadius: 12,
      padding: "18px 20px", display: "flex", flexDirection: "column", gap: 4,
    }}>
      <span style={{ fontSize: 11, color: "#6b7a8d", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 32, fontWeight: 700, color: accent, lineHeight: 1.1 }}>{value ?? "—"}</span>
      {sub && <span style={{ fontSize: 12, color: "#3a4a5a" }}>{sub}</span>}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("overview"); // overview | words
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchData();
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0f14", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #1e2630", borderTop: "3px solid #00E5BE", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "#6b7a8d", fontSize: 14 }}>Loading your vocabulary...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: "#0a0f14", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <p style={{ color: "#ef4444", fontSize: 14, marginBottom: 12 }}>⚠️ {error}</p>
        <button onClick={load} style={{ background: "#00E5BE", color: "#0a0f14", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, cursor: "pointer" }}>Retry</button>
      </div>
    </div>
  );

  const words = data?.words || [];
  const goals = data?.goals || [];
  const currentMonth = data?.currentMonth || new Date().toISOString().slice(0, 7);

  // Stats
  const wordsThisMonth = words.filter(w => w.dateAdded?.startsWith(currentMonth)).length;
  const thisGoal = goals.find(g => g.month === currentMonth);
  const wordsTarget = thisGoal?.wordsTarget || 30;
  const wordsPct = Math.min((wordsThisMonth / wordsTarget) * 100, 100);
  const totalWords = words.length;

  // By month chart (last 6)
  const monthCounts = {};
  words.forEach(w => { if (w.dateAdded) { const m = w.dateAdded.slice(0, 7); monthCounts[m] = (monthCounts[m] || 0) + 1; } });
  const monthKeys = Object.keys(monthCounts).sort().slice(-6);
  const chartData = monthKeys.map(m => ({ label: m.slice(5), count: monthCounts[m] }));

  // Quarter stats
  const quarterMap = { "01": "Q1", "02": "Q1", "03": "Q1", "04": "Q2", "05": "Q2", "06": "Q2", "07": "Q3", "08": "Q3", "09": "Q3", "10": "Q4", "11": "Q4", "12": "Q4" };
  const currentQ = quarterMap[currentMonth.slice(5, 7)];
  const wordsThisQ = words.filter(w => w.dateAdded && quarterMap[w.dateAdded.slice(5, 7)] === currentQ && w.dateAdded.startsWith(currentMonth.slice(0, 4))).length;

  // Category breakdown
  const catCounts = {};
  words.forEach(w => { const c = w.category || "Other"; catCounts[c] = (catCounts[c] || 0) + 1; });
  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];

  // Streak
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    if (words.some(w => w.dateAdded === ds)) streak++; else break;
  }

  // Filtered words
  const cats = ["All", ...Object.keys(catCounts).sort()];
  const filtered = words
    .filter(w => filterCat === "All" || w.category === filterCat)
    .filter(w => !search || w.word?.toLowerCase().includes(search.toLowerCase()) || w.translation?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.dateAdded || "").localeCompare(a.dateAdded || ""));

  const accent = "#00E5BE";
  const navBtn = (id, label) => (
    <button onClick={() => setView(id)} style={{
      background: view === id ? accent : "transparent",
      color: view === id ? "#0a0f14" : "#6b7a8d",
      border: "none", borderRadius: 8, padding: "7px 18px",
      fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s",
    }}>{label}</button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f14", fontFamily: "'Inter', system-ui, sans-serif", color: "#e2e8f0" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e2630", padding: "0 32px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🇬🇧</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>English Tracker</span>
            <span style={{ fontSize: 12, color: "#3a4a5a", marginLeft: 4 }}>/ Nick</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {navBtn("overview", "Overview")}
            {navBtn("words", `Words (${totalWords})`)}
          </div>
          <button onClick={load} style={{
            background: "transparent", border: "1px solid #1e2630", borderRadius: 8,
            color: "#6b7a8d", fontSize: 12, padding: "6px 14px", cursor: "pointer",
          }}>↻ Refresh</button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 32px" }}>

        {view === "overview" && (
          <>
            {/* Top row — ring + stats */}
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 20, marginBottom: 20 }}>
              {/* Monthly goal card */}
              <div style={{
                background: "#111820", border: "1px solid #1e2630", borderRadius: 14,
                padding: "24px 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, minWidth: 200,
              }}>
                <span style={{ fontSize: 11, color: "#6b7a8d", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>Monthly Goal</span>
                <RingProgress pct={wordsPct} color={accent} label={`${wordsThisMonth} / ${wordsTarget}`} />
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 12, color: "#6b7a8d" }}>{currentMonth}</p>
                  {wordsPct >= 100
                    ? <p style={{ margin: "4px 0 0", fontSize: 12, color: accent }}>🎉 Goal complete!</p>
                    : <p style={{ margin: "4px 0 0", fontSize: 12, color: "#3a4a5a" }}>{wordsTarget - wordsThisMonth} words left</p>}
                </div>
              </div>

              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <StatCard label="Total Words" value={totalWords} sub="in your dictionary" />
                <StatCard label="This Quarter" value={wordsThisQ} sub={currentQ + " " + currentMonth.slice(0, 4)} accent="#7c3aed" />
                <StatCard label="Day Streak 🔥" value={streak} sub="consecutive days" accent="#f97316" />
                <StatCard label="Top Category" value={topCat?.[0] || "—"} sub={topCat ? `${topCat[1]} words` : ""} accent="#3b82f6" />
              </div>
            </div>

            {/* Chart */}
            <div style={{
              background: "#111820", border: "1px solid #1e2630", borderRadius: 14, padding: "20px 24px", marginBottom: 20,
            }}>
              <p style={{ margin: "0 0 16px", fontSize: 12, color: "#6b7a8d", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Words Added — Last 6 Months</p>
              <BarChart data={chartData} color={accent} />
            </div>

            {/* Category breakdown */}
            <div style={{ background: "#111820", border: "1px solid #1e2630", borderRadius: 14, padding: "20px 24px" }}>
              <p style={{ margin: "0 0 16px", fontSize: 12, color: "#6b7a8d", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>By Category</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {Object.entries(catCounts).sort((a, b) => b[1] - a[1]).map(([cat, cnt]) => {
                  const c = { Business: "#3b82f6", Everyday: "#22c55e", "Phrasal Verb": "#f97316", Idiom: "#a855f7", Slang: "#ec4899", Academic: "#94a3b8", Phrase: "#eab308", Other: "#78716c" }[cat] || "#6b7a8d";
                  return (
                    <div key={cat} style={{ display: "flex", alignItems: "center", gap: 8, background: "#0a0f14", border: `1px solid ${c}33`, borderRadius: 8, padding: "8px 14px" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "#c8d6e5" }}>{cat}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{cnt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {view === "words" && (
          <>
            {/* Filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <input
                placeholder="Search word or translation..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1, minWidth: 200, background: "#111820", border: "1px solid #1e2630",
                  borderRadius: 8, padding: "9px 14px", color: "#e2e8f0", fontSize: 14, outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {cats.map(c => (
                  <button key={c} onClick={() => setFilterCat(c)} style={{
                    background: filterCat === c ? accent : "#111820",
                    color: filterCat === c ? "#0a0f14" : "#6b7a8d",
                    border: "1px solid " + (filterCat === c ? accent : "#1e2630"),
                    borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}>{c}</button>
                ))}
              </div>
            </div>

            {/* Word list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filtered.length === 0
                ? <p style={{ color: "#6b7a8d", fontSize: 14, textAlign: "center", padding: "40px 0" }}>No words found</p>
                : filtered.map((w, i) => (
                  <WordRow key={i} word={w.word} translation={w.translation} category={w.category} date={w.dateAdded} example={w.example} phrase={w.phrase} />
                ))
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
}
