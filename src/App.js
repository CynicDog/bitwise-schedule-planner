import "./App.css";
import { useEffect, useState, useMemo, useRef } from "react";
import { loadRepository } from "./api/loadRepository";
import { joinRepository } from "./scheduler/joinRepository";
import { simulateRuns } from "./scheduler/simulateRuns";

const getTheme = (isDark) => ({
    primary: "#6366F1",
    highlightBg: isDark ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)",
    bg: isDark ? "#0F172A" : "#F8FAFC",
    cardBg: isDark ? "#1E293B" : "#FFFFFF",
    headerBg: isDark ? "#334155" : "#F1F5F9",
    zebra: isDark ? "#1e293b" : "#F9FBFC",
    border: isDark ? "#334155" : "#E2E8F0",
    textMain: isDark ? "#F1F5F9" : "#0F172A",
    textMuted: isDark ? "#94A3B8" : "#64748B",
    workflowWidth: 220,
    slotWidth: 34,
    rowHeight: 32,
});

const ScheduleCanvas = ({ timeline, workflows, grouped, subjectColors, view, isDark, selectedIndex }) => {
    const canvasRef = useRef(null);
    const theme = getTheme(isDark);

    const getSlotIndex = (runDate, view, timelineStart) => {
        const diffMs = runDate.getTime() - timelineStart.getTime();
        if (view === "30min") return Math.round(diffMs / (30 * 60000));
        if (view === "hour") return Math.round(diffMs / (60 * 60000));
        if (view === "day") return Math.round(diffMs / (24 * 60 * 60000));
        return -1;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !timeline.length) return;
        const ctx = canvas.getContext("2d");

        const dpr = window.devicePixelRatio || 1;
        const width = timeline.length * theme.slotWidth;
        const height = workflows.length * theme.rowHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        const timelineStart = timeline[0];

        workflows.forEach((_, i) => {
            if (i === selectedIndex) {
                ctx.fillStyle = theme.highlightBg;
            } else {
                ctx.fillStyle = i % 2 === 0 ? theme.zebra : theme.cardBg;
            }
            ctx.fillRect(0, i * theme.rowHeight, width, theme.rowHeight);

            ctx.strokeStyle = `${theme.border}88`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(0, (i + 1) * theme.rowHeight);
            ctx.lineTo(width, (i + 1) * theme.rowHeight);
            ctx.stroke();
        });

        ctx.strokeStyle = `${theme.border}44`;
        ctx.lineWidth = 1;
        timeline.forEach((_, i) => {
            const x = Math.floor(i * theme.slotWidth) + 0.5;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        });

        workflows.forEach((wf, rowIndex) => {
            const runs = grouped[wf] || [];
            runs.forEach(run => {
                let colIndex = -1;
                if (view === "week" || view === "month") {
                    colIndex = timeline.findIndex(slot => {
                        if (view === "week") {
                            const end = new Date(slot);
                            end.setDate(end.getDate() + 7);
                            return run.date >= slot && run.date < end;
                        }
                        return run.date.getMonth() === slot.getMonth() && run.date.getFullYear() === slot.getFullYear();
                    });
                } else {
                    colIndex = getSlotIndex(run.date, view, timelineStart);
                }

                if (colIndex >= 0 && colIndex < timeline.length) {
                    const x = colIndex * theme.slotWidth + (theme.slotWidth - 22) / 2;
                    const y = rowIndex * theme.rowHeight + (theme.rowHeight - 22) / 2;

                    ctx.fillStyle = subjectColors[run.subject] || theme.primary;
                    ctx.beginPath();
                    ctx.roundRect(x, y, 22, 22, 4);
                    ctx.fill();

                    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)";
                    ctx.stroke();
                }
            });
        });
    }, [timeline, workflows, grouped, subjectColors, view, isDark, theme, selectedIndex]);

    return <canvas ref={canvasRef} style={{ display: "block" }} />;
};

