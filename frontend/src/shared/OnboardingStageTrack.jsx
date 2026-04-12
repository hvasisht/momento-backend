function OnboardingStageTrack({activeIndex=-1, top="18px", dark=false, zIndex=705}) {
  const labels = ["READ", "MOMENTS", "WORTH", "SHARING"];
  const borderColor = dark ? "rgba(255,244,229,0.18)" : "rgba(139,105,20,0.18)";
  const activeBg = dark ? "rgba(255,244,229,0.14)" : "rgba(139,105,20,0.1)";
  const idleBg = dark ? "rgba(255,244,229,0.04)" : "rgba(139,105,20,0.03)";
  const activeText = dark ? "#FFF4E5" : "#8B6914";
  const idleText = dark ? "rgba(255,244,229,0.5)" : "rgba(139,105,20,0.5)";

  return (
    <div style={{
      position:"fixed",
      top,
      left:"50%",
      transform:"translateX(-50%)",
      display:"inline-flex",
      alignItems:"center",
      gap:8,
      padding:"6px",
      borderRadius:999,
      border:`1px solid ${borderColor}`,
      background:dark ? "rgba(20,12,7,0.2)" : "rgba(255,250,241,0.38)",
      backdropFilter:"blur(8px)",
      WebkitBackdropFilter:"blur(8px)",
      zIndex,
      pointerEvents:"none",
      transition:"top 420ms cubic-bezier(0.22, 1, 0.36, 1), background 180ms ease, border-color 180ms ease",
    }}>
      {labels.map((label, index)=>(
        <div key={label} style={{
          minWidth:84,
          height:30,
          padding:"0 14px",
          borderRadius:999,
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          background:index===activeIndex ? activeBg : idleBg,
          border:`1px solid ${index===activeIndex ? borderColor : "transparent"}`,
          transition:"background 180ms ease, border-color 180ms ease, transform 180ms ease",
          transform:index===activeIndex ? "translateY(-1px)" : "translateY(0)",
        }}>
          <span className="font-sans" style={{
            fontSize:9,
            letterSpacing:"0.16em",
            textTransform:"uppercase",
            fontWeight:700,
            color:index===activeIndex ? activeText : idleText,
          }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
