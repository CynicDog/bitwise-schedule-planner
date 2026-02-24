import "./App.css";
import { useEffect, useState, useMemo } from "react";
import { loadRepository, joinRepository } from "./data/repository";
import { projectRuns } from "./logic/project";

// Components
import Controls from "./components/Controls";
import GridView from "./components/GridView";
import DetailsPanel from "./components/DetailsPanel"; // Unified panel
import SchemasView from "./components/SchemasView";

const getTheme = (isDark) => ({
    primary: "#0090DA",
    highlightBg: isDark ? "rgba(0, 144, 218, 0.2)" : "rgba(0, 144, 218, 0.08)",
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
    const [mode, setMode] = useState("grid");

    // Selection State
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [selectedRunIndex, setSelectedRunIndex] = useState(null); // Added this

    const [loading, setLoading] = useState(true);
    const [from, setFrom] = useState(new Date());
    const [until, setUntil] = useState(new Date());
    const [tableSearch, setTableSearch] = useState("");

    // Reset run selection when the workflow changes
    useEffect(() => {
        setSelectedRunIndex(null);
    }, [selectedIndex]);

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

    useEffect(() => {
        async function init() {
            try {
                const repo = await loadRepository();
                const joinedData = joinRepository(repo);
                setJoined(joinedData);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        }
        init();
    }, []);

    const normalizedRange = useMemo(() => {
        const nFrom = new Date(from); nFrom.setSeconds(0, 0);
        const nUntil = new Date(until);
        if (["day", "week", "month"].includes(view)) {
            nFrom.setHours(0, 0, 0, 0);
            nUntil.setHours(23, 59, 59, 999);
        } else {
            nFrom.setSeconds(0, 0);
            nUntil.setSeconds(59, 999);
        }
        return { start: nFrom, end: nUntil };
    }, [from, until, view]);

    const filteredWorkflows = useMemo(() => {
        if (!tableSearch.trim()) return joined;
        const term = tableSearch.toLowerCase();
        return joined.filter(wf =>
            (wf.workflow?.WORKFLOW_NAME || "").toLowerCase().includes(term) ||
            (wf.Sources || "").toLowerCase().includes(term) ||
            (wf.Targets || "").toLowerCase().includes(term)
        );
    }, [joined, tableSearch]);

    useEffect(() => {
        if (!filteredWorkflows.length) { setRuns([]); return; }
        setRuns(projectRuns(filteredWorkflows, normalizedRange.start, normalizedRange.end));
    }, [filteredWorkflows, normalizedRange]);

    const timeline = useMemo(() => {
        const slots = [];
        const cursor = new Date(normalizedRange.start);
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

    const workflowList = useMemo(() => [...new Set(runs.map(r => r.workflow))].sort(), [runs]);

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
        return joined.find(j => j.workflow.WORKFLOW_NAME === workflowList[selectedIndex]);
    }, [selectedIndex, workflowList, joined]);

    const selectedWorkflowRuns = useMemo(() => {
        if (selectedIndex === null || !workflowList[selectedIndex]) return [];
        return runs
            .filter(r => r.workflow === workflowList[selectedIndex])
            .sort((a, b) => new Date(a.runTime) - new Date(b.runTime));
    }, [selectedIndex, workflowList, runs]);

    if (loading) return <div style={{ padding: 40, color: theme.textMain, background: theme.bg, minHeight: "100vh" }}>Loading...</div>;

    return (
        <div style={{ backgroundColor: theme.bg, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "20px", flexShrink: 0 }}>
                <Controls
                    isDark={isDark} setIsDark={setIsDark}
                    mode={mode} setMode={setMode}
                    view={view} setView={setView}
                    from={from} setFrom={setFrom}
                    until={until} setUntil={setUntil}
                    theme={theme} workflowCount={filteredWorkflows.length}
                    tableSearch={tableSearch} setTableSearch={setTableSearch}
                />
            </div>

            <div style={{ display: "flex", gap: "20px", flex: 1, padding: "0 20px 20px 20px", minHeight: 0, overflow: "hidden" }}>
                <div style={{
                    flex: selectedIndex !== null ? 9 : 12,
                    transition: "flex 0.4s ease",
                    overflowY: "auto",
                    height: "100%",
                    borderRadius: "8px",
                    border: `1px solid ${theme.border}`
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
                   <div style={{ flex: 3, minWidth: "350px", height: "100%" }}>
                       <DetailsPanel
                           data={selectedWorkflowData}
                           runs={selectedWorkflowRuns}
                           theme={theme}
                           isDark={isDark}
                           selectedRunIndex={selectedRunIndex}
                           onSelectRun={setSelectedRunIndex}
                           onClose={() => setSelectedIndex(null)}
                       />
                   </div>
               )}
            </div>
        </div>
    );
}

export default App;