const Controls = ({ isDark, setIsDark, mode, setMode, view, setView, horizon, setHorizon, theme, workflowCount }) => {
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

    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <h2 style={{ margin: 0, fontSize: "18px", color: theme.textMain }}>Informatica Scheduler</h2>
                <button onClick={() => setIsDark(!isDark)} style={{ ...navButtonStyle(false), borderRadius: '20px', padding: '6px 12px' }}>
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
                        style={{ padding: "5px 10px", border: `1px solid ${theme.border}`, borderRadius: "4px", backgroundColor: theme.cardBg, color: theme.textMain, fontSize: "12px" }}
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
    );
};

export default Controls;