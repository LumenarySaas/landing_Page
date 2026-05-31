// lumenary-tweaks.jsx — small React island that drives the page's CSS vars + jargon
const { useEffect: useEffectT } = React;

const ACCENTS = {
  "Gold":  { light: ["#9A7A33", "#7A5F22"], dark: ["#C7A24E", "#D8B868"] },
  "Blue":  { light: ["#2A6FDB", "#1F52A8"], dark: ["#5C95F0", "#7DACF5"] },
  "Green": { light: ["#1F8A5B", "#166B45"], dark: ["#3FB57E", "#5BC795"] },
  "Slate": { light: ["#53607A", "#3C465C"], dark: ["#8C99B5", "#A6B1C9"] },
};
const JARGON = { "Plain": "zero", "Balanced": "balanced", "Crypto-native": "owned" };

const T_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "Gold",
  "dark": false,
  "jargon": "Balanced"
}/*EDITMODE-END*/;

function LumTweaks() {
  const [t, setTweak] = useTweaks(T_DEFAULTS);

  useEffectT(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", !!t.dark);
    const pair = (ACCENTS[t.accent] || ACCENTS.Gold)[t.dark ? "dark" : "light"];
    root.style.setProperty("--accent", pair[0]);
    root.style.setProperty("--accent-ink", pair[1]);
  }, [t.accent, t.dark]);

  useEffectT(() => {
    if (window.LUM) window.LUM.setJargon(JARGON[t.jargon] || "balanced");
  }, [t.jargon]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Voice" />
      <TweakRadio label="Crypto jargon" value={t.jargon}
        options={["Plain", "Balanced", "Crypto-native"]}
        onChange={(v) => setTweak("jargon", v)} />
      <TweakSection label="Look" />
      <TweakRadio label="Accent" value={t.accent}
        options={["Gold", "Blue", "Green", "Slate"]}
        onChange={(v) => setTweak("accent", v)} />
      <TweakToggle label="Dark mode" value={t.dark}
        onChange={(v) => setTweak("dark", v)} />
    </TweaksPanel>
  );
}

const _mount = document.createElement("div");
document.body.appendChild(_mount);
ReactDOM.createRoot(_mount).render(<LumTweaks />);
