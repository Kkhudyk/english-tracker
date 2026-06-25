import { useState, useEffect, useCallback } from "react";

async function fetchData() {
  const res = await fetch("/api/notion");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch data");
  return data;
}

// ── Ring Progress ────────────────────────────────────────────────────────────
function RingProgress({ pct, size = 120, stroke = 10, color = "#00E5BE", label }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - Math.min(pct / 100, 1) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e2630" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{Math.round(pct)}%</span>
        {label && <span style={{ fontSize: 10, color: "#6b7a8d", fontWeight: 500 }}>{label}</span>}
      </div>
    </div>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ pct, color = "#00E5BE", fact, target, unit }) {
  const clamped = Math.min(pct, 100);
  const done = pct >= 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{fact} <span style={{ color: "#3a4a5a", fontWeight: 400 }}>/ {target} {unit}</span></span>
        <span style={{ fontSize: 11, color: done ? color : "#6b7a8d" }}>{done ? "✓ Done" : `${Math.round(pct)}%`}</span>
      </div>
      <div style={{ height: 6, background: "#1e2630", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${clamped}%`, background: color, borderRadius: 3, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

// ── Month History Card ────────────────────────────────────────────────────────
function MonthCard({ month, wordsTarget, wordsActual, hoursTarget, hoursActual, daysTarget, daysActual, isCurrent }) {
  const [open, setOpen] = useState(isCurrent);
  const wordsPct = wordsTarget ? (wordsActual / wordsTarget) * 100 : 0;
  const hoursPct = hoursTarget ? (hoursActual / hoursTarget) * 100 : 0;
  const daysPct  = daysTarget  ? (daysActual  / daysTarget)  * 100 : 0;

  return (
    <div style={{ background: "#111820", border: `1px solid ${isCurrent ? "#00E5BE44" : "#1e2630"}`, borderRadius: 14, overflow: "hidden" }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isCurrent && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00E5BE", flexShrink: 0 }} />}
          <span style={{ fontWeight: 600, color: isCurrent ? "#fff" : "#8899aa", fontSize: 14 }}>{month}</span>
          {isCurrent && <span style={{ fontSize: 10, color: "#00E5BE", fontWeight: 600, letterSpacing: "0.06em" }}>CURRENT</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: wordsPct >= 100 ? "#00E5BE" : "#6b7a8d" }}>{wordsActual}/{wordsTarget} words</span>
          <span style={{ color: "#3a4a5a", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>
      {open && (
        <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <ProgressBar pct={wordsPct} color="#00E5BE" fact={wordsActual} target={wordsTarget} unit="words" />
          <ProgressBar pct={hoursPct} color="#7c3aed" fact={`${hoursActual.toFixed(1)}h`} target={`${hoursTarget}h`} unit="" />
          <ProgressBar pct={daysPct}  color="#f97316" fact={`${daysActual}d`} target={`${daysTarget}d`} unit="" />
        </div>
      )}
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
    <div onClick={() => setOpen(o => !o)} style={{ padding: "12px 16px", borderRadius: 10, background: "#111820", border: "1px solid #1e2630", cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, color: "#e2e8f0", fontSize: 15 }}>{word}</span>
            <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: catColor + "22", color: catColor, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{category || "—"}</span>
          </div>
          <span style={{ color: "#6b7a8d", fontSize: 13, display: "block", marginTop: 3 }}>{translation}</span>
          <span style={{ fontSize: 11, color: "#3a4a5a" }}>{date}</span>
        </div>
        <span style={{ color: "#3a4a5a", fontSize: 12, flexShrink: 0, marginTop: 2 }}>{open ? "▲" : "▼"}</span>
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

// ── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("overview");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fetchData()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
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

  const words    = data?.words    || [];
  const goals    = data?.goals    || [];
  const sessions = data?.sessions || [];
  const currentMonth = data?.currentMonth || new Date().toISOString().slice(0, 7);

  // Build month history — all months that appear in goals or words
  const monthSet = new Set([
    ...goals.map(g => g.month),
    ...words.map(w => w.dateAdded?.slice(0, 7)).filter(Boolean),
    currentMonth,
  ]);
  const allMonths = Array.from(monthSet).filter(Boolean).sort().reverse();

  const monthHistory = allMonths.map(month => {
    const goal = goals.find(g => g.month === month) || {};
    const wordsActual = words.filter(w => w.dateAdded?.startsWith(month)).length;
    const monthSessions = sessions.filter(s => s.date?.startsWith(month));
    const hoursActual = monthSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60;
    const daysActual  = new Set(monthSessions.map(s => s.date)).size;
    return {
      month,
      wordsTarget: goal.wordsTarget || 0,
      wordsActual,
      hoursTarget: goal.hoursTarget || 0,
      hoursActual,
      daysTarget: goal.daysTarget || 0,
      daysActual,
      isCurrent: month === currentMonth,
    };
  });

  // Current month stats for header rings
  const current = monthHistory.find(m => m.isCurrent) || {};
  const totalWords = words.length;

  // Calendar data
  const studiedDates = new Set(sessions.map(s => s.date));
  const [calMonth, setCalMonth] = useState(currentMonth);
  const calYear  = parseInt(calMonth.slice(0, 4));
  const calMonthN = parseInt(calMonth.slice(5, 7)) - 1;
  const firstDay = new Date(calYear, calMonthN, 1).getDay();
  const daysInMonth = new Date(calYear, calMonthN + 1, 0).getDate();
  const prevMonth = () => { const d = new Date(calYear, calMonthN - 1, 1); setCalMonth(d.toISOString().slice(0, 7)); };
  const nextMonth = () => { const d = new Date(calYear, calMonthN + 1, 1); setCalMonth(d.toISOString().slice(0, 7)); };
  const calMonthSessions = sessions.filter(s => s.date?.startsWith(calMonth));
  const calStudiedDays = new Set(calMonthSessions.map(s => s.date)).size;
  const calHours = calMonthSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60;

  // Category breakdown for words view
  const catCounts = {};
  words.forEach(w => { const c = w.category || "Other"; catCounts[c] = (catCounts[c] || 0) + 1; });
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
    <div style={{ minHeight: "100vh", background: "#0a0f14", fontFamily: "'Inter', system-ui, sans-serif", color: "#e2e8f0", overflowX: "hidden" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        @media (max-width: 600px) {
          .main-pad { padding: 12px !important; }
          .rings-row { grid-template-columns: 1fr 1fr 1fr !important; gap: 8px !important; }
          .ring-card { padding: 12px 8px !important; }
          .nav-tabs { position: fixed; bottom: 0; left: 0; right: 0; background: #0d1520; border-top: 1px solid #1e2630; display: flex !important; padding: 8px 16px 24px; gap: 8px; z-index: 100; }
          .nav-tabs button { flex: 1; padding: 10px !important; font-size: 14px !important; border-radius: 10px !important; }
          .bottom-spacer { height: 80px; }
          .refresh-btn { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e2630" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52, padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🇬🇧</span>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>English Tracker</span>
          </div>
          <div className="nav-tabs" style={{ display: "flex", gap: 4 }}>
            {navBtn("overview", "Overview")}
            {navBtn("words", `Words (${totalWords})`)}
            {navBtn("calendar", "📅")}
          </div>
          <button className="refresh-btn" onClick={load} style={{ background: "transparent", border: "1px solid #1e2630", borderRadius: 8, color: "#6b7a8d", fontSize: 12, padding: "6px 12px", cursor: "pointer" }}>↻ Refresh</button>
        </div>
      </div>

      <div className="main-pad" style={{ maxWidth: 960, margin: "0 auto", padding: "20px 24px" }}>

        {view === "overview" && (
          <>
            {/* Current month rings */}
            <div className="rings-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div className="ring-card" style={{ background: "#111820", border: "1px solid #1e2630", borderRadius: 14, padding: "16px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: "#6b7a8d", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>Words</span>
                <RingProgress pct={current.wordsTarget ? (current.wordsActual / current.wordsTarget) * 100 : 0} color={accent} label={`${current.wordsActual||0}/${current.wordsTarget||0}`} />
              </div>
              <div className="ring-card" style={{ background: "#111820", border: "1px solid #1e2630", borderRadius: 14, padding: "16px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: "#6b7a8d", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>Hours</span>
                <RingProgress pct={current.hoursTarget ? (current.hoursActual / current.hoursTarget) * 100 : 0} color="#7c3aed" label={`${(current.hoursActual||0).toFixed(1)}/${current.hoursTarget||0}h`} />
              </div>
              <div className="ring-card" style={{ background: "#111820", border: "1px solid #1e2630", borderRadius: 14, padding: "16px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: "#6b7a8d", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>Days</span>
                <RingProgress pct={current.daysTarget ? (current.daysActual / current.daysTarget) * 100 : 0} color="#f97316" label={`${current.daysActual||0}/${current.daysTarget||0}d`} />
              </div>
            </div>

            {/* Month history */}
            <p style={{ fontSize: 11, color: "#6b7a8d", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 10px" }}>Monthly History</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {monthHistory.map(m => <MonthCard key={m.month} {...m} />)}
            </div>
          </>
        )}

        {view === "words" && (
          <>
            <input
              placeholder="Search word or translation..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", marginBottom: 10, background: "#111820", border: "1px solid #1e2630", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none" }}
            />
            <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
              {cats.map(c => (
                <button key={c} onClick={() => setFilterCat(c)} style={{
                  background: filterCat === c ? accent : "#111820",
                  color: filterCat === c ? "#0a0f14" : "#6b7a8d",
                  border: "1px solid " + (filterCat === c ? accent : "#1e2630"),
                  borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                }}>{c}</button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filtered.length === 0
                ? <p style={{ color: "#6b7a8d", fontSize: 14, textAlign: "center", padding: "40px 0" }}>No words found</p>
                : filtered.map((w, i) => <WordRow key={i} word={w.word} translation={w.translation} category={w.category} date={w.dateAdded} example={w.example} phrase={w.phrase} />)
              }
            </div>
          </>
        )}

        {view === "calendar" && (
          <>
            {/* Month nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <button onClick={prevMonth} style={{ background: "#111820", border: "1px solid #1e2630", borderRadius: 8, color: "#e2e8f0", fontSize: 18, padding: "6px 14px", cursor: "pointer" }}>‹</button>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>
                {new Date(calYear, calMonthN).toLocaleString("en", { month: "long", year: "numeric" })}
              </span>
              <button onClick={nextMonth} disabled={calMonth >= currentMonth} style={{ background: "#111820", border: "1px solid #1e2630", borderRadius: 8, color: calMonth >= currentMonth ? "#3a4a5a" : "#e2e8f0", fontSize: 18, padding: "6px 14px", cursor: calMonth >= currentMonth ? "default" : "pointer" }}>›</button>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div style={{ background: "#111820", border: "1px solid #1e2630", borderRadius: 12, padding: "14px 16px" }}>
                <span style={{ fontSize: 11, color: "#6b7a8d", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>Days studied</span>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#f97316", marginTop: 4 }}>{calStudiedDays}</div>
              </div>
              <div style={{ background: "#111820", border: "1px solid #1e2630", borderRadius: 12, padding: "14px 16px" }}>
                <span style={{ fontSize: 11, color: "#6b7a8d", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>Hours studied</span>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#7c3aed", marginTop: 4 }}>{calHours.toFixed(1)}h</div>
              </div>
            </div>

            {/* Calendar grid */}
            <div style={{ background: "#111820", border: "1px solid #1e2630", borderRadius: 14, padding: "16px" }}>
              {/* Day labels */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 8 }}>
                {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: 11, color: "#3a4a5a", fontWeight: 600, padding: "4px 0" }}>{d}</div>
                ))}
              </div>
              {/* Days */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const dateStr = `${calMonth}-${String(day).padStart(2, "0")}`;
                  const studied = studiedDates.has(dateStr);
                  const isToday = dateStr === new Date().toISOString().slice(0, 10);
                  const daySession = sessions.filter(s => s.date === dateStr);
                  const mins = daySession.reduce((sum, s) => sum + (s.duration || 0), 0);
                  return (
                    <div key={day} title={studied ? `${mins} min` : ""} style={{
                      aspectRatio: "1", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: studied ? 700 : 400,
                      background: studied ? "#00E5BE22" : "transparent",
                      color: studied ? "#00E5BE" : isToday ? "#fff" : "#6b7a8d",
                      border: isToday ? "1px solid #00E5BE66" : "1px solid transparent",
                      position: "relative",
                    }}>
                      {day}
                      {studied && <span style={{ position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: "#00E5BE" }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <div className="bottom-spacer" />
      </div>
    </div>
  );
}
