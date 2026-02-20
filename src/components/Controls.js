import React from "react";

const Controls = ({
                      isDark,
                      setIsDark,
                      mode,
                      setMode,
                      view,
                      setView,
                      horizon,
                      setHorizon,
                      theme,
                      workflowCount
                  }) => {

    /* ---------- UI TOKENS ---------- */

    const softBg = isDark ? "#ffffff10" : "#00000008";
    const hoverBg = isDark ? "#ffffff18" : "#00000012";

    const containerStyle = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "18px"
    };

    const leftGroup = {
        display: "flex",
        alignItems: "center",
        gap: "14px",
        flexWrap: "wrap"
    };

    const rightGroup = {
        display: "flex",
        alignItems: "center",
        gap: "12px"
    };

    const panel = {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px",
        borderRadius: "10px",
        background: theme.cardBg,
        border: `1px solid ${theme.border}`,
        boxShadow: isDark
            ? "0 2px 8px rgba(0,0,0,0.35)"
            : "0 2px 8px rgba(0,0,0,0.06)"
    };

    const segmentGroup = {
        display: "flex",
        background: softBg,
        padding: "3px",
        borderRadius: "8px",
        gap: "3px"
    };

    const button = (active) => ({
        padding: "7px 14px",
        fontSize: "12px",
        fontWeight: 600,
        borderRadius: "6px",
        cursor: "pointer",
        border: "none",
        outline: "none",
        background: active ? theme.primary : "transparent",
        color: active ? "#fff" : theme.textMain,
        transition: "all .15s ease",
        letterSpacing: ".3px"
    });

    const titleStyle = {
        margin: 0,
        fontSize: "18px",
        fontWeight: 700,
        color: theme.textMain,
        letterSpacing: ".4px"
    };

    const themeToggle = {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 12px",
        borderRadius: "999px",
        cursor: "pointer",
        border: `1px solid ${theme.border}`,
        background: softBg,
        color: theme.textMain,
        fontSize: "12px",
        fontWeight: 600,
        transition: "all .2s ease",
        userSelect: "none"
    };

    const dateBox = {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 10px",
        borderRadius: "10px",
        background: softBg,
        border: `1px solid ${theme.border}`
    };

    const dateInput = {
        border: "none",
        outline: "none",
        background: "transparent",
        color: theme.textMain,
        fontSize: "12px",
        fontWeight: 600
    };

    return (
        <div style={containerStyle}>

            {/* LEFT SIDE CONTROLS */}
            <div style={leftGroup}>

                {/* TITLE */}
                <h2 style={titleStyle}>Informatica Scheduler</h2>

                {/* MODE SWITCH */}
                <div style={panel}>
                    <div style={segmentGroup}>
                        <button
                            style={button(mode === "grid")}
                            onClick={() => setMode("grid")}
                        >
                            Grid
                        </button>
                        <button
                            style={button(mode === "table")}
                            onClick={() => setMode("table")}
                        >
                            Table
                        </button>
                    </div>
                </div>

                {/* VIEW SWITCH */}
                {mode === "grid" && (
                    <div style={panel}>
                        <div style={segmentGroup}>
                            {["30min", "hour", "day", "week", "month"].map(v => (
                                <button
                                    key={v}
                                    style={button(view === v)}
                                    onClick={() => setView(v)}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* HORIZON DATE */}
                <div style={dateBox}>
          <span
              style={{
                  fontSize: "11px",
                  color: theme.textMuted,
                  fontWeight: 700
              }}
          >
            Until
          </span>
                    <input
                        type="date"
                        style={dateInput}
                        value={horizon.toISOString().split("T")[0]}
                        onChange={(e) => {
                            const d = new Date(e.target.value);
                            d.setHours(23, 59, 59);
                            setHorizon(d);
                        }}
                    />
                </div>
            </div>

            {/* RIGHT SIDE — THEME TOGGLE */}
            <div style={rightGroup}>
                <div
                    style={themeToggle}
                    onClick={() => setIsDark(!isDark)}
                >
                    <span>{isDark ? "🌙" : "☀️"}</span>
                    {isDark ? "Dark" : "Light"}
                </div>
            </div>

        </div>
    );
};

export default Controls;