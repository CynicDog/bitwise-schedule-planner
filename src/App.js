import "./App.css";
import { useEffect, useState, useMemo } from "react";
import { loadRepository, joinRepository } from "./data/repository";
import { projectRuns } from "./logic/project";

// Components
import Controls from "./components/Controls";
import GridView from "./components/GridView";
import TableView from "./components/TableView";

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
        if (joined.length) setRuns(projectRuns(joined, horizon));
    }, [joined, horizon]);

    const workflowList = useMemo(() => [...new Set(runs.map(r => r.workflow))].sort(), [runs]);

    const subjectColors = useMemo(() => {
        const map = {};

        // Modern scheduler categorical palette (24 distinct hues)
        const palette = [
            "#5B8FF9", // blue
            "#61DDAA", // mint
            "#65789B", // steel
            "#F6BD16", // amber
            "#7262FD", // indigo
            "#78D3F8", // sky
            "#9661BC", // purple
            "#F6903D", // orange
            "#008685", // teal
            "#F08BB4", // pink
            "#3CC2D8", // aqua
            "#D3C6EA", // lavender
            "#6DC8EC", // light blue
            "#FF99C3", // rose
            "#B6E880", // lime
            "#FFB55A", // soft orange
            "#9A6BFF", // violet
            "#36B37E", // emerald
            "#FF6B6B", // coral
            "#4C9AFF", // azure
            "#00B8D9", // cyan
            "#6554C0", // deep indigo
            "#FF8F73", // peach
            "#A0AEC0"  // neutral slate
        ];

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

    if (loading) return <div style={{ padding: 40, color: theme.textMain, background: theme.bg, minHeight: '100vh' }}>Loading...</div>;

    return (
        <div style={{ backgroundColor: theme.bg, minHeight: "100vh", padding: "20px", color: theme.textMain, fontFamily: 'Inter, system-ui, sans-serif', transition: "background 0.3s ease" }}>
            <Controls
                isDark={isDark} setIsDark={setIsDark} mode={mode} setMode={setMode}
                view={view} setView={setView} horizon={horizon} setHorizon={setHorizon}
                theme={theme} workflowCount={workflowList.length}
            />

            {mode === "grid" ? (
                <GridView
                    theme={theme} isDark={isDark} workflowList={workflowList}
                    timeline={timeline} view={view} grouped={grouped}
                    subjectColors={subjectColors} selectedIndex={selectedIndex}
                    setSelectedIndex={setSelectedIndex}
                />
            ) : (
                <TableView
                    runs={runs} workflowList={workflowList} selectedIndex={selectedIndex}
                    setSelectedIndex={setSelectedIndex} subjectColors={subjectColors} theme={theme}
                />
            )}
        </div>
    );
}

export default App;