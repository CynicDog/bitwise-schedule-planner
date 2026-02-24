import React from "react";
import { RRule } from "rrule";
import { convertToRRule } from "../logic/define";

const DetailsPanel = ({ data, runs = [], theme, isDark, onSelectRun, selectedRunIndex, onClose }) => {
    if (!data) return null;

    const { workflow, schedule, Sources, Targets, LoadTypes } = data;
    const now = Date.now();

    const getFrequencyText = () => {
        try {
            const ruleData = convertToRRule(workflow, schedule);
            if (!ruleData) return "Manual/External Trigger";
            const baseText = new RRule(ruleData).toText();
            const timeParts = workflow.START_TIME?.split("/");
            if (timeParts && timeParts.length >= 5) {
                const hh = timeParts[3].padStart(2, "0");
                const mm = timeParts[4].padStart(2, "0");
                return `${baseText} at ${hh}:${mm}`;
            }
            return baseText;
        } catch (e) { return "Custom Schedule"; }
    };

    // Shared Styles
    const labelStyle = {
        fontSize: "11px",
        fontWeight: 800,
        color: theme.textMuted,
        textTransform: "uppercase",
        letterSpacing: "1px",
        display: "block",
        marginBottom: "8px",
        borderLeft: `3px solid ${theme.primary}`,
        paddingLeft: "8px"
    };

    const codeBlockStyle = {
        fontSize: "12px",
        fontFamily: "'JetBrains Mono', monospace",
        color: isDark ? "#94A3B8" : "#475569",
        background: isDark ? "rgba(30, 41, 59, 0.5)" : "#F1F5F9",
        padding: "4px 8px",
        borderRadius: "4px",
        border: `1px solid ${theme.border}`,
        wordBreak: "break-all"
    };

    return (
        <div style={{
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: "16px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            boxShadow: isDark ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)" : "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            overflow: "hidden"
        }}>
            {/* HEADER */}
            <div style={{
                padding: "20px",
                background: theme.headerBg,
                borderBottom: `1px solid ${theme.border}`,
                display: "flex", // Added flex to align title and button
                justifyContent: "space-between",
                alignItems: "flex-start"
            }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{
                        margin: 0, fontSize: "17px", fontWeight: 800, color: theme.textMain,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                    }} title={workflow.WORKFLOW_NAME}>
                        {workflow.WORKFLOW_NAME}
                    </h2>
                    <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>
                        Schedule: <span style={{ color: theme.primary, fontWeight: 600 }}>{getFrequencyText()}</span>
                    </div>
                </div>

                {/* CLOSE BUTTON */}
                <button
                    onClick={onClose}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: theme.textMuted,
                        cursor: "pointer",
                        padding: "4px",
                        marginLeft: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.target.style.background = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}
                    onMouseLeave={(e) => e.target.style.background = "transparent"}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 0" }}>

                {/* METADATA SECTION */}
                <div style={{ padding: "0 24px" }}>
                    <div style={{ marginBottom: "24px" }}>
                        <span style={labelStyle}>Target Tables</span>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {Targets ? Targets.split(", ").map(t => (
                                <div key={t}><code style={codeBlockStyle}>{t}</code></div>
                            )) : <div style={{ color: theme.textMuted, fontSize: "12px" }}>No physical targets</div>}
                        </div>
                    </div>
                </div>

                {/* EXECUTIONS SECTION */}
                <div style={{ borderTop: `1px solid ${theme.border}`, marginTop: "10px" }}>
                    <div style={{
                        padding: "16px 24px 8px 24px",
                        background: theme.zebra,
                        display: "flex",
                        justifyContent: "space-between"
                    }}>
                        <span style={labelStyle}>Upcoming Executions</span>
                        <span style={{ fontSize: "11px", color: theme.textMuted }}>{runs.length} Runs</span>
                    </div>

                    {!runs.length ? (
                        <div style={{ padding: "12px 24px", color: theme.textMuted, fontSize: "12px" }}>
                            No scheduled executions.
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            {runs.slice(0, 100).map((r, i) => {
                                const runDate = new Date(r.runTime);
                                const isPast = runDate.getTime() < now;
                                const isSelected = selectedRunIndex === i;
                                return (
                                    <div
                                        key={i}
                                        onClick={() => onSelectRun && onSelectRun(i)}
                                        style={{
                                            padding: "10px 24px",
                                            fontSize: "12px",
                                            cursor: "pointer",
                                            borderBottom: `1px solid ${theme.border}22`,
                                            background: isSelected ? theme.highlightBg : "transparent",
                                            position: "relative",
                                            fontFamily: "monospace",
                                            color: isPast ? theme.textMuted : theme.primary,
                                            fontWeight: isPast ? 400 : 600
                                        }}
                                    >
                                        {isSelected && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: theme.primary }} />}
                                        {runDate.toLocaleString()}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* FOOTER */}
            <div style={{
                padding: "12px 20px",
                background: theme.headerBg,
                borderTop: `1px solid ${theme.border}`,
                fontSize: "10px",
                color: theme.textMuted,
                fontFamily: "monospace"
            }}>
                ID: {workflow.WORKFLOW_ID} • {workflow.SUBJECT_AREA}
            </div>
        </div>
    );
};

export default DetailsPanel;