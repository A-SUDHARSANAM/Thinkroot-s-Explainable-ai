export default function ProcessingStepper({ steps = [], currentStep = -1 }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {steps.map((step, idx) => {
        const done = idx <= currentStep;
        return (
          <div
            key={step}
            className={`rounded-xl border px-2 py-2 text-[11px] leading-tight text-center transition-all ${
              done
                ? "border-accent/50 bg-yellow-300/10 text-accent"
                : "border-slate-700 bg-slate-900/30 text-secondaryText"
            }`}
          >
            <span className="font-medium break-words">{step}</span>
          </div>
        );
      })}
    </div>
  );
}
