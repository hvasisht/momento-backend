/* Cube hint tooltip */

function CubeHint({showHint}) {
  if(!showHint) return null;

  return (
    <div style={{position:"fixed",bottom:58,right:28,zIndex:9999,pointerEvents:"none",animation:"bookmarkIn 300ms cubic-bezier(0.34,1.56,0.64,1) both"}}>
      <div style={{background:"var(--bg2)",border:"1px solid rgba(139,105,20,0.2)",borderRight:"none",borderRadius:"8px 0 8px 8px",boxShadow:"-3px 3px 16px rgba(139,105,20,0.18)",padding:"12px 16px 14px 16px",width:230,position:"relative"}}>
        <div style={{position:"absolute",right:0,top:0,bottom:0,width:4,background:"#8B6914"}}/>
        <div style={{position:"absolute",bottom:-7,right:0,width:0,height:0,borderLeft:"7px solid transparent",borderRight:"7px solid transparent",borderTop:"7px solid rgba(139,105,20,0.22)"}}/>
        <div style={{position:"absolute",bottom:-6,right:1,width:0,height:0,borderLeft:"6px solid transparent",borderRight:"6px solid transparent",borderTop:"6px solid #FDFAF2"}}/>
        <p className="font-serif" style={{fontSize:11,fontStyle:"italic",fontWeight:600,color:"var(--amber)",margin:"0 0 7px",lineHeight:1.3}}>How to turn</p>
        <ul className="font-sans" style={{fontSize:10,lineHeight:1.7,color:"var(--text)",margin:0,paddingLeft:14,display:"flex",flexDirection:"column",gap:2}}>
          <li>Click the tabs at the top to navigate.</li>
          <li>Click and drag the section tabs below to open multiple tabs.</li>
        </ul>
      </div>
    </div>
  );
}
