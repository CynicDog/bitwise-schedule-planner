import React from "react";

const Controls = ({
                      isDark,
                      setIsDark,
                      mode,
                      setMode,
                      view,
                      setView,
                      from,
                      setFrom,
                      until,
                      setUntil,
                      theme,
                      workflowCount
                  }) => {

    const softBg = isDark ? "#ffffff10" : "#00000008";
    const pad = (n) => String(n).padStart(2, "0");
    const isFineTimeView = view === "30min" || view === "hour";

    /* ---------- FORMATTERS ---------- */
    const toLocalDate = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };

    const toLocalHour = (date) => {
        const d = new Date(date);
        return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    /* ---------- DATE CREATION ---------- */
    const createDayStart = (dateStr) => {
        const [y, m, d] = dateStr.split("-").map(Number);
        return new Date(y, m - 1, d, 0, 0, 0, 0);
    };

    const createDayEnd = (dateStr) => {
        const [y, m, d] = dateStr.split("-").map(Number);
        return new Date(y, m - 1, d, 23, 59, 59, 999);
    };

    const applyTime = (baseDate, timeStr) => {
        const [h, min] = timeStr.split(":").map(Number);
        const d = new Date(baseDate);
        d.setHours(h, min || 0, 0, 0);
        return d;
    };


    const handleFromDate = (value) => {

        const newDate = createDayStart(value);

        if (!isFineTimeView) {
            setFrom(newDate);
            if (newDate > until) {
                setUntil(createDayEnd(value));
            }
        } else {
            const updated = applyTime(newDate, toLocalHour(from));
            setFrom(updated);
        }
    };

    const handleUntilDate = (value) => {
        // createDayEnd ensures time is 23:59:59:999
        const newDate = createDayEnd(value);

        if (newDate < from) return;

        if (!isFineTimeView) {
            setUntil(newDate);
        } else {
            // In 30min/Hour view, preserve the current hour/minute
            const updated = applyTime(newDate, toLocalHour(until));
            setUntil(updated);
        }
    };

    const handleFromHour = (value) => {
        const newDate = applyTime(from, value);
        if (newDate > until) {
            const nextHour = new Date(newDate);
            nextHour.setHours(nextHour.getHours() + 1);
            setUntil(nextHour);
        }
        setFrom(newDate);
    };

    const handleUntilHour = (value) => {
        const newDate = applyTime(until, value);
        if (newDate < from) return;
        setUntil(newDate);
    };

    /* ---------- STYLES ---------- */
    const containerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" };
    const leftGroup = { display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" };
    const rightGroup = { display: "flex", alignItems: "center", gap: "12px" };
    const panel = { display: "flex", alignItems: "center", gap: "6px", padding: "6px", borderRadius: "10px", background: theme.cardBg, border: `1px solid ${theme.border}` };
    const segmentGroup = { display: "flex", background: softBg, padding: "3px", borderRadius: "8px", gap: "3px" };
    const button = (active) => ({ padding: "7px 14px", fontSize: "12px", fontWeight: 600, borderRadius: "6px", cursor: "pointer", border: "none", background: active ? theme.primary : "transparent", color: active ? "#fff" : theme.textMain });
    const themeToggle = { display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", borderRadius: "999px", cursor: "pointer", border: `1px solid ${theme.border}`, background: softBg, color: theme.textMain, fontSize: "12px", fontWeight: 600 };
    const dateBox = { display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", borderRadius: "10px", background: softBg, border: `1px solid ${theme.border}` };
    const dateInput = { border: "none", outline: "none", background: "transparent", color: theme.textMain, fontSize: "12px", fontWeight: 600 };

    return (
        <div style={containerStyle}>
            <div style={leftGroup}>
                <div style={panel}>
                    <div style={segmentGroup}>
                        <button style={button(mode === "grid")} onClick={() => setMode("grid")}>Grid</button>
                        <button style={button(mode === "table")} onClick={() => setMode("table")}>Table</button>
                    </div>
                </div>

                {mode === "grid" && (
                    <div style={panel}>
                        <div style={segmentGroup}>
                            {["30min", "hour", "day", "week", "month"].map(v => (
                                <button key={v} style={button(view === v)} onClick={() => setView(v)}>
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div style={dateBox}>
                    <span style={{ fontSize: "11px", color: theme.textMuted, fontWeight: 700 }}>From</span>
                    <input type="date" style={dateInput} value={toLocalDate(from)} onChange={(e) => handleFromDate(e.target.value)} />
                    {isFineTimeView && (
                        <input type="time" style={dateInput} value={toLocalHour(from)} onChange={(e) => handleFromHour(e.target.value)} />
                    )}
                </div>

                <div style={dateBox}>
                    <span style={{ fontSize: "11px", color: theme.textMuted, fontWeight: 700 }}>Until</span>
                    <input type="date" style={dateInput} value={toLocalDate(until)} onChange={(e) => handleUntilDate(e.target.value)} />
                    {isFineTimeView && (
                        <input type="time" style={dateInput} value={toLocalHour(until)} onChange={(e) => handleUntilHour(e.target.value)} />
                    )}
                </div>
            </div>

            <div style={rightGroup}>
                <div style={themeToggle} onClick={() => setIsDark(!isDark)}>
                    <span>{isDark ? "🌙" : "☀️"}</span>
                    {isDark ? "Dark" : "Light"}
                </div>
            </div>
        </div>
    );
};

export default Controls;