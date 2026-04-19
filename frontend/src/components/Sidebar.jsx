const navItems = [
  "Upload Document",
  "Analysis",
  "Verify Document",
  "Compare Documents",
  "Audit Log",
  "Settings",
];

export default function Sidebar({ active, onSelect }) {
  return (
    <aside className="w-full lg:w-[230px] shrink-0 bg-[#1b2a44] border-r border-slate-700 lg:min-h-screen flex flex-col">
      <div className="border-b border-slate-700 px-4 py-4">
        <h1 className="text-primaryText font-display text-[28px] font-bold leading-tight tracking-tight">DocForensics</h1>
        <p className="text-secondaryText text-sm">AI Verifier</p>
      </div>

      <nav className="space-y-2 px-2 py-6">
        {navItems.map((item) => {
          const isActive = active === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              className={`w-full rounded-xl px-4 py-3 text-left text-[18px] leading-tight font-medium transition-all ${
                isActive
                  ? "bg-slate-700/40 text-accent"
                  : "text-secondaryText hover:bg-slate-700/20 hover:text-primaryText"
              }`}
            >
              {item}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-700">
        <button type="button" className="w-full px-4 py-5 text-left text-[20px] text-secondaryText hover:text-primaryText">
          Collapse
        </button>
        <div className="flex items-center gap-3 border-t border-slate-700 px-4 py-5">
          <div className="h-10 w-10 rounded-full bg-accent text-slate-900 grid place-content-center text-sm font-bold">FI</div>
          <div>
            <p className="text-primaryText text-sm font-semibold">Forensic Investigator</p>
            <p className="text-secondaryText text-xs">investigator@docforensics.ai</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
