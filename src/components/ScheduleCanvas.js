import { useEffect, useRef } from "react";

const ScheduleCanvas = ({
                            timeline,
                            workflows,
                            grouped,
                            subjectColors,
                            view,
                            isDark,
                            selectedIndex,
                            theme,
                            onRenderComplete // New Prop
                        }) => {
    const canvasRef = useRef(null);

    const getSlotIndex = (runDate, view, timelineStart) => {
        const diffMs = runDate.getTime() - timelineStart.getTime();
        if (view === "30min") return Math.round(diffMs / (30 * 60000));
        if (view === "hour") return Math.round(diffMs / (60 * 60000));
        if (view === "day") return Math.round(diffMs / (24 * 60 * 60000));
        return -1;
    };

    useEffect(() => {
        const draw = () => {
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

            ctx.resetTransform();
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, width, height);

            const timelineStart = timeline[0];

            // 1. Draw Background Rows
            workflows.forEach((_, i) => {
                const yPos = Math.floor(i * theme.rowHeight);
                ctx.fillStyle = i === selectedIndex ? theme.highlightBg : (i % 2 === 0 ? theme.zebra : theme.cardBg);
                ctx.fillRect(0, yPos, width, theme.rowHeight);
                ctx.strokeStyle = `${theme.border}88`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, yPos + theme.rowHeight + 0.5);
                ctx.lineTo(width, yPos + theme.rowHeight + 0.5);
                ctx.stroke();
            });

            // 2. Draw Grid Lines
            ctx.strokeStyle = `${theme.border}44`;
            ctx.lineWidth = 1;
            timeline.forEach((_, i) => {
                const x = Math.floor(i * theme.slotWidth) + 0.5;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            });

            // 3. Draw Cells
            workflows.forEach((wf, rowIndex) => {
                const runs = grouped[wf] || [];
                const renderedSlots = new Set();

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

                    if (colIndex >= 0 && colIndex < timeline.length && !renderedSlots.has(colIndex)) {
                        renderedSlots.add(colIndex);
                        const x = Math.floor(colIndex * theme.slotWidth + (theme.slotWidth - 22) / 2);
                        const y = Math.floor(rowIndex * theme.rowHeight + (theme.rowHeight - 22) / 2);

                        ctx.beginPath();
                        ctx.fillStyle = subjectColors[run.subject] || theme.primary;
                        ctx.roundRect(x + 0.5, y + 0.5, 21, 21, 4);
                        ctx.fill();
                        ctx.strokeStyle = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)";
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                });
            });

            // Signal completion
            if (onRenderComplete) onRenderComplete();
        };

        const raf = requestAnimationFrame(() => {
            setTimeout(draw, 0);
        });

        return () => cancelAnimationFrame(raf);
    }, [timeline, workflows, grouped, subjectColors, view, isDark, theme, selectedIndex, onRenderComplete]);

    return <canvas ref={canvasRef} style={{ display: "block" }} />;
};

export default ScheduleCanvas;