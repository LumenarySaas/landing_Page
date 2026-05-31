// wf-sections.jsx — landing-page section components (wireframe fidelity)

/* ---------- product-card placeholder used in heroes ---------- */
function MiniProduct({ jargon }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="between" style={{ padding: "13px 18px", borderBottom: "2px dashed var(--line-soft)" }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Synthèse · Treasury</span>
        <span className="chip on"><span className="dot-live"></span>LIVE</span>
      </div>
      <div style={{ padding: 20 }}>
        <div className="muted" style={{ fontFamily: "Architects Daughter", fontSize: 12, letterSpacing: ".06em" }}>TOTAL BALANCE</div>
        <div className="h-lg" style={{ marginTop: 4 }}>$1,284,930</div>
        <div style={{ fontFamily: "Architects Daughter", fontSize: 13, color: "var(--accent)", marginTop: 4 }}>▲ +$8,420 yield · 30d</div>
        <div className="grid g2 mt20">
          <div className="card alt" style={{ padding: 13 }}>
            <div className="muted" style={{ fontFamily: "Architects Daughter", fontSize: 10.5 }}>APY</div>
            <div className="h-md" style={{ color: "var(--accent)" }}>7.02%</div>
          </div>
          <div className="card alt" style={{ padding: 13 }}>
            <div className="muted" style={{ fontFamily: "Architects Daughter", fontSize: 10.5 }}>{J(jargon, { zero: "EARNS VIA", balanced: "YIELD ACCOUNT", owned: "VAULT" })}</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}>{J(jargon, { zero: "Secure account", balanced: "Yield account", owned: "Morpho · Arbitrum" })}</div>
          </div>
        </div>
        <Ph label="balance chart" h={70} style={{ marginTop: 16 }} />
      </div>
    </div>
  );
}

/* ---------- HERO (variants: yield / bridge / compliance) ---------- */
const HERO = {
  yield: {
    tag: "Treasury · non-custodial",
    h: { zero: "Earn more on the cash your business isn't using.", balanced: "Put your idle treasury to work.", owned: "Idle treasury, earning ~7% onchain." },
    note: <span><b>Approach A — Yield-first.</b> Leads with the core promise from the spec: turn dormant CAD into institutional yield, taxes handled. Most direct, least “bank-like”.</span>,
  },
  bridge: {
    tag: "TradFi ↔ DeFi",
    h: { zero: "One account for dollars, digital dollars, and everything between.", balanced: "The bridge between your bank and onchain finance.", owned: "Multi-currency IBANs, corporate cards & instant stablecoin settlement." },
    note: <span><b>Approach B — The bridge.</b> Frames Lumenary as a full banking layer (accounts, cards, settlement). Honours the broad brief; widest scope, furthest from the V1.3 spec.</span>,
  },
  compliance: {
    tag: "Compliance-as-a-service",
    h: { zero: "Modern money rails your auditor will sign off on.", balanced: "Crypto rails built for Canadian compliance.", owned: "Automated KYB/KYC, CARF 2026 tax packs, FINTRAC-aligned." },
    note: <span><b>Approach C — Compliance-first.</b> Disarms the skeptic immediately: regulation, KYB and tax automation lead, yield is the reward. Most “banking-grade” feel.</span>,
  },
};

