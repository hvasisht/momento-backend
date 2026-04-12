/* Snippet card â€" looks like a torn page */
function MomentCard({moment, onClick, onDragStart, passageFirst=false, onDelete}) {
  const [dragging, setDragging] = useState(false);
  const [folded, setFolded] = useState(false);
  const dragRef = useRef({started:false, moved:false, startX:0, startY:0});
  const hasMomento = !!moment.interpretation;

  // Reset fold when flip changes
  useEffect(()=>{ setFolded(false); }, [passageFirst]);

  const handleMouseDown = (e) => {
    if(e.target.closest('[data-fold-trigger]')) return;
    e.preventDefault();
    dragRef.current = {started:true, moved:false, startX:e.clientX, startY:e.clientY};
    setDragging(true);
    onDragStart(moment, e.clientX, e.clientY);
    const onMove = (me) => {
      const dx = me.clientX - dragRef.current.startX;
      const dy = me.clientY - dragRef.current.startY;
      if(Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
    };
    const onUp = (me) => {
      setDragging(false);
      if(!dragRef.current.moved) onClick&&onClick(me);
      dragRef.current.started = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div onMouseDown={handleMouseDown}
      style={{
        cursor:"grab",
        position:"relative",
        borderRadius:3,
      }}>
      {onDelete && (
        <button
          onMouseDown={e=>e.stopPropagation()}
          onClick={e=>{e.stopPropagation(); onDelete(moment.id);}}
          style={{position:"absolute",top:1,right:1,zIndex:10,width:20,height:20,borderRadius:"50%",border:"none",background:"rgba(139,105,20,0.08)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(139,105,20,0.45)"}}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(180,50,30,0.12)";e.currentTarget.style.color="rgba(180,50,30,0.75)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(139,105,20,0.08)";e.currentTarget.style.color="rgba(139,105,20,0.45)";}}>
          <svg width="10" height="11" viewBox="0 0 11 12" fill="none">
            <path d="M1 3h9M4 3V2h3v1M2 3l.5 7.5a.5.5 0 00.5.5h5a.5.5 0 00.5-.5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="4.5" y1="5.5" x2="4.5" y2="9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
            <line x1="6.5" y1="5.5" x2="6.5" y2="9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
        </button>
      )}
      {/* Top — interpretation first (or passage if no interpretation) */}
      <div style={{background:(passageFirst||!hasMomento)?"var(--reading-bg)":"var(--card)",borderRadius:hasMomento?"3px 3px 0 0":"3px",padding:"14px 14px 0 26px",position:"relative",
        border:"1px solid var(--border)",
        borderBottom: hasMomento ? "none" : "1px solid var(--border)",
      }}>
        <div style={{position:"absolute",left:16,top:10,bottom:-1,width:3,background:"#8B6914",borderRadius:1}}/>

        {(passageFirst||!hasMomento) && (
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
            <span className="font-serif" style={{fontSize:10,fontStyle:"italic",color:"var(--amber)",fontWeight:500}}>{moment.book}</span>
            <span className="font-sans" style={{fontSize:8,color:"var(--text2)",letterSpacing:"0.04em"}}>{moment.chapter}</span>
          </div>
        )}

        {hasMomento ? (
          passageFirst ? (
            <p style={{fontFamily:"Georgia,'Times New Roman',serif",fontSize:13,lineHeight:1.7,color:"var(--text)",margin:0,textIndent:"1em",textAlign:"justify"}}>
              {moment.passage}
            </p>
          ) : (
            <p style={{fontFamily:"'Kalam',cursive",fontSize:14,lineHeight:1.55,color:"var(--text)",margin:0,fontWeight:400}}>
              {moment.interpretation}
            </p>
          )
        ) : (
          <p style={{fontFamily:"Georgia,'Times New Roman',serif",fontSize:13,lineHeight:1.7,color:"var(--text)",margin:0,textIndent:"1em",textAlign:"justify"}}>
            {moment.passage}
          </p>
        )}

        {hasMomento && (
          <div
            data-fold-trigger="true"
            onMouseDown={e=>e.stopPropagation()}
            onClick={e=>{e.stopPropagation();setFolded(f=>!f);}}
            style={{display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:"3px 0 0"}}>
            <svg style={{transition:"transform 500ms",transform:folded?"rotate(180deg)":"rotate(0deg)"}} width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path d="M1 1.5L6 6.5L11 1.5" stroke="var(--amber)" strokeWidth="1.2" strokeOpacity="0.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>

      {/* Passage peek + fold */}
      {hasMomento && (
        <div style={{borderRadius:"0 0 3px 3px",
          borderLeft:"1px solid var(--border)",
          borderRight:"1px solid var(--border)",
          borderBottom:"1px solid var(--border)",
                  }}>

          {/* Physical fold crease */}
          <div style={{height:1,background:"rgba(255,255,255,0.2)"}}/>
          <div style={{height:1,background:"rgba(0,0,0,0.08)"}}/>

          {/* Peek strip */}
          <div style={{
            height: folded ? "0px" : "20px",
            opacity: folded ? 0 : 1,
            overflow:"hidden",
            transition:"height 400ms cubic-bezier(0.4,0,0.2,1), opacity 200ms",
            padding:"0 14px 0 26px",
            position:"relative",
            background:passageFirst?"var(--card)":"var(--reading-bg)",
          }}>
            <div style={{position:"absolute",left:16,top:0,bottom:0,width:3,background:"var(--amber)"}}/>
            <div style={{
              position:"absolute",bottom:0,left:0,right:0,height:8,
              background:"linear-gradient(to bottom,transparent,rgba(0,0,0,0.06))",
              pointerEvents:"none",zIndex:2,
            }}/>
            <p style={{fontFamily: passageFirst ? "'Kalam',cursive" : "Georgia,'Times New Roman',serif",fontSize:12,lineHeight:1.7,color:"var(--text)",margin:0,textIndent: passageFirst ? "0" : "1em",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {passageFirst ? moment.interpretation : moment.passage}
            </p>
          </div>

          {/* Fold content */}
          <div style={{
            perspective:"900px",
            perspectiveOrigin:"50% 0%",
            overflow:"hidden",
            maxHeight: folded ? "500px" : "0px",
            transition: folded ? "max-height 0ms" : "max-height 0ms 520ms",
          }}>
            <div style={{
              transformOrigin:"top center",
              transform: folded ? "rotateX(0deg)" : "rotateX(-90deg)",
              transition:"transform 520ms cubic-bezier(0.4,0,0.2,1)",
              background:passageFirst?"var(--card)":"var(--reading-bg)",
              position:"relative",
              padding:"0 14px 10px 26px",
            }}>
              <div style={{position:"absolute",left:16,top:0,bottom:0,width:3,background:"var(--amber)"}}/>
              {passageFirst ? (
                <p style={{fontFamily:"'Kalam',cursive",fontSize:14,lineHeight:1.6,color:"var(--text)",margin:0,fontWeight:400,opacity:folded?1:0,transition:"opacity 300ms 200ms"}}>
                  {moment.interpretation}
                </p>
              ) : (
                <>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4,paddingTop:8,opacity:folded?1:0,transition:"opacity 300ms 200ms"}}>
                    <span className="font-serif" style={{fontSize:10,fontStyle:"italic",color:"var(--amber)",fontWeight:500}}>{moment.book}</span>
                    <span className="font-sans" style={{fontSize:8,color:"var(--text2)",letterSpacing:"0.04em"}}>{moment.chapter}</span>
                  </div>
                  <p style={{fontFamily:"Georgia,'Times New Roman',serif",fontSize:13,lineHeight:1.7,color:"var(--text)",margin:0,textIndent:"1em",textAlign:"justify",opacity:folded?1:0,transition:"opacity 300ms 200ms"}}>
                    {moment.passage}
                  </p>
                </>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function ExpandedMoment({moment, onClose, passageFirst=false, onDragStart, onUpdateMoment, onDelete}) {
  const [momentoText, setMomentoText] = useState(moment.interpretation||"");
  const [editing, setEditing] = useState(false);
  const [shortInterpToast, setShortInterpToast] = useState(false);
  const shortInterpTimerRef = useRef(null);
  const hasMomento = !!momentoText;
  const dragRef = useRef({started:false, moved:false, startX:0, startY:0});

  const handleMouseDown = (e) => {
    if(editing) return;
    if(e.target.closest("button,textarea")) return;
    e.preventDefault();
    dragRef.current = {started:true, moved:false, startX:e.clientX, startY:e.clientY};
    onDragStart&&onDragStart(moment, e.clientX, e.clientY);
    const onMove = (me) => {
      const dx = me.clientX - dragRef.current.startX;
      const dy = me.clientY - dragRef.current.startY;
      if(Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
    };
    const onUp = () => {
      dragRef.current.started = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const interpretationBlock = (
    <div style={{padding:"14px 32px 10px 26px",position:"relative"}}>
      <div style={{position:"absolute",left:16,top:10,bottom:0,width:3,background:"#8B6914",borderRadius:1}}/>
      {editing ? (
        <div>
          <textarea autoFocus value={momentoText} onChange={e=>setMomentoText(e.target.value)}
            placeholder="What does this mean to you..."
            style={{width:"100%",minHeight:60,border:"none",outline:"none",
              fontSize:14,lineHeight:1.6,color:"var(--text)",resize:"none",
              background:"transparent",fontFamily:"'Kalam',cursive",fontWeight:400}}/>
          {(function(){
            var wc = momentoText.trim()==='' ? 0 : momentoText.trim().split(/\s+/).filter(Boolean).length;
            return momentoText.trim().length > 0 && wc < 10 ? (
              <p className="font-sans" style={{fontSize:11,color:"rgba(139,105,20,0.65)",fontStyle:"italic",margin:"2px 0 4px",letterSpacing:"0.01em"}}>
                a little more letters might find you a close reader
              </p>
            ) : null;
          })()}
          <button onClick={()=>{
            var wc = momentoText.trim()==='' ? 0 : momentoText.trim().split(/\s+/).filter(Boolean).length;
            setEditing(false);
            onUpdateMoment&&onUpdateMoment(moment.id, momentoText);
            if(wc > 0 && wc < 10){ if(shortInterpTimerRef.current) clearTimeout(shortInterpTimerRef.current); setShortInterpToast(true); shortInterpTimerRef.current = setTimeout(()=>setShortInterpToast(false),5000); }
          }} className="font-sans"
            style={{padding:"4px 14px",borderRadius:10,border:"none",
              background:"#8B6914",fontSize:10,color:"var(--bg)",cursor:"pointer",fontWeight:600}}>
            Save
          </button>
        </div>
      ) : (
        <div onClick={()=>setEditing(true)} style={{cursor:"text"}}>
          {hasMomento ? (
            <p style={{fontFamily:"'Kalam',cursive",fontSize:14,lineHeight:1.6,color:"var(--text)",margin:0,fontWeight:400}}>
              {momentoText}
            </p>
          ) : (
            <p className="font-sans" style={{fontSize:10,color:"var(--text3)",fontStyle:"italic",margin:0}}>
          Tap to write your momento…
            </p>
          )}
        </div>
      )}
    </div>
  );

  const passageBlock = (
    <div style={{padding:"10px 12px 14px 26px",position:"relative",background:"var(--reading-bg)"}}>
      <div style={{position:"absolute",left:16,top:0,bottom:0,width:3,background:"#8B6914"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
        <span className="font-serif" style={{fontSize:10,fontStyle:"italic",color:"var(--amber)",fontWeight:500}}>{moment.book}</span>
        <span className="font-sans" style={{fontSize:8,color:"var(--text2)",letterSpacing:"0.04em"}}>{moment.chapter}</span>
      </div>
      <p style={{fontFamily:"Georgia,'Times New Roman',serif",fontSize:17,lineHeight:1.7,color:"var(--text)",margin:0,textIndent:"1em",textAlign:"justify"}}>
        {moment.passage}
      </p>
    </div>
  );

  return (
    <div onMouseDown={handleMouseDown} style={{
      background:"var(--card)",
      border:"1px solid var(--border)",
      borderRadius:3,
      position:"relative",
      cursor: editing ? "text" : "grab",
      width:"calc(100% - 32px)",
      alignSelf:"center",
    }}>
      <button onClick={onClose} style={{
        position:"absolute",top:10,right:10,zIndex:10,
        width:22,height:22,borderRadius:"50%",
        background:"rgba(139,105,20,0.1)",border:"none",cursor:"pointer",
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:12,color:"var(--amber)",
      }}
        onMouseEnter={e=>e.currentTarget.style.background="rgba(139,105,20,0.18)"}
        onMouseLeave={e=>e.currentTarget.style.background="rgba(139,105,20,0.1)"}
          >×</button>
      {onDelete && (
        <button onClick={()=>{onDelete(moment.id); onClose();}} style={{
          position:"absolute",top:10,right:38,zIndex:10,
          width:22,height:22,borderRadius:"50%",
          background:"rgba(139,105,20,0.1)",border:"none",cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",
          color:"rgba(139,105,20,0.55)",
        }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(180,50,30,0.12)";e.currentTarget.style.color="rgba(180,50,30,0.8)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(139,105,20,0.1)";e.currentTarget.style.color="rgba(139,105,20,0.55)";}}>
          <svg width="11" height="12" viewBox="0 0 11 12" fill="none">
            <path d="M1 3h9M4 3V2h3v1M2 3l.5 7.5a.5.5 0 00.5.5h5a.5.5 0 00.5-.5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="4.5" y1="5.5" x2="4.5" y2="9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
            <line x1="6.5" y1="5.5" x2="6.5" y2="9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
        </button>
      )}

      {passageFirst ? passageBlock : interpretationBlock}
      <div style={{height:1,background:"rgba(139,105,20,0.1)"}}/>
      {passageFirst ? interpretationBlock : passageBlock}
      {ReactDOM.createPortal(
        <div style={{
          position:"fixed", bottom:28, left:"50%",
          transform:`translateX(-50%) translateY(${shortInterpToast ? 0 : 20}px)`,
          opacity: shortInterpToast ? 1 : 0,
          pointerEvents: shortInterpToast ? "auto" : "none",
          transition:"opacity 360ms ease, transform 360ms ease",
          zIndex:9999,
          background:"linear-gradient(135deg, #1C1209 0%, #2C1A08 100%)",
          border:"1px solid rgba(196,160,85,0.35)",
          borderRadius:16, padding:"12px 20px",
          boxShadow:"0 8px 32px rgba(0,0,0,0.32)",
          maxWidth:"min(420px, calc(100vw - 48px))", textAlign:"center",
        }}>
          <p className="font-sans" style={{margin:0,fontSize:13,lineHeight:1.55,color:"rgba(248,242,228,0.92)"}}>
            momento won't be used for finding close reader due to length
          </p>
        </div>,
        document.body
      )}
    </div>
  );
}

