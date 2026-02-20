const TableView = ({ runs, workflowList, selectedIndex, setSelectedIndex, subjectColors, theme }) => {
    return (
        <div style={{ background: theme.cardBg, borderRadius: "8px", border: `1px solid ${theme.border}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead style={{ background: theme.headerBg, textAlign: "left", color: theme.textMain }}>
                <tr>
                    <th style={{ padding: "12px" }}>Workflow</th>
                    <th style={{ padding: "12px" }}>Subject</th>
                    <th style={{ padding: "12px" }}>Frequency</th>
                    <th style={{ padding: "12px" }}>Next Run</th>
                </tr>
                </thead>
                <tbody>
                {runs.slice(0, 500).map((r, i) => {
                    const masterIndex = workflowList.indexOf(r.workflow);
                    const isSelected = selectedIndex === masterIndex;
                    return (
                        <tr key={i} onClick={() => setSelectedIndex(masterIndex)} style={{ borderBottom: `1px solid ${theme.border}44`, background: isSelected ? theme.highlightBg : (i % 2 === 0 ? theme.zebra : theme.cardBg), cursor: "pointer", transition: "background 0.2s ease" }}>
                            <td style={{ padding: "12px", fontWeight: "600", position: 'relative' }}>
                                {isSelected && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: theme.primary }} />}
                                {r.workflow}
                            </td>
                            <td style={{ padding: "12px" }}>
                                <span style={{ padding: "2px 8px", borderRadius: "4px", color: "#FFF", fontSize: "10px", fontWeight: "bold", background: subjectColors[r.subject] }}>{r.subject}</span>
                            </td>
                            <td style={{ padding: "12px", color: theme.textMuted }}>{r.frequency}</td>
                            <td style={{ padding: "12px" }}>{new Date(r.runTime).toLocaleString()}</td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};

export default TableView;