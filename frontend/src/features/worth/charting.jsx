function ColorFilledText({text, r, c, d, fontSize=64, onClick, active, flip=false}) {
  const uid = useRef(Math.random().toString(36).slice(2));
  const id = `clip-${uid.current}-${flip?"f":"n"}`;
  const total=r+c+d, width=fontSize*0.75, height=fontSize*1.2;
  const rW=(r/total)*width, cW=(c/total)*width, dW=(d/total)*width;
  const rects = flip ? (
    <><rect x={0} y={0} width={dW} height={height} fill="#6B6B63"/><rect x={dW} y={0} width={cW} height={height} fill="#C0392B"/><rect x={dW+cW} y={0} width={rW} height={height} fill="#2D8A4E"/></>
  ) : (
    <><rect x={0} y={0} width={rW} height={height} fill="#2D8A4E"/><rect x={rW} y={0} width={cW} height={height} fill="#C0392B"/><rect x={rW+cW} y={0} width={dW} height={height} fill="rgba(139,105,20,0.55)"/></>
  );
  return (
    <div onClick={onClick} style={{cursor:"pointer",display:"inline-flex",alignItems:"center",transition:"transform 0.15s",transform:active?"scale(1.06)":"scale(1)"}}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs><clipPath id={id}><text x={width/2} y={height*0.82} textAnchor="middle" fontSize={fontSize} fontFamily="Georgia,serif" fontWeight="700">{text}</text></clipPath></defs>
        <g clipPath={`url(#${id})`}>{rects}</g>
      </svg>
    </div>
  );
}

function TFBars({rt, ct, dt, rf, cf, df}) {
  return (
    <div style={{display:"flex",gap:12,width:"100%",marginTop:12,padding:"0 4px"}}>
      <div style={{flex:1}}><MatchBar label="Think" resonate={rt} contradict={ct} diverge={dt} /></div>
      <div style={{width:1,background:"rgba(139,105,20,0.1)",flexShrink:0}}/>
      <div style={{flex:1}}><MatchBar label="Feel" resonate={rf} contradict={cf} diverge={df} /></div>
    </div>
  );
}

function CompatibilityTeaser({profile, style={}}) {
  const text = `You read for the question, ${profile.name.split(" ")[0]} reads for the answer.`;
  return <span style={style}>{text}</span>;
}

