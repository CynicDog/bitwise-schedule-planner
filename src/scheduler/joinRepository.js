export function joinRepository(workflows, schedules) {

    const scheduleMap = new Map();

    schedules.forEach(s => {
        scheduleMap.set(String(s.SCHEDULER_ID), s);
    });

    return workflows.map(wf => ({
        workflow: wf,
        schedule: scheduleMap.get(String(wf.SCHEDULER_ID)) || null
    }));
}
