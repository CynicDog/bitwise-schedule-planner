import Papa from "papaparse";

async function loadCsv(path) {
    const response = await fetch(path);
    const text = await response.text();

    const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true
    });

    return parsed.data;
}

export async function loadRepository() {

    const [workflows, schedules] = await Promise.all([
        loadCsv("/data/REP_WORKFLOWS.csv"),
        loadCsv("/data/OPB_SCHEDULE_LOGIC.csv")
    ]);

    return { workflows, schedules };
}
