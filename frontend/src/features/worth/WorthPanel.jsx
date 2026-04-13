/* â"€â"€ Worth sub-components â€" defined at top level so their state survives WorthPanel re-renders â"€â"€ */

/* Worth panel */

const BOOK_ID_MAP = {
  "84":"Frankenstein","1342":"Pride and Prejudice","64317":"The Great Gatsby",
  "frankenstein":"Frankenstein","pride and prejudice":"Pride and Prejudice","the great gatsby":"The Great Gatsby",
};

function transformMatches(rows) {
  const byUser = {};
  rows.forEach(function(row) {
    const id = row.matched_user_id;
    if (!byUser[id]) {
      byUser[id] = {
        id: id,
        name: row.character_name || ("Reader "+id),
        bio: row.profession || "",
        gender: row.gender || "",
        since: "",
        _tR:[], _tC:[], _tD:[], _fR:[], _fC:[], _fD:[],
        moments: [], _books: new Set(),
      };
    }
    const u = byUser[id];
    u._tR.push(row.think_R||0); u._tC.push(row.think_C||0); u._tD.push(row.think_D||0);
    u._fR.push(row.feel_R||0);  u._fC.push(row.feel_C||0);  u._fD.push(row.feel_D||0);
    const bookTitle = BOOK_ID_MAP[row.book_id] || BOOK_ID_MAP[(row.book_id||"").toLowerCase()] || row.book_id || "";
    u._books.add(bookTitle);
    u.moments.push({book:bookTitle, passage:row.passage_id||"", verdict:row.verdict||"", rationale:row.think_rationale||row.feel_rationale||""});
  });
  const avg = function(arr){ return arr.length ? Math.round(arr.reduce(function(a,b){return a+b;},0)/arr.length) : 0; };
  return Object.values(byUser).map(function(u) {
    return {
      id:u.id, name:u.name, bio:u.bio, gender:u.gender, since:u.since,
      rt:avg(u._tR), ct:avg(u._tC), dt:avg(u._tD),
      rf:avg(u._fR), cf:avg(u._fC), df:avg(u._fD),
      r:avg(u._tR.concat(u._fR)), c:avg(u._tC.concat(u._fC)), d:avg(u._tD.concat(u._fD)),
      commonBooks:u._books.size, momentCount:u.moments.length, moments:u.moments,
    };
  });
}

