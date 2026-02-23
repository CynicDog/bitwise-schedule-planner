import React, { useState, useEffect } from "react";

const Controls = ({
    isDark, setIsDark, mode, setMode, view, setView,
    from, setFrom, until, setUntil, theme,
    workflowCount, tableSearch, setTableSearch
}) => {
    const softBg = isDark ? "#ffffff10" : "#00000008";
    const pad = (n) => String(n).padStart(2, "0");
    const [localSearch, setLocalSearch] = useState(tableSearch || "");

    useEffect(() => {
        const id = setTimeout(() => {
            setTableSearch(localSearch.trim().toLowerCase());
        }, 350);
        return () => clearTimeout(id);
    }, [localSearch, setTableSearch]);

    const toLocalDate = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };

    const handleDateChange = (type, value, isFrom) => {
        const [y, m, d] = value.split("-").map(Number);
        const newDate = new Date(y, m - 1, d, isFrom ? 0 : 23, isFrom ? 0 : 59);
        isFrom ? setFrom(newDate) : setUntil(newDate);
    };

    // --- UPDATED STYLES FOR RESPONSIVENESS ---
    const containerStyle = {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap", // <--- Key fix: allows wrapping to next line
        gap: "12px",
        marginBottom: "20px",
        background: theme.cardBg,
        padding: "12px 16px",
        borderRadius: "12px",
        border: `1px solid ${theme.border}`,
    };

    const groupStyle = {
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap", // <--- Allow inner groups to wrap on tiny screens
        gap: "8px",
        flex: "1 1 auto" // Allows the search group to grow
    };

    const panelStyle = {
        display: "flex",
        alignItems: "center",
        background: softBg,
        padding: "3px",
        borderRadius: "8px",
        border: `1px solid ${theme.border}`
    };

    const btn = (active) => ({
        padding: "5px 10px",
        fontSize: "12px",
        fontWeight: 600,
        borderRadius: "6px",
        cursor: "pointer",
        border: "none",
        background: active ? theme.primary : "transparent",
        color: active ? "#fff" : theme.textMuted,
        transition: "all 0.2s",
        whiteSpace: "nowrap"
    });

    const inputStyle = {
        background: "transparent",
        border: "none",
        color: theme.textMain,
        fontSize: "12px",
        outline: "none",
        fontWeight: 500
    };

    return (
        <div style={containerStyle}>
            {/* Left Section: View Modes and Search */}
            <div style={groupStyle}>
                <div style={panelStyle}>
                    <button style={btn(mode === "grid")} onClick={() => setMode("grid")}>Grid</button>
                    <button style={btn(mode === "table")} onClick={() => setMode("table")}>Table</button>
                </div>

                {mode === "grid" && (
                    <div style={{...panelStyle, overflowX: "auto"}}>
                        {["30min", "hour", "day", "week", "month"].map(v => (
                            <button key={v} style={btn(view === v)} onClick={() => setView(v)}>{v}</button>
                        ))}
                    </div>
                )}

                <div style={{ ...panelStyle, padding: "5px 10px", flex: "1 1 200px", minWidth: "150px" }}>
                    <span style={{ marginRight: "6px", opacity: 0.6 }}>🔍</span>
                    <input
                        style={{ ...inputStyle, width: "100%" }}
                        placeholder="Search..."
                        value={localSearch}
                        onChange={e => setLocalSearch(e.target.value)}
                    />
                    <span style={{ fontSize: "10px", opacity: 0.5, fontWeight: 700 }}>{workflowCount}</span>
                </div>
            </div>

            {/* Right Section: Dates and Theme */}
            <div style={{...groupStyle, flex: "0 1 auto", justifyContent: "flex-end"}}>
                <div style={{ ...panelStyle, padding: "5px 10px", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 800, opacity: 0.5 }}>FROM</span>
                        <input type="date" style={inputStyle} value={toLocalDate(from)} onChange={e => handleDateChange("date", e.target.value, true)} />
                    </div>
                    <div style={{ width: "1px", height: "14px", background: theme.border }}></div>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 800, opacity: 0.5 }}>TO</span>
                        <input type="date" style={inputStyle} value={toLocalDate(until)} onChange={e => handleDateChange("date", e.target.value, false)} />
                    </div>
                </div>

                <button onClick={() => setIsDark(!isDark)} style={{
                    ...btn(false),
                    background: softBg,
                    width: "32px",
                    height: "32px",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    flexShrink: 0
                }}>
                    {isDark ? "🌙" : "☀️"}
                </button>
            </div>
        </div>
    );
};

export default Controls;