/* MatchBar — pill segmented bar for R/C/D match data */
function MatchBar({ label, resonate, contradict, diverge, name }) {
  const GRADIENTS = {
    resonate:   "linear-gradient(to bottom, #3D8A3D 0%, #2D6A2D 100%)",
    contradict: "linear-gradient(to bottom, #C04040 0%, #A33030 100%)",
    diverge:    "linear-gradient(to bottom, #9A9890 0%, #888780 100%)",
  };
  const LABELS = { resonate: "Resonance", contradict: "Contradiction", diverge: "Divergence" };

  const sum = (resonate || 0) + (contradict || 0) + (diverge || 0);

  const [hoveredKey, setHoveredKey] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!hoveredKey) return;
    const onMove = e => setMousePos({ x: e.clientX, y: e.clientY });
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, [hoveredKey]);

  if (sum === 0) {
    return (
      <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 8 }}>
        {label && (
          <div className="font-sans" style={{ fontFamily: "'Playfair Display',serif", fontSize: 11, fontWeight: 700, color: "var(--text2)", flexShrink: 0, width: 28, textAlign: "right" }}>
            {label}
          </div>
        )}
        <div style={{ flex: 1, height: 30, borderRadius: 999, background: "rgba(140,133,116,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="font-sans" style={{ fontSize: 13, fontWeight: 600, color: "rgba(139,105,20,0.38)" }}>No data</span>
        </div>
      </div>
    );
  }

  const norm = {
    resonate: ((resonate || 0) / sum) * 100,
    contradict: ((contradict || 0) / sum) * 100,
    diverge: ((diverge || 0) / sum) * 100,
  };

  const dominantKey = ["resonate", "contradict", "diverge"].reduce((a, b) => norm[a] >= norm[b] ? a : b);

  const dimension = label === "feel" ? "feeling" : label === "think" ? "thinking" : label || "thinking";
  const displayName = name || "them";

  function getTooltip(key, pct) {
    const p = Math.round(pct);
    const pStr = p > 0 ? ` (${p}%)` : "";
    if (key === "resonate") {
      const qualifier = pct >= 60 ? " highly" : pct >= 40 ? "" : " somewhat";
      return `You and ${displayName} resonate${qualifier} in ${dimension}${pStr}`;
    }
    if (key === "contradict") {
      const qualifier = pct >= 50 ? " strongly" : pct >= 30 ? "" : " a little";
      return `You and ${displayName} contradict${qualifier} in ${dimension}${pStr}`;
    }
    if (key === "diverge") {
      const qualifier = pct >= 50 ? " broadly" : pct <= 20 ? " less" : "";
      return `You and ${displayName} diverge${qualifier} in ${dimension}${pStr}`;
    }
    return "";
  }

  const segments = ["resonate", "contradict", "diverge"]
    .filter(k => (norm[k] || 0) > 0)
    .map(k => ({ key: k, gradient: GRADIENTS[k], label: LABELS[k], pct: norm[k] }));

  const n = segments.length;
  const hoveredSeg = segments.find(s => s.key === hoveredKey);

  return (
    <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 8 }}>
      {label && (
        <div className="font-sans" style={{ fontFamily: "'Playfair Display',serif", fontSize: 11, fontWeight: 700, color: "var(--text2)", flexShrink: 0, width: 28, textAlign: "right" }}>
          {label}
        </div>
      )}
      <div style={{ flex: 1, display: "flex", height: 30, gap: n > 1 ? 3 : 0 }}>
        {hoveredSeg && ReactDOM.createPortal(
          <div style={{
            position: "fixed",
            left: mousePos.x + 12 + 260 > window.innerWidth ? mousePos.x - 260 : mousePos.x + 12,
            top: mousePos.y + 16,
            background: "rgba(30,22,10,0.88)",
            color: "rgba(255,248,230,0.95)",
            fontSize: 11,
            fontWeight: 500,
            fontFamily: "'DM Sans',sans-serif",
            padding: "5px 9px",
            borderRadius: 6,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 9999,
            boxShadow: "0 2px 8px rgba(0,0,0,0.28)",
            letterSpacing: "0.01em",
          }}>
            {getTooltip(hoveredSeg.key, hoveredSeg.pct)}
          </div>,
          document.body
        )}
        {segments.map((seg, i) => {
          const isOnly = n === 1;
          const isFirst = i === 0;
          const isLast = i === n - 1;
          const br = isOnly ? 999 : isFirst ? "999px 0 0 999px" : isLast ? "0 999px 999px 0" : 2;
          const roundedPct = Math.round(seg.pct);
          const isDominant = seg.key === dominantKey;
          const inlineText = seg.pct > 22
            ? (isDominant ? `${roundedPct}% ${seg.label}` : `${roundedPct}%`)
            : seg.pct >= 14
            ? `${roundedPct}%`
            : null;
          return (
            <div
              key={seg.key}
              onMouseEnter={() => setHoveredKey(seg.key)}
              onMouseLeave={() => setHoveredKey(null)}
              style={{
                flex: seg.pct,
                background: seg.gradient,
                borderRadius: br,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                minWidth: 0,
                cursor: "default",
              }}
            >
              {inlineText && (
                <span className="font-sans" style={{
                  fontSize: isDominant ? 14 : 13,
                  fontWeight: isDominant ? 700 : 500,
                  color: "rgba(255,255,255,0.92)",
                  whiteSpace: "nowrap",
                  lineHeight: 1,
                  letterSpacing: "0.01em",
                  textShadow: "0 1px 2px rgba(0,0,0,0.22)",
                }}>
                  {inlineText}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