function WorthPanel({authUser, focusedMoment, onClear, worthMessage, onDismissMessage, activeWhisper, onOpenWhisper, onCloseWhisper, onSnip, snippedMoments, openBookInRead, lastOpenedBook, onOpenMoments, onWave, onAddWaved, wavedNames: wavedNamesProp, hideHeader, sectionCount=1, onFirstProfileShown, onAnotherProfileShown}) {
  const allMoments = [...(snippedMoments||[]), ...MOMENTS_DATA];

  const [profiles, setProfiles] = useState(PROFILES);
  const [profilesLoading, setProfilesLoading] = useState(false);

  useEffect(function() {
    if (!authUser) return;
    setProfilesLoading(true);
    Promise.allSettled([
      apiGet("/worth/matches"),
      apiGet("/worth/rankings"),
    ]).then(function(results) {
      var matchesResult = results[0];
      var rankingsResult = results[1];
      var rows = matchesResult.status === "fulfilled" ? matchesResult.value : [];
      var rankingsData = rankingsResult.status === "fulfilled" ? rankingsResult.value : null;
      var transformed = transformMatches(rows);
      if (transformed.length > 0) {
        if (rankingsData && Array.isArray(rankingsData.rankings) && rankingsData.rankings.length > 0) {
          var rankMap = {};
          rankingsData.rankings.forEach(function(r, i) { rankMap[String(r.user_id)] = i; });
          transformed.sort(function(a, b) {
            var ra = rankMap[String(a.id)] !== undefined ? rankMap[String(a.id)] : 9999;
            var rb = rankMap[String(b.id)] !== undefined ? rankMap[String(b.id)] : 9999;
            return ra - rb;
          });
        }
        setProfiles(transformed);
      }
    }).finally(function() {
      setProfilesLoading(false);
    });
  }, [authUser]);

  // Books from user's own moments only
  const userMomentBooks = [...new Set((snippedMoments||[]).map(function(m){return m.book;}).filter(Boolean))];
  const filterableBooks = SHELF_BOOKS.filter(function(b){ return userMomentBooks.includes(b.title); });

  // Current book context - manual selection takes priority over read context
  const [selectedBookId, setSelectedBookId] = useState(LAST_READ_SHELF_ID);
  const [bookDropOpen, setBookDropOpen] = useState(false);
  const [labelFilter, setLabelFilter] = useState([]);
  const [rcdFilter, setRcdFilter] = useState(null);
  const [labelDropOpen, setLabelDropOpen] = useState(false);
  const [oLabelFilter, setOLabelFilter] = useState([]);
  const [oRcdFilter, setORcdFilter] = useState(null);
  const [oDropOpen, setODropOpen] = useState(false);
  const wavedNames = wavedNamesProp || new Set();
  const [exitingNames, setExitingNames] = useState(new Set());

  const handleWave = (profile) => {
    setExitingNames(prev => new Set([...prev, profile.name]));
    setTimeout(() => {
      onAddWaved && onAddWaved(profile.name);
      setExitingNames(prev => { const s = new Set(prev); s.delete(profile.name); return s; });
      onWave && onWave(profile);
    }, 540);
  };
  
  // Find matching shelf book for openBookInRead (fallback to synthetic for epub-only books)
  const openBookShelf = openBookInRead
    ? (SHELF_BOOKS.find(b => b.title === openBookInRead.title) || {id:-1, title:openBookInRead.title, author:openBookInRead.author||''})
    : null;
  // Last opened book — persists after closing, used as default when nothing is open
  const lastOpenedShelf = (!openBookInRead && lastOpenedBook)
    ? (SHELF_BOOKS.find(b => b.title === lastOpenedBook.title) || {id:-1, title:lastOpenedBook.title, author:lastOpenedBook.author||''})
    : null;
  // Manual selection always wins — read context is only default when nothing is manually selected
  const manuallySelected = selectedBookId !== LAST_READ_SHELF_ID;
  const currentBook = manuallySelected
    ? (SHELF_BOOKS.find(b=>b.id===selectedBookId) || openBookShelf || lastOpenedShelf || SHELF_BOOKS[0])
    : (openBookShelf || lastOpenedShelf || (filterableBooks[0]) || SHELF_BOOKS[0]);
  const isCurrentlyOpen = !manuallySelected && !!openBookShelf;
  const isLastOpened = !manuallySelected && !isCurrentlyOpen && !!lastOpenedShelf;
  const isManualBook = manuallySelected;

  // Book-row: profiles that have at least one momento for the current book (exclude waved)
  const bookProfiles = profiles.filter(p =>
    !wavedNames.has(p.name) &&
    p.moments && p.moments.some(m => m.book === currentBook.title)
  );
  const filteredBookProfiles = (() => {
    let list = bookProfiles;
    if (labelFilter.includes("think") && !labelFilter.includes("feel")) list = list.filter(p=>p.r>45);
    if (labelFilter.includes("feel") && !labelFilter.includes("think")) list = list.filter(p=>p.c>25);
    if (labelFilter.includes("think") && labelFilter.includes("feel")) list = list.filter(p=>p.r>45||p.c>25);
    if (rcdFilter==="resonant")   list = list.filter(p=>p.r>p.c&&p.r>p.d);
    if (rcdFilter==="contradict") list = list.filter(p=>p.c>p.r&&p.c>p.d);
    if (rcdFilter==="diverge")    list = list.filter(p=>p.d>p.r&&p.d>p.c);
    return list;
  })();
  const filterActive = labelFilter.length>0 || rcdFilter;

  // Overall row: all profiles sorted by resonance (r desc), exclude waved
  const baseProfiles = profiles.filter(p => !wavedNames.has(p.name));
  const overallProfiles = [...baseProfiles].sort((a,b)=>b.r-a.r);
  const filteredOverallProfiles = (() => {
    let list = overallProfiles;
    if (oLabelFilter.includes("think") && !oLabelFilter.includes("feel")) list = list.filter(p=>p.r>45);
    if (oLabelFilter.includes("feel") && !oLabelFilter.includes("think")) list = list.filter(p=>p.c>25);
    if (oLabelFilter.includes("think") && oLabelFilter.includes("feel")) list = list.filter(p=>p.r>45||p.c>25);
    if (oRcdFilter==="resonant")   list = list.filter(p=>p.r>p.c&&p.r>p.d);
    if (oRcdFilter==="contradict") list = list.filter(p=>p.c>p.r&&p.c>p.d);
    if (oRcdFilter==="diverge")    list = list.filter(p=>p.d>p.r&&p.d>p.c);
    return list;
  })();
  const oFilterActive = oLabelFilter.length>0 || oRcdFilter;

  // Detect first profile shown and subsequent profile count increases
  const totalVisibleProfiles = new Set([
    ...filteredBookProfiles.map(p=>p.name),
    ...filteredOverallProfiles.map(p=>p.name),
  ]).size;
  const prevTotalRef = useRef(null);
  useEffect(()=>{
    if(prevTotalRef.current === null){
      if(totalVisibleProfiles > 0) onFirstProfileShown && onFirstProfileShown();
    } else if(totalVisibleProfiles > prevTotalRef.current){
      onAnotherProfileShown && onAnotherProfileShown();
    }
    prevTotalRef.current = totalVisibleProfiles;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[totalVisibleProfiles]);

  if(activeWhisper) {
    const profile = profiles.find(p=>p.name===activeWhisper)||profiles[0];
    return <WhisperThread profile={profile} onClose={onCloseWhisper} onSnip={onSnip} onOpenMoments={onOpenMoments}/>;
  }

  // ProfileScrollRow and CardNavigator are top-level functions defined above WorthPanel

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",paddingTop:48,boxSizing:"border-box"}}>

      {/* â"€â"€ Top bar â"€â"€ */}
      {!hideHeader && (
      <div style={{flexShrink:0,minHeight:48,display:"flex",alignItems:"center",justifyContent:"center",gap:12,padding:"8px 16px",background:"var(--bg)",borderBottom:"1px solid rgba(139,105,20,0.1)"}}>
        {worthMessage && (
          <div style={{display:"flex",alignItems:"center",gap:6,maxWidth:"100%",minHeight:24,opacity:0.76}}>
            <span style={{fontSize:10,color:"var(--amber)",lineHeight:1,flexShrink:0,opacity:0.7}}>✦</span>
            <p className="font-serif" style={{fontSize:10.5,fontStyle:"italic",color:"rgba(139,105,20,0.76)",margin:0,lineHeight:1.35,textAlign:"center"}}>
              {worthMessage}
            </p>
          </div>
        )}
      </div>
      )}

      <div className={`panel-scroll${sectionCount===4?" scroll-dim":""}`} style={{flex:1,overflowY:"auto",scrollbarColor:sectionCount===4?"rgba(139,105,20,0.04) transparent":undefined}}>

        {/* â"€â"€ Focused moment banner â"€â"€ */}
        {focusedMoment&&(
          <div style={{padding:"10px 16px",background:"rgba(139,105,20,0.05)",borderBottom:"1px solid rgba(139,105,20,0.1)",display:"flex",alignItems:"flex-start",gap:10}}>
            <div style={{flex:1,minWidth:0}}>
              <p className="font-sans" style={{fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--amber)",margin:"0 0 3px",fontWeight:600}}>
                {"Readers for this moment"}
              </p>
              <p className="font-reading" style={{fontSize:11.5,fontStyle:"italic",color:"var(--text)",margin:0,lineHeight:1.55,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>"{focusedMoment.passage}"</p>
              <p className="font-serif" style={{fontSize:10,color:"var(--amber)",margin:"3px 0 0",fontStyle:"italic",opacity:0.85}}>{focusedMoment.book}</p>
            </div>
          <button onClick={onClear} style={{flexShrink:0,width:18,height:18,borderRadius:"50%",background:"transparent",border:"1px solid rgba(139,105,20,0.25)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"var(--text2)",lineHeight:1,marginTop:1}}>×</button>
          </div>
        )}

        {/* â"€â"€ TOP SECTION: Readers of current book â"€â"€ */}
        <div style={{background:"var(--bg)",padding:"12px 16px 18px"}}>
          <div style={{borderRadius:14,border:"1.5px solid rgba(196,160,85,0.5)"}}>
          <div style={{position:"relative"}}>
            {/* Header â€" top of the shared container */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px 9px",background:"var(--card)",borderRadius:"14px 14px 0 0",borderBottom:"1.5px solid rgba(196,160,85,0.5)",marginBottom:0}}>
              {sectionCount!==4 && (
              <div style={{minWidth:0,flex:1,paddingRight:10}}>
                <p className="font-serif" style={{fontSize:sectionCount===1?16:13,fontWeight:400,color:"var(--amber)",margin:0,lineHeight:sectionCount===1?1.2:1.4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:sectionCount===1?"normal":"nowrap"}}>
                  {sectionCount===1 ? <>Readers who read closer to you in <strong style={{fontWeight:700}}>{currentBook.title}</strong></> : <strong style={{fontWeight:700}}>{currentBook.title}</strong>}
                </p>
              </div>
              )}
              <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
                {(isCurrentlyOpen || isLastOpened) && (
                  <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:isCurrentlyOpen?"#3a9e4e":"rgba(196,160,85,0.7)",boxShadow:isCurrentlyOpen?"0 0 4px rgba(58,158,78,0.7)":"0 0 4px rgba(196,160,85,0.4)",flexShrink:0,display:"inline-block"}}/>
                    {sectionCount!==4 && (
                    <span className="font-sans" style={{fontSize:7.5,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(139,105,20,0.55)",fontWeight:600}}>
                      {isCurrentlyOpen ? "Currently reading" : "Last opened"}
                    </span>
                    )}
                  </div>
                )}
                {/* Book picker chip */}
                <button onClick={()=>{setBookDropOpen(o=>!o);setLabelDropOpen(false);}} title="Switch book"
                  style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",height:24,background:(bookDropOpen||isManualBook)?"var(--amber2)":"var(--card)",border:`1px solid ${(bookDropOpen||isManualBook)?"var(--amber)":"var(--border)"}`,borderRadius:999,cursor:"pointer",color:(bookDropOpen||isManualBook)?"var(--amber)":"var(--text2)",transition:"all 150ms",flexShrink:0,maxWidth:160}}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                  <span className="font-sans" style={{fontSize:8,fontWeight:600,letterSpacing:"0.04em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:100}}>{currentBook.title}</span>
                  <svg width="7" height="7" viewBox="0 0 10 10" fill="none" style={{flexShrink:0,transform:bookDropOpen?"rotate(180deg)":"none",transition:"transform 200ms"}}>
                    <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {/* Label filter chip */}
                <button onClick={()=>{setLabelDropOpen(o=>!o);setBookDropOpen(false);}} title="Filter by reading style"
                  style={{display:"flex",alignItems:"center",gap:3,padding:"3px 8px",height:24,background:(labelDropOpen||filterActive)?"var(--amber2)":"var(--card)",border:`1px solid ${(labelDropOpen||filterActive)?"var(--amber)":"var(--border)"}`,borderRadius:999,cursor:"pointer",color:(labelDropOpen||filterActive)?"var(--amber)":"var(--text2)",transition:"all 150ms",flexShrink:0}}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                  </svg>
                  {filterActive && (
                    <span className="font-sans" style={{fontSize:8,fontWeight:600,letterSpacing:"0.04em",lineHeight:1}}>
                      {labelFilter.includes("think")&&labelFilter.includes("feel")?"Think+Feel":labelFilter.includes("think")?"Think":labelFilter.includes("feel")?"Feel":""}
                  {labelFilter.length>0&&rcdFilter?" · ":""}
                      {rcdFilter==="resonant"?"R":rcdFilter==="contradict"?"C":rcdFilter==="diverge"?"D":""}
                    </span>
                  )}
                </button>
                {sectionCount===4 && (
                  <span className="font-sans" style={{fontSize:8,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(139,105,20,0.55)",whiteSpace:"nowrap",marginLeft:4}}>
                    {filteredBookProfiles.length} {filteredBookProfiles.length===1?"reader":"readers"}
                  </span>
                )}
              </div>
            </div>
            {/* Book shelf — absolute dropdown */}
            {bookDropOpen && (
              <>
                <div onClick={()=>setBookDropOpen(false)} style={{position:"fixed",inset:0,zIndex:49}}/>
                <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:50,background:"var(--bg)",border:"1px solid rgba(196,160,85,0.4)",borderRadius:10,boxShadow:"0 6px 22px rgba(139,105,20,0.14)",overflow:"hidden"}}>
                  <div style={{padding:"10px 14px 12px",display:"flex",gap:10,overflowX:"auto",scrollSnapType:"x mandatory",WebkitOverflowScrolling:"touch"}} className="panel-scroll">
                    {filterableBooks.length > 0 ? filterableBooks.map(b => {
                      const isSelected = b.id === selectedBookId;
                      return (
                        <button key={b.id} onClick={()=>{setSelectedBookId(b.id);setBookDropOpen(false);}}
                          style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",padding:0,scrollSnapAlign:"start",opacity:isSelected?1:0.72,transition:"opacity 150ms"}}>
                          <div style={{width:46,height:68,borderRadius:3,overflow:"hidden",boxShadow:isSelected?"0 0 0 2px var(--amber), 0 4px 10px rgba(139,105,20,0.28)":"0 2px 6px rgba(0,0,0,0.18)",transition:"box-shadow 150ms"}}>
                            <div style={{width:"100%",height:"100%"}} dangerouslySetInnerHTML={{__html:makeShelfCoverSVG(b)}}/>
                          </div>
                          <p className="font-sans" style={{fontSize:8,color:isSelected?"var(--amber)":"var(--text2)",fontWeight:isSelected?700:400,margin:0,maxWidth:52,textAlign:"center",lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.title}</p>
                        </button>
                      );
                    }) : (
                      <p className="font-sans" style={{fontSize:10,color:"var(--text2)",fontStyle:"italic",margin:"4px 0",lineHeight:1.5}}>Capture moments to see books here.</p>
                    )}
                  </div>
                </div>
              </>
            )}
            {/* Label filter dropdown */}
            {labelDropOpen && (
              <>
                <div onClick={()=>setLabelDropOpen(false)} style={{position:"fixed",inset:0,zIndex:49}}/>
                <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,zIndex:50,background:"var(--bg)",border:"1px solid var(--border)",borderRadius:10,boxShadow:"0 6px 22px rgba(0,0,0,0.12)",overflow:"hidden",width:196}}>
                  {/* Row 1: Think / Feel toggle buttons */}
                  <div style={{padding:"10px 11px 8px"}}>
                    <p className="font-sans" style={{fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--text2)",margin:"0 0 7px",fontWeight:500}}>Reading style</p>
                    <div style={{display:"flex",gap:6}}>
                      {[
                        {key:"think", label:"Think", desc:"Analytical lens"},
                        {key:"feel",  label:"Feel",  desc:"Emotional lens"},
                      ].map(t=>(
                        <button key={t.key}
                          onClick={()=>{setLabelFilter(lf=>lf.includes(t.key)?lf.filter(k=>k!==t.key):[...lf,t.key]);setRcdFilter(null);}}
                          style={{flex:1,padding:"6px 4px",background:labelFilter.includes(t.key)?"var(--amber2)":"transparent",border:`1.5px solid ${labelFilter.includes(t.key)?"var(--amber)":"var(--border)"}`,borderRadius:7,cursor:"pointer",textAlign:"center",transition:"all 150ms"}}>
                          <p className="font-sans" style={{fontSize:11,fontWeight:labelFilter.includes(t.key)?700:400,color:labelFilter.includes(t.key)?"var(--amber)":"var(--text)",margin:"0 0 1px",lineHeight:1.2}}>{t.label}</p>
                          <p className="font-sans" style={{fontSize:8,color:"var(--text2)",margin:0,lineHeight:1.2}}>{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Row 2: Dominant in â€" only when Think or Feel is selected */}
                  {labelFilter.length>0 && (
                    <div style={{padding:"8px 11px 11px",borderTop:"1px solid var(--border2)"}}>
                      <p className="font-sans" style={{fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--text2)",margin:"0 0 7px",fontWeight:500}}>
                        {labelFilter.includes("think")&&labelFilter.includes("feel")?"Think & Feel":labelFilter.includes("think")?"Think":"Feel"} dominant in
                      </p>
                      <div style={{display:"flex",gap:5}}>
                        {[
                          {key:"resonant",   label:"Resonant",   color:"#2D8A4E", dot:"#2D8A4E"},
                          {key:"contradict", label:"Contradict",  color:"#C0392B", dot:"#C0392B"},
                          {key:"diverge",    label:"Diverge",     color:"#7A7A6A", dot:"#7A7A6A"},
                        ].map(opt=>(
                          <button key={opt.key}
                            onClick={()=>setRcdFilter(rf=>rf===opt.key?null:opt.key)}
                            style={{flex:1,padding:"5px 3px",background:rcdFilter===opt.key?opt.color+"22":"transparent",border:`1.5px solid ${rcdFilter===opt.key?opt.color:"var(--border)"}`,borderRadius:7,cursor:"pointer",textAlign:"center",transition:"all 150ms"}}>
                            <div style={{width:6,height:6,borderRadius:"50%",background:opt.dot,margin:"0 auto 3px",opacity:rcdFilter===opt.key?1:0.4}}/>
                            <p className="font-sans" style={{fontSize:9,fontWeight:rcdFilter===opt.key?700:400,color:rcdFilter===opt.key?opt.color:"var(--text2)",margin:0,lineHeight:1.2}}>{opt.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Clear button */}
                  {filterActive && (
                    <div style={{padding:"7px 11px 9px",borderTop:"1px solid var(--border2)"}}>
                      <button onClick={()=>{setLabelFilter([]);setRcdFilter(null);setLabelDropOpen(false);}}
                        style={{width:"100%",padding:"5px 0",background:"transparent",border:"1px solid var(--border)",borderRadius:6,cursor:"pointer",color:"var(--text2)",fontSize:10,fontFamily:"'DM Sans',sans-serif"}}>
                        Clear filter
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>{/* end position:relative */}

          {filteredBookProfiles.length > 0 ? (
            <CardNavigator profiles={filteredBookProfiles} exitingNames={exitingNames} cardWidth={265} cardHeight={420} focusedMoment={focusedMoment} onOpenWhisper={onOpenWhisper} onWave={handleWave} sectionCount={sectionCount}/>
          ) : bookProfiles.length > 0 ? (
            <div style={{padding:"16px 18px 22px",display:"flex",alignItems:"flex-start",gap:12,background:"linear-gradient(180deg, var(--card) 0%, color-mix(in srgb, var(--card) 92%, var(--amber2) 8%) 100%)",border:"1.5px solid rgba(196,160,85,0.5)",borderTop:"none",borderRadius:"0 0 14px 14px"}}>
              <div style={{width:2,alignSelf:"stretch",background:"rgba(139,105,20,0.2)",borderRadius:1,flexShrink:0}}/>
              <div>
                <p className="font-serif" style={{fontSize:12,fontStyle:"italic",color:"var(--text)",margin:"0 0 3px",lineHeight:1.5}}>No readers match this filter.</p>
                <p className="font-sans" style={{fontSize:9.5,color:"var(--text2)",margin:0,lineHeight:1.5}}>Try adjusting the style or dominant dimension, or clear the filter.</p>
              </div>
            </div>
          ) : (
            <div style={{padding:"20px 18px 24px",display:"flex",alignItems:"flex-start",gap:12,background:"linear-gradient(180deg, var(--card) 0%, color-mix(in srgb, var(--card) 92%, var(--amber2) 8%) 100%)",border:"1.5px solid rgba(196,160,85,0.5)",borderTop:"none",borderRadius:"0 0 14px 14px"}}>
              <div style={{width:2,alignSelf:"stretch",background:"rgba(139,105,20,0.2)",borderRadius:1,flexShrink:0}}/>
              <div>
                <p className="font-sans" style={{fontSize:10,color:"var(--text2)",margin:0,lineHeight:1.6}}>Capture Moments to make them Momento and Worth will start finding readers close to you.</p>
              </div>
            </div>
          )}
          </div>{/* end shadow wrapper */}
          </div>

        {/* â"€â"€ BOTTOM SECTION: Overall closest readers ï¿½ï¿½ï¿½â"€ */}
        <div style={{padding:"0 12px 14px"}}>
          <div style={{borderRadius:14,overflow:"hidden",border:"1px solid rgba(139,105,20,0.18)",boxShadow:"0 8px 22px rgba(139,105,20,0.10),0 1px 4px rgba(0,0,0,0.05)",position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"13px 14px 10px",position:"relative",background:"linear-gradient(180deg, color-mix(in srgb, var(--card2) 90%, var(--amber2) 10%) 0%, var(--card2) 100%)",borderBottom:"1px solid rgba(139,105,20,0.1)"}}>
            {/* Left: label above title */}
            <div style={{display:"flex",flexDirection:"column",gap:2,flex:1,minWidth:0}}>
              <p className="font-sans" style={{fontSize:8,letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--amber)",margin:0,lineHeight:1,fontWeight:700}}>All your reading</p>
              <p className="font-serif" style={{fontSize:16,fontWeight:700,color:"var(--text)",margin:0,flex:1,lineHeight:1.2}}>
                Across all your books
              </p>
            </div>
            {/* Right: book count + filter chip */}
            <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
              <span className="font-sans" style={{fontSize:9,fontWeight:700,letterSpacing:"0.06em",color:"var(--amber)",background:"var(--amber2)",borderRadius:999,padding:"3px 9px",whiteSpace:"nowrap"}}>{userMomentBooks.length} books</span>
              <button onClick={()=>{setODropOpen(o=>!o);}} title="Filter by reading style"
                style={{display:"flex",alignItems:"center",gap:3,padding:"3px 8px",height:24,background:(oDropOpen||oFilterActive)?"var(--amber2)":"var(--card)",border:`1px solid ${(oDropOpen||oFilterActive)?"var(--amber)":"var(--border)"}`,borderRadius:999,cursor:"pointer",color:(oDropOpen||oFilterActive)?"var(--amber)":"var(--text2)",transition:"all 150ms",flexShrink:0}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                </svg>
                {oFilterActive && (
                  <span className="font-sans" style={{fontSize:8,fontWeight:600,letterSpacing:"0.04em",lineHeight:1}}>
                    {oLabelFilter.includes("think")&&oLabelFilter.includes("feel")?"Think+Feel":oLabelFilter.includes("think")?"Think":oLabelFilter.includes("feel")?"Feel":""}
                  {oLabelFilter.length>0&&oRcdFilter?" · ":""}
                    {oRcdFilter==="resonant"?"R":oRcdFilter==="contradict"?"C":oRcdFilter==="diverge"?"D":""}
                  </span>
                )}
              </button>
            </div>
            {/* Overall filter dropdown */}
            {oDropOpen && (
              <>
                <div onClick={()=>setODropOpen(false)} style={{position:"fixed",inset:0,zIndex:49}}/>
                <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,zIndex:50,background:"var(--bg)",border:"1px solid var(--border)",borderRadius:10,boxShadow:"0 6px 22px rgba(0,0,0,0.12)",overflow:"hidden",width:196}}>
                  <div style={{padding:"10px 11px 8px"}}>
                    <p className="font-sans" style={{fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--text2)",margin:"0 0 7px",fontWeight:500}}>Reading style</p>
                    <div style={{display:"flex",gap:6}}>
                      {[
                        {key:"think",label:"Think",desc:"Analytical lens"},
                        {key:"feel", label:"Feel", desc:"Emotional lens"},
                      ].map(t=>(
                        <button key={t.key}
                          onClick={()=>{setOLabelFilter(lf=>lf.includes(t.key)?lf.filter(k=>k!==t.key):[...lf,t.key]);setORcdFilter(null);}}
                          style={{flex:1,padding:"6px 4px",background:oLabelFilter.includes(t.key)?"var(--amber2)":"transparent",border:`1.5px solid ${oLabelFilter.includes(t.key)?"var(--amber)":"var(--border)"}`,borderRadius:7,cursor:"pointer",textAlign:"center",transition:"all 150ms"}}>
                          <p className="font-sans" style={{fontSize:11,fontWeight:oLabelFilter.includes(t.key)?700:400,color:oLabelFilter.includes(t.key)?"var(--amber)":"var(--text)",margin:"0 0 1px",lineHeight:1.2}}>{t.label}</p>
                          <p className="font-sans" style={{fontSize:8,color:"var(--text2)",margin:0,lineHeight:1.2}}>{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  {oLabelFilter.length>0 && (
                    <div style={{padding:"8px 11px 11px",borderTop:"1px solid var(--border2)"}}>
                      <p className="font-sans" style={{fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--text2)",margin:"0 0 7px",fontWeight:500}}>
                        {oLabelFilter.includes("think")&&oLabelFilter.includes("feel")?"Think & Feel":oLabelFilter.includes("think")?"Think":"Feel"} dominant in
                      </p>
                      <div style={{display:"flex",gap:5}}>
                        {[
                          {key:"resonant",   label:"Resonant",  color:"#2D8A4E"},
                          {key:"contradict", label:"Contradict", color:"#C0392B"},
                          {key:"diverge",    label:"Diverge",    color:"#7A7A6A"},
                        ].map(opt=>(
                          <button key={opt.key}
                            onClick={()=>setORcdFilter(rf=>rf===opt.key?null:opt.key)}
                            style={{flex:1,padding:"5px 3px",background:oRcdFilter===opt.key?opt.color+"22":"transparent",border:`1.5px solid ${oRcdFilter===opt.key?opt.color:"var(--border)"}`,borderRadius:7,cursor:"pointer",textAlign:"center",transition:"all 150ms"}}>
                            <div style={{width:6,height:6,borderRadius:"50%",background:opt.color,margin:"0 auto 3px",opacity:oRcdFilter===opt.key?1:0.4}}/>
                            <p className="font-sans" style={{fontSize:9,fontWeight:oRcdFilter===opt.key?700:400,color:oRcdFilter===opt.key?opt.color:"var(--text2)",margin:0,lineHeight:1.2}}>{opt.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {oFilterActive && (
                    <div style={{padding:"7px 11px 9px",borderTop:"1px solid var(--border2)"}}>
                      <button onClick={()=>{setOLabelFilter([]);setORcdFilter(null);setODropOpen(false);}}
                        style={{width:"100%",padding:"5px 0",background:"transparent",border:"1px solid var(--border)",borderRadius:6,cursor:"pointer",color:"var(--text2)",fontSize:10,fontFamily:"'DM Sans',sans-serif"}}>
                        Clear filter
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          {filteredOverallProfiles.length > 0 ? (
            <div style={{background:"var(--card2)"}}><ProfileScrollRow profiles={filteredOverallProfiles} exitingNames={exitingNames} focusedMoment={focusedMoment} onOpenWhisper={onOpenWhisper} onWave={handleWave}/></div>
          ) : (
            <div style={{padding:"14px 16px 20px",display:"flex",alignItems:"flex-start",gap:12,background:"var(--card2)"}}>
              <div style={{width:2,alignSelf:"stretch",background:"rgba(139,105,20,0.2)",borderRadius:1,flexShrink:0}}/>
              <div>
                <p className="font-serif" style={{fontSize:12,fontStyle:"italic",color:"var(--text)",margin:"0 0 3px",lineHeight:1.5}}>No readers match this filter.</p>
                <p className="font-sans" style={{fontSize:9.5,color:"var(--text2)",margin:0,lineHeight:1.5}}>Try adjusting the style or dominant dimension, or clear the filter.</p>
              </div>
            </div>
          )}
          <span className="font-sans" style={{position:"absolute",bottom:10,right:12,fontSize:8,color:"var(--text2)",letterSpacing:"0.08em",textTransform:"uppercase",background:"rgba(139,105,20,0.08)",borderRadius:999,padding:"4px 8px",fontWeight:600,pointerEvents:"none"}}>
            {oFilterActive ? `${filteredOverallProfiles.length}/` : ""}{overallProfiles.length} readers
          </span>
          </div>{/* end rectangle */}
        </div>

      </div>
    </div>
  );
}

