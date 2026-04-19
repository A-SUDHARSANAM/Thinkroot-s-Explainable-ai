export default function LoaderOverlay({ show, text = "Analyzing document..." }) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-20 grid place-content-center rounded-2xl bg-slate-950/70 backdrop-blur-sm">
      <div className="flex items-center gap-3 rounded-full border border-slate-700 bg-slate-900/80 px-5 py-3">
        <span className="h-3 w-3 animate-ping rounded-full bg-accent" />
        <span className="text-primaryText text-sm font-medium">{text}</span>
      </div>
    </div>
  );
}
