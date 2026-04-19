import { useRef, useState } from "react";

const ACCEPTED = ["image/jpeg", "image/png", "application/pdf"];

export default function FileDropzone({ label, onFileSelected, maxMb = 10, compact = false }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  function validate(file) {
    if (!file) return false;
    if (!ACCEPTED.includes(file.type)) {
      setError("Only JPG, PNG, and PDF are supported.");
      return false;
    }
    const mb = file.size / (1024 * 1024);
    if (mb > maxMb) {
      setError(`File is too large. Maximum allowed is ${maxMb}MB.`);
      return false;
    }
    setError("");
    return true;
  }

  function pickFile(file) {
    if (validate(file)) {
      onFileSelected(file);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  }

  return (
    <div>
      <p className="mb-2 text-sm text-secondaryText">{label}</p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border border-dashed text-center transition-all ${
          compact ? "px-5 py-10" : "p-8"
        } ${
          dragging ? "border-accent bg-yellow-300/10" : "border-slate-600 hover:border-slate-500"
        }`}
      >
        <p className="text-secondaryText text-4xl">⇪</p>
        <p className="mt-2 text-primaryText font-semibold">Upload Document</p>
        <p className="mt-1 text-sm text-secondaryText">Drag and drop or click</p>
        {!compact ? (
          <p className="mt-3 text-xs text-secondaryText">JPG, PNG, PDF up to {maxMb}MB</p>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={(e) => pickFile(e.target.files?.[0])}
      />
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
