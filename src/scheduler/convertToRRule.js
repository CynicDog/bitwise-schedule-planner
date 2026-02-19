/* global BigInt */
import { RRule } from "rrule";

/**
 * Bitmask helper
 */
const isBitSet = (value, bit) => {
    return (BigInt(value) & (1n << BigInt(bit))) !== 0n;
};

/**
 * START_TIME parser (MM/DD/YYYY/HH/MI)
 */
function parseStartTime(startTime) {
    if (!startTime) return null;

    const [month, day, year, hour, minute] =
        startTime.split("/").map(Number);

    return new Date(year, month - 1, day, hour, minute, 0);
}

export function convertToRRule(workflow, schedule) {

    if (!workflow) return null;

    const runOptions = Number(workflow.RUN_OPTIONS);
    const delta = Number(workflow.DELTA_VALUE);
    const userLogic = Number(schedule?.USER_LOGIC_TYPE);

    const startDate = parseStartTime(workflow.START_TIME);
    if (!startDate) return null;

    const base = {
        dtstart: startDate
    };

    /**
     * ====================================
     * RUN_OPTIONS = 4 (Interval execution)
     * ====================================
     */
    if (runOptions === 4 || runOptions === 20) {

        // 20 = restart + interval
        if (delta > 86400) {
            return {
                ...base,
                freq: RRule.DAILY,
                interval: delta / 86400
            };
        }

        if (delta === 86400) {
            return {
                ...base,
                freq: RRule.DAILY,
                interval: 1
            };
        }

        if (delta > 3600) {
            return {
                ...base,
                freq: RRule.HOURLY,
                interval: delta / 3600
            };
        }

        return {
            ...base,
            freq: RRule.MINUTELY,
            interval: delta / 60
        };
    }

    /**
     * ====================================
     * RUN_OPTIONS = 8 OR 24 (User repeat)
     * ====================================
     */
    if ((runOptions === 8 || runOptions === 24) && schedule) {

        switch (userLogic) {

            /**
             * USER_LOGIC_TYPE = 1 → Daily
             */
            case 1:
                return {
                    ...base,
                    freq: RRule.DAILY,
                    interval: 1
                };

            /**
             * USER_LOGIC_TYPE = 2 → Weekly (bit 16~22)
             */
            case 2: {
                const weekdays = [];

                const map = [
                    { bit: 16, rule: RRule.MO },
                    { bit: 17, rule: RRule.TU },
                    { bit: 18, rule: RRule.WE },
                    { bit: 19, rule: RRule.TH },
                    { bit: 20, rule: RRule.FR },
                    { bit: 21, rule: RRule.SA },
                    { bit: 22, rule: RRule.SU }
                ];

                map.forEach(d => {
                    if (isBitSet(schedule.WEEKLY_LOGIC, d.bit)) {
                        weekdays.push(d.rule);
                    }
                });

                return {
                    ...base,
                    freq: RRule.WEEKLY,
                    byweekday: weekdays.length ? weekdays : undefined
                };
            }

            /**
             * USER_LOGIC_TYPE = 4 → Monthly
             * (Simple monthly-day version)
             */
            case 4: {
                const monthDays = [];
                const weekNumbers = [];
                const weekdays = [];

                const logic = BigInt(schedule.MONTHLY_LOGIC || 0);

                // Detect mode: if bit 0 set → day-based
                const isDayBased = (logic % 2n) === 1n;

                if (isDayBased) {
                    for (let i = 1; i <= 31; i++) {
                        if (isBitSet(logic, i)) {
                            monthDays.push(i);
                        }
                    }

                    return {
                        ...base,
                        freq: RRule.MONTHLY,
                        bymonthday: monthDays.length ? monthDays : undefined
                    };
                }

                // Week-based monthly
                for (let i = 1; i <= 5; i++) {
                    if (isBitSet(logic, i)) {
                        weekNumbers.push(i);
                    }
                }

                const weekdayMap = [
                    { bit: 16, rule: RRule.MO },
                    { bit: 17, rule: RRule.TU },
                    { bit: 18, rule: RRule.WE },
                    { bit: 19, rule: RRule.TH },
                    { bit: 20, rule: RRule.FR },
                    { bit: 21, rule: RRule.SA },
                    { bit: 22, rule: RRule.SU }
                ];

                weekdayMap.forEach(d => {
                    if (isBitSet(logic, d.bit)) {
                        weekdays.push(d.rule);
                    }
                });

                if (weekNumbers.length && weekdays.length) {
                    return {
                        ...base,
                        freq: RRule.MONTHLY,
                        byweekday: weekdays.map(w =>
                            weekNumbers.map(n => w.nth(n))
                        ).flat()
                    };
                }

                return null;
            }


            default:
                return null;
        }
    }

    /**
     * RUN_OPTIONS > 32 → run continue (ignore recurrence)
     */
    if (runOptions > 32) {
        return null;
    }

    return null;
}
