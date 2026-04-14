/* ── Worth sub-components – defined at top level so their state survives WorthPanel re-renders ── */

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

  // Book container state
  const [selectedBookId, setSelectedBookId] = useState(LAST_READ_SHELF_ID);
  const [bookDropOpen, setBookDropOpen] = useState(false);
  const [labelFilter, setLabelFilter] = useState([]);
  const [rcdFilter, setRcdFilter] = useState(null);
  const [labelDropOpen, setLabelDropOpen] = useState(false);

  // All-books container state
  const [oLabelFilter, setOLabelFilter] = useState([]);
  const [oRcdFilter, setORcdFilter] = useState(null);
  const [oDropOpen, setODropOpen] = useState(false);

  // Momento container state
  const [momentoDropOpen, setMomentoDropOpen] = useState(false);
  const [selectedMomentoId, setSelectedMomentoId] = useState(null);
  const [mLabelFilter, setMLabelFilter] = useState([]);
  const [mRcdFilter, setMRcdFilter] = useState(null);
  const [mFilterDropOpen, setMFilterDropOpen] = useState(false);

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

  // Book context
  const openBookShelf = openBookInRead
    ? (SHELF_BOOKS.find(b => b.title === openBookInRead.title) || {id:-1, title:openBookInRead.title, author:openBookInRead.author||''})
    : null;
  const lastOpenedShelf = (!openBookInRead && lastOpenedBook)
    ? (SHELF_BOOKS.find(b => b.title === lastOpenedBook.title) || {id:-1, title:lastOpenedBook.title, author:lastOpenedBook.author||''})
    : null;
  const manuallySelected = selectedBookId !== LAST_READ_SHELF_ID;
  const currentBook = manuallySelected
    ? (SHELF_BOOKS.find(b=>b.id===selectedBookId) || openBookShelf || lastOpenedShelf || SHELF_BOOKS[0])
    : (openBookShelf || lastOpenedShelf || (filterableBooks[0]) || SHELF_BOOKS[0]);
  const isCurrentlyOpen = !manuallySelected && !!openBookShelf;
  const isLastOpened = !manuallySelected && !isCurrentlyOpen && !!lastOpenedShelf;
  const isManualBook = manuallySelected;

  // Book-level profiles
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

  // All-books profiles
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

  // Momento-level: active momento + top-5 profiles
  const userMomentos = snippedMoments || [];
  const latestMomento = userMomentos.length > 0 ? userMomentos[userMomentos.length - 1] : null;
  const activeMomento = focusedMoment
    || (selectedMomentoId ? userMomentos.find(m => m.id === selectedMomentoId) : null)
    || latestMomento;

  const rawMomentoProfiles = activeMomento
    ? profiles.filter(p =>
        !wavedNames.has(p.name) &&
        p.moments && p.moments.some(m => m.book === activeMomento.book)
      ).sort((a,b) => b.r - a.r)
    : [];
  const filteredMomentoProfiles = (() => {
    let list = rawMomentoProfiles;
    if (mLabelFilter.includes("think") && !mLabelFilter.includes("feel")) list = list.filter(p=>p.r>45);
    if (mLabelFilter.includes("feel") && !mLabelFilter.includes("think")) list = list.filter(p=>p.c>25);
    if (mLabelFilter.includes("think") && mLabelFilter.includes("feel")) list = list.filter(p=>p.r>45||p.c>25);
    if (mRcdFilter==="resonant")   list = list.filter(p=>p.r>p.c&&p.r>p.d);
    if (mRcdFilter==="contradict") list = list.filter(p=>p.c>p.r&&p.c>p.d);
    if (mRcdFilter==="diverge")    list = list.filter(p=>p.d>p.r&&p.d>p.c);
    return list.slice(0, 5);
  })();
  const mFilterActive = mLabelFilter.length > 0 || mRcdFilter;

  // onFirstProfileShown / onAnotherProfileShown
  const totalVisibleProfiles = new Set([
    ...filteredMomentoProfiles.map(p=>p.name),
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

  // Shared filter dropdown renderer to avoid repetition
  function FilterDropdown({labelF, setLabelF, rcdF, setRcdF, onClose}) {
    return (
      <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,zIndex:50,background:"var(--bg)",border:"1px solid var(--border)",borderRadius:10,boxShadow:"0 6px 22px rgba(0,0,0,0.12)",overflow:"hidden",width:196}}>
        <div style={{padding:"10px 11px 8px"}}>
          <p className="font-sans" style={{fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--text2)",margin:"0 0 7px",fontWeight:500}}>Reading style</p>
          <div style={{display:"flex",gap:6}}>
            {[{key:"think",label:"Think",desc:"Analytical lens"},{key:"feel",label:"Feel",desc:"Emotional lens"}].map(t=>(
              <button key={t.key}
                onClick={()=>{setLabelF(lf=>lf.includes(t.key)?lf.filter(k=>k!==t.key):[...lf,t.key]);setRcdF(null);}}
                style={{flex:1,padding:"6px 4px",background:labelF.includes(t.key)?"var(--amber2)":"transparent",border:`1.5px solid ${labelF.includes(t.key)?"var(--amber)":"var(--border)"}`,borderRadius:7,cursor:"pointer",textAlign:"center",transition:"all 150ms"}}>
                <p className="font-sans" style={{fontSize:11,fontWeight:labelF.includes(t.key)?700:400,color:labelF.includes(t.key)?"var(--amber)":"var(--text)",margin:"0 0 1px",lineHeight:1.2}}>{t.label}</p>
                <p className="font-sans" style={{fontSize:8,color:"var(--text2)",margin:0,lineHeight:1.2}}>{t.desc}</p>
              </button>
            ))}
          </div>
        </div>
        {labelF.length>0 && (
          <div style={{padding:"8px 11px 11px",borderTop:"1px solid var(--border2)"}}>
            <p className="font-sans" style={{fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--text2)",margin:"0 0 7px",fontWeight:500}}>
              {labelF.includes("think")&&labelF.includes("feel")?"Think & Feel":labelF.includes("think")?"Think":"Feel"} dominant in
            </p>
            <div style={{display:"flex",gap:5}}>
              {[{key:"resonant",label:"Resonant",color:"#2D8A4E"},{key:"contradict",label:"Contradict",color:"#C0392B"},{key:"diverge",label:"Diverge",color:"#7A7A6A"}].map(opt=>(
                <button key={opt.key}
                  onClick={()=>setRcdF(rf=>rf===opt.key?null:opt.key)}
                  style={{flex:1,padding:"5px 3px",background:rcdF===opt.key?opt.color+"22":"transparent",border:`1.5px solid ${rcdF===opt.key?opt.color:"var(--border)"}`,borderRadius:7,cursor:"pointer",textAlign:"center",transition:"all 150ms"}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:opt.color,margin:"0 auto 3px",opacity:rcdF===opt.key?1:0.4}}/>
                  <p className="font-sans" style={{fontSize:9,fontWeight:rcdF===opt.key?700:400,color:rcdF===opt.key?opt.color:"var(--text2)",margin:0,lineHeight:1.2}}>{opt.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}
        {(labelF.length>0||rcdF) && (
          <div style={{padding:"7px 11px 9px",borderTop:"1px solid var(--border2)"}}>
            <button onClick={()=>{setLabelF([]);setRcdF(null);onClose();}}
              style={{width:"100%",padding:"5px 0",background:"transparent",border:"1px solid var(--border)",borderRadius:6,cursor:"pointer",color:"var(--text2)",fontSize:10,fontFamily:"'DM Sans',sans-serif"}}>
              Clear filter
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",paddingTop:48,boxSizing:"border-box"}}>

      {/* ── Top bar ── */}
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

        {/* ══ TOP: Momento-level container (full width, CardNavigator style) ══ */}
        <div style={{background:"var(--bg)",padding:"12px 16px 0"}}>
          <div style={{borderRadius:14,border:"1.5px solid rgba(196,160,85,0.5)"}}>
          <div style={{position:"relative"}}>
            {/* Header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px 9px",background:"var(--card)",borderRadius:"14px 14px 0 0",borderBottom:"1.5px solid rgba(196,160,85,0.5)"}}>
              {sectionCount!==4 && (
              <div style={{minWidth:0,flex:1,paddingRight:10}}>
                <p className="font-serif" style={{fontSize:sectionCount===1?16:13,fontWeight:400,color:"var(--amber)",margin:0,lineHeight:sectionCount===1?1.2:1.4,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                  {activeMomento
                    ? (focusedMoment
                        ? <>Readers for this momento in <strong style={{fontWeight:700}}>{activeMomento.book}</strong></>
                        : <>Readers for your latest momento in <strong style={{fontWeight:700}}>{activeMomento.book}</strong></>)
                    : <>Readers for your momentos</>}
                </p>
              </div>
              )}
              <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
                {/* Momento picker chip */}
                {userMomentos.length > 0 && (
                <button onClick={()=>{setMomentoDropOpen(o=>!o);setMFilterDropOpen(false);}} title="Switch momento"
                  style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",height:24,background:(momentoDropOpen||!!selectedMomentoId||!!focusedMoment)?"var(--amber2)":"var(--card)",border:`1px solid ${(momentoDropOpen||!!selectedMomentoId||!!focusedMoment)?"var(--amber)":"var(--border)"}`,borderRadius:999,cursor:"pointer",color:(momentoDropOpen||!!selectedMomentoId||!!focusedMoment)?"var(--amber)":"var(--text2)",transition:"all 150ms",flexShrink:0,maxWidth:150}}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                  <span className="font-sans" style={{fontSize:8,fontWeight:600,letterSpacing:"0.04em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:90}}>
                    {activeMomento ? (activeMomento.passage||"").slice(0,22)+"…" : "momentos"}
                  </span>
                  <svg width="7" height="7" viewBox="0 0 10 10" fill="none" style={{flexShrink:0,transform:momentoDropOpen?"rotate(180deg)":"none",transition:"transform 200ms"}}>
                    <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                )}
                {/* Clear focused momento (drag mode) */}
                {focusedMoment && (
                <button onClick={onClear} title="Back to latest momento"
                  style={{flexShrink:0,width:18,height:18,borderRadius:"50%",background:"transparent",border:"1px solid rgba(139,105,20,0.25)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"var(--text2)",lineHeight:1,marginLeft:-1}}>×</button>
                )}
                {/* Filter chip */}
                <button onClick={()=>{setMFilterDropOpen(o=>!o);setMomentoDropOpen(false);}} title="Filter by reading style"
                  style={{display:"flex",alignItems:"center",gap:3,padding:"3px 8px",height:24,background:(mFilterDropOpen||mFilterActive)?"var(--amber2)":"var(--card)",border:`1px solid ${(mFilterDropOpen||mFilterActive)?"var(--amber)":"var(--border)"}`,borderRadius:999,cursor:"pointer",color:(mFilterDropOpen||mFilterActive)?"var(--amber)":"var(--text2)",transition:"all 150ms",flexShrink:0}}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                  </svg>
                  {mFilterActive && (
                    <span className="font-sans" style={{fontSize:8,fontWeight:600,letterSpacing:"0.04em",lineHeight:1}}>
                      {mLabelFilter.includes("think")&&mLabelFilter.includes("feel")?"Think+Feel":mLabelFilter.includes("think")?"Think":mLabelFilter.includes("feel")?"Feel":""}
                      {mLabelFilter.length>0&&mRcdFilter?" · ":""}
                      {mRcdFilter==="resonant"?"R":mRcdFilter==="contradict"?"C":mRcdFilter==="diverge"?"D":""}
                    </span>
                  )}
                </button>
                {sectionCount===4 && (
                  <span className="font-sans" style={{fontSize:8,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(139,105,20,0.55)",whiteSpace:"nowrap",marginLeft:4}}>
                    {filteredMomentoProfiles.length} {filteredMomentoProfiles.length===1?"reader":"readers"}
                  </span>
                )}
              </div>
            </div>

            {/* Momento picker dropdown */}
            {momentoDropOpen && (
              <>
                <div onClick={()=>setMomentoDropOpen(false)} style={{position:"fixed",inset:0,zIndex:49}}/>
                <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:50,background:"var(--bg)",border:"1px solid rgba(196,160,85,0.4)",borderRadius:10,boxShadow:"0 6px 22px rgba(139,105,20,0.14)",overflow:"hidden"}}>
                  <div style={{padding:"8px 10px",maxHeight:190,overflowY:"auto"}} className="panel-scroll">
                    {userMomentos.slice().reverse().map(function(m, i) {
                      const isSelected = activeMomento && m.id === activeMomento.id;
                      return (
                        <button key={m.id||i}
                          onClick={()=>{setSelectedMomentoId(m.id);if(focusedMoment)onClear&&onClear();setMomentoDropOpen(false);}}
                          style={{width:"100%",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:2,background:isSelected?"var(--amber2)":"none",border:isSelected?"1px solid rgba(196,160,85,0.5)":"1px solid transparent",borderRadius:7,padding:"7px 10px",cursor:"pointer",textAlign:"left",transition:"background 150ms",marginBottom:4}}>
                          <p className="font-reading" style={{fontSize:10.5,fontStyle:"italic",color:"var(--text)",margin:0,lineHeight:1.5,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>"{(m.passage||"").slice(0,80)}{m.passage&&m.passage.length>80?"…":""}"</p>
                          <p className="font-sans" style={{fontSize:8.5,color:"var(--amber)",margin:0,fontWeight:600}}>{m.book}{m.pg?" · p."+m.pg:""}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Momento filter dropdown */}
            {mFilterDropOpen && (
              <>
                <div onClick={()=>setMFilterDropOpen(false)} style={{position:"fixed",inset:0,zIndex:49}}/>
                <FilterDropdown labelF={mLabelFilter} setLabelF={setMLabelFilter} rcdF={mRcdFilter} setRcdF={setMRcdFilter} onClose={()=>setMFilterDropOpen(false)}/>
              </>
            )}
          </div>{/* end position:relative */}

          {/* Body */}
          {userMomentos.length === 0 ? (
            <div style={{padding:"20px 18px 24px",display:"flex",alignItems:"flex-start",gap:12,background:"linear-gradient(180deg, var(--card) 0%, color-mix(in srgb, var(--card) 92%, var(--amber2) 8%) 100%)",borderTop:"none",borderRadius:"0 0 14px 14px"}}>
              <div style={{width:2,alignSelf:"stretch",background:"rgba(139,105,20,0.2)",borderRadius:1,flexShrink:0}}/>
              <p className="font-sans" style={{fontSize:10,color:"var(--text2)",margin:0,lineHeight:1.6}}>Capture Moments and make them momentos to find close Readers for those.</p>
            </div>
          ) : filteredMomentoProfiles.length > 0 ? (
            <CardNavigator profiles={filteredMomentoProfiles} exitingNames={exitingNames} cardWidth={265} cardHeight={420} focusedMoment={focusedMoment} onOpenWhisper={onOpenWhisper} onWave={handleWave} sectionCount={sectionCount}/>
          ) : rawMomentoProfiles.length > 0 ? (
            <div style={{padding:"16px 18px 22px",display:"flex",alignItems:"flex-start",gap:12,background:"linear-gradient(180deg, var(--card) 0%, color-mix(in srgb, var(--card) 92%, var(--amber2) 8%) 100%)",borderTop:"none",borderRadius:"0 0 14px 14px"}}>
              <div style={{width:2,alignSelf:"stretch",background:"rgba(139,105,20,0.2)",borderRadius:1,flexShrink:0}}/>
              <div>
                <p className="font-serif" style={{fontSize:12,fontStyle:"italic",color:"var(--text)",margin:"0 0 3px",lineHeight:1.5}}>No readers match this filter.</p>
                <p className="font-sans" style={{fontSize:9.5,color:"var(--text2)",margin:0,lineHeight:1.5}}>Try adjusting or clearing the filter.</p>
              </div>
            </div>
          ) : (
            <div style={{padding:"20px 18px 24px",display:"flex",alignItems:"flex-start",gap:12,background:"linear-gradient(180deg, var(--card) 0%, color-mix(in srgb, var(--card) 92%, var(--amber2) 8%) 100%)",borderTop:"none",borderRadius:"0 0 14px 14px"}}>
              <div style={{width:2,alignSelf:"stretch",background:"rgba(139,105,20,0.2)",borderRadius:1,flexShrink:0}}/>
              <p className="font-sans" style={{fontSize:10,color:"var(--text2)",margin:0,lineHeight:1.6}}>No close readers found for this momento yet. Capture more to discover your readers.</p>
            </div>
          )}
          </div>{/* end shadow wrapper */}
        </div>

        {/* ══ BOTTOM ROW: Book + All books side by side ══ */}
        <div style={{display:"flex",gap:8,padding:"8px 16px 14px",alignItems:"stretch"}}>

          {/* ── Left: Book-level container (compact, ProfileScrollRow style) ── */}
          <div style={{flex:1,minWidth:0,borderRadius:14,border:"1px solid rgba(139,105,20,0.18)",boxShadow:"0 8px 22px rgba(139,105,20,0.10),0 1px 4px rgba(0,0,0,0.05)",position:"relative",display:"flex",flexDirection:"column",overflow:"visible"}}>
            <div style={{position:"relative"}}>
              <div style={{display:"flex",alignItems:"center",gap:4,padding:"10px 10px 8px",background:"linear-gradient(180deg, color-mix(in srgb, var(--card2) 90%, var(--amber2) 10%) 0%, var(--card2) 100%)",borderBottom:"1px solid rgba(139,105,20,0.1)",borderRadius:"14px 14px 0 0"}}>
                <div style={{display:"flex",flexDirection:"column",gap:1,flex:1,minWidth:0}}>
                  <p className="font-sans" style={{fontSize:7,letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--amber)",margin:0,lineHeight:1,fontWeight:700}}>This book</p>
                  <p className="font-serif" style={{fontSize:12,fontWeight:700,color:"var(--text)",margin:0,lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentBook.title}</p>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0}}>
                  {(isCurrentlyOpen||isLastOpened) && (
                    <span style={{width:6,height:6,borderRadius:"50%",background:isCurrentlyOpen?"#3a9e4e":"rgba(196,160,85,0.7)",boxShadow:isCurrentlyOpen?"0 0 4px rgba(58,158,78,0.7)":"0 0 4px rgba(196,160,85,0.4)",flexShrink:0,display:"inline-block"}}/>
                  )}
                  <button onClick={()=>{setBookDropOpen(o=>!o);setLabelDropOpen(false);}} title="Switch book"
                    style={{display:"flex",alignItems:"center",gap:3,padding:"2px 6px",height:22,background:(bookDropOpen||isManualBook)?"var(--amber2)":"var(--card)",border:`1px solid ${(bookDropOpen||isManualBook)?"var(--amber)":"var(--border)"}`,borderRadius:999,cursor:"pointer",color:(bookDropOpen||isManualBook)?"var(--amber)":"var(--text2)",transition:"all 150ms",flexShrink:0}}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                    <svg width="7" height="7" viewBox="0 0 10 10" fill="none" style={{flexShrink:0,transform:bookDropOpen?"rotate(180deg)":"none",transition:"transform 200ms"}}>
                      <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button onClick={()=>{setLabelDropOpen(o=>!o);setBookDropOpen(false);}} title="Filter"
                    style={{display:"flex",alignItems:"center",gap:2,padding:"2px 6px",height:22,background:(labelDropOpen||filterActive)?"var(--amber2)":"var(--card)",border:`1px solid ${(labelDropOpen||filterActive)?"var(--amber)":"var(--border)"}`,borderRadius:999,cursor:"pointer",color:(labelDropOpen||filterActive)?"var(--amber)":"var(--text2)",transition:"all 150ms",flexShrink:0}}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
              {/* Book shelf dropdown */}
              {bookDropOpen && (
                <>
                  <div onClick={()=>setBookDropOpen(false)} style={{position:"fixed",inset:0,zIndex:49}}/>
                  <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:50,background:"var(--bg)",border:"1px solid rgba(196,160,85,0.4)",borderRadius:10,boxShadow:"0 6px 22px rgba(139,105,20,0.14)",overflow:"hidden"}}>
                    <div style={{padding:"10px 12px",display:"flex",gap:8,overflowX:"auto",scrollSnapType:"x mandatory",WebkitOverflowScrolling:"touch"}} className="panel-scroll">
                      {filterableBooks.length > 0 ? filterableBooks.map(b => {
                        const isSelected = b.id === selectedBookId;
                        return (
                          <button key={b.id} onClick={()=>{setSelectedBookId(b.id);setBookDropOpen(false);}}
                            style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",padding:0,scrollSnapAlign:"start",opacity:isSelected?1:0.72,transition:"opacity 150ms"}}>
                            <div style={{width:38,height:54,borderRadius:3,overflow:"hidden",boxShadow:isSelected?"0 0 0 2px var(--amber), 0 4px 10px rgba(139,105,20,0.28)":"0 2px 6px rgba(0,0,0,0.18)",transition:"box-shadow 150ms"}}>
                              <div style={{width:"100%",height:"100%"}} dangerouslySetInnerHTML={{__html:makeShelfCoverSVG(b)}}/>
                            </div>
                            <p className="font-sans" style={{fontSize:7.5,color:isSelected?"var(--amber)":"var(--text2)",fontWeight:isSelected?700:400,margin:0,maxWidth:44,textAlign:"center",lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.title}</p>
                          </button>
                        );
                      }) : (
                        <p className="font-sans" style={{fontSize:10,color:"var(--text2)",fontStyle:"italic",margin:"4px 0",lineHeight:1.5}}>Capture moments to see books here.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
              {/* Book filter dropdown */}
              {labelDropOpen && (
                <>
                  <div onClick={()=>setLabelDropOpen(false)} style={{position:"fixed",inset:0,zIndex:49}}/>
                  <FilterDropdown labelF={labelFilter} setLabelF={setLabelFilter} rcdF={rcdFilter} setRcdF={setRcdFilter} onClose={()=>setLabelDropOpen(false)}/>
                </>
              )}
            </div>{/* end position:relative */}

            {/* Book body */}
            {filteredBookProfiles.length > 0 ? (
              <div style={{background:"var(--card2)",borderRadius:"0 0 14px 14px",flex:1,overflow:"hidden"}}>
                <ProfileScrollRow profiles={filteredBookProfiles} exitingNames={exitingNames} focusedMoment={focusedMoment} onOpenWhisper={onOpenWhisper} onWave={handleWave}/>
              </div>
            ) : bookProfiles.length > 0 ? (
              <div style={{padding:"12px 12px 16px",display:"flex",alignItems:"flex-start",gap:8,background:"var(--card2)",borderRadius:"0 0 14px 14px",flex:1}}>
                <div style={{width:2,alignSelf:"stretch",background:"rgba(139,105,20,0.2)",borderRadius:1,flexShrink:0}}/>
                <div>
                  <p className="font-serif" style={{fontSize:11,fontStyle:"italic",color:"var(--text)",margin:"0 0 2px",lineHeight:1.5}}>No readers match this filter.</p>
                  <p className="font-sans" style={{fontSize:9,color:"var(--text2)",margin:0,lineHeight:1.5}}>Try adjusting or clearing.</p>
                </div>
              </div>
            ) : (
              <div style={{padding:"12px 12px 36px",display:"flex",alignItems:"flex-start",gap:8,background:"var(--card2)",borderRadius:"0 0 14px 14px",flex:1}}>
                <div style={{width:2,alignSelf:"stretch",background:"rgba(139,105,20,0.2)",borderRadius:1,flexShrink:0}}/>
                <p className="font-sans" style={{fontSize:9.5,color:"var(--text2)",margin:0,lineHeight:1.6}}>Capture Moments to find readers here.</p>
              </div>
            )}
            <span className="font-sans" style={{position:"absolute",bottom:8,right:8,fontSize:7,color:"var(--text2)",letterSpacing:"0.08em",textTransform:"uppercase",background:"rgba(139,105,20,0.08)",borderRadius:999,padding:"3px 6px",fontWeight:600,pointerEvents:"none"}}>
              {filterActive?`${filteredBookProfiles.length}/`:""}{bookProfiles.length} readers
            </span>
          </div>

          {/* ── Right: All-books container ── */}
          <div style={{flex:1,minWidth:0,borderRadius:14,border:"1px solid rgba(139,105,20,0.18)",boxShadow:"0 8px 22px rgba(139,105,20,0.10),0 1px 4px rgba(0,0,0,0.05)",position:"relative",display:"flex",flexDirection:"column",overflow:"visible"}}>
            <div style={{position:"relative"}}>
              <div style={{display:"flex",alignItems:"center",gap:4,padding:"10px 10px 8px",background:"linear-gradient(180deg, color-mix(in srgb, var(--card2) 90%, var(--amber2) 10%) 0%, var(--card2) 100%)",borderBottom:"1px solid rgba(139,105,20,0.1)",borderRadius:"14px 14px 0 0"}}>
                <div style={{display:"flex",flexDirection:"column",gap:1,flex:1,minWidth:0}}>
                  <p className="font-sans" style={{fontSize:7,letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--amber)",margin:0,lineHeight:1,fontWeight:700}}>All your reading</p>
                  <p className="font-serif" style={{fontSize:12,fontWeight:700,color:"var(--text)",margin:0,lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Across all books</p>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0}}>
                  <span className="font-sans" style={{fontSize:7.5,fontWeight:700,letterSpacing:"0.06em",color:"var(--amber)",background:"var(--amber2)",borderRadius:999,padding:"2px 6px",whiteSpace:"nowrap"}}>{userMomentBooks.length} bks</span>
                  <button onClick={()=>{setODropOpen(o=>!o);}} title="Filter"
                    style={{display:"flex",alignItems:"center",gap:2,padding:"2px 6px",height:22,background:(oDropOpen||oFilterActive)?"var(--amber2)":"var(--card)",border:`1px solid ${(oDropOpen||oFilterActive)?"var(--amber)":"var(--border)"}`,borderRadius:999,cursor:"pointer",color:(oDropOpen||oFilterActive)?"var(--amber)":"var(--text2)",transition:"all 150ms",flexShrink:0}}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                    </svg>
                    {oFilterActive && (
                      <span className="font-sans" style={{fontSize:8,fontWeight:600,letterSpacing:"0.04em",lineHeight:1}}>
                        {oLabelFilter.includes("think")&&oLabelFilter.includes("feel")?"T+F":oLabelFilter.includes("think")?"T":oLabelFilter.includes("feel")?"F":""}
                        {oLabelFilter.length>0&&oRcdFilter?" · ":""}
                        {oRcdFilter==="resonant"?"R":oRcdFilter==="contradict"?"C":oRcdFilter==="diverge"?"D":""}
                      </span>
                    )}
                  </button>
                </div>
              </div>
              {/* All-books filter dropdown */}
              {oDropOpen && (
                <>
                  <div onClick={()=>setODropOpen(false)} style={{position:"fixed",inset:0,zIndex:49}}/>
                  <FilterDropdown labelF={oLabelFilter} setLabelF={setOLabelFilter} rcdF={oRcdFilter} setRcdF={setORcdFilter} onClose={()=>setODropOpen(false)}/>
                </>
              )}
            </div>{/* end position:relative */}

            {/* All-books body */}
            {filteredOverallProfiles.length > 0 ? (
              <div style={{background:"var(--card2)",borderRadius:"0 0 14px 14px",flex:1,overflow:"hidden"}}>
                <ProfileScrollRow profiles={filteredOverallProfiles} exitingNames={exitingNames} focusedMoment={focusedMoment} onOpenWhisper={onOpenWhisper} onWave={handleWave}/>
              </div>
            ) : (
              <div style={{padding:"12px 12px 36px",display:"flex",alignItems:"flex-start",gap:8,background:"var(--card2)",borderRadius:"0 0 14px 14px",flex:1}}>
                <div style={{width:2,alignSelf:"stretch",background:"rgba(139,105,20,0.2)",borderRadius:1,flexShrink:0}}/>
                <div>
                  <p className="font-serif" style={{fontSize:11,fontStyle:"italic",color:"var(--text)",margin:"0 0 2px",lineHeight:1.5}}>No readers match this filter.</p>
                  <p className="font-sans" style={{fontSize:9,color:"var(--text2)",margin:0,lineHeight:1.5}}>Try adjusting or clearing.</p>
                </div>
              </div>
            )}
            <span className="font-sans" style={{position:"absolute",bottom:8,right:8,fontSize:7,color:"var(--text2)",letterSpacing:"0.08em",textTransform:"uppercase",background:"rgba(139,105,20,0.08)",borderRadius:999,padding:"3px 6px",fontWeight:600,pointerEvents:"none"}}>
              {oFilterActive?`${filteredOverallProfiles.length}/`:""}{overallProfiles.length} readers
            </span>
          </div>

        </div>{/* end bottom row */}

      </div>
    </div>
  );
}
