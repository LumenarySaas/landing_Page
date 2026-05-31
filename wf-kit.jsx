// wf-kit.jsx — wireframe primitives + jargon helper + nav/footer
const { useState } = React;

/* jargon helper: pick copy by crypto-jargon level */
function J(level, v) {
  return v[level] !== undefined ? v[level] : (v.balanced || v.owned || v.zero || "");
}

/* greeked text block */
function Greek({ lines = 3, sm = false, widths }) {
  const ws = widths || (
    lines === 1 ? ["70%"]
    : Array.from({ length: lines }, (_, i) =>
        i === lines - 1 ? ["52%", "44%", "60%"][i % 3] : ["100%", "96%", "92%", "98%"][i % 4])
  );
  return (
    <div className={"greek" + (sm ? " sm" : "")}>
      {ws.map((w, i) => <i key={i} style={{ width: w }}></i>)}
    </div>
  );
}

/* placeholder visual box */
function Ph({ label, h = 200, style }) {
  return (
    <div className="ph" style={{ height: h, ...style }}>
      {label && <span className="pl">{label}</span>}
    </div>
  );
}

function Btn({ children, fill, style }) {
  return <span className={"btn" + (fill ? " fill" : " ghost")} style={style}>{children}</span>;
}

function Chip({ children, on }) {
  return <span className={"chip" + (on ? " on" : "")}>{children}</span>;
}

function Tag({ children }) { return <span className="tag">{children}</span>; }

/* sticky-note annotation */
function Note({ children, tilt = "l", style }) {
  return <div className={"note note-tilt-" + tilt} style={style}>{children}</div>;
}

/* icon stand-in box (two letters) */
function IcBox({ children }) { return <div className="icbox">{children}</div>; }

function WNav({ jargon }) {
  return (
    <div className="wf-nav">
      <div className="wf-brand"><span className="g"></span>Lumenary</div>
      <div className="ln">
        <span className="lk">Product</span>
        <span className="lk">Compliance</span>
        <span className="lk">Pricing</span>
        <span className="lk">About</span>
      </div>
      <div className="gapc">
        <Btn>Sign in</Btn>
        <Btn fill>Launch app →</Btn>
      </div>
    </div>
  );
}

function WFooter() {
  return (
    <div className="sec" style={{ paddingTop: 30, paddingBottom: 30 }}>
      <div className="between">
        <div className="wf-brand" style={{ fontSize: 16 }}><span className="g"></span>Lumenary</div>
        <div className="gapc" style={{ gap: 18 }}>
          {["Security", "FINTRAC", "Privacy", "Terms"].map(x =>
            <span key={x} className="lk" style={{ fontFamily: "Architects Daughter", fontSize: 13 }}>{x}</span>)}
        </div>
        <span className="muted" style={{ fontFamily: "Architects Daughter", fontSize: 12 }}>© 2026 · Montréal · CA-CENTRAL</span>
      </div>
      <Greek sm lines={1} widths={["88%"]} />
    </div>
  );
}

Object.assign(window, { J, Greek, Ph, Btn, Chip, Tag, Note, IcBox, WNav, WFooter });
