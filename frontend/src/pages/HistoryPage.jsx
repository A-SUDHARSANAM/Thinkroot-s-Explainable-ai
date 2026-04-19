import { useEffect, useMemo, useState } from "react";

import { clearHistory, getHistory } from "../services/api";

export default function HistoryPage() {
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  async function loadHistory(filter = "") {
    try {
      const res = await getHistory(filter);
      setEntries(res.entries || []);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return entries;
    return entries.filter((entry) => entry.file_name?.toLowerCase().includes(s));
  }, [entries, search]);

  const verified = filtered.filter((entry) => entry.status === "Verified" || entry.status === "Accepted").length;
  const suspicious = filtered.filter((entry) => entry.status === "Suspicious" || entry.status === "Flagged").length;
  const forged = filtered.filter((entry) => entry.status === "Forged" || entry.status === "Rejected").length;

  return (
    <section className="fade-up relative min-h-[calc(100vh-4rem)] rounded-2xl border border-slate-700 bg-[#0a173c] p-6">
      <button type="button" className="absolute right-8 top-6 z-10 rounded-full border border-slate-700 bg-slate-800/80 p-3 text-accent">
        ☼
      </button>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-primaryText text-6xl font-semibold">Audit Log</h2>
          <p className="text-secondaryText mt-1 text-xl">Complete history of all document verification decisions</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-xl bg-accent/70 px-4 py-2 text-slate-900">Export JSON</button>
          <button
            type="button"
            onClick={async () => {
              await clearHistory();
              await loadHistory("");
              setSearch("");
            }}
            className="rounded-xl bg-rose-400/10 px-4 py-2 text-rose-400"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="mt-5 max-w-xl">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by file name..."
          className="w-full rounded-xl border border-slate-600 bg-[#1a2a46] px-4 py-2 text-primaryText outline-none focus:border-accent"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4 text-secondaryText">
          <p>Total Records</p>
          <p className="text-primaryText text-4xl font-bold">{filtered.length}</p>
        </div>
        <div className="card p-4 text-secondaryText">
          <p>Verified</p>
          <p className="text-primaryText text-4xl font-bold">{verified}</p>
        </div>
        <div className="card p-4 text-secondaryText">
          <p>Suspicious</p>
          <p className="text-primaryText text-4xl font-bold">{suspicious}</p>
        </div>
        <div className="card p-4 text-secondaryText">
          <p>Forged</p>
          <p className="text-primaryText text-4xl font-bold">{forged}</p>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

      {!filtered.length ? (
        <div className="grid min-h-[260px] place-content-center text-center text-secondaryText">
          <p className="text-4xl">🗎</p>
          <p className="mt-2 text-3xl">No audit records yet</p>
        </div>
      ) : (
        <div className="mt-6 card overflow-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-900/60 text-secondaryText">
              <tr>
                <th className="px-4 py-3">File Name</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Processing Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={`${entry.file_name}-${entry.timestamp}`} className="border-t border-slate-800 text-primaryText">
                  <td className="px-4 py-3">{entry.file_name}</td>
                  <td className="px-4 py-3">{new Date(entry.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        entry.status === "Verified" || entry.status === "Accepted"
                          ? "bg-success/20 text-success"
                          : entry.status === "Forged" || entry.status === "Rejected"
                            ? "bg-danger/20 text-danger"
                            : "bg-yellow-500/20 text-yellow-300"
                      }`}
                    >
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{entry.confidence ?? "-"}%</td>
                  <td className="px-4 py-3">{entry.processing_time_ms} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </section>
  );
}
