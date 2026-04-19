import { useMemo, useState } from "react";

import DocumentViewer from "../components/DocumentViewer";
import FileDropzone from "../components/FileDropzone";
import LoaderOverlay from "../components/LoaderOverlay";
import { absoluteAssetUrl, compareDocuments, uploadDocument } from "../services/api";

export default function ComparePage() {
  const [docA, setDocA] = useState(null);
  const [docB, setDocB] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const previewA = useMemo(() => (docA ? absoluteAssetUrl(docA.preview_url) : ""), [docA]);
  const previewB = useMemo(() => (docB ? absoluteAssetUrl(docB.preview_url) : ""), [docB]);

  async function uploadForSide(file, side) {
    try {
      const up = await uploadDocument(file);
      if (side === "A") setDocA(up);
      if (side === "B") setDocB(up);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }

  async function runComparison() {
    if (!docA?.stored_name || !docB?.stored_name) {
      setError("Upload both documents first.");
      return;
    }

    setComparing(true);
    setError("");
    try {
      const data = await compareDocuments(docA.stored_name, docB.stored_name);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setComparing(false);
    }
  }

  return (
    <section className="fade-up relative min-h-[calc(100vh-4rem)] rounded-2xl border border-slate-700 overflow-y-auto bg-[#0a173c]">
      <button type="button" className="absolute right-8 top-6 z-10 rounded-full border border-slate-700 bg-slate-800/80 p-3 text-accent">
        ☼
      </button>

      <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 xl:grid-cols-[290px_1fr_1fr]">
        <div className="border-r border-slate-700 p-4">
          <h2 className="text-primaryText text-[30px] font-semibold">Compare Documents</h2>
          <p className="text-secondaryText mt-1 text-sm">Upload two documents to compare side-by-side</p>

          <div className="mt-4 space-y-4">
            <FileDropzone label="Document 1" compact onFileSelected={(f) => uploadForSide(f, "A")} />
            <FileDropzone label="Document 2" compact onFileSelected={(f) => uploadForSide(f, "B")} />
          </div>

          <button
            type="button"
            onClick={runComparison}
            disabled={comparing}
            className="mt-4 w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            {comparing ? "Comparing..." : "Run Comparison"}
          </button>

          {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

          <div className="mt-4 rounded-xl bg-slate-200/25 p-3 text-sm text-secondaryText">
            Tip: Upload two versions of the same document to identify differences and potential tampering.
          </div>
        </div>

        <div className="relative border-r border-slate-700 bg-slate-100/80">
          <LoaderOverlay show={comparing} text="Comparing documents..." />
          {previewA ? (
            <div className="h-full p-3">
              <DocumentViewer src={previewA} regions={(result?.difference_regions_doc1 || []).map((bbox) => ({ bbox }))} alt="doc a" plain />
            </div>
          ) : (
            <div className="grid h-full place-content-center text-3xl text-slate-500">No document loaded</div>
          )}
        </div>

        <div className="bg-slate-100/80 p-3">
          {previewB ? (
            <DocumentViewer src={previewB} regions={(result?.difference_regions_doc2 || []).map((bbox) => ({ bbox }))} alt="doc b" plain />
          ) : (
            <div className="grid h-[72%] place-content-center text-3xl text-slate-500">No document loaded</div>
          )}

          <div className="mt-3 rounded-xl bg-white/80 p-4 text-slate-700">
            {!result ? (
              <p className="text-2xl text-slate-500">Analysis results will appear here</p>
            ) : (
              <div className="space-y-1 text-sm">
                <p>Match percentage: <span className="font-semibold">{result.match_percentage}%</span></p>
                <p>Number of changes: <span className="font-semibold">{result.number_of_changes}</span></p>
                <p>{result.summary}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
