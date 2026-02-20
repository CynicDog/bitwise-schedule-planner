import { useState, useEffect } from "react"; // Added useState, useEffect
import ScheduleCanvas from "./ScheduleCanvas";

const GridView = ({
                      theme,
                      isDark,
                      workflowList,
                      timeline,
                      view,
                      grouped,
                      subjectColors,
                      selectedIndex,
                      setSelectedIndex
                  }) => {
    const [isRendering, setIsRendering] = useState(false);

    // Trigger loading state when major dependencies change
    useEffect(() => {
        setIsRendering(true);
    }, [view, timeline, workflowList]);

    const HEADER_HEIGHT = view === "30min" || view === "hour" ? 50 : 40;
    const isTimeView = view === "30min" || view === "hour";
    const pad = (n) => String(n).padStart(2, "0");

    const normalizeCalendarDate = (d) => {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    };

    const getParts = (date) => {
        const d = normalizeCalendarDate(date);
        return {
            year: d.getFullYear(),
            month: d.getMonth() + 1,
            day: d.getDate(),
            hour: date.getHours(),
            minute: date.getMinutes()
        };
    };

    return (
        <div
            style={{
                overflow: "auto",
                maxHeight: "95vh",
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.cardBg,
                position: "relative",
                borderRadius: "8px"
            }}
        >
            {/* SPINNER OVERLAY */}
            {isRendering && (
                <div style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 100,
                    background: isDark ? "rgba(15, 23, 42, 0.6)" : "rgba(255, 255, 255, 0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(2px)"
                }}>
                    <div className="spinner" style={{
                        width: "40px",
                        height: "40px",
                        border: `4px solid ${theme.border}`,
                        borderTop: `4px solid ${theme.primary}`,
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite"
                    }} />
                    <style>{`
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    `}</style>
                </div>
            )}

            <div style={{ display: "flex", minWidth: "max-content" }}>
                {/* LEFT WORKFLOW COLUMN */}
                <div style={{
                    position: "sticky",
                    left: 0,
                    zIndex: 40,
                    background: theme.cardBg,
                    boxShadow: isDark ? "2px 0 5px rgba(0,0,0,0.3)" : "2px 0 5px rgba(0,0,0,0.05)"
                }}>
                    <div style={{
                        position: "sticky",
                        top: 0,
                        width: theme.workflowWidth,
                        height: HEADER_HEIGHT,
                        background: theme.headerBg,
                        borderRight: `2px solid ${theme.border}`,
                        borderBottom: `2px solid ${theme.border}`,
                        display: "flex",
                        alignItems: "center",
                        padding: "0 12px",
                        fontWeight: "bold",
                        fontSize: "12px",
                        boxSizing: "border-box",
                        zIndex: 50
                    }}>
                        Workflow ({workflowList.length})
                    </div>

                    {workflowList.map((wf, i) => (
                        <div
                            key={wf}
                            onClick={() => setSelectedIndex(i)}
                            style={{
                                width: theme.workflowWidth,
                                height: theme.rowHeight,
                                backgroundColor: selectedIndex === i ? theme.highlightBg : (i % 2 === 0 ? theme.zebra : theme.cardBg),
                                borderRight: `2px solid ${theme.border}`,
                                display: "flex",
                                alignItems: "center",
                                padding: "0 12px",
                                fontSize: "11px",
                                color: theme.textMain,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                boxSizing: "border-box",
                                cursor: "pointer",
                                borderLeft: selectedIndex === i ? `4px solid ${theme.primary}` : "none"
                            }}
                        >
                            {wf}
                        </div>
                    ))}
                </div>

                {/* RIGHT GRID */}
                <div style={{ position: "relative", alignSelf: "flex-start" }}>
                    {/* TIMELINE HEADER */}
                    <div style={{
                        display: "flex",
                        position: "sticky",
                        top: 0,
                        zIndex: 30,
                        background: theme.headerBg,
                        borderBottom: `1px solid ${theme.border}`
                    }}>
                        {timeline.map((slot, i) => {

                            const { month, day, hour, minute } = getParts(slot);

                            const isMidnight = hour === 0 && minute === 0;
                            const isFirstOfMonth = day === 1;

                            let label;

                            if (view === "30min") {
                                label = `${pad(hour)}:${pad(minute)}`;
                            }
                            else if (view === "hour") {
                                label = `${pad(hour)}:00`;
                            }
                            else if (view === "day" || view === "week") {
                                label = `${month}/${day}`;
                            }
                            else if (view === "month") {
                                label = `${month}/${day}`;
                            }

                            const dateMarker = `${month}/${day}`;

                            return (
                                <div key={i} style={{
                                    width: theme.slotWidth,
                                    height: HEADER_HEIGHT,
                                    borderLeft: isTimeView && isMidnight ? `2px solid ${theme.border}` : `1px solid ${theme.border}44`,
                                    position: "relative",
                                    flexShrink: 0,
                                    boxSizing: "border-box"
                                }}>
                                    {isTimeView && isMidnight && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: "3px",
                                                left: "50%",
                                                transform: "translateX(-50%)",
                                                fontSize: "10px",
                                                fontWeight: 700,
                                                color: theme.primary,
                                                whiteSpace: "nowrap",
                                                pointerEvents: "none"
                                            }}
                                        >
                                            {dateMarker}
                                        </div>
                                    )}
                                    <div style={{
                                        position: "absolute",
                                        bottom: "6px",
                                        left: "50%",
                                        transform: "translateX(-30%) rotate(-45deg)",
                                        transformOrigin: "bottom left",
                                        fontSize: "9px",
                                        fontWeight: 700,
                                        color: theme.textMain,
                                        whiteSpace: "nowrap"
                                    }}>{label}</div>
                                </div>
                            );
                        })}
                    </div>

                    <ScheduleCanvas
                        timeline={timeline}
                        workflows={workflowList}
                        grouped={grouped}
                        subjectColors={subjectColors}
                        view={view}
                        isDark={isDark}
                        selectedIndex={selectedIndex}
                        theme={theme}
                        onRenderComplete={() => setIsRendering(false)}
                    />
                </div>
            </div>
        </div>
    );
};

export default GridView;