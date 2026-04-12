/* â”€â”€ BOTTOM TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function BottomTab({section, isExpanded, isCubeFace, isFirst, isLast, onClick, onDragExpand, pulse=false, savedBlink=false, worthNotif=false, notifUnderline=0, headerBg="var(--bg2)", isReadMode=false, darkMode=false}) {
  const [isDragging,setIsDragging]=useState(false);
  const [dragY,setDragY]=useState(0);
  const dragRef=useRef({startY:0,hasMoved:false});
  const handleMouseDown=(e)=>{e.preventDefault();e.stopPropagation();setIsDragging(true);dragRef.current={startY:e.clientY,hasMoved:false};setDragY(0);};
  useEffect(()=>{
    if(!isDragging) return;
    const onMove=e=>{const dy=e.clientY-dragRef.current.startY;const c=Math.max(0,Math.min(dy,80));setDragY(c);if(dy>15)dragRef.current.hasMoved=true;};
    const onUp=()=>{setIsDragging(false);if(dragY>40&&!isExpanded)onDragExpand();else if(!dragRef.current.hasMoved)onClick();setDragY(0);};
    window.addEventListener("mousemove",onMove);window.addEventListener("mouseup",onUp);
    return()=>{window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);};
  },[isDragging,dragY,onClick,onDragExpand,isExpanded]);
  const br=isFirst?"16px 0 0 16px":isLast?"0 16px 16px 0":0;
  return (
    <div onMouseDown={handleMouseDown} style={{flex:1,position:"relative",background:"transparent",border:"none",borderRadius:br,cursor:isDragging?"grabbing":"grab",display:"flex",alignItems:"center",justifyContent:"center",transition:isDragging?"none":"background 200ms",transform:isDragging&&dragY>0?`translateY(${Math.min(dragY*0.3,12)}px)`:"none",zIndex:isDragging?10:1}}>
      <span className="font-sans" style={{fontSize:isExpanded?14:12,fontWeight:isExpanded?700:600,letterSpacing:"0.1em",color:isExpanded?(isReadMode||darkMode?"rgba(255,230,140,1)":"rgba(80,50,8,0.92)"):(isReadMode||darkMode?"rgba(255,247,232,0.85)":"rgba(80,50,8,0.52)"),textTransform:"uppercase",transition:"font-size 200ms, color 200ms",userSelect:"none",pointerEvents:"none",animation:pulse?"worth-pulse 1.5s ease-in-out infinite":""}}>
        {section.label}
      </span>
      <span style={{
        position:"absolute",bottom:2,left:"8%",right:"8%",
        height:3,borderRadius:2,
        background:isReadMode||darkMode?"rgba(245,205,95,1)":"rgba(80,50,8,0.65)",
        transform:isExpanded?"scaleX(1)":"scaleX(0)",
        transformOrigin:"center",
        transition:"transform 260ms cubic-bezier(0.4,0,0.2,1), opacity 180ms ease",
        opacity:isExpanded?1:0,
        pointerEvents:"none",
      }}/>
      {savedBlink && (
      <span style={{position:"absolute",top:2,right:6,fontSize:10,color:"var(--amber)",fontWeight:700,animation:"blink-in 2s ease forwards",pointerEvents:"none",lineHeight:1}}>✓</span>
      )}
      {worthNotif && !isExpanded && (
        <span style={{position:"absolute",top:2,right:6,width:14,height:14,borderRadius:"50%",background:"#8B6914",display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none",animation:"blink-in 2s ease forwards"}}>
          <span style={{fontSize:8,fontWeight:700,color:"var(--bg)",lineHeight:1}}>!</span>
        </span>
      )}
      {notifUnderline > 0 && !isExpanded && (
        <span style={{
          position:"absolute",bottom:4,left:"50%",transform:"translateX(-50%)",
          height:2,borderRadius:1,
          background:"rgba(196,160,85,0.85)",
          width:`${Math.min(notifUnderline*22,80)}%`,
          transition:"width 400ms cubic-bezier(0.4,0,0.2,1)",
          pointerEvents:"none",
        }}/>
      )}
      {isDragging&&dragY>20&&!isExpanded&&(
        <div style={{position:"absolute",bottom:-22,left:"50%",transform:"translateX(-50%)",width:16,height:16,borderRadius:"50%",background:section.accent,display:"flex",alignItems:"center",justifyContent:"center",opacity:Math.min(1,(dragY-20)/30)}}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2V8M5 8L2 5M5 8L8 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      )}
    </div>
  );
}

const PANEL_COMPONENTS = {read:ReadPanel, moments:MomentsPanel, worth:WorthPanel, sharing:SharingPanel};

