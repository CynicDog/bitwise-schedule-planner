import React from "react";
import { RRule } from "rrule";
import { convertToRRule } from "../logic/define";

const DetailsPanel = ({ data, theme, isDark, onClose }) => {
    if (!data) return null;

    const { workflow, schedule, Sources, Targets, LoadTypes } = data;

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
        } catch (e) {
            return "Custom Schedule";
        }
    };

    const sectionStyle = { marginBottom: "24px" };

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

    const tableListStyle = {
        display: "flex",
        flexDirection: "column",
        gap: "6px"
    };

    const codeBlockStyle = {
        fontSize: "12px",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        color: isDark ? "#94A3B8" : "#475569",
        background: isDark ? "rgba(30, 41, 59, 0.5)" : "#F1F5F9",
        padding: "6px 10px",
        borderRadius: "6px",
        border: `1px solid ${theme.border}`,
        wordBreak: "break-all",
        display: "inline-block"
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
            {/* --- HEADER FIX APPLIED HERE --- */}
            <div style={{
                padding: "20px",
                background: theme.headerBg,
                borderBottom: `1px solid ${theme.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px" // Ensure space between title and X
            }}>
                <div style={{ flex: 1, minWidth: 0 }}> {/* minWidth: 0 is critical for ellipsis to work */}
                    <h2 style={{
                        margin: 0,
                        fontSize: "17px",
                        fontWeight: 800,
                        color: theme.textMain,
                        whiteSpace: "nowrap",      // Prevent wrapping to multiple lines
                        overflow: "hidden",        // Hide overflow
                        textOverflow: "ellipsis"   // Add the "..."
                    }} title={workflow.WORKFLOW_NAME}> {/* Hovering will show full name */}
                        {workflow.WORKFLOW_NAME}
                    </h2>
                    <div style={{
                        fontSize: "12px",
                        color: theme.textMuted,
                        marginTop: "4px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                    }}>
                        Schedule: <span style={{ color: theme.primary, fontWeight: 600 }}>{getFrequencyText()}</span>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    style={{
                        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                        border: "none",
                        color: theme.textMuted,
                        cursor: "pointer",
                        fontSize: "20px",
                        lineHeight: "28px",
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0, // Never let the button get squished
                        transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => e.target.style.background = theme.highlightBg}
                    onMouseOut={(e) => e.target.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                >
                    ×
                </button>
            </div>

            {/* Scrollable Content stays the same */}
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
                <div style={sectionStyle}>
                    <span style={labelStyle}>Source Tables ({Sources?.split(", ").length || 0})</span>
                    <div style={tableListStyle}>
                        {Sources ? Sources.split(", ").map(s => (
                            <div key={s}><code style={codeBlockStyle}>{s}</code></div>
                        )) : <div style={{ color: theme.textMuted, fontSize: "12px" }}>No physical sources identified</div>}
                    </div>
                </div>

                <div style={sectionStyle}>
                    <span style={labelStyle}>Target Tables ({Targets?.split(", ").length || 0})</span>
                    <div style={tableListStyle}>
                        {Targets ? Targets.split(", ").map(t => (
                            <div key={t}><code style={codeBlockStyle}>{t}</code></div>
                        )) : <div style={{ color: theme.textMuted, fontSize: "12px" }}>No physical targets identified</div>}
                    </div>
                </div>

                <div style={sectionStyle}>
                    <span style={labelStyle}>Data Loading Strategy</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {LoadTypes ? LoadTypes.split(", ").map(type => (
                            <span key={type} style={{
                                padding: "4px 10px",
                                background: theme.highlightBg,
                                color: theme.primary,
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 700,
                                border: `1px solid ${theme.primary}33`
                            }}>
                                {type}
                            </span>
                        )) : <span style={{ fontSize: "12px", color: theme.textMuted }}>-</span>}
                    </div>
                </div>

                <div style={{
                    marginTop: "10px",
                    padding: "12px",
                    borderRadius: "8px",
                    background: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.03)",
                    fontSize: "11px",
                    color: theme.textMuted,
                    fontFamily: "monospace"
                }}>
                    <div style={{ marginBottom: "4px" }}>ID: {workflow.WORKFLOW_ID}</div>
                    <div>Folder: {workflow.SUBJECT_AREA}</div>
                </div>
            </div>
        </div>
    );
};

export default DetailsPanel;