function Hero({ jargon, variant = "yield" }) {
  const c = HERO[variant];
  return (
    <div className="sec" style={{ paddingTop: 56, paddingBottom: 56 }}>
      <div className="hero-grid">
        <div>
          <Tag>{c.tag}</Tag>
          <h1 className="h-xl">{J(jargon, c.h)}</h1>
          <p className="sub">{J(jargon, {
            zero: "Built for Canadian businesses. No crypto know-how needed — your money stays yours, always.",
            balanced: "The treasury workspace for Canadian SMEs. Non-custodial, compliant by default.",
            owned: "Non-custodial DeFi treasury for Canadian SMEs. Passkey-signed, CARF-ready, no lock-up.",
          })}</p>
          <div className="gapc mt28">
            <Btn fill>{J(jargon, { zero: "Get started free", balanced: "Start free", owned: "Join private beta" })} →</Btn>
            <Btn>See the product</Btn>
          </div>
          <div className="muted mt20" style={{ fontFamily: "Architects Daughter", fontSize: 13 }}>Free during private beta · no platform fee · no lock-up</div>
        </div>
        <div style={{ position: "relative" }}>
          {variant === "compliance"
            ? <Ph label="compliance / KYB visual" h={300} />
            : <MiniProduct jargon={jargon} />}
        </div>
      </div>
      <Note tilt="r" style={{ position: "absolute", right: 30, bottom: -18, maxWidth: 290 }}>{c.note}</Note>
    </div>
  );
}

/* ---------- HERO variant D: comparator-led / proof ---------- */
function HeroComparator({ jargon }) {
  return (
    <div className="sec" style={{ paddingTop: 52, paddingBottom: 56 }}>
      <div className="hero-grid" style={{ gridTemplateColumns: ".82fr 1.18fr" }}>
        <div>
          <Tag>Proof, not promises</Tag>
          <h1 className="h-xl">{J(jargon, {
            zero: "Your bank pays ~1%. Watch what the same cash does here.",
            balanced: "Your bank pays ~1%. See the difference on Lumenary.",
            owned: "Your bank pays ~1%. ~7% APY, non-custodial, same cash.",
          })}</h1>
          <p className="sub">Slide your balance and the period — the gap is the pitch. The comparator is free, forever, even before you deposit a dollar.</p>
          <div className="gapc mt28">
            <Btn fill>Run the numbers →</Btn>
            <Btn>How it works</Btn>
          </div>
        </div>
        <div>
          <div className="card">
            <div className="between" style={{ marginBottom: 14 }}>
              <span style={{ fontWeight: 700 }}>Lumenary (DeFi) vs Savings (TradFi)</span>
              <div className="gapc" style={{ gap: 6 }}>
                {["7D", "1M", "YTD", "1Y", "ALL"].map((t, i) => <Chip key={t} on={i === 2}>{t}</Chip>)}
              </div>
            </div>
            <Ph label="two-line comparison chart" h={240} />
            <div className="between mt20">
              <Note tilt="l" style={{ margin: 0 }}><b>+$12,480</b> more with Lumenary over this period</Note>
              <div className="gapc">
                <Chip><span className="dot-live"></span>DeFi · Lumenary</Chip>
                <Chip>TradFi · savings</Chip>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Note tilt="r" style={{ position: "absolute", right: 30, bottom: -18, maxWidth: 300 }}>
        <span><b>Approach D — Proof-led.</b> The conviction tool (Finary-style comparator) IS the hero. Best for skeptics who trust numbers over claims.</span>
      </Note>
    </div>
  );
}

/* ---------- TRUST BAR ---------- */
function TrustBar() {
  return (
    <div className="sec" style={{ paddingTop: 26, paddingBottom: 26 }}>
      <div className="between">
        <span className="muted" style={{ fontFamily: "Architects Daughter", fontSize: 12, letterSpacing: ".08em" }}>BUILT ON TRUSTED RAILS</span>
        <div className="gapc" style={{ gap: 22 }}>
          {["Morpho", "Arbitrum", "Interac", "FINTRAC", "Privy", "Chainlink"].map(x =>
            <span key={x} style={{ fontWeight: 700, fontSize: 16, color: "var(--ink-soft)", opacity: .8 }}>{x}</span>)}
        </div>
      </div>
    </div>
  );
}

