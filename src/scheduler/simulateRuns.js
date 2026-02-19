import { RRule } from "rrule";
import { convertToRRule } from "./convertToRRule";

/**
 * Simulate workflow runs until a given horizon date.
 *
 * @param {Array} joined - joined workflow + schedule data
 * @param {Date | string} horizon - simulation end date
 */
export function simulateRuns(joined, horizon) {

    const results = [];

    const now = new Date();
    const windowEnd =
        horizon instanceof Date
            ? horizon
            : new Date(horizon);

    joined.forEach(({ workflow, schedule }) => {

        const ruleData = convertToRRule(workflow, schedule);
        if (!ruleData) return;

        const endOptions = Number(workflow.END_OPTIONS ?? 2);
        const runCount = Number(workflow.RUN_COUNT ?? 0);
        const endTimeRaw = workflow.END_TIME;

        const ruleConfig = { ...ruleData };

        /**
         * END_OPTIONS
         * 0 → until END_TIME
         * 1 → limit by RUN_COUNT
         * 2 → infinite (we restrict by horizon)
         */

        if (endOptions === 0 && endTimeRaw) {
            const [m, d, y, h, mi] =
                endTimeRaw.split("/").map(Number);

            ruleConfig.until = new Date(y, m - 1, d, h, mi, 0);
        }

        if (endOptions === 1 && runCount > 0) {
            ruleConfig.count = runCount;
        }

        if (endOptions === 2) {
            // Infinite → restrict to horizon
            ruleConfig.until = windowEnd;
        }

        const rule = new RRule(ruleConfig);
        const frequencyText = new RRule(ruleData).toText();

        /**
         * Generate only occurrences inside window
         */
        const occurrences = rule.between(
            now,
            windowEnd,
            true
        );

        occurrences.forEach(date => {
            results.push({
                workflowId: workflow.WORKFLOW_ID,
                workflow: workflow.WORKFLOW_NAME,
                subject: workflow.SUBJECT_AREA,
                schedulerId: workflow.SCHEDULER_ID,
                runTime: date,
                frequency: frequencyText
            });
        });
    });

    return results.sort((a, b) => a.runTime - b.runTime);
}
