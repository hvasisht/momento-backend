/* â"€â"€ WHISPER CARD — read-only shared moment/momento â"€â"€ */
function WhisperCard({msg, isYou, senderName}) {
  const senderInterp = msg.senderInterp !== undefined ? msg.senderInterp : (msg.interpretation || null);
  return (
    <div style={{
      maxWidth:"92%",
      background:"var(--card)",
      border:`1px solid rgba(139,105,20,${isYou?0.22:0.16})`,
      borderRadius: isYou?"10px 3px 10px 10px":"3px 10px 10px 10px",
      boxShadow:"2px 0 6px rgba(139,105,20,0.06), -2px 0 6px rgba(139,105,20,0.06)",
      overflow:"hidden",
      position:"relative",
    }}>
      <div style={{position:"absolute",top:0,right:0,width:14,height:14,background:"linear-gradient(225deg,transparent 50%,rgba(139,105,20,0.12) 50%)"}}/>
      <div style={{position:"absolute",left:16,top:10,bottom:0,width:3,background:"var(--amber)",borderRadius:1}}/>
      {/* Passage */}
      <div style={{padding:"11px 14px 9px 26px",borderBottom:senderInterp?"1px solid rgba(139,105,20,0.07)":"none"}}>
        <span className="font-serif" style={{fontSize:10,fontStyle:"italic",color:"var(--amber)",fontWeight:500}}>{msg.book}</span>
        <div style={{background:"var(--card)",borderRadius:3,padding:"8px 10px",borderLeft:"2px solid rgba(139,105,20,0.18)",marginTop:6}}>
          <p className="font-reading" style={{fontSize:12,lineHeight:1.8,color:"var(--text)",margin:0,fontStyle:"italic"}}>"{msg.passage}"</p>
        </div>
      </div>
      {/* Sender's interpretation */}
      {senderInterp && (
        <div style={{padding:"9px 14px 12px 26px"}}>
          <span className="font-sans" style={{fontSize:8,letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--amber)",opacity:0.6,display:"block",marginBottom:4}}>
            {isYou ? "You" : senderName}
          </span>
          <p style={{fontFamily:"'Kalam',cursive",fontSize:14,lineHeight:1.6,color:"var(--text)",margin:0,fontWeight:400}}>{senderInterp}</p>
        </div>
      )}
    </div>
  );
}

/* â"€â"€ CARD REPLY AREA — interpretation reply below a received card â"€â"€ */

const DEFAULT_THREAD = [
  {from:"them", type:"card", passage:"It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.", book:"Pride and Prejudice", senderInterp:"Austen is not mocking marriage — she is mourning a world where women had no other door. The irony is the cage itself.", receiverInterp:null, time:"2m ago"},
  {from:"you",  type:"card", passage:"It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.", book:"Pride and Prejudice", senderInterp:"The irony cuts both ways. The 'truth' is universally acknowledged precisely because no one dares question it out loud.", receiverInterp:null, time:"1m ago"},
  {from:"them", type:"text", text:"This passage hits differently when you consider Austen was writing it while unmarried herself.", time:"45s ago"},
  {from:"them", type:"card", passage:"Whenever you feel like criticizing anyone, remember that all the people in this world haven't had the advantages that you have had.", book:"The Great Gatsby", senderInterp:"His father's generosity sounds like wisdom but lands like a quiet accusation. Empathy framed as debt.", receiverInterp:null, time:"just now"},
];

function WhisperThread({profile, onClose, onSnip, pendingMoment=null, onOpenMoments, onResolvePendingMoment, onSent, savedThread, onThreadUpdate, currentUser}) {
  const [showProfileOverlay, setShowProfileOverlay] = React.useState(false);
  const [thread,        setThread]        = useState(()=>savedThread||DEFAULT_THREAD);
  const [showWhisper,   setShowWhisper]   = useState(false);
  const [whisperText,   setWhisperText]   = useState("");

  /* ── Firestore thread ID: sorted UIDs so both sides get same doc ── */
  const threadId = React.useMemo(() => {
    if (!currentUser) return null;
    const theirId = profile.userId || ('user_' + profile.name.replace(/\s+/g,'_').toLowerCase());
    return [currentUser.uid, theirId].sort().join('__');
  }, [currentUser, profile.name, profile.userId]);

  /* ── Subscribe to real-time messages ── */
  useEffect(() => {
    if (!threadId || typeof firebase === 'undefined') return;
    const db = firebase.firestore();
    const unsub = db.collection('threads').doc(threadId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .onSnapshot((snapshot) => {
        if (snapshot.empty) return;
        const msgs = snapshot.docs.map(doc => {
          const d = doc.data();
          const isYou = currentUser && d.senderId === currentUser.uid;
          const ts = d.timestamp ? d.timestamp.toDate() : new Date();
          const timeStr = ts.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
          return {
            from: isYou ? 'you' : 'them',
            type: d.type || 'text',
            text: d.text || '',
            passage: d.passage || '',
            book: d.book || '',
            senderInterp: d.senderInterp || null,
            receiverInterp: null,
            time: timeStr,
          };
        });
        if (msgs.length > 0) setThread(msgs);
      });
    return () => unsub();
  }, [threadId]);
  const [viewMode,    setViewMode]    = useState("default");
  const [showThreadMenu,setShowThreadMenu]= useState(false);
  const [pendingCard, setPendingCard] = useState(pendingMoment);
  const [pendingInterp,setPendingInterp]=useState("");
  const [searchText,  setSearchText]  = useState("");
  const [cardSubTab,  setCardSubTab]  = useState("moments");
  const [scrollToMsg,    setScrollToMsg]    = useState(null);
  const [searchMatchIdx, setSearchMatchIdx] = useState(0);
  const scrollRef = useRef(null);
  const msgRefs   = useRef(new Map());

  useEffect(()=>{ setSearchMatchIdx(0); }, [searchText]);

  useEffect(()=>{
    if(scrollToMsg && viewMode==="default") {
      const el = msgRefs.current.get(scrollToMsg);
      if(el) el.scrollIntoView({behavior:"smooth", block:"center"});
      setScrollToMsg(null);
    }
  }, [scrollToMsg, viewMode]);

  const VIEW_OPTIONS = [
    {id:"default",       label:"Default",                      sub:"All messages in order"},
    {id:"momento-list",  label:"Shared Moments and Momentos",  sub:"Moments · Momentos"},
    {id:"whispers-only", label:"Whispers only",                sub:"Text messages only"},
  ];

  useEffect(()=>{
    if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  },[thread, viewMode]);

  useEffect(()=>{ onThreadUpdate&&onThreadUpdate(thread); },[thread]);

  useEffect(()=>{
    setPendingCard(pendingMoment||null);
    setPendingInterp((pendingMoment&&pendingMoment.interpretation)||"");
  },[pendingMoment]);

  const _firestoreSend = (payload) => {
    if (!threadId || !currentUser || typeof firebase === 'undefined') return false;
    firebase.firestore()
      .collection('threads').doc(threadId)
      .collection('messages')
      .add({ ...payload, senderId: currentUser.uid, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
    return true;
  };

  const handleSendMomento = (cardData) => {
    const {interpretation, ...rest} = cardData;
    const sent = _firestoreSend({ type:'card', passage:rest.passage||'', book:rest.book||'', senderInterp:interpretation||null });
    if (!sent) setThread(prev=>[...prev, {from:"you", type:"card", ...rest, senderInterp:interpretation||null, receiverInterp:null, time:"just now"}]);
    onSnip&&onSnip({...cardData});
    onSent&&onSent("card");
  };
  const handleSendText = () => {
    if(!whisperText.trim()) return;
    const sent = _firestoreSend({ type:'text', text:whisperText.trim() });
    if (!sent) setThread(prev=>[...prev, {from:"you", type:"text", text:whisperText.trim(), time:"just now"}]);
    setWhisperText(""); setShowWhisper(false);
    onSent&&onSent("whisper");
  };
  const handleSendPendingMoment = () => {
    if(!pendingCard) return;
    const interp = pendingInterp||pendingCard.interpretation||pendingCard.senderInterp||null;
    const {interpretation, senderInterp:_si, receiverInterp:_ri, ...rest} = pendingCard;
    const sent = _firestoreSend({ type:'card', passage:rest.passage||'', book:rest.book||'', senderInterp:interp||null });
    if (!sent) setThread(prev=>[...prev,{from:"you",type:"card",...rest,senderInterp:interp,receiverInterp:null,time:"just now"}]);
    onSent&&onSent("card");
    onSnip&&onSnip({...rest, interpretation:interp});
    setPendingCard(null);
    setPendingInterp("");
    onResolvePendingMoment&&onResolvePendingMoment();
  };

  const firstName = profile.name.split(" ")[0];
  const normalizedSearch = searchText.trim().toLowerCase();
  const matchesSearch = (msg) => {
    if(!normalizedSearch) return true;
    const haystacks = [
      msg.type,
      msg.book,
      msg.time,
      msg.passage,
      msg.interpretation,
      msg.text,
      msg.from==="you" ? "you" : firstName,
      msg.from==="you" ? "your" : profile.name,
    ].filter(Boolean).join(" ").toLowerCase();
    return haystacks.includes(normalizedSearch);
  };
  const filteredThread = thread.filter(matchesSearch);
  const matchingMsgs   = normalizedSearch ? thread.filter(matchesSearch) : [];
  const matchCount     = matchingMsgs.length;

  useEffect(()=>{
    if(!normalizedSearch || !matchingMsgs.length) return;
    const idx = Math.max(0, Math.min(searchMatchIdx, matchingMsgs.length-1));
    const el = msgRefs.current.get(matchingMsgs[idx]);
    if(el) el.scrollIntoView({behavior:"smooth", block:"center"});
  }, [searchMatchIdx, searchText]);

  /* â"€â"€ Momento list view — mini tab per card â"€â"€ */
  const renderMomentoList = () => {
    const allCards   = filteredThread.filter(m=>m.type==="card");
    const moments    = allCards.filter(m=>!(m.senderInterp||m.interpretation));
    const momentos   = allCards.filter(m=>!!(m.senderInterp||m.interpretation));
    const cards      = cardSubTab==="moments" ? moments : momentos;
    const emptyLabel = cardSubTab==="moments"
      ? (normalizedSearch ? "No moments match your search" : "No moments shared yet")
      : (normalizedSearch ? "No momentos match your search" : "No momentos shared yet");
    return (
      <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
        <div style={{display:"flex",gap:0,borderBottom:"1px solid rgba(139,105,20,0.1)",flexShrink:0}}>
          {[{id:"moments",label:"Moments"},{id:"momentos",label:"Momentos"}].map(tab=>(
            <button key={tab.id} onClick={()=>setCardSubTab(tab.id)} className="font-sans"
              style={{flex:1,padding:"10px 0",border:"none",borderBottom:"2px solid "+(cardSubTab===tab.id?"var(--amber)":"transparent"),
                background:"transparent",cursor:"pointer",fontSize:10,fontWeight:600,
                color:cardSubTab===tab.id?"var(--amber)":"var(--text2)",transition:"all 150ms",
                marginBottom:-1}}>
              {tab.label}
              <span style={{marginLeft:5,fontSize:8,opacity:0.7,fontWeight:400}}>
                {tab.id==="moments"?moments.length:momentos.length}
              </span>
            </button>
          ))}
        </div>
        {!cards.length ? (
          <div style={{padding:"32px 16px",textAlign:"center"}}>
            <p className="font-sans" style={{fontSize:11,color:"var(--text)",fontStyle:"italic"}}>{emptyLabel}</p>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:6,padding:"12px 16px",overflowY:"auto",flex:1}}>
            {cards.map((msg,i)=>{
              const isYou = msg.from==="you";
              const interp = msg.senderInterp||msg.interpretation||null;
              return (
                <div key={i}
                  onClick={()=>{ setViewMode("default"); setShowThreadMenu(false); setScrollToMsg(msg); }}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",
                    background:"var(--card)",border:"1px solid rgba(139,105,20,0.15)",
                    borderLeft:"3px solid var(--amber)",borderRadius:6,cursor:"pointer",transition:"background 120ms"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(139,105,20,0.06)"}
                  onMouseLeave={e=>e.currentTarget.style.background="var(--card)"}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                      <span className="font-serif" style={{fontSize:8,fontStyle:"italic",color:"var(--amber)",flexShrink:0}}>{msg.book}</span>
                      <span className="font-sans" style={{fontSize:8,color:"var(--text2)"}}>·</span>
                      <span className="font-sans" style={{fontSize:8,color:"var(--text2)"}}>{isYou?"You":firstName}</span>
                    </div>
                    <p className="font-reading" style={{fontSize:10,lineHeight:1.4,color:"var(--text)",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontStyle:"italic"}}>
                      {"“"}{msg.passage.slice(0,65)}{msg.passage.length>65?"…":""}{"”"}
                    </p>
                    {interp && (
                      <p style={{fontFamily:"'Kalam',cursive",fontSize:11.5,lineHeight:1.35,color:"var(--text2)",margin:"3px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:400}}>
                        {interp.slice(0,60)}{interp.length>60?"…":""}
                      </p>
                    )}
                  </div>
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="none" style={{flexShrink:0,opacity:0.35}}>
                    <path d="M1 1l6 5-6 5" stroke="var(--amber)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  /* â"€â"€ Whispers only view â"€â"€ */
  const renderWhispersOnly = () => {
    const texts = filteredThread.filter(m=>m.type==="text");
    if(!texts.length) return (
      <div style={{padding:"32px 16px",textAlign:"center"}}>
        <p className="font-sans" style={{fontSize:11,color:"var(--text)",fontStyle:"italic"}}>{normalizedSearch?"No whispers match your search":"No whispers yet"}</p>
      </div>
    );
    return (
      <div style={{display:"flex",flexDirection:"column",gap:10,padding:"16px"}}>
        {texts.map((msg,i)=>{
          const isYou = msg.from==="you";
          return (
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:isYou?"flex-end":"flex-start",gap:3}}>
              <span className="font-sans" style={{fontSize:8,color:"var(--text)",paddingLeft:isYou?0:4,paddingRight:isYou?4:0}}>
                {isYou?"You":firstName} · {msg.time}
              </span>
              <div style={{maxWidth:"80%",padding:"8px 13px",background:isYou?"rgba(139,105,20,0.1)":"rgba(139,105,20,0.05)",border:"1px solid rgba(139,105,20,0.18)",borderRadius:isYou?"16px 4px 16px 16px":"4px 16px 16px 16px"}}>
                <p className="font-sans" style={{fontSize:12,lineHeight:1.6,color:"var(--text)",margin:0}}>{msg.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:"var(--bg)",position:"relative",paddingTop:48,boxSizing:"border-box"}}
      onClick={()=>{ if(showThreadMenu) setShowThreadMenu(false); }}>

      {/* â"€â"€ Header â"€â"€ */}
      <div style={{flexShrink:0,padding:"10px 16px 12px",borderBottom:"1px solid var(--border2)"}}>
        <div style={{display:"grid",gridTemplateColumns:"auto auto 1fr auto auto",alignItems:"center",columnGap:10,position:"relative"}}>
          <button onClick={e=>{e.stopPropagation();onClose();}} style={{display:"flex",alignItems:"center",justifyContent:"center",width:30,height:30,borderRadius:"50%",background:"rgba(139,105,20,0.07)",border:"1px solid rgba(139,105,20,0.22)",cursor:"pointer",color:"var(--amber)",fontSize:16,lineHeight:1,padding:0,flexShrink:0}}>←</button>
          <div style={{minWidth:115,flexShrink:0}}>
            <p className="font-serif" style={{fontSize:13.5,fontWeight:600,color:"var(--text)",margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{profile.name}</p>
            <p className="font-sans" style={{fontSize:8.5,color:"var(--text)",margin:"1px 0 0",letterSpacing:"0.04em",whiteSpace:"nowrap"}}>Whisper</p>
          </div>
          <div />
          {(()=>{
            const tC = typeof getRCDGlyphColor!=="undefined" ? getRCDGlyphColor(profile.rt||profile.r, profile.ct||profile.c, profile.dt||profile.d) : "#2D8A4E";
            const fC = typeof getRCDGlyphColor!=="undefined" ? getRCDGlyphColor(profile.rf||profile.r, profile.cf||profile.c, profile.df||profile.d) : "#C0392B";
            return (
              <div style={{position:"relative",flexShrink:0,width:56,height:28}}>
                <svg width="28" height="28" viewBox="-6 9 66 67" style={{display:"block",position:"absolute",top:0,left:0}}>
                  <rect x="-3" y="12" width="46" height="55" rx="10" fill="var(--amber3)" stroke="var(--amber)" strokeOpacity="0.35" strokeWidth="1.2"/>
                  <text x="4" y="50" fontFamily="'Playfair Display',serif" fontWeight="700" fontSize="42" fill={tC}>t</text>
                  <text x="36" y="50" fontFamily="'Playfair Display',serif" fontWeight="700" fontSize="42" fill={fC} transform="translate(72,80) rotate(180)">t</text>
                </svg>
                <button onClick={e=>{e.stopPropagation();setShowProfileOverlay(true);}}
                  style={{position:"absolute",inset:0,width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,border:"1px solid rgba(139,105,20,0.35)",background:"var(--bg)",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:7,fontWeight:700,color:"var(--amber)",letterSpacing:"0.08em",textTransform:"uppercase",whiteSpace:"nowrap",padding:0}}>
                  view them
                </button>
              </div>
            );
          })()}
          <div style={{position:"relative",flexShrink:0}}>
            <button onClick={e=>{e.stopPropagation();setShowThreadMenu(v=>!v);}}
              style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"0 8px",height:30,borderRadius:15,
              background:showThreadMenu?"rgba(139,105,20,0.08)":"transparent",
              border:"1px solid rgba(139,105,20,0.25)",
              cursor:"pointer",transition:"all 150ms"}}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="3" cy="7" r="1.2" fill="var(--amber)"/>
                <circle cx="7" cy="7" r="1.2" fill="var(--amber)"/>
                <circle cx="11" cy="7" r="1.2" fill="var(--amber)"/>
              </svg>
            </button>

            {showThreadMenu && (
              <div onClick={e=>e.stopPropagation()}
                style={{position:"absolute",top:"calc(100% + 8px)",right:0,
                  background:"var(--bg)",border:"1px solid rgba(139,105,20,0.18)",
                  borderRadius:12,boxShadow:"0 8px 22px rgba(139,105,20,0.14)",
                  zIndex:30,overflow:"hidden",width:320,padding:"12px 12px 10px"}}>
                <div style={{position:"relative",marginBottom:10}}>
                  <svg width="11" height="11" viewBox="0 0 18 18" fill="none" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}>
                    <circle cx="7.5" cy="7.5" r="4.5" stroke="rgba(139,105,20,0.55)" strokeWidth="1.6"/>
                    <path d="M11.5 11.5L15.5 15.5" stroke="rgba(139,105,20,0.55)" strokeWidth="1.7" strokeLinecap="round"/>
                  </svg>
                  <input
                    value={searchText}
                    onChange={e=>{ setSearchText(e.target.value); if(e.target.value.trim()) setViewMode("default"); }}
                    placeholder="Search whispers and moments"
                    className="font-sans"
                    style={{width:"100%",height:32,borderRadius:16,border:"1px solid rgba(139,105,20,0.18)",background:"var(--bg2)",padding:"0 12px 0 28px",outline:"none",fontSize:10,color:"var(--text)"}}
                  />
                </div>
                <div style={{padding:"0 2px 8px"}}>
                  <p className="font-sans" style={{fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--amber)",margin:"0 0 6px",fontWeight:700}}>View</p>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    {VIEW_OPTIONS.map((opt)=>(
                      <button key={opt.id} onClick={()=>setViewMode(opt.id)} className="font-sans"
                        style={{display:"flex",flexDirection:"column",alignItems:"flex-start",width:"100%",padding:"8px 10px",border:"1px solid rgba(139,105,20,0.14)",borderRadius:10,background:viewMode===opt.id?"var(--amber3)":"var(--bg2)",cursor:"pointer",textAlign:"left"}}>
                        <span style={{fontSize:10,fontWeight:600,color:viewMode===opt.id?"var(--amber)":"var(--text)"}}>{opt.label}</span>
                        <span style={{fontSize:8.5,color:"var(--text2)",marginTop:1}}>{opt.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{height:1,background:"rgba(139,105,20,0.08)",margin:"0 0 10px"}}/>
                <div style={{display:"flex",alignItems:"center",gap:0}}>
                  {(()=>{
                    const _cards = thread.filter(m=>m.type==="card");
                    const _texts = thread.filter(m=>m.type==="text");
                    const _books = new Set(_cards.map(m=>m.book).filter(Boolean)).size;
                    return [
                      {value:_books,                                     label:"Books"},
                      {value:_cards.length,                              label:"Moments"},
                      {value:_cards.filter(m=>m.senderInterp||m.interpretation).length,  label:"Momentos"},
                      {value:_texts.length,                              label:"Whispers"},
                    ];
                  })().map((s,i)=>(
                    <div key={i} style={{flex:1,padding:"4px 4px 0",display:"flex",flexDirection:"column",alignItems:"center",
                      borderRight:i<3?"1px solid rgba(139,105,20,0.08)":"none"}}>
                      <span className="font-serif" style={{fontSize:16,fontWeight:700,color:"var(--amber)",lineHeight:1}}>{s.value}</span>
                      <span className="font-sans" style={{fontSize:7,color:"var(--text)",marginTop:3,letterSpacing:"0.02em",textAlign:"center"}}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Find bar — shows when search is active */}
      {normalizedSearch && (
        <div style={{flexShrink:0,display:"flex",alignItems:"center",gap:8,padding:"5px 14px",
          background:"var(--bg)",borderBottom:"1px solid rgba(139,105,20,0.12)"}}>
          <span className="font-sans" style={{flex:1,fontSize:9,color:matchCount?"var(--text2)":"var(--amber)"}}>
            {matchCount===0 ? "No matches" : `${searchMatchIdx+1} of ${matchCount}`}
          </span>
          {matchCount>0 && (
            <>
              <button onClick={()=>setSearchMatchIdx(i=>(i-1+matchCount)%matchCount)}
                style={{width:22,height:22,borderRadius:"50%",border:"1px solid rgba(139,105,20,0.2)",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 5L4 2L7 5" stroke="var(--amber)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button onClick={()=>setSearchMatchIdx(i=>(i+1)%matchCount)}
                style={{width:22,height:22,borderRadius:"50%",border:"1px solid rgba(139,105,20,0.2)",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 1L4 4L7 1" stroke="var(--amber)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </>
          )}
          <button onClick={()=>setSearchText("")}
            style={{width:22,height:22,borderRadius:"50%",border:"none",background:"rgba(139,105,20,0.08)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"var(--amber)",padding:0}}>×</button>
        </div>
      )}

      <div ref={scrollRef} className="panel-scroll" style={{flex:1,overflowY:"auto",padding: viewMode==="default"?"12px 16px 72px":viewMode==="momento-list"?"8px 0 72px":"0 0 72px",display:"flex",flexDirection:"column",gap: viewMode==="default"?10:0}}>
        {viewMode==="default" && thread.map((msg,i)=>{
          const isYou   = msg.from==="you";
          const isMatch = normalizedSearch && matchingMsgs.includes(msg);
          const isCurrent = isMatch && matchingMsgs[searchMatchIdx]===msg;
          const highlightStyle = isCurrent
            ? {outline:"2px solid var(--amber)",outlineOffset:3,borderRadius:8}
            : isMatch
              ? {outline:"1px solid rgba(139,105,20,0.35)",outlineOffset:3,borderRadius:8}
              : {};
          if(msg.type==="text") return (
            <div key={i} ref={el=>{ if(el) msgRefs.current.set(msg,el); else msgRefs.current.delete(msg); }}
              style={{display:"flex",flexDirection:"column",alignItems:isYou?"flex-end":"flex-start",gap:3,...highlightStyle}}>
              <span className="font-sans" style={{fontSize:8,color:"var(--text)",paddingLeft:isYou?0:4,paddingRight:isYou?4:0}}>{isYou?"You":firstName} · {msg.time}</span>
              <div style={{maxWidth:"80%",padding:"8px 13px",background:isYou?"rgba(139,105,20,0.1)":"rgba(139,105,20,0.05)",border:"1px solid rgba(139,105,20,0.18)",borderRadius:isYou?"16px 4px 16px 16px":"4px 16px 16px 16px"}}>
                <p className="font-sans" style={{fontSize:12,lineHeight:1.6,color:"var(--text)",margin:0}}>{msg.text}</p>
              </div>
            </div>
          );
          return (
            <div key={i} ref={el=>{ if(el) msgRefs.current.set(msg,el); else msgRefs.current.delete(msg); }}
              style={{display:"flex",flexDirection:"column",alignItems:isYou?"flex-end":"flex-start",gap:3,...highlightStyle}}>
              <span className="font-sans" style={{fontSize:8,color:"var(--text)",paddingLeft:isYou?0:4,paddingRight:isYou?4:0}}>{isYou?"You":firstName} · {msg.time}</span>
              <WhisperCard msg={msg} isYou={isYou} senderName={firstName}/>
            </div>
          );
        })}
        {viewMode==="default" && thread.length===0 && (
          <div style={{padding:"32px 16px",textAlign:"center"}}>
            <p className="font-sans" style={{fontSize:11,color:"var(--text)",fontStyle:"italic",margin:0}}>Nothing in this thread yet</p>
          </div>
        )}
        {viewMode==="default" && pendingCard && (
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
            <span className="font-sans" style={{fontSize:8,color:"var(--text)",paddingRight:4}}>Ready to send</span>
            <div style={{
              width:"min(80%, 560px)",
              background:"rgba(139,105,20,0.05)",
              border:"1px solid rgba(139,105,20,0.22)",
              borderRadius:18,
              padding:"12px 12px 10px",
              boxShadow:"0 4px 14px rgba(139,105,20,0.08)"
            }}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                  <span className="font-sans" style={{fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700,color:"var(--amber)"}}>Moment Draft</span>
                  {pendingCard.book && (
                    <span className="font-serif" style={{fontSize:10,fontStyle:"italic",color:"var(--text)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{pendingCard.book}</span>
                  )}
                </div>
                <button onClick={()=>{setPendingCard(null);setPendingInterp(""); onResolvePendingMoment&&onResolvePendingMoment();}} className="font-sans"
                  style={{padding:"0 8px",height:22,borderRadius:11,border:"1px solid rgba(139,105,20,0.18)",background:"transparent",cursor:"pointer",fontSize:8.5,color:"var(--text)"}}>
                  Cancel
                </button>
              </div>
              <div style={{background:"var(--card)",border:"1px solid rgba(139,105,20,0.12)",borderRadius:12,padding:"10px 12px",marginBottom:8}}>
                <p className="font-reading" style={{fontSize:11.5,lineHeight:1.65,color:"var(--text)",margin:0}}>
                  "{pendingCard.passage}"
                </p>
              </div>
              <textarea
                value={pendingInterp}
                onChange={e=>setPendingInterp(e.target.value)}
                placeholder="Add a note before you send it..."
                className="font-sans"
                style={{width:"100%",minHeight:54,resize:"vertical",border:"1px solid rgba(139,105,20,0.14)",borderRadius:12,background:"var(--bg2)",padding:"10px 12px",outline:"none",fontSize:11,lineHeight:1.55,color:"var(--text)",boxSizing:"border-box"}}
              />
              <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:10}}>
                <button onClick={()=>{setPendingCard(null);setPendingInterp(""); onResolvePendingMoment&&onResolvePendingMoment();}} className="font-sans"
                  style={{padding:"0 12px",height:28,borderRadius:14,border:"1px solid rgba(139,105,20,0.18)",background:"transparent",cursor:"pointer",fontSize:9.5,color:"var(--text)",fontWeight:600}}>
                  Not now
                </button>
                <button onClick={handleSendPendingMoment} className="font-sans"
                  style={{padding:"0 14px",height:28,borderRadius:14,border:"none",background:"var(--amber)",cursor:"pointer",fontSize:9.5,color:"var(--bg)",fontWeight:700,letterSpacing:"0.04em",boxShadow:"0 2px 8px rgba(139,105,20,0.2)"}}>
                  Send Moment
                </button>
              </div>
            </div>
          </div>
        )}
        {viewMode==="momento-list"  && renderMomentoList()}
        {viewMode==="whispers-only" && renderWhispersOnly()}
      </div>

      {/* â"€â"€ Cloud text area â"€â"€ */}
      {showWhisper && (
        <div style={{position:"absolute",bottom:56,right:12,width:"calc(100% - 24px)",background:"var(--bg)",border:"1px solid rgba(139,105,20,0.25)",borderRadius:14,padding:"12px 14px",boxShadow:"0 4px 16px rgba(139,105,20,0.12)",zIndex:20}}>
          <div style={{position:"absolute",bottom:-7,right:18,width:0,height:0,borderLeft:"7px solid transparent",borderRight:"7px solid transparent",borderTop:"7px solid rgba(139,105,20,0.25)"}}/>
          <div style={{position:"absolute",bottom:-6,right:19,width:0,height:0,borderLeft:"6px solid transparent",borderRight:"6px solid transparent",borderTop:"6px solid var(--bg)"}}/>
          <textarea autoFocus value={whisperText} onChange={e=>setWhisperText(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSendText();} }}
            placeholder="Whisper your thoughts and feelings..."
            style={{width:"100%",minHeight:56,border:"none",outline:"none",fontSize:12,lineHeight:1.65,color:"var(--text)",resize:"none",background:"transparent",fontFamily:"'DM Sans',sans-serif"}}/>
          <div style={{display:"flex",justifyContent:"flex-end",gap:6,marginTop:6}}>
            <button onClick={()=>{setShowWhisper(false);setWhisperText("");}} className="font-sans"
              style={{padding:"4px 10px",borderRadius:12,border:"1px solid rgba(139,105,20,0.2)",background:"transparent",fontSize:9,color:"var(--text)",cursor:"pointer"}}>Cancel</button>
            <button onClick={handleSendText} className="font-sans"
              style={{padding:"4px 14px",borderRadius:12,border:"none",background:whisperText.trim()?"var(--amber)":"rgba(139,105,20,0.18)",fontSize:9,fontWeight:600,color:"var(--bg)",cursor:whisperText.trim()?"pointer":"default",letterSpacing:"0.04em",transition:"background 150ms"}}>Send</button>
          </div>
        </div>
      )}

      {/* â"€â"€ M icon — bottom left â"€â"€ */}
      <div style={{position:"absolute",bottom:12,left:12,zIndex:20}}>
        <button onClick={()=>{ onOpenMoments&&onOpenMoments(); }}
          style={{
            display:"flex",alignItems:"center",gap:7,
            height:38,padding:"0 14px 0 12px",borderRadius:19,
            background:"var(--bg2)",
            border:"1.5px solid rgba(139,105,20,0.26)",
            boxShadow:"0 2px 10px rgba(139,105,20,0.18)",
            cursor:"pointer",
            transition:"all 200ms",
          }}>
          <span style={{fontFamily:"Georgia,serif",fontSize:15,fontWeight:700,color:"var(--amber)",lineHeight:1,fontStyle:"italic"}}>m</span>
          <span className="font-sans" style={{fontSize:10,letterSpacing:"0.04em",color:"var(--text)",fontWeight:600,whiteSpace:"nowrap"}}>
            Share a <span style={{color:"var(--amber)",fontWeight:700}}>moment</span>
          </span>
        </button>
      </div>

      {/* â"€â"€ Whisper icon — bottom right â"€â"€ */}
      <div style={{position:"absolute",bottom:12,right:12,zIndex:20}}>
        <button onClick={()=>setShowWhisper(v=>!v)}
          style={{width:52,height:52,borderRadius:14,background:showWhisper?"var(--amber)":"var(--bg2)",border:`1.5px solid ${showWhisper?"var(--amber)":"rgba(139,105,20,0.3)"}`,boxShadow:"0 2px 14px rgba(139,105,20,0.22)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 200ms"}}>
          <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
            <path d="M3 4.5C3 3.67 3.67 3 4.5 3h11C16.33 3 17 3.67 17 4.5v8c0 .83-.67 1.5-1.5 1.5H7l-4 3V4.5z"
              fill={showWhisper?"var(--bg)":"none"} stroke={showWhisper?"var(--bg)":"var(--amber)"} strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {showProfileOverlay && ReactDOM.createPortal(
        <div onClick={()=>setShowProfileOverlay(false)}
          style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(20,14,4,0.72)",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>
          <div onClick={e=>e.stopPropagation()} style={{position:"relative",width:320,height:440}}>
            <ProfileCard
              profile={profile}
              isClose={true}
              showTeaser={true}
              showOverlays={true}
              showFooter={true}
              nameSize={22}
              seamless={false}
              onWhisper={()=>setShowProfileOverlay(false)}
            />
            <button onClick={()=>setShowProfileOverlay(false)}
              style={{position:"absolute",top:-20,right:-20,width:28,height:28,borderRadius:"50%",border:"1.5px solid rgba(139,105,20,0.35)",background:"var(--bg)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.18)",color:"var(--text2)",fontSize:14,fontWeight:700,lineHeight:1}}>
              ×
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

