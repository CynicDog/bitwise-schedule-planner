import React, { useMemo, useState } from "react";

const SchemasView = ({ data = [], searchTerm = "", theme, isDark, onSelectWorkflow }) => {
    const [activeDBs, setActiveDBs] = useState([]);
    const [activeSchemas, setActiveSchemas] = useState([]);

    // 1. Safe Hierarchy Map
    const { hierarchy, allUniqueSchemas } = useMemo(() => {
        const hMap = {};
        const sSet = new Set();

        // Safety check: ensure data exists and is an array
        if (!Array.isArray(data)) return { hMap: {}, allUniqueSchemas: [] };

        data.forEach(wf => {
            wf.rawDetails?.forEach(detail => {
                const db = detail.TGT_DB_NM || 'UNKNOWN_DB';
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

    // 2. Safe DB list - using optional chaining/fallback to prevent TypeError
    const allDBs = useMemo(() => {
        return hierarchy ? Object.keys(hierarchy).sort() : [];
    }, [hierarchy]);

    // 3. Logic for valid schemas based on DB selection
    const validSchemasForSelectedDBs = useMemo(() => {
        if (!hierarchy || activeDBs.length === 0) return allUniqueSchemas;
        const valid = new Set();
        activeDBs.forEach(db => {
            if (hierarchy[db]) {
                hierarchy[db].forEach(s => valid.add(s));
            }
        });
        return Array.from(valid);
    }, [hierarchy, activeDBs, allUniqueSchemas]);

    const groupedLineage = useMemo(() => {
            const targetMap = {};
            if (!Array.isArray(data)) return [];

            const term = searchTerm.toLowerCase().trim();

            data.forEach(wf => {
                wf.rawDetails?.forEach(detail => {
                    const db = detail.TGT_DB_NM || 'UNKNOWN_DB';
                    const schema = detail.TGT_SCHEMA_NM;
                    const tableName = detail.TGT_TABLE_NM || "";

                    // 1. Search Filter: Only Target Table Name
                    if (term && !tableName.toLowerCase().includes(term)) return;

                    // 2. Chip Filters: DB and Schema
                    if (activeDBs.length > 0 && !activeDBs.includes(db)) return;
                    if (activeSchemas.length > 0 && !activeSchemas.includes(schema)) return;

                    const tgtKey = `${db}.${schema}.${tableName}`;

                    if (!targetMap[tgtKey]) {
                        targetMap[tgtKey] = { db, schema, table: tableName, workflows: {} };
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
        }, [data, activeDBs, activeSchemas, searchTerm]);

    const toggleDB = (db) => {
        setActiveDBs(prev => prev.includes(db) ? prev.filter(d => d !== db) : [...prev, db]);
        setActiveSchemas(prev => prev.filter(s => validSchemasForSelectedDBs.includes(s)));
    };

    const styles = {
        container: { height: "100%", overflowY: "auto", display: "block", padding: "20px" },
        filterSection: {
            position: "sticky", top: -20, zIndex: 10,
            background: theme.bg, paddingBottom: "20px", marginBottom: "10px",
            display: "flex", flexDirection: "column", gap: "12px"
        },
        chipGroup: { display: "flex", flexWrap: "wrap", gap: "8px" },
        chip: (active, disabled) => ({
            padding: "5px 12px", borderRadius: "18px", fontSize: "11px", fontWeight: "700",
            cursor: disabled ? "not-allowed" : "pointer",
            border: `1px solid ${active ? theme.primary : theme.border}`,
            background: active ? theme.primary : "transparent",
            color: active ? "#fff" : theme.textMuted,
            opacity: disabled ? 0.25 : (active ? 1 : 0.7),
            pointerEvents: disabled ? "none" : "auto",
        }),
        lineageNode: {
            background: theme.cardBg, border: `1px solid ${theme.border}`,
            borderRadius: "12px", marginBottom: "20px", flexShrink: 0
        },
        nodeHeader: { padding: "12px 20px", background: isDark ? "rgba(0, 144, 218, 0.12)" : "rgba(0, 144, 218, 0.04)", borderBottom: `1px solid ${theme.border}` },
        wfBlock: { display: "grid", gridTemplateColumns: "1fr 200px", borderBottom: `1px solid ${theme.border}44`, cursor: "pointer" },
        wfSidebar: { padding: "15px 20px", display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "right", background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)", borderLeft: `1px solid ${theme.border}44` }
    };

    return (
        <div style={styles.container}>
            <div style={styles.filterSection}>
                <div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: theme.textMuted, marginBottom: '4px' }}>TARGET DATABASE</div>
                    <div style={styles.chipGroup}>
                        <div style={styles.chip(activeDBs.length === 0, false)} onClick={() => {setActiveDBs([]); setActiveSchemas([]);}}>ALL</div>
                        {allDBs.map(db => (
                            <div key={db} style={styles.chip(activeDBs.includes(db), false)} onClick={() => toggleDB(db)}>{db}</div>
                        ))}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: theme.textMuted, marginBottom: '4px' }}>TARGET SCHEMA</div>
                    <div style={styles.chipGroup}>
                        {allUniqueSchemas.map(s => {
                            const isDisabled = !validSchemasForSelectedDBs.includes(s);
                            return (
                                <div key={s} style={styles.chip(activeSchemas.includes(s), isDisabled)}
                                    onClick={() => !isDisabled && setActiveSchemas(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}>
                                    {s}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {groupedLineage.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: theme.textMuted }}>No lineage flow matches these filters.</div>
            ) : (
                groupedLineage.map((node) => (
                    <div key={`${node.db}-${node.schema}-${node.table}`} style={styles.lineageNode}>
                        <div style={styles.nodeHeader}>
                            <span style={{ fontSize: "9px", fontWeight: 900, color: theme.primary }}>TARGET TABLE</span>
                            <h3 style={{ margin: 0, fontSize: "14px", color: theme.textMain }}>
                                <span style={{ opacity: 0.5 }}>{node.db}.{node.schema}.</span>
                                <span style={{ fontWeight: 800 }}>{node.table}</span>
                            </h3>
                        </div>

                        {Object.entries(node.workflows).map(([wfName, wfData], idx) => (
                            <div key={idx} style={styles.wfBlock} onClick={() => onSelectWorkflow(wfData.fullWf)}>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    {wfData.sources.map((src, sIdx) => (
                                        <div key={sIdx} style={{ display: "grid", gridTemplateColumns: "1fr 120px", padding: "14px 20px", alignItems: "center", borderBottom: sIdx === wfData.sources.length - 1 ? "none" : `1px solid ${theme.border}15` }}>
                                            <div style={{ opacity: 0.5 }}>
                                                <div style={{ fontSize: "9px", fontWeight: 800 }}>{src.srcSchema}</div>
                                                <div style={{ fontSize: "12px", fontWeight: 700 }}>{src.srcTable}</div>
                                            </div>
                                            <div style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "10px", background: isDark ? "#334155" : "#F1F5F9", fontWeight: "800", color: theme.textMain, textAlign: "center", border: `1px solid ${theme.border}` }}>
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
                ))
            )}
        </div>
    );
};

export default SchemasView;