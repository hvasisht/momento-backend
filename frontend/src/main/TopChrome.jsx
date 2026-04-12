/* Main top chrome */

function TopChrome({
  expandedSections,
  cubeIndex,
  expandedArray,
  setShowHint,
  darkMode,
  dm,
  TRACK_W,
  SECTIONS,
  momentsSavedBlink,
  worthNotif,
  sharingNotifCount=0,
  rotateTo,
  handleClose,
  toggleSection,
  expandSection,
  searchInputRef,
  setShowProfile,
  showProfile,
  isWorthSolo,
  worthMessage,
  isMomentsSolo,
  momentsWithMomento,
  momentsBookCount,
  momentsLayoutMode,
  setMomentsLayoutMode,
  momentsPassageFirst,
  setMomentsPassageFirst,
  momentsShowLayoutMenu,
  setMomentsShowLayoutMenu,
  isSharingSolo,
  onSharingOpenThread,
  readSearchQuery,
  setReadSearchQuery,
  bookOpen=false,
  momentsBrowsingBook=false,
}) {
  const isRead = expandedSections.size===1 && cubeIndex===0;
  const isReadShelf = isRead && !bookOpen; /* on shelf, not inside a book */
  const faceSize = 16;
  const letters = ["R","M","W","S"];
  const folded = expandedSections.size===1;
  const n = expandedArray.length;
  const [searchFocused, setSearchFocused] = useState(false);
  const [showQuoteInput, setShowQuoteInput] = useState(false);
  const [quoteThought, setQuoteThought] = useState("");
  const [quoteSent, setQuoteSent] = useState(false);

  return (
    <React.Fragment>
    <header style={{height:48,display:"flex",alignItems:"center",padding:"0 16px",gap:12,background:isRead ? "transparent" : darkMode ? "rgba(24,20,16,0.82)" : "rgba(250,247,239,0.72)",backdropFilter:isRead ? "none" : "blur(12px)",WebkitBackdropFilter:isRead ? "none" : "blur(12px)",borderBottom:isRead ? "none" : `1px solid ${darkMode?"rgba(196,160,85,0.1)":"rgba(139,105,20,0.12)"}`,boxShadow:"none",position:"absolute",top:0,left:0,right:0,zIndex:10,transition:"background 350ms ease, border-color 350ms ease"}}>

      <button onClick={()=>setShowProfile(v=>!v)} style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",zIndex:3,display:"flex",alignItems:"center",background:"none",border:"none",padding:0,cursor:"pointer",borderRadius:6}}>
        <img src="./logo-clean.png" alt="momento" style={{height:26,width:"auto",display:"block",filter:isReadShelf?"none":darkMode?"brightness(10) opacity(0.65)":"brightness(0) opacity(0.75)",transition:"filter 350ms ease, opacity 200ms ease"}}/>
      </button>

      <div style={{position:"absolute",left:"50%",transform:"translateX(-50%)",display:"flex",alignItems:"center",zIndex:2}}>
        <div style={{position:"relative",width:TRACK_W,height:32,borderRadius:16,background:"transparent",display:"flex"}}>
          {SECTIONS.map((s,i)=>{
            const isExpanded = expandedSections.has(i);
            const isCubeFace = cubeIndex===i&&expandedSections.size===1;
            return (
              <BottomTab
                key={s.id}
                section={s}
                isExpanded={isExpanded}
                isCubeFace={isCubeFace}
                isFirst={i===0}
                isLast={i===3}
                pulse={false}
                headerBg={darkMode?"#3A2810":"var(--bg2)"}
                isReadMode={isReadShelf}
                darkMode={darkMode}
                savedBlink={s.id==="moments"&&momentsSavedBlink&&!isExpanded}
                worthNotif={s.id==="worth"&&worthNotif&&!isExpanded}
                notifUnderline={s.id==="sharing"&&!isExpanded ? sharingNotifCount : 0}
                onClick={()=>{
                  if(expandedSections.size===1&&!isExpanded) rotateTo(i);
                  else if(isExpanded&&expandedSections.size>1) handleClose(i);
                  else toggleSection(i);
                }}
                onDragExpand={()=>expandSection(i)}
              />
            );
          })}
        </div>
      </div>

      {isReadShelf && (
        <div style={{position:"absolute",right:`calc(50% + ${TRACK_W/2}px)`,top:"50%",transform:"translateY(-50%)",width:155,height:28,flexShrink:0,zIndex:1}}>
          <svg width="155" height="28" viewBox="0 0 155 28" style={{position:"absolute",inset:0}} fill="none">
            <path d="M14 0 L155 0 A20 20 0 0 0 155 28 L14 28 A14 14 0 0 1 0 14 A14 14 0 0 1 14 0 Z" fill="rgba(139,105,20,0.06)" stroke={searchFocused?"rgba(255,230,140,0.9)":"rgba(139,105,20,0.6)"} strokeWidth="1.5"/>
          </svg>
          <div style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",gap:7,padding:"0 0 0 11px",height:"100%"}}>
            <svg width="11" height="11" viewBox="0 0 18 18" fill="none" style={{flexShrink:0,transition:"stroke 180ms ease"}}>
              <circle cx="7.5" cy="7.5" r="4.5" stroke={searchFocused?"rgba(255,230,140,0.9)":"rgba(139,105,20,0.85)"} strokeWidth="1.7"/>
              <path d="M11.5 11.5L15.5 15.5" stroke={searchFocused?"rgba(255,230,140,0.9)":"rgba(139,105,20,0.85)"} strokeWidth="1.9" strokeLinecap="round"/>
            </svg>
            <input ref={searchInputRef} value={readSearchQuery||""} onChange={e=>setReadSearchQuery&&setReadSearchQuery(e.target.value)} onFocus={()=>setSearchFocused(true)} onBlur={()=>setSearchFocused(false)} className="search-input" style={{border:"none",outline:"none",background:"transparent",fontSize:12,fontWeight:700,fontStyle:"italic",color:searchFocused?"rgba(255,230,140,0.95)":"rgba(139,105,20,0.92)",fontFamily:"'Playfair Display',Georgia,serif",padding:"0",width:116,flexShrink:0,transition:"color 180ms ease"}} placeholder="What do you want to"/>
          </div>
        </div>
      )}



      {isWorthSolo && worthMessage && (
        <div style={{position:"absolute",left:`calc(50% + ${TRACK_W/2}px + 10px)`,right:16,top:"50%",transform:"translateY(-50%)",zIndex:3,display:"flex",alignItems:"center",justifyContent:"flex-end",pointerEvents:"none"}}>
          <p className="font-serif" style={{fontSize:10.5,fontStyle:"italic",fontWeight:700,color:"var(--amber)",margin:0,lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",textAlign:"right"}}>
            {worthMessage}
          </p>
        </div>
      )}

      <div style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",display:"flex",alignItems:"center",gap:8,zIndex:3}}>
        {isSharingSolo && (
          <CloseCircleIcon onOpenThread={onSharingOpenThread}/>
        )}
        {isReadShelf && (
          <div style={{position:"relative"}}>
            {showQuoteInput && <div onClick={()=>setShowQuoteInput(false)} style={{position:"fixed",inset:0,zIndex:98}}/>}
            <button onClick={()=>setShowQuoteInput(v=>!v)} style={{display:"flex",alignItems:"center",gap:7,background:"none",border:"none",padding:0,cursor:"pointer"}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(255,235,155,0.9)" style={{flexShrink:0}}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <p className="font-serif" style={{fontSize:11.5,fontStyle:"italic",margin:0,lineHeight:1.2,whiteSpace:"nowrap",letterSpacing:"0.01em",userSelect:"none"}}>
                <span style={{color:"rgba(255,235,155,0.96)"}}>&#8220;A reader lives a thousand lives before he dies.&#8221;</span>
              </p>
            </button>
            {showQuoteInput && (
              <div style={{position:"absolute",top:"calc(100% + 10px)",right:0,zIndex:99,width:300,background:darkMode?"rgba(36,28,14,0.98)":"rgba(212,175,85,1)",border:`1px solid ${darkMode?"rgba(196,160,85,0.25)":"rgba(196,160,55,0.6)"}`,borderRadius:14,boxShadow:"0 8px 28px rgba(28,20,4,0.22)",padding:"16px 16px 14px",display:"flex",flexDirection:"column",gap:10}}>
                <button onClick={()=>{setShowQuoteInput(false);setQuoteSent(false);setQuoteThought("");}} style={{position:"absolute",top:10,right:10,width:20,height:20,borderRadius:"50%",border:"1px solid rgba(196,160,85,0.4)",background:darkMode?"rgba(196,160,85,0.12)":"rgba(255,248,220,0.75)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"var(--amber)",lineHeight:1,padding:0}}>×</button>
                {!quoteSent && <p className="font-sans" style={{fontSize:8.5,letterSpacing:"0.08em",color:"var(--amber)",margin:0,fontWeight:700}}>says George R.R. Martin</p>}
                {quoteSent ? (
                  <p className="font-serif" style={{fontSize:13,fontStyle:"italic",color:"var(--amber)",margin:"6px 0 4px",lineHeight:1.5,textAlign:"center"}}>We will soon find its worth.</p>
                ) : (
                  <>
                    <textarea
                      value={quoteThought}
                      onChange={e=>setQuoteThought(e.target.value)}
                      placeholder="What do you say? Let's see if someone thinks the same as you"
                      rows={3}
                      style={{resize:"none",border:"1px solid rgba(196,160,85,0.35)",borderRadius:8,padding:"8px 10px",fontFamily:"'Lora',serif",fontSize:11,fontStyle:"italic",color:"var(--text)",background:darkMode?"var(--bg2)":"rgba(255,252,240,0.85)",outline:"none",lineHeight:1.6}}
                    />
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <p className="font-serif" style={{fontSize:12,fontStyle:"italic",color:"var(--amber)",margin:0,letterSpacing:"0.04em",fontWeight:700}}><svg width="12" height="12" viewBox="0 0 24 24" fill="var(--amber)" style={{marginRight:5,flexShrink:0}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>Side-Quest</p>
                      <button
                        onClick={()=>quoteThought.trim().length>=6&&setQuoteSent(true)}
                        style={{padding:"6px 18px",borderRadius:999,border:"1px solid rgba(196,160,85,0.6)",background:quoteThought.trim().length>=6?"rgba(196,160,85,0.55)":"rgba(196,160,85,0.15)",fontSize:10,fontWeight:700,color:quoteThought.trim().length>=6?(darkMode?"var(--amber)":"rgba(100,70,10,1)"):"rgba(139,105,20,0.4)",cursor:quoteThought.trim().length>=6?"pointer":"default",fontFamily:"'Playfair Display',serif",fontStyle:"italic",letterSpacing:"0.03em",transition:"all 200ms"}}
                      >Find</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        {isMomentsSolo && !momentsBrowsingBook && (
          <>
            <p className="font-serif" style={{fontSize:11,fontStyle:"italic",color:"var(--text2)",margin:0,lineHeight:1,whiteSpace:"nowrap"}}>
              <strong style={{color:"var(--amber)",fontStyle:"normal",fontWeight:700}}>{momentsWithMomento} momento{momentsWithMomento!==1?"s":""}</strong>
              {" across "}
              <strong style={{color:"var(--text)",fontStyle:"normal",fontWeight:600}}>{momentsBookCount} book{momentsBookCount!==1?"s":""}</strong>
            </p>
            <div style={{position:"relative"}}>
              <button
                onClick={()=>setMomentsShowLayoutMenu(v=>!v)}
                className="font-sans"
                style={{border:"1px solid rgba(139,105,20,0.2)",borderRadius:20,background:"transparent",padding:"5px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:9,fontWeight:600,color:"var(--amber)",letterSpacing:"0.05em"}}
              >
                {momentsLayoutMode==="clip-by-books" ? "Clip by books" : "List all"}
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none" style={{transform:momentsShowLayoutMenu?"rotate(180deg)":"none",transition:"transform 150ms"}}>
                  <path d="M2 3.5l3 3 3-3" stroke="#8B6914" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {momentsShowLayoutMenu && (
                <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,background:"var(--bg)",border:"1px solid rgba(139,105,20,0.18)",borderRadius:10,boxShadow:"0 4px 16px rgba(139,105,20,0.14)",zIndex:30,overflow:"hidden",minWidth:150}}>
                  {[{id:"default",label:"List all"},{id:"clip-by-books",label:"Clip by books"}].map((opt,i)=>(
                    <button
                      key={opt.id}
                      onClick={()=>{setMomentsLayoutMode(opt.id);setMomentsShowLayoutMenu(false);}}
                      className="font-sans"
                      style={{display:"flex",alignItems:"center",width:"100%",padding:"9px 12px",border:"none",borderBottom:i===0?"1px solid rgba(139,105,20,0.08)":"none",background:momentsLayoutMode===opt.id?"rgba(139,105,20,0.07)":"transparent",cursor:"pointer",fontSize:10,color:momentsLayoutMode===opt.id?"#8B6914":"var(--text)",fontWeight:momentsLayoutMode===opt.id?600:500,textAlign:"left"}}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={()=>setMomentsPassageFirst(p=>!p)}
              style={{border:"1px solid rgba(139,105,20,0.2)",borderRadius:20,background:"transparent",padding:"4px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}
            >
              <svg width="13" height="16" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 2 H26 V28 Q23 30 20 27 Q17 24 14 27 Q11 30 8 27 Q5 24 4 28 Z" fill="none" stroke="var(--amber)" strokeWidth="2.5"/>
                <line x1="8" y1="10" x2="22" y2="10" stroke="var(--amber)" strokeWidth="2" opacity="0.85"/>
                <line x1="8" y1="15" x2="22" y2="15" stroke="var(--amber)" strokeWidth="2" opacity="0.85"/>
                <line x1="8" y1="20" x2="16" y2="20" stroke="var(--amber)" strokeWidth="2" opacity="0.85"/>
                <path d="M7 35 Q14 31 22 36" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <svg width="10" height="13" viewBox="0 0 10 13" fill="none">
                <path d="M2 4V2.5C2 2.5 4 1 6 2.5" stroke="rgba(139,105,20,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 2.5L1 4.5L3 4.5" stroke="rgba(139,105,20,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 9V10.5C8 10.5 6 12 4 10.5" stroke="rgba(139,105,20,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 10.5L9 8.5L7 8.5" stroke="rgba(139,105,20,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}
      </div>
    </header>
    <div style={{position:"fixed",bottom:24,right:28,zIndex:50}} onMouseEnter={()=>setShowHint(true)} onMouseLeave={()=>setShowHint(false)}>
      <div style={{perspective:"120px",perspectiveOrigin:"left center",display:"flex",alignItems:"center"}}>
        {folded ? (
          <div style={{position:"relative",width:faceSize,height:faceSize,transformStyle:"preserve-3d",transform:`rotateY(${-cubeIndex*90}deg)`,transition:"transform 600ms cubic-bezier(0.4,0,0.2,1)"}}>
            {letters.map((letter,i)=>(
              <div key={i} style={{position:"absolute",inset:0,border:"1.5px solid rgba(139,105,20,0.35)",background:"rgba(139,105,20,0.08)",borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",backfaceVisibility:"hidden",transform:`rotateY(${i*90}deg) translateZ(${faceSize/2}px)`}}>
                <span style={{fontFamily:"Georgia,serif",fontSize:9,fontWeight:700,color:"rgba(139,105,20,0.55)"}}>{letter}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{position:"relative",width:faceSize*n+(n-1)*2,height:faceSize}}>
            {expandedArray.map((si,i)=>(
              <div key={si} style={{position:"absolute",top:0,left:i*(faceSize+2),width:faceSize,height:faceSize,border:"1.5px solid rgba(139,105,20,0.35)",background:"rgba(139,105,20,0.08)",borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",transformOrigin:"left center",transform:"rotateY(0deg)",animation:`unfoldFromRight 500ms cubic-bezier(0.4,0,0.2,1) ${i*80}ms both`}}>
                <span style={{fontFamily:"Georgia,serif",fontSize:9,fontWeight:700,color:"rgba(139,105,20,0.55)"}}>{letters[si]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </React.Fragment>
  );
}
