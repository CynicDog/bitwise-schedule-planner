import "./App.css";
import { useEffect, useState, useMemo } from "react";
import { loadRepository, joinRepository } from "./data/repository";
import { projectRuns } from "./logic/project";

// Components
import Controls from "./components/Controls";
import GridView from "./components/GridView";
import TableView from "./components/TableView";
import DetailsPanel from "./components/DetailsPanel";
import SchemasView from "./components/SchemasView"; // <--- Import this once created

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

function App() {
    const [isDark, setIsDark] = useState(false);
    const theme = useMemo(() => getTheme(isDark), [isDark]);

    const [runs, setRuns] = useState([]);
    const [joined, setJoined] = useState([]);
    const [view, setView] = useState("hour");
    const [mode, setMode] = useState("grid"); // New view mode state
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [loading, setLoading] = useState(true);

    const [from, setFrom] = useState(new Date());
    const [until, setUntil] = useState(new Date());
    const [tableSearch, setTableSearch] = useState("");

    /* --------------------------------------------------
        WINDOW MGMT
    -------------------------------------------------- */
    useEffect(() => {
        const now = new Date();
        const start = new Date(now);
        const end = new Date(now);

        switch (view) {
            case "30min": end.setMinutes(end.getMinutes() + 1800); break;
            case "hour": end.setHours(end.getHours() + 23); break;
            case "day": end.setDate(end.getDate() + 7); break;
            case "week": end.setDate(end.getDate() + 21); break;
            case "month": end.setMonth(end.getMonth() + 2); break;
            default: end.setHours(end.getHours() + 1);
        }
        setFrom(start);
        setUntil(end);
    }, [view]);

    /* --------------------------------------------------
        INITIAL LOAD
    -------------------------------------------------- */
    useEffect(() => {
        async function init() {
            try {
                const repo = await loadRepository();
                const joinedData = joinRepository(repo);
                setJoined(joinedData);
            } catch (e) {
                console.error("Initialization error:", e);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, []);

    const normalizedRange = useMemo(() => {
        const nFrom = new Date(from);
        nFrom.setSeconds(0, 0);
        const nUntil = new Date(until);
        if (view === "day" || view === "week" || view === "month") {
            nFrom.setHours(0, 0, 0, 0);
            nUntil.setHours(23, 59, 59, 999);
        } else {
            nFrom.setSeconds(0, 0);
            nUntil.setSeconds(59, 999);
        }
        return { start: nFrom, end: nUntil };
    }, [from, until, view]);

    /* --------------------------------------------------
        FILTERING & PROJECTION
    -------------------------------------------------- */
    const filteredWorkflows = useMemo(() => {
        if (!tableSearch.trim()) return joined;
        const term = tableSearch.toLowerCase();
        return joined.filter(wf => {
            const workflowName = (wf.workflow?.WORKFLOW_NAME || "").toLowerCase();
            const sources = (wf.Sources || "").toLowerCase();
            const targets = (wf.Targets || "").toLowerCase();
            return workflowName.includes(term) || sources.includes(term) || targets.includes(term);
        });
    }, [joined, tableSearch]);

    useEffect(() => {
        if (!filteredWorkflows.length) {
            setRuns([]);
            return;
        }
        const projected = projectRuns(filteredWorkflows, normalizedRange.start, normalizedRange.end);
        setRuns(projected);
    }, [filteredWorkflows, normalizedRange]);

    /* --------------------------------------------------
        GRID DATA PREP
    -------------------------------------------------- */
    const timeline = useMemo(() => {
        const slots = [];
        const cursor = new Date(normalizedRange.start);
        if (view === "30min") cursor.setMinutes(Math.floor(cursor.getMinutes() / 30) * 30);
        else if (view === "hour") cursor.setMinutes(0);

        while (cursor <= normalizedRange.end) {
            slots.push(new Date(cursor));
            if (view === "30min") cursor.setMinutes(cursor.getMinutes() + 30);
            else if (view === "hour") cursor.setHours(cursor.getHours() + 1);
            else if (view === "day") cursor.setDate(cursor.getDate() + 1);
            else if (view === "week") cursor.setDate(cursor.getDate() + 7);
            else if (view === "month") cursor.setMonth(cursor.getMonth() + 1);
            if (slots.length > 5000) break;
        }
        return slots;
    }, [normalizedRange, view]);

    const workflowList = useMemo(() => {
        return [...new Set(runs.map(r => r.workflow))].sort();
    }, [runs]);

    const grouped = useMemo(() => {
        const map = {};
        runs.forEach((r) => {
            if (!map[r.workflow]) map[r.workflow] = [];
            map[r.workflow].push({ date: new Date(r.runTime), subject: r.subject });
        });
        return map;
    }, [runs]);

    const subjectColors = useMemo(() => {
        const map = {};
        const palette = ["#5B8FF9", "#61DDAA", "#65789B", "#F6BD16", "#7262FD", "#78D3F8", "#9661BC", "#F6903D"];
        let i = 0;
        runs.forEach((r) => {
            if (!map[r.subject]) { map[r.subject] = palette[i % palette.length]; i++; }
        });
        return map;
    }, [runs]);

    const selectedWorkflowData = useMemo(() => {
        if (selectedIndex === null || !workflowList[selectedIndex]) return null;
        const name = workflowList[selectedIndex];
        return joined.find(j => j.workflow.WORKFLOW_NAME === name);
    }, [selectedIndex, workflowList, joined]);

    const selectedWorkflowRuns = useMemo(() => {
        if (selectedIndex === null || !workflowList[selectedIndex]) return [];
        const selectedName = workflowList[selectedIndex];
        return runs
            .filter(r => r.workflow === selectedName)
            .sort((a, b) => new Date(a.runTime) - new Date(b.runTime));
    }, [selectedIndex, workflowList, runs]);

    if (loading) return (
        <div style={{ padding: 40, color: theme.textMain, background: theme.bg, minHeight: "100vh" }}>
            Loading Informatics Metadata Repository...
        </div>
    );

    return (
        <div style={{ backgroundColor: theme.bg, minHeight: "100vh", padding: "20px", color: theme.textMain, fontFamily: "Inter, sans-serif" }}>
            <Controls
                isDark={isDark} setIsDark={setIsDark}
                mode={mode} setMode={setMode}
                view={view} setView={setView}
                from={from} setFrom={setFrom}
                until={until} setUntil={setUntil}
                theme={theme} workflowCount={filteredWorkflows.length}
                tableSearch={tableSearch} setTableSearch={setTableSearch}
            />

            <div style={{ display: "flex", gap: "20px", width: "100%", alignItems: "flex-start" }}>
                <div style={{
                    flex: selectedIndex !== null ? 9 : 12,
                    transition: "flex 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    minWidth: 0,
                    overflow: "hidden"
                }}>
                    {mode === "grid" ? (
                        <GridView
                            theme={theme} isDark={isDark}
                            workflowList={workflowList}
                            timeline={timeline}
                            view={view}
                            grouped={grouped}
                            subjectColors={subjectColors}
                            selectedIndex={selectedIndex}
                            setSelectedIndex={setSelectedIndex}
                        />
                    ) : (
                        <SchemasView
                            data={filteredWorkflows}
                            theme={theme}
                            isDark={isDark}
                            onSelectWorkflow={(wf) => {
                                const idx = workflowList.indexOf(wf.workflow.WORKFLOW_NAME);
                                if (idx !== -1) setSelectedIndex(idx);
                            }}
                        />
                    )}
                </div>

                {selectedIndex !== null && (
                    <div style={{
                        flex: 3,
                        minWidth: "350px",
                        position: "sticky",
                        top: "20px",
                        maxHeight: "calc(100vh - 40px)",
                        animation: "slideIn 0.3s ease-out",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px"
                    }}>
                        <DetailsPanel
                            data={selectedWorkflowData}
                            theme={theme}
                            isDark={isDark}
                        />

                        <TableView
                            runs={selectedWorkflowRuns}
                            subjectColors={subjectColors}
                            theme={theme}
                            isDark={isDark}
                        />
                    </div>
                )}
            </div>

            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}

export default App;