import "./App.css";
import { useEffect, useState, useMemo, useRef } from "react";
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
    slotWidth: 34, // Slightly wider for 30min labels
    rowHeight: 32,
};

/* ================= CANVAS COMPONENT ================= */
const ScheduleCanvas = ({ timeline, workflows, grouped, subjectColors, view }) => {
    const canvasRef = useRef(null);

    // Helper to find slot index without O(N) searching every time
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
        const width = timeline.length * AF_THEME.slotWidth;
        const height = workflows.length * AF_THEME.rowHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        const timelineStart = timeline[0];

        // 1. Draw Grid Background & Zebra Stripes
        workflows.forEach((_, i) => {
            ctx.fillStyle = i % 2 === 0 ? "#F9FBFC" : "#FFFFFF";
            ctx.fillRect(0, i * AF_THEME.rowHeight, width, AF_THEME.rowHeight);

            ctx.strokeStyle = `${AF_THEME.border}44`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, (i + 1) * AF_THEME.rowHeight);
            ctx.lineTo(width, (i + 1) * AF_THEME.rowHeight);
            ctx.stroke();
        });

        // 2. Draw Column Dividers
        ctx.strokeStyle = `${AF_THEME.border}22`;
        timeline.forEach((_, i) => {
            ctx.beginPath();
            ctx.moveTo(i * AF_THEME.slotWidth, 0);
            ctx.lineTo(i * AF_THEME.slotWidth, height);
            ctx.stroke();
        });

        // 3. Draw Scheduled Runs
        workflows.forEach((wf, rowIndex) => {
            const runs = grouped[wf] || [];
            runs.forEach(run => {
                let colIndex = -1;

                // For complex views (week/month), fallback to manual matching
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
                    const x = colIndex * AF_THEME.slotWidth + (AF_THEME.slotWidth - 22) / 2;
                    const y = rowIndex * AF_THEME.rowHeight + (AF_THEME.rowHeight - 22) / 2;

                    ctx.fillStyle = subjectColors[run.subject] || AF_THEME.primary;

                    // Draw rounded marker
                    ctx.beginPath();
                    const radius = 3;
                    ctx.roundRect(x, y, 22, 22, radius);
                    ctx.fill();

                    // Subtle Border
                    ctx.strokeStyle = "rgba(0,0,0,0.1)";
                    ctx.stroke();
                }
            });
        });
    }, [timeline, workflows, grouped, subjectColors, view]);

    return <canvas ref={canvasRef} style={{ display: "block" }} />;
};

