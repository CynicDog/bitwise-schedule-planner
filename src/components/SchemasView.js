import React, { useMemo, useState } from "react";

const SchemasView = ({ data, theme, isDark, onSelectWorkflow }) => {
    const [selectedSrc, setSelectedSrc] = useState(null);
    const [selectedTgt, setSelectedTgt] = useState(null);

    // 1. Extract Unique Schemas for the Master Area
    const { srcSchemas, tgtSchemas } = useMemo(() => {
        const srcs = new Set();
        const tgts = new Set();
        data.forEach(wf => {
            wf.rawDetails.forEach(d => {
                if (d.SRC_SCHEMA_NM) srcs.add(d.SRC_SCHEMA_NM);
                if (d.TGT_SCHEMA_NM) tgts.add(d.TGT_SCHEMA_NM);
            });
        });
        return {
            srcSchemas: Array.from(srcs).sort(),
            tgtSchemas: Array.from(tgts).sort()
        };
    }, [data]);

    // 2. Filter the lineage list based on selection
    const filteredLineage = useMemo(() => {
        const flows = [];
        data.forEach(wf => {
            wf.rawDetails.forEach(detail => {
                const matchSrc = !selectedSrc || detail.SRC_SCHEMA_NM === selectedSrc;
                const matchTgt = !selectedTgt || detail.TGT_SCHEMA_NM === selectedTgt;

                if (matchSrc && matchTgt) {
                    flows.push({
                        id: `${wf.workflow.WORKFLOW_ID}_${detail.SESSION_ID}_${detail.SRC_TABLE_NM}_${detail.TGT_TABLE_NM}`,
                        workflowName: wf.workflow.WORKFLOW_NAME,
                        fullWf: wf,
                        srcSchema: detail.SRC_SCHEMA_NM || "N/A",
                        srcTable: detail.SRC_TABLE_NM || "N/A",
                        tgtSchema: detail.TGT_SCHEMA_NM || "N/A",
                        tgtTable: detail.TGT_TABLE_NM || "N/A",
                        loadType: detail.TGT_LOAD_TP_NM,
                        session: detail.SESSION_NM,
                        subjectArea: wf.workflow.SUBJECT_AREA
                    });
                }
            });
        });
        return flows;
    }, [data, selectedSrc, selectedTgt]);

    // --- STYLES ---
    const chipStyle = (active, isSource) => ({
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: "700",
        cursor: "pointer",
        border: `1px solid ${active ? theme.primary : theme.border}`,
        background: active ? theme.primary : (isDark ? "#ffffff05" : "#fff"),
        color: active ? "#fff" : theme.textMain,
        transition: "all 0.2s",
        whiteSpace: "nowrap"
    });

    const flowCardStyle = {
        background: theme.cardBg,
        border: `1px solid ${theme.border}`,
        borderRadius: "10px",
        padding: "14px",
        display: "grid",
        gridTemplateColumns: "1fr 30px 1fr 1.2fr",
        alignItems: "center",
        gap: "20px",
        marginBottom: "10px",
        cursor: "pointer"
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* MASTER AREA: Schema Selectors */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
                background: isDark ? "#ffffff03" : "#00000002",
                padding: "20px",
                borderRadius: "12px",
                border: `1px solid ${theme.border}`
            }}>
                {/* Source Domains */}
                <div>
                    <div style={{ fontSize: "10px", fontWeight: "800", color: theme.textMuted, marginBottom: "10px", letterSpacing: "1px" }}>SOURCE SCHEMAS</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        <div style={chipStyle(!selectedSrc, true)} onClick={() => setSelectedSrc(null)}>ALL</div>
                        {srcSchemas.map(s => (
                            <div key={s} style={chipStyle(selectedSrc === s, true)} onClick={() => setSelectedSrc(s)}>{s}</div>
                        ))}
                    </div>
                </div>

                {/* Target Domains */}
                <div>
                    <div style={{ fontSize: "10px", fontWeight: "800", color: theme.textMuted, marginBottom: "10px", letterSpacing: "1px" }}>TARGET SCHEMAS</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        <div style={chipStyle(!selectedTgt, false)} onClick={() => setSelectedTgt(null)}>ALL</div>
                        {tgtSchemas.map(s => (
                            <div key={s} style={chipStyle(selectedTgt === s, false)} onClick={() => setSelectedTgt(s)}>{s}</div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RESULTS AREA */}
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "baseline" }}>
                    <h3 style={{ margin: 0, fontSize: "16px" }}>Lineage Flows</h3>
                    <span style={{ fontSize: "12px", opacity: 0.6 }}>Showing {filteredLineage.length} relations</span>
                </div>

                {filteredLineage.map(flow => (
                    <div key={flow.id} style={flowCardStyle} onClick={() => onSelectWorkflow(flow.fullWf)}>
                        {/* Source Detail */}
                        <div>
                            <div style={{ fontSize: "9px", fontWeight: 800, color: theme.primary }}>{flow.srcSchema}</div>
                            <div style={{ fontSize: "13px", fontWeight: 600 }}>{flow.srcTable}</div>
                        </div>

                        <div style={{ opacity: 0.3 }}>➜</div>

                        {/* Target Detail */}
                        <div>
                            <div style={{ fontSize: "9px", fontWeight: 800, color: theme.primary }}>{flow.tgtSchema}</div>
                            <div style={{ fontSize: "13px", fontWeight: 600 }}>{flow.tgtTable}</div>
                            <div style={{ fontSize: "10px", color: theme.textMuted }}>{flow.loadType}</div>
                        </div>

                        {/* Execution Context */}
                        <div style={{ borderLeft: `1px solid ${theme.border}`, paddingLeft: "20px" }}>
                            <div style={{ fontSize: "10px", opacity: 0.5, fontWeight: 700 }}>{flow.subjectArea}</div>
                            <div style={{ fontSize: "12px", fontWeight: 700 }}>{flow.workflowName}</div>
                            <div style={{ fontSize: "11px", color: theme.textMuted, fontStyle: "italic" }}>{flow.session}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SchemasView;