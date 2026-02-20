import ScheduleCanvas from "./ScheduleCanvas";

const GridView = ({ theme, isDark, workflowList, timeline, view, grouped, subjectColors, selectedIndex, setSelectedIndex }) => {
    return (
        <div style={{ overflow: "auto", border: `1px solid ${theme.border}`, backgroundColor: theme.cardBg, position: "relative", borderRadius: "8px" }}>
            <div style={{ display: "flex", minWidth: "max-content" }}>
                {/* STICKY WORKFLOW NAMES */}
                <div style={{ position: "sticky", left: 0, zIndex: 30, background: theme.cardBg, boxShadow: isDark ? "2px 0 5px rgba(0,0,0,0.3)" : "2px 0 5px rgba(0,0,0,0.05)" }}>
                    <div style={{ width: theme.workflowWidth, height: "40px", background: theme.headerBg, borderRight: `2px solid ${theme.border}`, borderBottom: `2px solid ${theme.border}`, display: "flex", alignItems: "center", padding: "0 12px", fontWeight: "bold", fontSize: "12px", boxSizing: "border-box" }}>
                        Workflow ({workflowList.length})
                    </div>
                    {workflowList.map((wf, i) => (
                        <div key={wf} onClick={() => setSelectedIndex(i)} style={{ width: theme.workflowWidth, height: theme.rowHeight, backgroundColor: selectedIndex === i ? theme.highlightBg : (i % 2 === 0 ? theme.zebra : theme.cardBg), borderRight: `2px solid ${theme.border}`, display: "flex", alignItems: "center", padding: "0 12px", fontSize: "11px", color: theme.textMain, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", boxSizing: "border-box", cursor: "pointer", borderLeft: selectedIndex === i ? `4px solid ${theme.primary}` : 'none' }}>
                            {wf}
                        </div>
                    ))}
                </div>

                {/* STICKY TIME HEADER + CANVAS BODY */}
                <div style={{ position: "relative" }}>
                    <div style={{ display: "flex", position: "sticky", top: 0, zIndex: 20, background: theme.headerBg, borderBottom: `1px solid ${theme.border}` }}>
                        {timeline.map((slot, i) => (
                            <div key={i} style={{ width: theme.slotWidth, height: "40px", borderRight: `1px solid ${theme.border}44`, position: "relative", flexShrink: 0, boxSizing: "border-box" }}>
                                <div style={{ position: "absolute", bottom: "6px", left: "50%", transform: "translateX(-30%) rotate(-45deg)", transformOrigin: "bottom left", fontSize: "9px", fontWeight: "bold", color: theme.textMuted, whiteSpace: "nowrap", pointerEvents: "none" }}>
                                    {view === "30min" ? `${slot.getHours()}:${slot.getMinutes() === 0 ? '00' : '30'}` : view === "hour" ? `${slot.getHours()}:00` : `${slot.getMonth()+1}/${slot.getDate()}`}
                                </div>
                            </div>
                        ))}
                    </div>
                    <ScheduleCanvas
                        timeline={timeline} workflows={workflowList} grouped={grouped}
                        subjectColors={subjectColors} view={view} isDark={isDark}
                        selectedIndex={selectedIndex} theme={theme}
                    />
                </div>
            </div>
        </div>
    );
};

export default GridView;