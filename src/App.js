import "./App.css";
import { useEffect, useState } from "react";
import { loadRepository } from "./api/loadRepository";
import { joinRepository } from "./scheduler/joinRepository";
import { simulateRuns } from "./scheduler/simulateRuns";

function App() {
    const [runs, setRuns] = useState([]);
    const [joined, setJoined] = useState([]);
    const [horizon, setHorizon] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        date.setHours(23, 59, 59, 999);
        return date;
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * Load repository once
     */
    useEffect(() => {
        async function init() {
            try {
                const repo = await loadRepository();
                const joinedData = joinRepository(repo.workflows, repo.schedules);
                setJoined(joinedData);
            } catch (e) {
                console.error(e);
                setError("Failed to load repository files.");
            } finally {
                setLoading(false);
            }
        }

        init();
    }, []);

    /**
     * Re-simulate whenever horizon changes
     */
    useEffect(() => {
        if (joined.length === 0) return;

        const simulated = simulateRuns(joined, horizon);
        setRuns(simulated);
    }, [joined, horizon]);

    if (loading) {
        return (
            <div className="App">
                <h2>Loading repository...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="App">
                <h2>{error}</h2>
            </div>
        );
    }

    return (
        <div className="App">
            <h1>Bitwise Schedule Spread</h1>

            {/* Horizon Display + Date Picker */}
            <div style={{ marginBottom: "20px" }}>
                <p>
                    Show until:{" "}
                    <input
                        type="date"
                        value={horizon.toISOString().split("T")[0]}
                        onChange={(e) => {
                            const selected = new Date(e.target.value);
                            selected.setHours(23, 59, 59);
                            setHorizon(selected);
                        }}
                        style={{ marginTop: "8px" }}
                    />
                </p>
                <br />
            </div>
            <div>
                <table border="1" cellPadding="6">
                    <thead>
                    <tr>
                        <th>Workflow</th>
                        <th>Subject</th>
                        <th>Frequency</th>
                        <th>Next Run</th>
                    </tr>
                    </thead>
                    <tbody>
                    {runs.map((r, i) => (
                        <tr key={i}>
                            <td>{r.workflow}</td>
                            <td>{r.subject}</td>
                            <td>{r.frequency}</td>
                            <td>
                                {new Date(r.runTime).toLocaleString([], {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default App;
