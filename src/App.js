import "./App.css";
import { useEffect, useState, useMemo } from "react";
import { loadRepository } from "./api/loadRepository";
import { joinRepository } from "./scheduler/joinRepository";
import { simulateRuns } from "./scheduler/simulateRuns";

const AF_THEME = {
    primary: "#4F46E5",
    bg: "#F8FAFC",
    white: "#FFFFFF",
    border: "#E2E8F0",
    textMain: "#0F172A",
    textMuted: "#64748B",
    workflowWidth: 220,
    slotWidth: 32,
    rowHeight: 32,
};

function App() {
    const [runs, setRuns] = useState([]);
    const [joined, setJoined] = useState([]);
    const [view, setView] = useState("hour"); // 30min | hour | day | week | month
    const [mode, setMode] = useState("grid"); // grid | table
    const [horizon, setHorizon] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        d.setHours(23, 59, 59, 999);
        return d;
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /* ================= ORIGINAL LOGIC ================= */
    useEffect(() => {
        async function init() {
            try {
                const repo = await loadRepository();
                const joinedData = joinRepository(repo.workflows, repo.schedules);
                setJoined(joinedData);
            } catch (e) {
                console.error(e);
                setError("Failed to load repository files.");
            } finally {
                setLoading(false);
            }
        }
        init();
    }, []);

    useEffect(() => {
        if (!joined.length) return;
        setRuns(simulateRuns(joined, horizon));
    }, [joined, horizon]);

    const subjectColors = useMemo(() => {
        const map = {};
        const palette = ["#6366F1", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#14B8A6"];
        let i = 0;
        runs.forEach((r) => {
            if (!map[r.subject]) {
                map[r.subject] = palette[i % palette.length];
                i++;
            }
        });
        return map;
    }, [runs]);

    /* ================= UPDATED TIMELINE (WITH 30MIN) ================= */
    const timeline = useMemo(() => {
        const slots = [];
        const cursor = new Date();
        cursor.setMinutes(0, 0, 0);
        while (cursor <= horizon) {
            slots.push(new Date(cursor));
            if (view === "30min") cursor.setMinutes(cursor.getMinutes() + 30);
            else if (view === "hour") cursor.setHours(cursor.getHours() + 1);
            else if (view === "day") { cursor.setDate(cursor.getDate() + 1); cursor.setHours(0); }
            else if (view === "week") { cursor.setDate(cursor.getDate() + 7); cursor.setHours(0); }
            else if (view === "month") { cursor.setMonth(cursor.getMonth() + 1); cursor.setDate(1); cursor.setHours(0); }
        }
        return slots;
    }, [horizon, view]);

    const grouped = useMemo(() => {
        const map = {};
        runs.forEach((r) => {
            if (!map[r.workflow]) map[r.workflow] = [];
            map[r.workflow].push({
                date: new Date(r.runTime),
                subject: r.subject,
                frequency: r.frequency,
            });
        });
        return map;
    }, [runs]);

    /* ================= UPDATED MATCHES (WITH 30MIN) ================= */
    function matchesSlot(runDate, slot) {
        if (view === "30min") {
            const diff = Math.abs(runDate - slot);
            return diff < 15 * 60 * 1000; // Snap to nearest 30m slot
        }
        if (view === "hour")
            return runDate.getFullYear() === slot.getFullYear() && runDate.getMonth() === slot.getMonth() && runDate.getDate() === slot.getDate() && runDate.getHours() === slot.getHours();
        if (view === "day")
            return runDate.getFullYear() === slot.getFullYear() && runDate.getMonth() === slot.getMonth() && runDate.getDate() === slot.getDate();
        if (view === "week") {
            const end = new Date(slot);
            end.setDate(end.getDate() + 6);
            return runDate >= slot && runDate <= end;
        }
        if (view === "month")
            return runDate.getFullYear() === slot.getFullYear() && runDate.getMonth() === slot.getMonth();
        return false;
    }

    if (loading) return <div style={{ padding: 20, fontFamily: 'sans-serif' }}>Loading...</div>;
    if (error) return <div style={{ padding: 20, color: 'red' }}>{error}</div>;

    const navButtonStyle = (active) => ({
        padding: "6px 14px",
        fontSize: "12px",
        fontWeight: "bold",
        cursor: "pointer",
        border: `1px solid ${AF_THEME.border}`,
        backgroundColor: active ? AF_THEME.primary : "#FFF",
        color: active ? "#FFF" : AF_THEME.textMain,
        transition: "all 0.2s ease",
        outline: "none"
    });

    const viewOptions = ["30min", "hour", "day", "week", "month"];

    return (
        <div style={{ backgroundColor: AF_THEME.bg, minHeight: "100vh", padding: "20px", fontFamily: 'Segoe UI, Roboto, sans-serif', boxSizing: 'border-box' }}>

            {/* HEADER & CONTROLS (ONE LINE) */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <h2 style={{ margin: 0, color: AF_THEME.textMain, fontSize: "20px", whiteSpace: "nowrap" }}>Informatica (ETL) Schedule Spread</h2>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ display: "flex", borderRadius: "4px", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.1)", border: `1px solid ${AF_THEME.border}` }}>
                            <button style={{ ...navButtonStyle(mode === "grid"), border: "none", borderRight: `1px solid ${AF_THEME.border}`, borderRadius: 0 }} onClick={() => setMode("grid")}>GRID</button>
                            <button style={{ ...navButtonStyle(mode === "table"), border: "none", borderRadius: 0 }} onClick={() => setMode("table")}>TABLE</button>
                        </div>

                        {mode === "grid" && (
                            <div style={{ display: "flex", borderRadius: "4px", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.1)", border: `1px solid ${AF_THEME.border}` }}>
                                {viewOptions.map((v, i) => (
                                    <button
                                        key={v}
                                        style={{
                                            ...navButtonStyle(view === v),
                                            border: "none",
                                            borderRight: i === viewOptions.length - 1 ? "none" : `1px solid ${AF_THEME.border}`,
                                            borderRadius: 0,
                                            margin: 0
                                        }}
                                        onClick={() => setView(v)}
                                    >
                                        {v.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div style={{ width: "1px", height: "24px", backgroundColor: AF_THEME.border, margin: "0 5px" }} />

                        <label style={{ fontSize: "11px", fontWeight: "800", color: AF_THEME.textMuted, display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase" }}>
                            Until:
                            <input
                                type="date"
                                style={{ padding: "5px 8px", border: `1px solid ${AF_THEME.border}`, borderRadius: "4px", fontSize: "12px", color: AF_THEME.textMain }}
                                value={horizon.toISOString().split("T")[0]}
                                onChange={(e) => {
                                    const d = new Date(e.target.value);
                                    d.setHours(23, 59, 59);
                                    setHorizon(d);
                                }}
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* TABLE VIEW (ZEBRA STRIPED) */}
            {mode === "table" && (
                <div style={{ backgroundColor: "#FFF", border: `1px solid ${AF_THEME.border}`, borderRadius: "4px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead>
                        <tr style={{ backgroundColor: "#ECEFF1", borderBottom: `2px solid ${AF_THEME.border}`, textAlign: "left" }}>
                            <th style={{ padding: "12px", color: AF_THEME.textMain }}>Workflow</th>
                            <th style={{ padding: "12px", color: AF_THEME.textMain }}>Subject</th>
                            <th style={{ padding: "12px", color: AF_THEME.textMain }}>Frequency</th>
                            <th style={{ padding: "12px", color: AF_THEME.textMain }}>Run Time</th>
                        </tr>
                        </thead>
                        <tbody>
                        {runs.map((r, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${AF_THEME.border}44`, backgroundColor: i % 2 === 0 ? "#F9FAFB" : "#FFFFFF" }}>
                                <td style={{ padding: "12px", fontWeight: "600", color: AF_THEME.textMain }}>{r.workflow}</td>
                                <td style={{ padding: "12px" }}>
                                    <span style={{ padding: "3px 10px", borderRadius: "3px", color: "#FFF", fontSize: "11px", fontWeight: "bold", backgroundColor: subjectColors[r.subject] }}>{r.subject}</span>
                                </td>
                                <td style={{ padding: "12px", color: AF_THEME.textMuted }}>{r.frequency}</td>
                                <td style={{ padding: "12px", color: AF_THEME.textMuted }}>{new Date(r.runTime).toLocaleString()}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* GRID VIEW */}
            {mode === "grid" && (
                <div style={{ overflow: "auto", border: `1px solid ${AF_THEME.border}`, backgroundColor: "#FFF", position: "relative", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
                    <div style={{ display: "inline-block", verticalAlign: "top", minWidth: "100%" }}>
                        <div style={{ display: "flex", position: "sticky", top: 0, zIndex: 10, background: "#ECEFF1" }}>
                            <div style={{ width: AF_THEME.workflowWidth, minWidth: AF_THEME.workflowWidth, height: "45px", position: "sticky", left: 0, background: "#ECEFF1", zIndex: 11, borderRight: `2px solid ${AF_THEME.border}`, display: "flex", alignItems: "center", padding: "0 10px", fontSize: "12px", fontWeight: "bold", color: AF_THEME.textMain }}>Workflow</div>
                            {timeline.map((slot, i) => (
                                <div key={i} style={{
                                    width: AF_THEME.slotWidth,
                                    minWidth: AF_THEME.slotWidth,
                                    height: "45px",
                                    borderRight: `1px solid ${AF_THEME.border}44`,
                                    position: "relative",
                                    flexShrink: 0
                                }}>
                                    <div style={{
                                        position: "absolute",
                                        bottom: "6px",
                                        left: "50%",
                                        transform: "rotate(-45deg) translateX(-25%)",
                                        transformOrigin: "bottom left",
                                        whiteSpace: "nowrap",
                                        fontSize: "9px",
                                        fontWeight: "bold",
                                        color: AF_THEME.textMuted,
                                        textAlign: "center"
                                    }}>
                                        {view === "30min"
                                            ? `${slot.getHours()}:${slot.getMinutes() === 0 ? "00" : "30"}`
                                            : view === "hour" ? `${slot.getHours()}:00` : `${slot.getMonth()+1}/${slot.getDate()}`}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {Object.keys(grouped).map((wf, i) => (
                            <div key={i} style={{ display: "flex", borderBottom: `1px solid ${AF_THEME.border}33` }}>
                                <div style={{ width: AF_THEME.workflowWidth, minWidth: AF_THEME.workflowWidth, height: AF_THEME.rowHeight, position: "sticky", left: 0, background: "#FFF", zIndex: 5, borderRight: `2px solid ${AF_THEME.border}`, padding: "0 10px", fontSize: "11px", fontWeight: "500", display: "flex", alignItems: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: AF_THEME.textMain }}>{wf}</div>
                                {timeline.map((slot, idx) => {
                                    const run = grouped[wf].find((r) => matchesSlot(r.date, slot));
                                    return (
                                        <div key={idx} style={{ width: AF_THEME.slotWidth, minWidth: AF_THEME.slotWidth, height: AF_THEME.rowHeight, borderRight: `1px solid ${AF_THEME.border}22`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: idx % 2 === 0 ? "#F9FBFC" : "#FFF" }}>
                                            {run && (
                                                <div title={`${run.subject} - ${run.date.toLocaleString()}`} style={{ width: "22px", height: "22px", borderRadius: "2px", backgroundColor: subjectColors[run.subject], boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.05)" }} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;