/* ---------- FEATURES (5 spaces) ---------- */
const FEAT_BASE = [
  { ic: "▦", t: "Synthèse", d: "Live balance, accrued yield & APY — clear as a bank statement." },
  { ic: "T5", t: "Centrale Fiscale", d: "Automated T5, PBR & Grand Livre, ready for ARC & Revenu Québec." },
  { ic: "🔒", t: "Sécurité", d: "Passkey co-signers above your threshold, full audit log." },
  { ic: "⇄", t: "Comparateur", d: "TradFi vs DeFi, side by side — your conviction tool." },
  { ic: "$", t: "Paiements", d: "On/off-ramp, bank linking & subscription in one place." },
];
const FEAT_BRIDGE = [
  { ic: "▣", t: "Accounts", d: "Multi-currency balances with IBAN-style details." },
  { ic: "▭", t: "Cards", d: "Corporate cards that spend fiat & crypto seamlessly." },
  { ic: "⚡", t: "Settlement", d: "Instant cross-border stablecoin settlement." },
  { ic: "T5", t: "Tax & compliance", d: "Automated CARF packs & ledgers for your accountant." },
  { ic: "%", t: "Treasury yield", d: "Earn ~7% on idle balances, non-custodial." },
];

function Features5({ jargon, variant = "base" }) {
  const items = variant === "bridge" ? FEAT_BRIDGE : FEAT_BASE;
  return (
    <div className="sec">
      <div className="center mx" style={{ maxWidth: 620 }}>
        <Tag>One workspace</Tag>
        <h2 className="h-lg">{variant === "bridge" ? "Everything money should do, in one place." : "Five spaces, one treasury."}</h2>
        <p className="sub mx center" style={{ textAlign: "center" }}>Designed so a CFO gets it in thirty seconds.</p>
      </div>
      <div className="grid g5 mt28">
        {items.map((f, i) => (
          <div className="card" key={i}>
            <IcBox>{f.ic}</IcBox>
            <div className="h-md" style={{ fontSize: 18 }}>{f.t}</div>
            <p className="muted" style={{ fontFamily: "Architects Daughter", fontSize: 13.5, marginTop: 6 }}>{f.d}</p>
            <div className="rich-only"><Greek sm lines={2} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- COMPARATOR (standalone section) ---------- */
function Comparator({ jargon }) {
  return (
    <div className="sec">
      <div className="center mx" style={{ maxWidth: 640 }}>
        <Tag>The conviction tool</Tag>
        <h2 className="h-lg">See the cost of doing nothing.</h2>
      </div>
      <div className="card mt28">
        <div className="between" style={{ marginBottom: 14 }}>
          <div className="gapc">
            <Chip on>Lumenary · DeFi</Chip>
            <Chip>Canadian savings · TradFi</Chip>
          </div>
          <div className="gapc" style={{ gap: 6 }}>
            {["1D", "7D", "1M", "3M", "YTD", "1Y", "ALL"].map((t, i) => <Chip key={t} on={i === 4}>{t}</Chip>)}
          </div>
        </div>
        <Ph label="dual-curve comparison chart (DeFi rising vs flat savings)" h={260} />
        <div className="between mt20">
          <Note tilt="l" style={{ margin: 0, maxWidth: 360 }}>“With Lumenary, your treasury generated <b>$12,480 more</b> this year.”</Note>
          <div className="rich-only"><Greek sm lines={1} widths={["180px"]} /></div>
        </div>
      </div>
    </div>
  );
}

/* ---------- METRICS BAND ---------- */
function MetricsBand({ jargon }) {
  const m = [
    { v: "~7%", k: J(jargon, { zero: "Yield on idle cash", balanced: "Current yield", owned: "Vault APY (Morpho)" }) },
    { v: "<$0.10", k: "Cost per deposit" },
    { v: "~4h", k: "Typical withdrawal" },
    { v: "100%", k: J(jargon, { zero: "Stays yours", balanced: "Non-custodial", owned: "Non-custodial · Passkey" }) },
  ];
  return (
    <div className="sec">
      <div className="band">
        <div className="bgrid">
          {m.map((x, i) => (
            <div key={i}>
              <div className="bv">{x.v}</div>
              <div className="bk">{x.k}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- COMPLIANCE & SECURITY ---------- */
function Compliance({ jargon, lead = false }) {
  const items = [
    { t: "Non-custodial", d: J(jargon, { zero: "Only you can move your money.", balanced: "Lumenary never holds your funds.", owned: "Passkey-signed, ERC-4337 smart account." }) },
    { t: "KYB verified", d: "Checked against Corporations Canada & Revenu Québec." },
    { t: "CARF 2026 ready", d: "Automated T5, T1135 & TP-21.4.39 tax packs." },
    { t: "FINTRAC-aligned", d: "AML obligations via licensed partners; 6-yr retention." },
  ];
  return (
    <div className="sec">
      <div className="hero-grid" style={{ gridTemplateColumns: ".8fr 1.2fr", alignItems: "start" }}>
        <div>
          <Tag>Trust &amp; compliance</Tag>
          <h2 className="h-lg">{lead ? "Compliance comes first." : "Banking-grade, by design."}</h2>
          <p className="sub">The boring stuff, automated — so your finance team and your auditor stay comfortable.</p>
        </div>
        <div className="grid g2">
          {items.map((x, i) => (
            <div className="card" key={i}>
              <div className="flex" style={{ gap: 10, alignItems: "center" }}>
                <span className="icbox" style={{ width: 30, height: 30, margin: 0 }}>✓</span>
                <span className="h-md" style={{ fontSize: 17 }}>{x.t}</span>
              </div>
              <p className="muted" style={{ fontFamily: "Architects Daughter", fontSize: 13.5, marginTop: 10 }}>{x.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- FAQ (skepticism) ---------- */
function FAQ({ jargon }) {
  const qs = [
    "Is my money safe if Lumenary disappears?",
    "Do I need to understand crypto to use this?",
    "Is this legal and compliant in Canada?",
    "What are the fees, and is there a lock-up?",
    "How fast can I get my cash back?",
  ];
  return (
    <div className="sec">
      <div className="center mx" style={{ maxWidth: 600 }}>
        <Tag>For the skeptic</Tag>
        <h2 className="h-lg">Questions a CFO actually asks.</h2>
      </div>
      <div className="mx mt28" style={{ maxWidth: 760 }}>
        {qs.map((q, i) => (
          <div className="fa-row" key={i}>
            <div className="between" style={{ alignItems: "flex-start" }}>
              <span className="h-md" style={{ fontSize: 18 }}>{q}</span>
              <span className="h-md" style={{ color: "var(--accent)", fontSize: 22 }}>{i === 0 ? "–" : "+"}</span>
            </div>
            {i === 0 && <div style={{ marginTop: 12 }}><Greek lines={3} /></div>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- CTA ---------- */
function CTA({ jargon }) {
  return (
    <div className="sec center" style={{ paddingTop: 64, paddingBottom: 64 }}>
      <Tag>Private beta · free</Tag>
      <h2 className="h-xl mx" style={{ maxWidth: 760, fontSize: "clamp(30px,4.4vw,50px)" }}>
        {J(jargon, { zero: "Make your cash work harder.", balanced: "Put your treasury to work.", owned: "Earn on idle treasury, compliantly." })}
      </h2>
      <p className="sub mx center" style={{ textAlign: "center", marginTop: 16 }}>Join the Canadian SMEs already earning on idle cash — with the taxes handled.</p>
      <div className="flex mx mt28" style={{ maxWidth: 440, gap: 10 }}>
        <span style={{ flex: 1, fontFamily: "Architects Daughter", fontSize: 14, color: "var(--ink-soft)", background: "var(--panel)", border: "2px solid var(--line-soft)", borderRadius: "var(--sketch)", padding: "12px 16px", textAlign: "left" }}>name@yourcompany.ca</span>
        <Btn fill>Start free →</Btn>
      </div>
      <div className="muted mt14" style={{ fontFamily: "Architects Daughter", fontSize: 12 }}>no platform fee · no subscription · no lock-up</div>
    </div>
  );
}

Object.assign(window, { Hero, HeroComparator, TrustBar, Features5, Comparator, MetricsBand, Compliance, FAQ, CTA });
