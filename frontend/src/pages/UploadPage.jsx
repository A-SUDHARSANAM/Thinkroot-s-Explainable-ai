import { useMemo, useState } from "react";

import FileDropzone from "../components/FileDropzone";
import { listDemoFiles, uploadDemo, uploadDocument, absoluteAssetUrl } from "../services/api";

export default function UploadPage({ uploadedDoc, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [demoFiles, setDemoFiles] = useState([]);

  const previewUrl = useMemo(() => {
    if (!uploadedDoc) return "";
    return absoluteAssetUrl(uploadedDoc.preview_url);
  }, [uploadedDoc]);

  async function handleUpload(file) {
    try {
      setUploading(true);
      setMessage("");
      const result = await uploadDocument(file);
      onUploaded(result);
      setMessage("File uploaded successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUploading(false);
    }
  }

  async function loadDemoFiles() {
    try {
      const res = await listDemoFiles();
      setDemoFiles(res.files || []);
      if (!res.files?.length) {
        setMessage("No demo samples found in backend/demo_samples yet.");
      }
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function useDemo(name) {
    try {
      setUploading(true);
      const result = await uploadDemo(name);
      onUploaded(result);
      setMessage(`Demo file loaded: ${name}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="fade-up mx-auto max-w-5xl py-4">
      <button type="button" className="ml-auto block rounded-full border border-slate-700 bg-slate-800/80 p-3 text-accent">
        ☼
      </button>

      <div className="mt-5 text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-accent/15 text-accent grid place-content-center text-3xl">▣</div>
        <h2 className="text-primaryText text-5xl font-semibold">Document Forensics AI</h2>
        <p className="text-secondaryText mt-2 text-xl">Upload a document image to verify its authenticity using advanced AI analysis</p>
      </div>

      <div className="mt-8 card mx-auto max-w-3xl p-7">
        <FileDropzone label="" onFileSelected={handleUpload} maxMb={10} />
      </div>

      <div className="mt-6 card mx-auto max-w-3xl p-6">
        <h3 className="text-primaryText text-3xl font-semibold">Privacy-First Analysis</h3>
        <ul className="mt-3 space-y-2 text-secondaryText text-lg">
          <li>• All processing happens in your secure workspace environment</li>
          <li>• Explainable AI provides clear reasoning for every decision</li>
          <li>• Full audit trail for compliance and accountability</li>
        </ul>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadDemoFiles}
            className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-secondaryText hover:border-accent hover:text-accent"
          >
            Demo Mode: Load Samples
          </button>

          {demoFiles.map((f) => (
            <button
              key={f.name}
              type="button"
              onClick={() => useDemo(f.name)}
              className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-primaryText hover:bg-slate-700"
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {uploading ? <p className="mt-3 text-center text-sm text-accent">Uploading...</p> : null}
      {message ? <p className="mt-3 text-center text-sm text-secondaryText">{message}</p> : null}

      <div className="card p-5 mt-6">
        <h3 className="text-primaryText text-lg font-semibold">Preview</h3>
        {!uploadedDoc ? (
          <p className="mt-2 text-secondaryText text-sm">No file uploaded yet.</p>
        ) : previewUrl.toLowerCase().includes(".pdf") ? (
          <iframe title="uploaded preview" src={previewUrl} className="mt-3 h-[500px] w-full rounded-xl border border-slate-700" />
        ) : (
          <img src={previewUrl} alt="uploaded document" className="mt-3 max-h-[500px] rounded-xl border border-slate-700 object-contain" />
        )}
      </div>
    </section>
  );
}
