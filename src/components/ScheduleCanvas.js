import { useEffect, useRef } from "react";

const ScheduleCanvas = ({ timeline, workflows, grouped, subjectColors, view, isDark, selectedIndex, theme }) => {
    const canvasRef = useRef(null);

    const getSlotIndex = (runDate, view, timelineStart) => {
        const diffMs = runDate.getTime() - timelineStart.getTime();
        if (view === "30min") return Math.round(diffMs / (30 * 60000));
        if (view === "hour") return Math.round(diffMs / (60 * 60000));
        if (view === "day") return Math.round(diffMs / (24 * 60 * 60000));
        return -1;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !timeline.length) return;
        const ctx = canvas.getContext("2d");

        const dpr = window.devicePixelRatio || 1;
        const width = timeline.length * theme.slotWidth;
        const height = workflows.length * theme.rowHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        const timelineStart = timeline[0];

        workflows.forEach((_, i) => {
            ctx.fillStyle = i === selectedIndex ? theme.highlightBg : (i % 2 === 0 ? theme.zebra : theme.cardBg);
            ctx.fillRect(0, i * theme.rowHeight, width, theme.rowHeight);
            ctx.strokeStyle = `${theme.border}88`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(0, (i + 1) * theme.rowHeight);
            ctx.lineTo(width, (i + 1) * theme.rowHeight);
            ctx.stroke();
        });

        ctx.strokeStyle = `${theme.border}44`;
        ctx.lineWidth = 1;
        timeline.forEach((_, i) => {
            const x = Math.floor(i * theme.slotWidth) + 0.5;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        });

        workflows.forEach((wf, rowIndex) => {
            const runs = grouped[wf] || [];
            runs.forEach(run => {
                let colIndex = -1;
                if (view === "week" || view === "month") {
                    colIndex = timeline.findIndex(slot => {
                        if (view === "week") {
                            const end = new Date(slot);
                            end.setDate(end.getDate() + 7);
                            return run.date >= slot && run.date < end;
                        }
                        return run.date.getMonth() === slot.getMonth() && run.date.getFullYear() === slot.getFullYear();
                    });
                } else {
                    colIndex = getSlotIndex(run.date, view, timelineStart);
                }

                if (colIndex >= 0 && colIndex < timeline.length) {
                    const x = colIndex * theme.slotWidth + (theme.slotWidth - 22) / 2;
                    const y = rowIndex * theme.rowHeight + (theme.rowHeight - 22) / 2;
                    ctx.fillStyle = subjectColors[run.subject] || theme.primary;
                    ctx.beginPath();
                    ctx.roundRect(x, y, 22, 22, 4);
                    ctx.fill();
                    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)";
                    ctx.stroke();
                }
            });
        });
    }, [timeline, workflows, grouped, subjectColors, view, isDark, theme, selectedIndex]);

    return <canvas ref={canvasRef} style={{ display: "block" }} />;
};

export default ScheduleCanvas;