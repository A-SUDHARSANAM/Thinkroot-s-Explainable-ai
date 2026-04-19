import { useState } from "react";

import FileDropzone from "../components/FileDropzone";
import DocumentViewer from "../components/DocumentViewer";
import LoaderOverlay from "../components/LoaderOverlay";
import ProcessingStepper from "../components/ProcessingStepper";
import ResultCard from "../components/ResultCard";
import { absoluteAssetUrl, analyzeDocument, uploadDocument } from "../services/api";

const STEPS = ["Preprocessing", "OCR", "Detection", "Explanation"];

export default function AnalysisPage({ uploadedDoc }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [error, setError] = useState("");
  const [localDoc, setLocalDoc] = useState(uploadedDoc || null);

  async function handleLocalUpload(file) {
    const uploaded = await uploadDocument(file);
    setLocalDoc(uploaded);
    setResult(null);
    setError("");
  }

  async function handleAnalyze() {
    const doc = localDoc || uploadedDoc;
    if (!doc?.stored_name) {
      setError("Please upload a document first.");
      return;
    }

    setError("");
    setLoading(true);
    setCurrentStep(0);

    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 500);

    try {
      const data = await analyzeDocument(doc.stored_name, doc.file_name);
      setResult(data);
      setCurrentStep(STEPS.length - 1);
    } catch (e) {
      setError(e.message);
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  }

  const activeDoc = localDoc || uploadedDoc;
  const source = result?.preview_url
    ? absoluteAssetUrl(result.preview_url)
    : activeDoc?.preview_url
      ? absoluteAssetUrl(activeDoc.preview_url)
      : "";

  return (
    <section className="fade-up relative min-h-[calc(100vh-4rem)] rounded-2xl border border-slate-700 overflow-y-auto bg-[#0a173c]">
      <button type="button" className="absolute right-8 top-6 z-10 rounded-full border border-slate-700 bg-slate-800/80 p-3 text-accent">
        ☼
      </button>
      <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 xl:grid-cols-[290px_1fr_1fr]">
        <div className="border-r border-slate-700 p-4">
          <h2 className="text-primaryText text-[30px] font-semibold">Document Upload</h2>
          <p className="text-secondaryText mt-1 text-sm">Select a document to analyze</p>

          <div className="mt-5">
            <FileDropzone label="" compact onFileSelected={handleLocalUpload} />
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            {loading ? "Analyzing document..." : "Run Analysis"}
          </button>

          <div className="mt-4">
            <ProcessingStepper steps={STEPS} currentStep={currentStep} />
          </div>

          <div className="mt-4 rounded-xl bg-slate-200/25 p-3 text-sm text-secondaryText">
            Tip: Upload a clear image of your document for best results. The AI will analyze text regions for forgery detection.
          </div>

          {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        </div>

        <div className="relative border-r border-slate-700 bg-slate-100/80">
          <LoaderOverlay show={loading} />
          {source ? (
            <div className="h-full p-3">
              <DocumentViewer src={source} regions={result?.suspicious_regions || []} alt="analysis document" plain />
            </div>
          ) : (
            <div className="grid h-full place-content-center text-3xl text-slate-500">No document loaded</div>
          )}
        </div>

        <div className="bg-slate-100/80">
          <div className="h-full p-3">
            {result ? (
              <ResultCard result={result} light />
            ) : (
              <div className="grid h-full place-content-center text-3xl text-slate-500">Analysis results will appear here</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
