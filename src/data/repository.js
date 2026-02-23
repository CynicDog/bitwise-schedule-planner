import Papa from "papaparse";

/* --------------------------------------------------
   LOAD TYPE MAPPER
-------------------------------------------------- */
const LOAD_TYPE_MAP = {
  "U": "Update",
  "D": "Delete",
  "T": "Truncate",
  "TI": "Truncate/Insert",
  "DI": "Delete/Insert",
  "UI": "Update/Insert",
  "TUI": "Truncate/Update/Insert",
  "I": "Insert"
};

const getLoadTypeName = (code) => {
  if (!code) return "N/A";
  const trimmed = code.trim().toUpperCase();
  return LOAD_TYPE_MAP[trimmed] || trimmed; // Fallback to code if not in map
};

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
    loadCsv("/data/V_IFM_MT_INTG_INFO.csv")
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

  // 1. Map Schedules by SCHEDULER_ID
  const scheduleMap = new Map();
  schedules.forEach(s => {
    scheduleMap.set(String(s.SCHEDULER_ID), s);
  });

  // 2. Group Integration View records by WORKFLOW_ID
  const intgMap = new Map();
  integrationView.forEach(row => {
    const wfId = String(row.WORKFLOW_ID);

    // --- TRANSLATE LOAD TYPE HERE ---
    const enrichedRow = {
      ...row,
      TGT_LOAD_TP_NM: getLoadTypeName(row.TGT_LOAD_TP_NM)
    };

    if (!intgMap.has(wfId)) {
      intgMap.set(wfId, []);
    }
    intgMap.get(wfId).push(enrichedRow);
  });

  // 3. Construct Final Objects
  return workflows.map(wf => {
    const wfId = String(wf.WORKFLOW_ID);
    const relatedRecords = intgMap.get(wfId) || [];

    const sourceSet = new Set();
    const targetSet = new Set();
    const sessionSet = new Set();
    const loadTypes = new Set();

    relatedRecords.forEach(rec => {
      if (rec.SRC_TABLE_NM) sourceSet.add(rec.SRC_TABLE_NM.trim());
      if (rec.TGT_TABLE_NM) targetSet.add(rec.TGT_TABLE_NM.trim());
      if (rec.SESSION_NM) sessionSet.add(rec.SESSION_NM.trim());
      // These are now already human-readable thanks to step 2
      if (rec.TGT_LOAD_TP_NM) loadTypes.add(rec.TGT_LOAD_TP_NM);
    });

    return {
      workflow: wf,
      schedule: scheduleMap.get(String(wf.SCHEDULER_ID)) || null,
      Sources: Array.from(sourceSet).sort().join(", "),
      Targets: Array.from(targetSet).sort().join(", "),
      Sessions: Array.from(sessionSet).sort(),
      LoadTypes: Array.from(loadTypes).sort().join(", "),
      rawDetails: relatedRecords
    };
  });
}