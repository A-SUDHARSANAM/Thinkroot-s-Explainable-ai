import { useState } from "react";

import FileDropzone from "../components/FileDropzone";
import DocumentViewer from "../components/DocumentViewer";
import LoaderOverlay from "../components/LoaderOverlay";
import ProcessingStepper from "../components/ProcessingStepper";
import { absoluteAssetUrl, uploadDocument, verifyDocument } from "../services/api";

const STEPS = ["Preprocessing", "OCR", "Detection", "Explanation"];

function VerifyResultPanel({ result }) {
  if (!result) {
    return <div className="grid h-full place-content-center text-3xl text-slate-500">Verification results will appear here</div>;
  }

  const tone =
    result.status === "Verified"
      ? "bg-emerald-100 text-emerald-700"
      : result.status === "Suspicious"
        ? "bg-amber-100 text-amber-700"
        : "bg-rose-100 text-rose-700";

  return (
    <div className="rounded-xl border border-slate-300 bg-white p-5 space-y-3 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-800 text-lg font-semibold">Verification Result</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{result.badge || result.status}</span>
      </div>

      <p className="text-slate-600 text-sm">
        Status: <span className="font-semibold text-slate-800">{result.status}</span>
      </p>
      <p className="text-slate-600 text-sm">
        Confidence: <span className="font-semibold text-slate-800">{result.confidence}%</span>
      </p>
      <p className="text-slate-600 text-sm">
        Explanation: <span className="text-slate-800">{result.summary}</span>
      </p>

      <div>
        <p className="text-sm mb-1 text-slate-600">Detected Issues</p>
        {result.issues?.length ? (
          <ul className="space-y-1 text-sm text-slate-800">
            {result.issues.map((issue) => (
              <li key={issue} className="rounded-lg bg-slate-100 px-2 py-1">{issue}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No issues found.</p>
        )}
      </div>

      {result.report_url ? (
        <a
          href={absoluteAssetUrl(result.report_url)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-slate-900 hover:brightness-95"
        >
          Download Verification Report
        </a>
      ) : null}
    </div>
  );
}

export default function VerifyPage({ uploadedDoc }) {
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

  async function handleVerify() {
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
      const data = await verifyDocument(doc.stored_name, doc.file_name);
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
          <h2 className="text-primaryText text-[30px] font-semibold">Verify Document</h2>
          <p className="text-secondaryText mt-1 text-sm">Upload and run full authenticity validation</p>

          <div className="mt-5">
            <FileDropzone label="" compact onFileSelected={handleLocalUpload} />
          </div>

          <button
            type="button"
            onClick={handleVerify}
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            {loading ? "Verifying document..." : "Run Verification"}
          </button>

          <div className="mt-4">
            <ProcessingStepper steps={STEPS} currentStep={currentStep} />
          </div>

          <div className="mt-4 rounded-xl bg-slate-200/25 p-3 text-sm text-secondaryText">
            Verification checks OCR text consistency, field alignment, expected sections, and forgery indicators.
          </div>

          {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        </div>

        <div className="relative border-r border-slate-700 bg-slate-100/80">
          <LoaderOverlay show={loading} text="Verifying document..." />
          {source ? (
            <div className="h-full p-3">
              <DocumentViewer src={source} regions={result?.suspicious_regions || []} alt="verify document" plain />
            </div>
          ) : (
            <div className="grid h-full place-content-center text-3xl text-slate-500">No document loaded</div>
          )}
        </div>

        <div className="bg-slate-100/80 p-3">
          <VerifyResultPanel result={result} />
        </div>
      </div>
    </section>
  );
}
