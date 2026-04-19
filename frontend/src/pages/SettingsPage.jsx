import { useState } from "react";

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`h-7 w-12 rounded-full p-1 transition-all ${enabled ? "bg-accent" : "bg-slate-900"}`}
    >
      <span className={`block h-5 w-5 rounded-full bg-white transition-all ${enabled ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const [delay, setDelay] = useState(1500);
  const [threshold, setThreshold] = useState(75);
  const [animations, setAnimations] = useState(true);
  const [autoZoom, setAutoZoom] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  return (
    <section className="fade-up relative min-h-[calc(100vh-4rem)] rounded-2xl border border-slate-700 bg-[#0a173c] p-6">
      <button type="button" className="absolute right-8 top-6 z-10 rounded-full border border-slate-700 bg-slate-800/80 p-3 text-accent">
        ☼
      </button>

      <h2 className="text-primaryText text-5xl font-semibold">Settings</h2>
      <p className="text-secondaryText mt-1 text-xl">Fine-tune AI processing and interface behavior</p>

      <div className="mt-6 card p-5">
        <h3 className="text-primaryText text-3xl font-semibold">Processing Settings</h3>
        <p className="text-secondaryText text-sm">Control how the AI pipeline simulates analysis</p>

        <div className="mt-4">
          <div className="flex items-center justify-between text-secondaryText text-sm">
            <p>Processing Step Delay</p>
            <p>{delay}ms</p>
          </div>
          <input
            type="range"
            min={500}
            max={3000}
            step={100}
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-secondaryText">
            <span>Faster (500ms)</span>
            <span>Slower (3000ms)</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-secondaryText text-sm">
            <p>Confidence Threshold</p>
            <p>{threshold}%</p>
          </div>
          <input
            type="range"
            min={50}
            max={95}
            step={1}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-secondaryText">
            <span>Lenient (50%)</span>
            <span>Strict (95%)</span>
          </div>
        </div>
      </div>

      <div className="mt-5 card p-5">
        <h3 className="text-primaryText text-3xl font-semibold">UI Preferences</h3>
        <p className="text-secondaryText text-sm">Customize visual behavior and interactions</p>

        <div className="mt-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primaryText">Enable Animations</p>
              <p className="text-secondaryText text-sm">Smooth transitions and motion effects</p>
            </div>
            <Toggle enabled={animations} onChange={setAnimations} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-primaryText">Auto-Zoom Anomalies</p>
              <p className="text-secondaryText text-sm">Automatically zoom to anomalies when selected</p>
            </div>
            <Toggle enabled={autoZoom} onChange={setAutoZoom} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-primaryText">Demo Mode</p>
              <p className="text-secondaryText text-sm">Enable demonstration mode with example workflows</p>
            </div>
            <Toggle enabled={demoMode} onChange={setDemoMode} />
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-rose-400/40 bg-rose-500/5 p-5">
        <h3 className="text-rose-300 text-3xl font-semibold">Danger Zone</h3>
        <p className="text-secondaryText text-sm">Irreversible actions - proceed with caution</p>

        <button type="button" className="mt-4 w-full rounded-xl border border-rose-400/30 bg-rose-400/5 px-4 py-3 text-left text-rose-300">
          Reset All Settings
        </button>
      </div>
    </section>
  );
}
