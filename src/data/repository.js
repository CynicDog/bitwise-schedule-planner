import Papa from "papaparse";

/* --------------------------------------------------
   CSV LOADER
-------------------------------------------------- */
async function loadCsv(path) {
  const response = await fetch(path);
  const text = await response.text();

  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true
  });

  return parsed.data;
}

/* --------------------------------------------------
   LOAD REPOSITORY CSVs
-------------------------------------------------- */
export async function loadRepository() {
  const [
    workflows,
    schedules,
    integrationView
  ] = await Promise.all([
    loadCsv("/data/REP_WORKFLOWS.csv"),
    loadCsv("/data/OPB_SCHEDULE_LOGIC.csv"),
    loadCsv("/data/V_IFM_MT_INTG_INFO.csv") // Our new consolidated view
  ]);

  return {
    workflows,
    schedules,
    integrationView
  };
}

/* --------------------------------------------------
   JOIN REPOSITORY
-------------------------------------------------- */
export function joinRepository(repo) {
  const { workflows, schedules, integrationView } = repo;

  // 1. Map Schedules by SCHEDULER_ID for O(1) lookup
  const scheduleMap = new Map();
  schedules.forEach(s => {
    scheduleMap.set(String(s.SCHEDULER_ID), s);
  });

  // 2. Group Integration View records by WORKFLOW_ID
  // Since one workflow has many sessions/tables, we group them into arrays
  const intgMap = new Map();
  integrationView.forEach(row => {
    const wfId = String(row.WORKFLOW_ID);
    if (!intgMap.has(wfId)) {
      intgMap.set(wfId, []);
    }
    intgMap.get(wfId).push(row);
  });

  // 3. Construct the Final Enriched Workflow Object
  return workflows.map(wf => {
    const wfId = String(wf.WORKFLOW_ID);
    const relatedRecords = intgMap.get(wfId) || [];

    // Extract unique values for the UI
    const sourceSet = new Set();
    const targetSet = new Set();
    const sessionSet = new Set();
    const loadTypes = new Set();

    relatedRecords.forEach(rec => {
      if (rec.SRC_TABLE_NM) sourceSet.add(rec.SRC_TABLE_NM.trim());
      if (rec.TGT_TABLE_NM) targetSet.add(rec.TGT_TABLE_NM.trim());
      if (rec.SESSION_NM) sessionSet.add(rec.SESSION_NM.trim());
      if (rec.TGT_LOAD_TP_NM) loadTypes.add(rec.TGT_LOAD_TP_NM.trim());
    });

    return {
      // Original master metadata
      workflow: wf,

      // Schedule logic (for RRule generation)
      schedule: scheduleMap.get(String(wf.SCHEDULER_ID)) || null,

      // Detailed Lineage for the Details Panel
      Sources: Array.from(sourceSet).sort().join(", "),
      Targets: Array.from(targetSet).sort().join(", "),
      Sessions: Array.from(sessionSet).sort(), // Array for list rendering
      LoadTypes: Array.from(loadTypes).sort().join(", "),

      // Keep the raw records in case we want to show a session-specific table in the panel later
      rawDetails: relatedRecords
    };
  });
}