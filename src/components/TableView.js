import React from "react";

const TableView = ({
    runs = [],
    selectedRunIndex,
    setSelectedRunIndex,
    theme,
    isDark
}) => {

    const now = Date.now();

    const emptyState = (
        <div
            style={{
                padding: "20px 24px",
                color: theme.textMuted,
                fontSize: "12px"
            }}
        >
            No scheduled executions in selected time range.
        </div>
    );

    return (
        <div
            style={{
                background: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: "16px",
                display: "flex",
                flexDirection: "column",
                boxShadow: isDark
                    ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                    : "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                overflow: "hidden",
                height: "100%"
            }}
        >
            {/* HEADER — same language as DetailsPanel */}
            <div
                style={{
                    padding: "20px",
                    background: theme.headerBg,
                    borderBottom: `1px solid ${theme.border}`,
                }}
            >
                <div
                    style={{
                        fontSize: "16px",
                        fontWeight: 800,
                        color: theme.textMain
                    }}
                >
                    Upcoming Executions
                </div>

                <div
                    style={{
                        fontSize: "12px",
                        color: theme.textMuted,
                        marginTop: "4px"
                    }}
                >
                    {runs.length} scheduled runs
                </div>
            </div>

            {/* BODY */}
            <div
                style={{
                    overflowY: "auto",
                    flex: 1
                }}
            >
                {!runs.length ? (
                    emptyState
                ) : (
                    <ul
                        style={{
                            listStyle: "none",
                            margin: 0,
                            padding: 0
                        }}
                    >
                        {runs.slice(0, 500).map((r, i) => {
                            const runDate = new Date(r.runTime);
                            const isPast = runDate.getTime() < now;
                            const isSelected = selectedRunIndex === i;

                            return (
                                <li
                                    key={`${r.workflow}-${r.runTime}-${i}`}
                                    onClick={() => setSelectedRunIndex(i)}
                                    style={{
                                        position: "relative",
                                        padding: "12px 24px",
                                        borderBottom: `1px solid ${theme.border}33`,
                                        cursor: "pointer",
                                        background: isSelected
                                            ? theme.highlightBg
                                            : (i % 2 === 0 ? theme.zebra : theme.cardBg),
                                        transition: "background 0.15s ease"
                                    }}
                                >
                                    {/* selection left bar (same visual language as workflow selection) */}
                                    {isSelected && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: "4px",
                                                background: theme.primary
                                            }}
                                        />
                                    )}

                                    {/* Time */}
                                    <div
                                        style={{
                                            fontFamily: "'JetBrains Mono','Fira Code',monospace",
                                            fontSize: "12px",
                                            fontWeight: isPast ? 500 : 700,
                                            color: isPast
                                                ? theme.textMuted
                                                : theme.primary
                                        }}
                                    >
                                        {runDate.toLocaleString()}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default TableView;