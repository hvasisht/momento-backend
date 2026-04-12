function MomentsPanel({onDragStart, snippedMoments, onUpdateMoment, onDeleteMoment, onBrowsingBookChange, expandedMomentId:externalExpandedId, onClearExpanded, openBookInRead, layoutMode, setLayoutMode, passageFirst, setPassageFirst, showLayoutMenu, setShowLayoutMenu, hideHeader, sectionCount=1}) {
  const [narrow, setNarrow] = useState(false);
  const [showCombinedMenu, setShowCombinedMenu] = useState(false);
  const [activeBook, setActiveBook] = useState(null);
  const [localExpandedId, setLocalExpandedId] = useState(null);
  const [showAllBooks, setShowAllBooks] = useState(false);
  const headerRef = useRef(null);
  const sharingAssistMode = arguments[0]?.sharingAssistMode;

  const allMoments = [...(snippedMoments||[]).slice().reverse(), ...MOMENTS_DATA];
  const snippedIds = new Set((snippedMoments||[]).map(function(m){return m.id;}));

  // Filter moments by open book in READ if one is open, unless user dismissed it
  const pinnedBook = openBookInRead && !showAllBooks ? openBookInRead : null;
  const filteredMoments = pinnedBook
    ? allMoments.filter(m => m.book === pinnedBook.title)
    : allMoments;

  // Group by book, preserving first-appearance order
  const bookOrder = [];
  const bookMap = {};
  filteredMoments.forEach(m => {
    const key = m.book || "—";
    if(!bookMap[key]) { bookMap[key]=[]; bookOrder.push(key); }
    bookMap[key].push(m);
  });

  const withMomento = filteredMoments.filter(m=>m.interpretation).length;

  useEffect(()=>{
    if(!headerRef.current) return;
    const ro = new ResizeObserver(([e])=>{ setNarrow(e.contentRect.width < 200); });
    ro.observe(headerRef.current);
    return ()=>ro.disconnect();
  },[]);

  // Report activeBook changes up so TopChrome can hide layout controls
  useEffect(()=>{
    onBrowsingBookChange&&onBrowsingBookChange(!!activeBook);
  },[activeBook]);

  // Auto-drill into the open book when READ has one open
  useEffect(()=>{
    if(openBookInRead?.title) setActiveBook(openBookInRead.title);
  },[openBookInRead?.title]);

  // Auto-navigate to the right book when an external moment ID arrives (e.g. drag-to-worth)
  useEffect(()=>{
    if(externalExpandedId && !activeBook) {
      const m = allMoments.find(m=>m.id===externalExpandedId);
    if(m) setActiveBook(m.book||"—");
    }
  },[externalExpandedId]);

  // BookBrowse drill-down
  if(activeBook) {
    return (
      <BookBrowse
        book={activeBook}
        moments={bookMap[activeBook]||[]}
        onBack={()=>setActiveBook(null)}
        onBackToAll={()=>{setActiveBook(null); setShowAllBooks(true);}}
        passageFirst={passageFirst}
        onDragStart={onDragStart}
        expandedMomentId={localExpandedId||externalExpandedId}
        onClearExpanded={()=>{ setLocalExpandedId(null); onClearExpanded&&onClearExpanded(); }}
        onUpdateMoment={onUpdateMoment}
        onDelete={onDeleteMoment}
        snippedMomentIds={snippedIds}
      />
    );
  }

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:"var(--bg)",paddingTop:48,boxSizing:"border-box"}}>
      {/* Header */}
      {!hideHeader && (<div ref={headerRef} style={{flexShrink:0,height:sectionCount===4?32:48,padding:sectionCount===4?"0 10px":"0 16px",borderBottom:"1px solid var(--border2)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        {narrow ? (
          sharingAssistMode ? (
            <p className="font-sans" style={{fontSize:10.5,letterSpacing:"0.02em",color:"var(--text)",margin:0,flex:1}}>
              Drag and drop a <span style={{color:"var(--amber)",fontWeight:700}}>moment</span> you want to share
            </p>
          ) : (
          <div style={{display:"flex",alignItems:"center",gap:6,flex:1}}>
            <span className="font-serif" style={{fontSize:13,fontWeight:700,color:"var(--amber)",lineHeight:1,position:"relative",top:"-2px"}}>{withMomento}</span>
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" style={{display:"block",flexShrink:0}}>
              <path d="M2 10.5L3.5 12L12 3.5L10.5 2L2 10.5Z" stroke="var(--amber)" strokeWidth="1.3" strokeLinejoin="round"/>
              <path d="M2 10.5L1 13L3.5 12" stroke="var(--amber)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{color:"var(--text2)",fontSize:11,lineHeight:1,position:"relative",top:"-1px"}}>/</span>
            <span className="font-serif" style={{fontSize:13,fontWeight:700,color:"var(--text2)",lineHeight:1,position:"relative",top:"-2px"}}>{allMoments.length}</span>
            <svg width="13" height="9" viewBox="0 0 16 10" fill="none" style={{display:"block",flexShrink:0}}>
              <path d="M1 5C1 5 3.5 1 8 1C12.5 1 15 5 15 5C15 5 12.5 9 8 9C3.5 9 1 5 1 5Z" stroke="var(--text2)" strokeWidth="1.3" strokeLinecap="round"/>
              <circle cx="8" cy="5" r="2" stroke="var(--text2)" strokeWidth="1.3"/>
            </svg>
          </div>
          )
        ) : (
          <p className="font-serif" style={{fontSize:13,fontStyle:"italic",color:"var(--text)",margin:0,lineHeight:1.5,flex:1}}>
            {sharingAssistMode ? (
              <>
                Drag and drop a <strong style={{color:"var(--amber)",fontStyle:"normal"}}>moment</strong>
                <span style={{color:"var(--text2)"}}> you want to share.</span>
              </>
            ) : pinnedBook ? (
              <>
                <strong style={{color:"var(--amber)",fontStyle:"normal"}}>{withMomento} momento{withMomento!==1?"s":""}</strong>
                <span style={{color:"var(--text2)"}}>, {filteredMoments.length} moment{filteredMoments.length!==1?"s":""} in </span>
                <strong style={{color:"var(--amber)",fontStyle:"normal"}}>{pinnedBook.title}</strong>
              </>
            ) : null}
          </p>
        )}
        <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:10,flexShrink:0}}>
          {!pinnedBook && !sharingAssistMode && (
            <p className="font-serif" style={{fontSize:11,fontStyle:"italic",color:"var(--text2)",margin:0,lineHeight:1,whiteSpace:"nowrap"}}>
              <strong style={{color:"var(--amber)",fontStyle:"normal",fontWeight:700}}>{withMomento} momento{withMomento!==1?"s":""}</strong>
              {" across "}
              <strong style={{color:"var(--text)",fontStyle:"normal",fontWeight:600}}>{bookOrder.length} book{bookOrder.length!==1?"s":""}</strong>
            </p>
          )}
          {sectionCount===4 ? (
            <div style={{position:"relative"}}>
              {showCombinedMenu && <div onClick={()=>setShowCombinedMenu(false)} style={{position:"fixed",inset:0,zIndex:29}}/>}
              <button
                onClick={()=>setShowCombinedMenu(v=>!v)}
                className="font-sans"
                style={{border:"1px solid var(--border)",borderRadius:20,background:"transparent",padding:"5px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,transition:"background 150ms",fontSize:9,fontWeight:600,color:"var(--amber)",letterSpacing:"0.05em"}}
                onMouseEnter={e=>e.currentTarget.style.background="var(--amber3)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              >
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                  <line x1="2" y1="4" x2="14" y2="4" stroke="var(--amber)" strokeWidth="1.4" strokeLinecap="round"/>
                  <line x1="4" y1="8" x2="12" y2="8" stroke="var(--amber)" strokeWidth="1.4" strokeLinecap="round"/>
                  <line x1="6" y1="12" x2="10" y2="12" stroke="var(--amber)" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                <svg width="7" height="7" viewBox="0 0 10 10" fill="none" style={{transform:showCombinedMenu?"rotate(180deg)":"none",transition:"transform 150ms"}}>
                  <path d="M2 3.5l3 3 3-3" stroke="var(--amber)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showCombinedMenu && (
                <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,background:"var(--bg)",border:"1px solid var(--border)",borderRadius:10,boxShadow:"0 4px 16px var(--amber2)",zIndex:30,overflow:"hidden",minWidth:160}}>
                  <div style={{padding:"6px 12px 4px",borderBottom:"1px solid var(--border2)"}}>
                    <p className="font-sans" style={{fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--text2)",margin:0,fontWeight:600}}>Layout</p>
                  </div>
                  {[{id:"default",label:"List all"},{id:"clip-by-books",label:"Clip by books"}].map((opt,i)=>(
                    <button key={opt.id} onClick={()=>{setLayoutMode(opt.id);setShowCombinedMenu(false);}} className="font-sans"
                      style={{display:"flex",alignItems:"center",width:"100%",padding:"8px 12px",border:"none",background:layoutMode===opt.id?"var(--amber2)":"transparent",cursor:"pointer",fontSize:10,color:layoutMode===opt.id?"var(--amber)":"var(--text)",fontWeight:layoutMode===opt.id?600:500,textAlign:"left"}}>
                      {opt.label}
                    </button>
                  ))}
                  <div style={{height:1,background:"var(--border2)",margin:"2px 0"}}/>
                  <div style={{padding:"6px 12px 4px"}}>
                    <p className="font-sans" style={{fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--text2)",margin:0,fontWeight:600}}>Order</p>
                  </div>
                  {[{val:true,label:"Passage first"},{val:false,label:"Momento first"}].map(opt=>(
                    <button key={String(opt.val)} onClick={()=>{setPassageFirst(opt.val);setShowCombinedMenu(false);}} className="font-sans"
                      style={{display:"flex",alignItems:"center",width:"100%",padding:"8px 12px 10px",border:"none",background:passageFirst===opt.val?"var(--amber2)":"transparent",cursor:"pointer",fontSize:10,color:passageFirst===opt.val?"var(--amber)":"var(--text)",fontWeight:passageFirst===opt.val?600:500,textAlign:"left"}}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
            <div style={{position:"relative"}}>
              <button
                onClick={()=>setShowLayoutMenu(v=>!v)}
                className="font-sans"
                style={{border:"1px solid var(--border)",borderRadius:20,background:"transparent",padding:"5px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,transition:"background 150ms",fontSize:9,fontWeight:600,color:"var(--amber)",letterSpacing:"0.05em"}}
                onMouseEnter={e=>e.currentTarget.style.background="var(--amber3)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              >
                {layoutMode==="clip-by-books" ? "Clip by books" : "List all"}
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none" style={{transform:showLayoutMenu?"rotate(180deg)":"none",transition:"transform 150ms"}}>
                  <path d="M2 3.5l3 3 3-3" stroke="var(--amber)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showLayoutMenu && (
                <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,background:"var(--bg)",border:"1px solid var(--border)",borderRadius:10,boxShadow:"0 4px 16px var(--amber2)",zIndex:30,overflow:"hidden",minWidth:150}}>
                  {[{id:"default",label:"List all"},{id:"clip-by-books",label:"Clip by books"}].map((opt,i)=>(
                    <button key={opt.id} onClick={()=>{setLayoutMode(opt.id);setShowLayoutMenu(false);}} className="font-sans"
                      style={{display:"flex",alignItems:"center",width:"100%",padding:"9px 12px",border:"none",borderBottom:i===0?"1px solid var(--border2)":"none",background:layoutMode===opt.id?"var(--amber2)":"transparent",cursor:"pointer",fontSize:10,color:layoutMode===opt.id?"var(--amber)":"var(--text)",fontWeight:layoutMode===opt.id?600:500,textAlign:"left"}}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={()=>setPassageFirst(p=>!p)} style={{border:"1px solid var(--border)",borderRadius:20,background:"transparent",padding:"4px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,transition:"background 150ms"}} onMouseEnter={e=>e.currentTarget.style.background="var(--amber3)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
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
      </div>)}

      {/* Back button when pinned to a single book (always visible, even in solo/hideHeader mode) */}
      {pinnedBook && (
        <div style={{flexShrink:0,padding:"6px 14px",borderBottom:"1px solid var(--border2)",display:"flex",alignItems:"center",gap:6}}>
          <button onClick={()=>setShowAllBooks(true)} style={{background:"none",border:"none",cursor:"pointer",padding:"4px 0",color:"var(--amber)",display:"flex",alignItems:"center",gap:6}}>
            <svg width="14" height="10" viewBox="0 0 16 12" fill="none">
              <path d="M6 1L1 6L6 11" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 6H15" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="font-sans" style={{fontSize:9,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",color:"var(--amber)"}}>All books</span>
          </button>
          <span className="font-serif" style={{fontSize:11,fontStyle:"italic",color:"var(--text2)",marginLeft:4}}>— {pinnedBook.title}</span>
        </div>
      )}

      {/* Book stacks grid / sharing-assist cards */}
      <div className={`panel-scroll${sectionCount===4?" scroll-dim":""}`} style={{flex:1,overflowY:"auto",padding:sectionCount===4?(layoutMode==="default"?"8px 10px":"12px 10px"):(layoutMode==="default"?"16px":"28px 16px 24px"),scrollbarColor:sectionCount===4?"rgba(139,105,20,0.04) transparent":undefined}}>
        {layoutMode==="default" ? (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {filteredMoments.map((m,i)=>(
              <div key={m.id||`${m.book}-${i}`} style={{transform:`rotate(${i%2===0?"-0.25deg":"0.25deg"})`}}>
                <MomentCard moment={m} onClick={()=>{ setLocalExpandedId(m.id); setActiveBook(m.book||"—"); }} onDragStart={onDragStart} passageFirst={passageFirst} onDelete={snippedIds.has(m.id)?onDeleteMoment:undefined}/>
              </div>
            ))}
          </div>
        ) : (
          <div style={{display:"flex",flexWrap:"wrap",rowGap:48,columnGap:10,justifyContent:"flex-start"}}>
            {bookOrder.map(book=>(
              <div key={book} style={{flex:"0 0 155px",width:155}}>
                <BookStack book={book} moments={bookMap[book]} onSelect={setActiveBook} passageFirst={passageFirst}/>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
