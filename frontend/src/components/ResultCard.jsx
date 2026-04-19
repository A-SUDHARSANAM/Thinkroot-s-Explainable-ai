import { absoluteAssetUrl } from "../services/api";

export default function ResultCard({ result, light = false }) {
  const baseClass = light ? "rounded-xl border border-slate-300 bg-white p-5 text-slate-700" : "card p-5";

  if (!result) {
    return (
      <div className={`${baseClass} ${light ? "text-slate-500" : "text-secondaryText"}`}>
        Run analysis to see confidence, forgery type, and explainable findings.
      </div>
    );
  }

  return (
    <div className={`${baseClass} space-y-3`}>
      <div className="flex items-center justify-between">
        <h3 className={`${light ? "text-slate-800" : "text-primaryText"} text-lg font-semibold`}>Analysis Results</h3>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            result.is_forgery ? "bg-danger/20 text-danger" : "bg-success/20 text-success"
          }`}
        >
          {result.status}
        </span>
      </div>

      <p className={`${light ? "text-slate-600" : "text-secondaryText"} text-sm`}>Confidence Score: <span className={`${light ? "text-slate-800" : "text-primaryText"} font-semibold`}>{result.confidence}%</span></p>
      <p className={`${light ? "text-slate-600" : "text-secondaryText"} text-sm`}>Type: <span className={light ? "text-slate-800" : "text-primaryText"}>{result.forgery_type}</span></p>

      <div>
        <p className={`text-sm mb-1 ${light ? "text-slate-600" : "text-secondaryText"}`}>Explanation</p>
        <ul className={`space-y-1 text-sm ${light ? "text-slate-800" : "text-primaryText"}`}>
          {result.explanations?.map((line) => (
            <li key={line} className={`rounded-lg px-2 py-1 ${light ? "bg-slate-100" : "bg-slate-900/40"}`}>{line}</li>
          ))}
        </ul>
      </div>

      {result.report_url ? (
        <a
          href={absoluteAssetUrl(result.report_url)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-slate-950 hover:brightness-95"
        >
          Download PDF Report
        </a>
      ) : null}
    </div>
  );
}
