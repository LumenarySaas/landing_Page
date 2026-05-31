// wf-app.jsx — approaches, tab controller, tweaks, mount
const { useState: useStateA } = React;

const JMAP = { "Plain": "zero", "Balanced": "balanced", "Crypto-native": "owned" };
const ORDERMAP = { "Approach default": "default", "Lead with comparator": "comparator", "Lead with compliance": "compliance", "Lead with proof / metrics": "metrics" };

const APPROACHES = [
  { id: "A", label: "Yield-first", short: "Turn idle CAD into ~7% institutional yield — taxes handled.",
    hero: { kind: "Hero", variant: "yield" }, featVariant: "base",
    sections: ["trust", "metrics", "features", "comparator", "compliance", "faq", "cta"] },
  { id: "B", label: "TradFi ↔ DeFi bridge", short: "A full banking layer: accounts, cards & stablecoin settlement.",
    hero: { kind: "Hero", variant: "bridge" }, featVariant: "bridge",
    sections: ["trust", "features", "metrics", "comparator", "compliance", "faq", "cta"] },
  { id: "C", label: "Compliance-first", short: "Lead with regulation, KYB & tax automation — yield is the reward.",
    hero: { kind: "Hero", variant: "compliance" }, featVariant: "base",
    sections: ["compliance", "trust", "features", "comparator", "metrics", "faq", "cta"] },
  { id: "D", label: "Proof / Comparator", short: "The TradFi-vs-DeFi conviction tool IS the hero.",
    hero: { kind: "HeroComparator" }, featVariant: "base",
    sections: ["trust", "metrics", "features", "compliance", "faq", "cta"] },
];

function applyOrder(keys, preset) {
  let arr = keys.filter(k => k !== "cta");
  const cta = keys.filter(k => k === "cta");
  const front = (k) => { if (arr.includes(k)) arr = [k, ...arr.filter(x => x !== k)]; };
  if (preset === "comparator") front("comparator");
  else if (preset === "compliance") front("compliance");
  else if (preset === "metrics") front("metrics");
  return [...arr, ...cta];
}

function Section({ k, ap, jargon }) {
  switch (k) {
    case "trust": return <TrustBar />;
    case "features": return <Features5 jargon={jargon} variant={ap.featVariant} />;
    case "comparator": return <Comparator jargon={jargon} />;
    case "metrics": return <MetricsBand jargon={jargon} />;
    case "compliance": return <Compliance jargon={jargon} lead={ap.id === "C"} />;
    case "faq": return <FAQ jargon={jargon} />;
    case "cta": return <CTA jargon={jargon} />;
    default: return null;
  }
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "accent": "#B68A16",
  "density": "Regular",
  "jargon": "Balanced",
  "order": "Approach default",
  "notes": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tab, setTab] = useStateA(0);
  const ap = APPROACHES[tab];
  const jargon = JMAP[t.jargon] || "balanced";
  const order = ORDERMAP[t.order] || "default";
  const sections = applyOrder(ap.sections, order);

  const densityClass = t.density === "Airy" ? "d-sparse" : "";
  const gap = t.density === "Airy" ? 1.3 : t.density === "Rich" ? 0.82 : 1;

  const wrapClass = [
    t.dark ? "theme-dark" : "theme-light",
    densityClass,
    t.notes ? "" : "notes-off",
  ].join(" ");

  return (
    <div className={wrapClass} style={{ "--accent": t.accent, "--gap": gap }}>
      <div className="stage">
        {/* top control bar */}
        <div className="topbar">
          <div className="topbar-in">
            <span className="tb-brand"><span className="glyph">L</span>Lumenary</span>
            <span className="tb-tag">Landing wireframes · sketch fidelity</span>
            <div className="tabs">
              {APPROACHES.map((a, i) => (
                <button key={a.id} className={"tab" + (i === tab ? " on" : "")} onClick={() => { setTab(i); window.scrollTo({ top: 0 }); }}>
                  <span className="k">{a.id}</span>{a.label}
                </button>
              ))}
            </div>
          </div>
          <div className="approach-desc">
            <span className="ab">Approach {ap.id}</span>
            <span className="at">{ap.short}</span>
          </div>
        </div>

        {/* wireframe in a browser frame */}
        <div className="scrollwrap">
          <div className="browser">
            <div className="browser-bar">
              <span className="dot"></span><span className="dot"></span><span className="dot"></span>
              <span className="url">lumenary.ca</span>
            </div>
            <div className="canvas">
              <WNav jargon={jargon} />
              {ap.hero.kind === "HeroComparator"
                ? <HeroComparator jargon={jargon} />
                : <Hero jargon={jargon} variant={ap.hero.variant} />}
              {sections.map((k, i) => <Section key={k + i} k={k} ap={ap} jargon={jargon} />)}
              <WFooter />
            </div>
          </div>
        </div>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Direction" />
        <TweakRadio label="Crypto jargon" value={t.jargon} options={["Plain", "Balanced", "Crypto-native"]} onChange={(v) => setTweak("jargon", v)} />
        <TweakSelect label="Section order" value={t.order} options={["Approach default", "Lead with comparator", "Lead with compliance", "Lead with proof / metrics"]} onChange={(v) => setTweak("order", v)} />
        <TweakSection label="Look" />
        <TweakToggle label="Dark mode" value={t.dark} onChange={(v) => setTweak("dark", v)} />
        <TweakColor label="Accent" value={t.accent} options={["#B68A16", "#2A6FDB", "#1F8A5B", "#475569"]} onChange={(v) => setTweak("accent", v)} />
        <TweakRadio label="Density" value={t.density} options={["Airy", "Regular", "Rich"]} onChange={(v) => setTweak("density", v)} />
        <TweakSection label="Review" />
        <TweakToggle label="Designer notes" value={t.notes} onChange={(v) => setTweak("notes", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