function App() {
    const [runs, setRuns] = useState([]);
    const [joined, setJoined] = useState([]);
    const [view, setView] = useState("hour"); // 30min | hour | day | week | month
    const [mode, setMode] = useState("grid");
    const [horizon, setHorizon] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        d.setHours(23, 59, 59, 999);
        return d;
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function init() {
            try {
                const repo = await loadRepository();
                const joinedData = joinRepository(repo.workflows, repo.schedules);
                setJoined(joinedData);
            } catch (e) {
                setError("Failed to load repository.");
            } finally {
                setLoading(false);
            }
        }
        init();
    }, []);

    useEffect(() => {
        if (joined.length) {
            setRuns(simulateRuns(joined, horizon));
        }
    }, [joined, horizon]);

    const workflowList = useMemo(() => {
        return [...new Set(runs.map(r => r.workflow))].sort();
    }, [runs]);

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

    const timeline = useMemo(() => {
        const slots = [];
        const cursor = new Date();
        cursor.setMinutes(0, 0, 0);
        cursor.setSeconds(0, 0);

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
            map[r.workflow].push({
                date: new Date(r.runTime),
                subject: r.subject
            });
        });
        return map;
    }, [runs]);

    const navButtonStyle = (active) => ({
        padding: "6px 14px",
        fontSize: "12px",
        fontWeight: "bold",
        cursor: "pointer",
        border: `1px solid ${AF_THEME.border}`,
        backgroundColor: active ? AF_THEME.primary : "#FFF",
        color: active ? "#FFF" : AF_THEME.textMain,
        outline: "none"
    });

    if (loading) return <div style={{ padding: 40 }}>Loading Engine...</div>;

    return (
        <div style={{ backgroundColor: AF_THEME.bg, minHeight: "100vh", padding: "20px", fontFamily: 'Inter, system-ui, sans-serif' }}>

            {/* CONTROLS HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <h2 style={{ margin: 0, fontSize: "18px", color: AF_THEME.textMain }}>Informatica Scheduler</h2>
                    <div style={{ display: "flex", border: `1px solid ${AF_THEME.border}`, borderRadius: "4px", overflow: "hidden" }}>
                        <button style={navButtonStyle(mode === "grid")} onClick={() => setMode("grid")}>GRID</button>
                        <button style={navButtonStyle(mode === "table")} onClick={() => setMode("table")}>TABLE</button>
                    </div>
                    {mode === "grid" && (
                        <div style={{ display: "flex", border: `1px solid ${AF_THEME.border}`, borderRadius: "4px", overflow: "hidden" }}>
                            {["30min", "hour", "day", "week", "month"].map(v => (
                                <button key={v} style={navButtonStyle(view === v)} onClick={() => setView(v)}>{v.toUpperCase()}</button>
                            ))}
                        </div>
                    )}
                    <input
                        type="date"
                        style={{ padding: "5px", border: `1px solid ${AF_THEME.border}`, borderRadius: "4px" }}
                        value={horizon.toISOString().split('T')[0]}
                        onChange={(e) => {
                            const d = new Date(e.target.value);
                            d.setHours(23, 59, 59);
                            setHorizon(d);
                        }}
                    />
                </div>
            </div>

            {/* GRID VIEW WITH CANVAS */}
            {mode === "grid" && (
                <div style={{
                    overflow: "auto",
                    border: `1px solid ${AF_THEME.border}`,
                    backgroundColor: "#FFF",
                    position: "relative",
                    borderRadius: "8px"
                }}>
                    <div style={{ display: "flex", minWidth: "max-content" }}>

                        {/* STICKY WORKFLOW NAMES */}
                        <div style={{ position: "sticky", left: 0, zIndex: 30, background: "#FFF", boxShadow: "2px 0 5px rgba(0,0,0,0.05)" }}>
                            <div style={{
                                width: AF_THEME.workflowWidth, height: "50px", background: "#F1F5F9",
                                borderRight: `2px solid ${AF_THEME.border}`, borderBottom: `2px solid ${AF_THEME.border}`,
                                display: "flex", alignItems: "center", padding: "0 12px", fontWeight: "bold", fontSize: "12px"
                            }}>Workflow ({workflowList.length})</div>

                            {workflowList.map((wf, i) => (
                                <div key={wf} style={{
                                    width: AF_THEME.workflowWidth, height: AF_THEME.rowHeight,
                                    backgroundColor: i % 2 === 0 ? "#F9FBFC" : "#FFF",
                                    borderRight: `2px solid ${AF_THEME.border}`,
                                    display: "flex", alignItems: "center", padding: "0 12px",
                                    fontSize: "11px", color: AF_THEME.textMain,
                                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                                }}>{wf}</div>
                            ))}
                        </div>

                        {/* STICKY TIME HEADER + CANVAS BODY */}
                        <div style={{ position: "relative" }}>
                            <div style={{ display: "flex", position: "sticky", top: 0, zIndex: 20, background: "#F1F5F9", borderBottom: `2px solid ${AF_THEME.border}` }}>
                                {timeline.map((slot, i) => (
                                    <div key={i} style={{
                                        width: AF_THEME.slotWidth, height: "50px", borderRight: `1px solid ${AF_THEME.border}44`,
                                        position: "relative", flexShrink: 0
                                    }}>
                                        <div style={{
                                            position: "absolute", bottom: "8px", left: "50%",
                                            transform: "rotate(-45deg) translateX(-20%)", transformOrigin: "bottom left",
                                            fontSize: "9px", fontWeight: "bold", color: AF_THEME.textMuted, whiteSpace: "nowrap"
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
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* TABLE VIEW */}
            {mode === "table" && (
                <div style={{ background: "#FFF", borderRadius: "8px", border: `1px solid ${AF_THEME.border}`, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead style={{ background: "#F1F5F9", textAlign: "left" }}>
                        <tr>
                            <th style={{ padding: "12px" }}>Workflow</th>
                            <th style={{ padding: "12px" }}>Subject</th>
                            <th style={{ padding: "12px" }}>Frequency</th>
                            <th style={{ padding: "12px" }}>Next Run</th>
                        </tr>
                        </thead>
                        <tbody>
                        {runs.slice(0, 500).map((r, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${AF_THEME.border}44`, background: i % 2 === 0 ? "#F9FBFC" : "#FFF" }}>
                                <td style={{ padding: "12px", fontWeight: "600" }}>{r.workflow}</td>
                                <td style={{ padding: "12px" }}>
                                        <span style={{
                                            padding: "2px 8px", borderRadius: "4px", color: "#FFF", fontSize: "10px", fontWeight: "bold",
                                            background: subjectColors[r.subject]
                                        }}>{r.subject}</span>
                                </td>
                                <td style={{ padding: "12px", color: AF_THEME.textMuted }}>{r.frequency}</td>
                                <td style={{ padding: "12px" }}>{new Date(r.runTime).toLocaleString()}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default App;