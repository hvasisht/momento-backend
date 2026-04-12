/* â”€â”€ PAPERCLIP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function Paperclip() {
  return (
    <svg style={{position:"absolute",top:9,left:-3,zIndex:20,overflow:"visible",pointerEvents:"none"}} width="148" height="26" viewBox="0 0 148 26" fill="none">
      <path d="M 2 16 C 2 22 5 24 11 24 L 124 24 L 138 13 L 124 2 L 11 2 C 5 2 2 4 2 10 Z"
        stroke="var(--clip)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M 13 0.8 L 122 0.8 L 136 11" stroke="var(--clip-hi)" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M 13 25 L 122 25 L 136 15" stroke="var(--clip-sh)" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

/* â”€â”€ BOOK STACK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function BookStack({book, moments, onSelect, passageFirst}) {
  const count = moments.length;
  const front = moments[0];
  const offsets = [
    {left:6, top:0,  rotate:-3,  zIndex:1, opacity:0.65},
    {left:3, top:4,  rotate:-1,  zIndex:2, opacity:0.82},
    {left:0, top:8,  rotate:0.5, zIndex:3, opacity:1},
  ];
  const visible = offsets.slice(Math.max(0, 3 - count));
  return (
    <div style={{position:"relative",cursor:"pointer",height:140}} onClick={()=>onSelect(book)}>
      <Paperclip/>
      {visible.map((off, i) => {
        const isFront = i === visible.length - 1;
        return (
          <div key={i} style={{
            position:"absolute",left:off.left,top:off.top,width:155,
            transform:`rotate(${off.rotate}deg)`,zIndex:off.zIndex,
            borderRadius:3,border:"1px solid var(--border)",
            background:"var(--card)",padding:"26px 9px 9px 20px",opacity:off.opacity,
            overflow:"hidden",
          }}>
            <div style={{position:"absolute",left:8,top:0,bottom:6,width:3,background:"var(--amber)",borderRadius:1}}/>
            <div style={{
              position:"absolute",top:11,left:20,right:6,
              fontFamily:"'Playfair Display',Georgia,serif",fontSize:8,fontStyle:"italic",
              color:"var(--amber)",fontWeight:700,lineHeight:1,zIndex:25,
              whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",
            }}>{front.book}</div>
            {isFront && (
              <>
                {passageFirst ? (
                  <div style={{background:"var(--reading-bg)",borderRadius:3,padding:"5px 7px",borderLeft:"2px solid var(--border)",marginBottom:4,maxHeight:68,overflow:"hidden",position:"relative"}}>
                    <p className="font-reading" style={{fontSize:9.5,lineHeight:1.65,color:"var(--text)",margin:0,fontStyle:"italic"}}>"{front.passage}"</p>
                    <div style={{position:"absolute",bottom:0,left:0,right:0,height:18,background:"linear-gradient(transparent,var(--reading-bg))",pointerEvents:"none"}}/>
                  </div>
                ) : front.interpretation ? (
                  <div style={{maxHeight:68,overflow:"hidden",position:"relative",marginBottom:4}}>
                    <p style={{fontFamily:"'Kalam',cursive",fontSize:11,lineHeight:1.45,color:"var(--text)",margin:0}}>{front.interpretation}</p>
                    <div style={{position:"absolute",bottom:0,left:0,right:0,height:18,background:"linear-gradient(transparent,var(--card))",pointerEvents:"none"}}/>
                  </div>
                ) : (
                  <div style={{background:"var(--reading-bg)",borderRadius:3,padding:"5px 7px",borderLeft:"2px solid var(--border)",marginBottom:4,maxHeight:68,overflow:"hidden",position:"relative"}}>
                    <p className="font-reading" style={{fontSize:9.5,lineHeight:1.65,color:"var(--text)",margin:0,fontStyle:"italic"}}>"{front.passage}"</p>
                    <div style={{position:"absolute",bottom:0,left:0,right:0,height:18,background:"linear-gradient(transparent,var(--reading-bg))",pointerEvents:"none"}}/>
                  </div>
                )}
                <div style={{fontSize:7.5,color:"var(--text3)",textAlign:"right",fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.04em"}}>
                  {count} moment{count!==1?"s":""}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* â”€â”€ BOOK BROWSE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function BookBrowse({book, moments, onBack, onBackToAll, passageFirst, onDragStart, expandedMomentId:externalExpandedId, onClearExpanded, onUpdateMoment, onDelete, snippedMomentIds}) {
  const [localExpandedId, setLocalExpandedId] = useState(null);
  const expandedId = externalExpandedId || localExpandedId;
  const setExpandedId = (id) => { setLocalExpandedId(id); if(!id) onClearExpanded&&onClearExpanded(); };
  const expanded = moments.find(m=>m.id===expandedId);
  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:"var(--bg)",paddingTop:48,boxSizing:"border-box"}}>
      <div style={{flexShrink:0,height:48,padding:"0 16px",borderBottom:"1px solid var(--border2)",display:"flex",alignItems:"center",gap:10}}>
        <button onClick={moments.length===0&&onBackToAll ? onBackToAll : onBack} style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px 4px 0",color:"var(--amber)",display:"flex",alignItems:"center",gap:6}}>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <path d="M6 1L1 6L6 11" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 6H15" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {moments.length===0&&onBackToAll && <span className="font-sans" style={{fontSize:10,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase"}}>All moments</span>}
        </button>
        <span className="font-serif" style={{fontSize:13,fontStyle:"italic",color:"var(--text)",fontWeight:600,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{book}</span>
        {moments.length>0 && <span className="font-sans" style={{fontSize:10,color:"var(--text3)"}}>{moments.length} moment{moments.length!==1?"s":""}</span>}
      </div>
      <div className="panel-scroll" style={{flex:1,overflowY:"auto",padding:expandedId&&expanded?"16px 0":"16px",display:"flex",flexDirection:"column",alignItems:expandedId&&expanded?"stretch":"center"}}>
        {expandedId && expanded ? (
          <ExpandedMoment key={expandedId} moment={expanded} onClose={()=>setExpandedId(null)} passageFirst={passageFirst} onDragStart={onDragStart} onUpdateMoment={onUpdateMoment} onDelete={snippedMomentIds&&snippedMomentIds.has(expanded.id)?onDelete:undefined}/>
        ) : moments.length === 0 ? (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:"48px 24px",textAlign:"center"}}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{opacity:0.25,marginBottom:14}}>
              <rect x="4" y="4" width="24" height="26" rx="2" stroke="var(--amber)" strokeWidth="1.5"/>
              <line x1="9" y1="11" x2="23" y2="11" stroke="var(--amber)" strokeWidth="1.3" strokeLinecap="round"/>
              <line x1="9" y1="16" x2="23" y2="16" stroke="var(--amber)" strokeWidth="1.3" strokeLinecap="round"/>
              <line x1="9" y1="21" x2="17" y2="21" stroke="var(--amber)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <p className="font-serif" style={{fontSize:13,fontStyle:"italic",color:"var(--text2)",margin:0,lineHeight:1.6}}>
              You haven't captured any moments in this book yet!
            </p>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:14,width:"100%"}}>
            {moments.map((m,i)=>(
              <div key={m.id} style={{transform:`rotate(${i%2===0?"-0.3deg":"0.3deg"})`,overflow:"hidden"}}>
                <MomentCard moment={m} onClick={()=>setExpandedId(m.id)} onDragStart={onDragStart} passageFirst={passageFirst} onDelete={snippedMomentIds&&snippedMomentIds.has(m.id)?onDelete:undefined}/>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

