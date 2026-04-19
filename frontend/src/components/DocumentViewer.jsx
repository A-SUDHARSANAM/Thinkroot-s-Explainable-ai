function Box({ bbox }) {
  const [x1, y1, x2, y2] = bbox;
  return (
    <div
      className="absolute border-2 border-danger shadow-[0_0_0_1px_rgba(239,68,68,0.8)]"
      style={{
        left: `${x1}px`,
        top: `${y1}px`,
        width: `${Math.max(1, x2 - x1)}px`,
        height: `${Math.max(1, y2 - y1)}px`,
      }}
    />
  );
}

export default function DocumentViewer({ src, regions = [], alt = "document", plain = false }) {
  if (!src) {
    return (
      <div className={`${plain ? "min-h-72 rounded-xl border border-slate-300 bg-white" : "card"} grid place-content-center p-6 text-secondaryText`}>
        Upload a document to start.
      </div>
    );
  }

  const isPdf = src.toLowerCase().includes(".pdf");

  return (
    <div className={`${plain ? "relative h-full overflow-auto rounded-xl border border-slate-300 bg-white p-3" : "card relative overflow-auto p-3"}`}>
      {isPdf ? (
        <iframe src={src} title="pdf preview" className="h-[520px] w-full rounded-xl border border-slate-700" />
      ) : (
        <div className="relative inline-block">
          <img src={src} alt={alt} className="max-h-[520px] rounded-xl object-contain" />
          <div className="absolute left-0 top-0">
            {regions.map((region, idx) => (
              <Box key={`${region.bbox.join("-")}-${idx}`} bbox={region.bbox} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