function App() {
    const [isDark, setIsDark] = useState(false);
    const theme = useMemo(() => getTheme(isDark), [isDark]);

    const [runs, setRuns] = useState([]);
    const [joined, setJoined] = useState([]);
    const [view, setView] = useState("hour");
    const [mode, setMode] = useState("grid");
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [horizon, setHorizon] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d;
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function init() {
            try {
                const repo = await loadRepository();
                const joinedData = joinRepository(repo.workflows, repo.schedules);
                setJoined(joinedData);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        }
        init();
    }, []);

    useEffect(() => {
        if (joined.length) setRuns(simulateRuns(joined, horizon));
    }, [joined, horizon]);

    const workflowList = useMemo(() => [...new Set(runs.map(r => r.workflow))].sort(), [runs]);

    const subjectColors = useMemo(() => {
        const map = {};
        const palette = ["#6366F1", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#14B8A6"];
        let i = 0;
        runs.forEach((r) => {
            if (!map[r.subject]) { map[r.subject] = palette[i % palette.length]; i++; }
        });
        return map;
    }, [runs]);

    const timeline = useMemo(() => {
        const slots = [];
        const cursor = new Date();
        cursor.setMinutes(0, 0, 0);
        while (cursor <= horizon) {
            slots.push(new Date(cursor));
            if (view === "30min") cursor.setMinutes(cursor.getMinutes() + 30);
            else if (view === "hour") cursor.setHours(cursor.getHours() + 1);
            else if (view === "day") cursor.setDate(cursor.getDate() + 1);
            else if (view === "week") cursor.setDate(cursor.getDate() + 7);
            else if (view === "month") cursor.setMonth(cursor.getMonth() + 1);
        }
        return slots;
    }, [horizon, view]);

    const grouped = useMemo(() => {
        const map = {};
        runs.forEach((r) => {
            if (!map[r.workflow]) map[r.workflow] = [];
            map[r.workflow].push({ date: new Date(r.runTime), subject: r.subject });
        });
        return map;
    }, [runs]);

    const navButtonStyle = (active) => ({
        padding: "6px 14px",
        fontSize: "12px",
        fontWeight: "bold",
        cursor: "pointer",
        border: `1px solid ${theme.border}`,
        backgroundColor: active ? theme.primary : theme.cardBg,
        color: active ? "#FFF" : theme.textMain,
        outline: "none",
        transition: "all 0.2s ease"
    });

    if (loading) return <div style={{ padding: 40, color: theme.textMain, background: theme.bg, minHeight: '100vh' }}>Loading...</div>;

    return (
        <div style={{ backgroundColor: theme.bg, minHeight: "100vh", padding: "20px", color: theme.textMain, fontFamily: 'Inter, system-ui, sans-serif', transition: "background 0.3s ease" }}>

            {/* CONTROLS HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <h2 style={{ margin: 0, fontSize: "18px", color: theme.textMain }}>Informatica Scheduler</h2>

                    <button
                        onClick={() => setIsDark(!isDark)}
                        style={{ ...navButtonStyle(false), borderRadius: '20px', padding: '6px 12px' }}
                    >
                        {isDark ? "🌙 Dark" : "☀️ Light"}
                    </button>

                    <div style={{ display: "flex", border: `1px solid ${theme.border}`, borderRadius: "4px", overflow: "hidden" }}>
                        <button style={navButtonStyle(mode === "grid")} onClick={() => setMode("grid")}>GRID</button>
                        <button style={navButtonStyle(mode === "table")} onClick={() => setMode("table")}>TABLE</button>
                    </div>

                    {mode === "grid" && (
                        <div style={{ display: "flex", border: `1px solid ${theme.border}`, borderRadius: "4px", overflow: "hidden" }}>
                            {["30min", "hour", "day", "week", "month"].map(v => (
                                <button key={v} style={navButtonStyle(view === v)} onClick={() => setView(v)}>{v.toUpperCase()}</button>
                            ))}
                        </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11px", color: theme.textMuted, fontWeight: "bold" }}>Until :</span>
                        <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            style={{
                                padding: "5px 10px",
                                border: `1px solid ${theme.border}`,
                                borderRadius: "4px",
                                backgroundColor: theme.cardBg,
                                color: theme.textMain,
                                outline: "none",
                                fontFamily: "inherit",
                                fontSize: "12px"
                            }}
                            value={horizon.toISOString().split('T')[0]}
                            onChange={(e) => {
                                const d = new Date(e.target.value);
                                d.setHours(23, 59, 59);
                                setHorizon(d);
                            }}
                        />
                    </div>
                </div>
            </div>

            {mode === "grid" && (
                <div style={{ overflow: "auto", border: `1px solid ${theme.border}`, backgroundColor: theme.cardBg, position: "relative", borderRadius: "8px" }}>
                    <div style={{ display: "flex", minWidth: "max-content" }}>

                        {/* STICKY WORKFLOW NAMES */}
                        <div style={{ position: "sticky", left: 0, zIndex: 30, background: theme.cardBg, boxShadow: isDark ? "2px 0 5px rgba(0,0,0,0.3)" : "2px 0 5px rgba(0,0,0,0.05)" }}>
                            <div style={{
                                width: theme.workflowWidth, height: "40px", background: theme.headerBg,
                                borderRight: `2px solid ${theme.border}`, borderBottom: `2px solid ${theme.border}`,
                                display: "flex", alignItems: "center", padding: "0 12px", fontWeight: "bold", fontSize: "12px",
                                boxSizing: "border-box"
                            }}>Workflow ({workflowList.length})</div>

                            {workflowList.map((wf, i) => (
                                <div
                                    key={wf}
                                    onClick={() => setSelectedIndex(i)}
                                    style={{
                                        width: theme.workflowWidth, height: theme.rowHeight,
                                        backgroundColor: selectedIndex === i ? theme.highlightBg : (i % 2 === 0 ? theme.zebra : theme.cardBg),
                                        borderRight: `2px solid ${theme.border}`,
                                        display: "flex", alignItems: "center", padding: "0 12px",
                                        fontSize: "11px", color: theme.textMain,
                                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                        boxSizing: "border-box",
                                        cursor: "pointer",
                                        borderLeft: selectedIndex === i ? `4px solid ${theme.primary}` : 'none'
                                    }}
                                >{wf}</div>
                            ))}
                        </div>

                        {/* STICKY TIME HEADER + CANVAS BODY */}
                        <div style={{ position: "relative" }}>
                            <div style={{ display: "flex", position: "sticky", top: 0, zIndex: 20, background: theme.headerBg, borderBottom: `1px solid ${theme.border}` }}>
                                {timeline.map((slot, i) => (
                                    <div key={i} style={{
                                        width: theme.slotWidth,
                                        height: "40px",
                                        borderRight: `1px solid ${theme.border}44`,
                                        position: "relative",
                                        flexShrink: 0,
                                        boxSizing: "border-box"
                                    }}>
                                        <div style={{
                                            position: "absolute",
                                            bottom: "6px",
                                            left: "50%",
                                            transform: "translateX(-30%) rotate(-45deg)",
                                            transformOrigin: "bottom left",
                                            fontSize: "9px",
                                            fontWeight: "bold",
                                            color: theme.textMuted,
                                            whiteSpace: "nowrap",
                                            pointerEvents: "none"
                                        }}>
                                            {view === "30min" ? `${slot.getHours()}:${slot.getMinutes() === 0 ? '00' : '30'}` :
                                                view === "hour" ? `${slot.getHours()}:00` : `${slot.getMonth()+1}/${slot.getDate()}`}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <ScheduleCanvas
                                timeline={timeline}
                                workflows={workflowList}
                                grouped={grouped}
                                subjectColors={subjectColors}
                                view={view}
                                isDark={isDark}
                                selectedIndex={selectedIndex}
                            />
                        </div>
                    </div>
                </div>
            )}

            {mode === "table" && (
                <div style={{ background: theme.cardBg, borderRadius: "8px", border: `1px solid ${theme.border}`, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead style={{ background: theme.headerBg, textAlign: "left", color: theme.textMain }}>
                        <tr>
                            <th style={{ padding: "12px" }}>Workflow</th>
                            <th style={{ padding: "12px" }}>Subject</th>
                            <th style={{ padding: "12px" }}>Frequency</th>
                            <th style={{ padding: "12px" }}>Next Run</th>
                        </tr>
                        </thead>
                        <tbody>
                        {runs.slice(0, 500).map((r, i) => {
                            const masterIndex = workflowList.indexOf(r.workflow);
                            const isSelected = selectedIndex === masterIndex;

                            return (
                                <tr
                                    key={i}
                                    onClick={() => setSelectedIndex(masterIndex)}
                                    style={{
                                        borderBottom: `1px solid ${theme.border}44`,
                                        background: isSelected ? theme.highlightBg : (i % 2 === 0 ? theme.zebra : theme.cardBg),
                                        cursor: "pointer",
                                        transition: "background 0.2s ease"
                                    }}
                                >
                                    <td style={{ padding: "12px", fontWeight: "600", position: 'relative' }}>
                                        {isSelected && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: theme.primary }} />}
                                        {r.workflow}
                                    </td>
                                    <td style={{ padding: "12px" }}>
                                        <span style={{ padding: "2px 8px", borderRadius: "4px", color: "#FFF", fontSize: "10px", fontWeight: "bold", background: subjectColors[r.subject] }}>{r.subject}</span>
                                    </td>
                                    <td style={{ padding: "12px", color: theme.textMuted }}>{r.frequency}</td>
                                    <td style={{ padding: "12px" }}>{new Date(r.runTime).toLocaleString()}</td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default App;