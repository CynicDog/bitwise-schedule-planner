import React, { useMemo, useState } from "react";

const SchemasView = ({ data, theme, isDark, onSelectWorkflow }) => {
    const [activeDBs, setActiveDBs] = useState([]);
    const [activeSchemas, setActiveSchemas] = useState([]);

    // Map out the full hierarchy: { DB_NAME: Set([SCHEMA_1, SCHEMA_2]) }
    const { hierarchy, allUniqueSchemas } = useMemo(() => {
        const hMap = {};
        const sSet = new Set();
        data.forEach(wf => {
            wf.rawDetails?.forEach(detail => {
                const db = detail.TGT_DB_NM || 'DB';
                const schema = detail.TGT_SCHEMA_NM;
                if (!hMap[db]) hMap[db] = new Set();
                if (schema) {
                    hMap[db].add(schema);
                    sSet.add(schema);
                }
            });
        });
        return {
            hierarchy: hMap,
            allUniqueSchemas: Array.from(sSet).sort()
        };
    }, [data]);

    const allDBs = useMemo(() => Object.keys(hierarchy).sort(), [hierarchy]);

    // Determine which schemas are valid based on selected DBs
    const validSchemasForSelectedDBs = useMemo(() => {
        if (activeDBs.length === 0) return allUniqueSchemas;
        const valid = new Set();
        activeDBs.forEach(db => {
            hierarchy[db]?.forEach(s => valid.add(s));
        });
        return Array.from(valid);
    }, [hierarchy, activeDBs, allUniqueSchemas]);

    const groupedLineage = useMemo(() => {
        const targetMap = {};
        data.forEach(wf => {
            wf.rawDetails?.forEach(detail => {
                const db = detail.TGT_DB_NM || 'DB';
                const schema = detail.TGT_SCHEMA_NM;

                if (activeDBs.length > 0 && !activeDBs.includes(db)) return;
                if (activeSchemas.length > 0 && !activeSchemas.includes(schema)) return;

                const tgtKey = `${db}.${schema}.${detail.TGT_TABLE_NM}`;
                if (!targetMap[tgtKey]) {
                    targetMap[tgtKey] = { db, schema, table: detail.TGT_TABLE_NM, workflows: {} };
                }

                const wfName = wf.workflow.WORKFLOW_NAME;
                if (!targetMap[tgtKey].workflows[wfName]) {
                    targetMap[tgtKey].workflows[wfName] = { fullWf: wf, sources: [] };
                }
                targetMap[tgtKey].workflows[wfName].sources.push({
                    srcSchema: detail.SRC_SCHEMA_NM,
                    srcTable: detail.SRC_TABLE_NM,
                    loadType: detail.TGT_LOAD_TP_NM
                });
            });
        });
        return Object.values(targetMap);
    }, [data, activeDBs, activeSchemas]);

    const toggleDB = (db) => {
        setActiveDBs(prev => {
            const next = prev.includes(db) ? prev.filter(d => d !== db) : [...prev, db];
            return next;
        });
        setActiveSchemas(prev => prev.filter(s => {
            if (activeDBs.length === 1 && activeDBs.includes(db)) return true; // Handling reset
            return validSchemasForSelectedDBs.includes(s);
        }));
    };

    const styles = {
        container: { display: "flex", flexDirection: "column", gap: "10px", padding: "20px", height: "100%", overflowY: "auto" },
        filterSection: { marginBottom: "20px", display: "flex", flexDirection: "column", gap: "12px" },
        chipGroup: { display: "flex", flexWrap: "wrap", gap: "8px" },
        label: { fontSize: '10px', fontWeight: 800, color: theme.textMuted, letterSpacing: '0.5px', marginBottom: '4px' },
        chip: (active, disabled) => ({
            padding: "5px 12px", borderRadius: "18px", fontSize: "11px", fontWeight: "700",
            cursor: disabled ? "not-allowed" : "pointer",
            border: `1px solid ${active ? theme.primary : theme.border}`,
            background: active ? theme.primary : "transparent",
            color: active ? "#fff" : theme.textMuted,
            opacity: disabled ? 0.25 : (active ? 1 : 0.7), // Faded if disabled
            filter: disabled ? "grayscale(1)" : "none",
            transition: "0.2s all ease",
            pointerEvents: disabled ? "none" : "auto",
            userSelect: "none"
        }),
        lineageNode: { background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", marginBottom: "16px", overflow: "hidden" },
        nodeHeader: { padding: "12px 20px", background: isDark ? "rgba(0, 144, 218, 0.12)" : "rgba(0, 144, 218, 0.04)", borderBottom: `1px solid ${theme.border}` },
        wfBlock: { display: "grid", gridTemplateColumns: "1fr 200px", borderBottom: `1px solid ${theme.border}44`, alignItems: "stretch", cursor: "pointer" },
        wfSidebar: { padding: "15px 20px", display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "right", background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)", borderLeft: `1px solid ${theme.border}44` }
    };

    return (
        <div style={styles.container}>
            <div style={styles.filterSection}>
                <div>
                    <div style={styles.label}>TARGET DATABASE</div>
                    <div style={styles.chipGroup}>
                        <div style={styles.chip(activeDBs.length === 0, false)} onClick={() => {setActiveDBs([]); setActiveSchemas([]);}}>ALL</div>
                        {allDBs.map(db => (
                            <div key={db} style={styles.chip(activeDBs.includes(db), false)} onClick={() => toggleDB(db)}>{db}</div>
                        ))}
                    </div>
                </div>

                <div>
                    <div style={styles.label}>TARGET SCHEMA</div>
                    <div style={styles.chipGroup}>
                        {allUniqueSchemas.map(s => {
                            const isDisabled = !validSchemasForSelectedDBs.includes(s);
                            return (
                                <div
                                    key={s}
                                    style={styles.chip(activeSchemas.includes(s), isDisabled)}
                                    onClick={() => !isDisabled && setActiveSchemas(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                                >
                                    {s}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {groupedLineage.map((node) => (
                <div key={`${node.db}-${node.schema}-${node.table}`} style={styles.lineageNode}>
                    <div style={styles.nodeHeader}>
                        <span style={{ fontSize: "9px", fontWeight: 900, color: theme.primary, letterSpacing: "1px" }}>TARGET TABLE</span>
                        <h3 style={{ margin: 0, fontSize: "14px", color: theme.textMain }}>
                            <span style={{ opacity: 0.5 }}>{node.db}.{node.schema}.</span>
                            <span style={{ fontWeight: 800 }}>{node.table}</span>
                        </h3>
                    </div>

                    {Object.entries(node.workflows).map(([wfName, wfData], idx) => (
                        <div key={idx} style={styles.wfBlock} onClick={() => onSelectWorkflow(wfData.fullWf)}>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                {wfData.sources.map((src, sIdx) => (
                                    <div key={sIdx} style={{ display: "grid", gridTemplateColumns: "1fr 120px", padding: "14px 20px", alignItems: "center", borderBottom: sIdx === wfData.sources.length - 1 ? "none" : `1px solid ${theme.border}15` }}>
                                        <div style={{ opacity: 0.5 }}>
                                            <div style={{ fontSize: "9px", fontWeight: 800, color: theme.textMuted }}>{src.srcSchema}</div>
                                            <div style={{ fontSize: "12px", fontWeight: 700, color: theme.textMain }}>{src.srcTable}</div>
                                        </div>
                                        <div style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "10px", background: isDark ? "#334155" : "#F1F5F9", fontWeight: "800", color: theme.textMain, textAlign: "center", width: "100px", border: `1px solid ${theme.border}` }}>
                                            {src.loadType}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={styles.wfSidebar}>
                                <div style={{ fontSize: "9px", fontWeight: 800, color: theme.textMuted }}>WORKFLOW</div>
                                <div style={{ fontSize: "11px", fontWeight: 700, color: theme.primary, wordBreak: "break-all" }}>{wfName}</div>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default SchemasView;