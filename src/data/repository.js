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
   LOAD ALL REPOSITORY CSVs
-------------------------------------------------- */

export async function loadRepository() {

  const [
    workflows,
    schedules,
    sessions,
    mappings,
    sessionMappingBridge
  ] = await Promise.all([
    loadCsv("/data/REP_WORKFLOWS.csv"),
    loadCsv("/data/OPB_SCHEDULE_LOGIC.csv"),
    loadCsv("/data/REP_SESSION_INSTANCES.csv"),
    loadCsv("/data/REP_TBL_MAPPING.csv"),
    loadCsv("/data/OPB_SESSION_MAPPING.csv")
  ]);

  return {
    workflows,
    schedules,
    sessions,
    mappings,
    sessionMappingBridge
  };
}

export function joinRepository(repo) {

  const {
    workflows,
    schedules,
    sessions,
    mappings,
    sessionMappingBridge
  } = repo;

  const scheduleMap = new Map();
  schedules.forEach(s => {
    scheduleMap.set(String(s.SCHEDULER_ID), s);
  });

  const workflowSessionsMap = new Map();

  sessions.forEach(sess => {
    const wfId = String(sess.WORKFLOW_ID);

    if (!workflowSessionsMap.has(wfId)) {
      workflowSessionsMap.set(wfId, []);
    }

    workflowSessionsMap.get(wfId).push(sess);
  });

  const sessionToMappingMap = new Map();

  sessionMappingBridge.forEach(row => {
    sessionToMappingMap.set(
      String(row.SESSION_ID),
      String(row.MAPPING_ID)
    );
  });

  const mappingMap = new Map();
  mappings.forEach(m => {
    mappingMap.set(String(m.MAPPING_ID), m);
  });

  return workflows.map(wf => {

    const wfId = String(wf.WORKFLOW_ID);
    const wfSessions = workflowSessionsMap.get(wfId) || [];

    const sourceSet = new Set();
    const targetSet = new Set();

    wfSessions.forEach(sess => {

      const mappingId = sessionToMappingMap.get(String(sess.SESSION_ID));
      if (!mappingId) return;

      const mapping = mappingMap.get(mappingId);
      if (!mapping) return;

      if (mapping.SOURCE_NAME && mapping.SOURCE_NAME.trim() !== "") {
        sourceSet.add(mapping.SOURCE_NAME.trim());
      }

      if (mapping.TARGET_NAME && mapping.TARGET_NAME.trim() !== "") {
        targetSet.add(mapping.TARGET_NAME.trim());
      }
    });

    return {
      workflow: wf,
      schedule: scheduleMap.get(String(wf.SCHEDULER_ID)) || null,

      Sources: Array.from(sourceSet).sort().join(", "),
      Targets: Array.from(targetSet).sort().join(", ")
    };
  });
}