function ReaderOnboardingOverlay({profile, onComplete, onStageChange}) {
  const [step, setStep] = useState(0);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [selectedPassageId, setSelectedPassageId] = useState(null);
  const [interpretation, setInterpretation] = useState("");
  const [closeReaderMade, setCloseReaderMade] = useState(false);
  const [selectedCloseReader, setSelectedCloseReader] = useState(null);
  const [hoveredBookId, setHoveredBookId] = useState(null);
  const [hoveredPassageId, setHoveredPassageId] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [whisperOpen, setWhisperOpen] = useState(false);
  const [whisperText, setWhisperText] = useState("");
  const [whisperSent, setWhisperSent] = useState(false);
  const [signatureHovered, setSignatureHovered] = useState(false);
  const [tutorialMomentId] = useState(()=>`tutorial-${Date.now()}`);

  const books = [
    {
      id:"pride",
      title:"Pride and Prejudice",
      author:"Jane Austen",
      cover:SHELF_BOOKS.find(b=>b.title==="Pride and Prejudice")?.cover,
      passages:[
        "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
        "However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so fixed in the minds of the surrounding families.",
        "\"My dear Mr. Bennet,\" said his lady to him one day, \"have you heard that Netherfield Park is let at last?\"",
      ],
      summary:"A sharp romance about love, class, and first impressions gone wrong.",
    },
    {
      id:"gatsby",
      title:"The Great Gatsby",
      author:"F. Scott Fitzgerald",
      cover:SHELF_BOOKS.find(b=>b.title==="The Great Gatsby")?.cover,
      passages:[
        "In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.",
        "\"Whenever you feel like criticizing anyone,\" he told me, \"just remember that all the people in this world haven't had the advantages that you've had.\"",
        "Nick begins by framing himself as careful, self-aware, and morally observant.",
      ],
      summary:"A glamorous but messy story about obsession, money, and wanting too much.",
    },
    {
      id:"jane",
      title:"Jane Eyre",
      author:"Charlotte Bronte",
      cover:SHELF_BOOKS.find(b=>b.title==="Jane Eyre")?.cover,
      passages:[
        "There was no possibility of taking a walk that day.",
        "I never liked long walks, especially on chilly afternoons.",
        "Dreadful to me was the coming home in the raw twilight, with nipped fingers and toes.",
      ],
      summary:"A lonely, intense story about growing up, love, and staying true to yourself.",
    },
  ];

  const demoCloseReaders = [
    {name:"Lena R.", note:"They have captured the same moment as you did.", glyph:"t"},
    {name:"Sofia A.", note:"They have captured the same moment as you did.", glyph:"f"},
  ];
  const tutorialCloseReaders = demoCloseReaders.filter(reader=>reader.name==="Sofia A.");
  const readerProfiles = (typeof PROFILES!=="undefined" ? PROFILES : []).filter(profile=>demoCloseReaders.some(reader=>reader.name===profile.name));
  const sofiaProfile = readerProfiles.find(reader=>reader.name==="Sofia A.") || readerProfiles[0] || null;

  const selectedBook = books.find(book=>book.id===selectedBookId) || null;
  const selectedPassage = selectedBook ? selectedBook.passages.find((passage, index)=>`${selectedBook.id}-${index}`===selectedPassageId) || null : null;
  const tutorialMoment = selectedBook && selectedPassage ? {
    id:tutorialMomentId,
    passage:selectedPassage,
    interpretation:interpretation.trim(),
    book:selectedBook.title,
    chapter:"Onboarding",
    page:1,
  } : null;

  const canAdvance =
    (step===1 && interpretation.trim().length >= 12) ||
    (step===2 && closeReaderMade) ||
    step===3;

  useEffect(()=>{
    onStageChange && onStageChange(step);
  },[step, onStageChange]);

  const nextStep = () => {
    if(!canAdvance) return;
    if(step < 3) setStep(prev=>prev+1);
  };

  const finish = () => {
    if(!tutorialMoment) return;
    onComplete({
      moment:tutorialMoment,
      closeReader:selectedCloseReader || demoCloseReaders[1],
    });
  };

  const renderStageTitle = () => {
    if(step===0 && !selectedBook) return "Choose a book.";
    if(step===0 && selectedBook && !selectedPassage) {
      return (
        <>
          Capture your <span style={{color:"#8B6914"}}>moment</span>.
        </>
      );
    }
    if(step===0 && selectedBook && selectedPassage) {
      return (
        <>
          Capture your <span style={{color:"#8B6914"}}>moment</span>.
        </>
      );
    }
    if(step===1) return <>Make it your <span style={{color:"#8B6914"}}>momento</span>.</>;
    if(step===2) return <>Find your <span style={{color:"#8B6914"}}>close readers</span>.</>;
    return "Whisper when they wave back.";
  };

  const renderStageDetail = () => {
    if(step===0 && !selectedBook) return "Next, you'll see how to capture a moment.";
    if(step===0 && selectedBook && !selectedPassage) return "Of the 3 passages choose the one that moves you.";
    if(step===0 && selectedBook && selectedPassage) return "Of the 3 passages choose the one that moves you.";
    if(step===1) return "When a Moment finds your Own words, it becomes MOMENTO";
    if(step===2) return "Wave to the readers who read close to you.";
    return "This is where reading turns into relation.";
  };

  const shellCard = {
    width:"min(1060px, 100%)",
    minHeight:"min(610px, calc(100vh - 180px))",
    borderRadius:34,
    background:"linear-gradient(180deg, rgba(248,242,228,0.97) 0%, rgba(241,231,211,0.97) 100%)",
    boxShadow:"0 38px 84px rgba(0,0,0,0.26)",
    color:"#2C1A08",
    padding:"24px 28px 22px",
    display:"flex",
    flexDirection:"column",
    gap:18,
  };

  const softCard = {
    borderRadius:24,
    border:"1px solid rgba(139,105,20,0.1)",
    background:"rgba(255,253,249,0.6)",
    boxShadow:"inset 0 1px 0 rgba(255,255,255,0.72)",
  };

  const actionButton = (active, hov=false) => ({
    background:"none",
    border:"none",
    borderRadius:0,
    padding:"0 0 6px",
    cursor:active ? "pointer" : "default",
    color:active ? "#8B6914" : "rgba(139,105,20,0.32)",
    fontSize:13,
    fontWeight:700,
    letterSpacing:"0.18em",
    textTransform:"uppercase",
    borderBottom:`${hov && active ? 2 : 1}px solid ${active ? (hov ? "rgba(139,105,20,0.82)" : "rgba(139,105,20,0.52)") : "rgba(139,105,20,0.18)"}`,
    transform:hov && active ? "translateY(-1px)" : "none",
    transition:"color 160ms ease, border-color 160ms ease, transform 180ms ease",
  });

  const subtleButton = (hov=false) => ({
    background:"none",
    border:"none",
    borderRadius:0,
    padding:"0 0 6px",
    cursor:"pointer",
    color:hov ? "rgba(44,26,8,0.72)" : "rgba(44,26,8,0.46)",
    fontSize:11,
    fontWeight:700,
    letterSpacing:"0.14em",
    textTransform:"uppercase",
    borderBottom:`${hov ? 2 : 1}px solid ${hov ? "rgba(44,26,8,0.38)" : "rgba(44,26,8,0.22)"}`,
    transform:hov ? "translateY(-1px)" : "none",
    transition:"color 160ms ease, border-color 160ms ease, transform 180ms ease",
  });

  const guidePill = {
    position:"absolute",
    left:0,
    top:-2,
    margin:0,
    padding:"6px 11px 5px",
    borderRadius:999,
    border:"1px solid rgba(139,105,20,0.16)",
    background:"rgba(139,105,20,0.08)",
    boxShadow:"inset 0 1px 0 rgba(255,255,255,0.56)",
    fontSize:11,
    letterSpacing:"0.16em",
    textTransform:"uppercase",
    fontWeight:700,
    color:"rgba(139,105,20,0.78)",
    lineHeight:1,
  };

  const momentoCardShell = {
    background:"var(--card)",
    borderRadius:3,
    border:"1px solid var(--border)",
    boxShadow:"2px 0 6px rgba(139,105,20,0.06), -2px 0 6px rgba(139,105,20,0.06)",
    position:"relative",
    overflow:"hidden",
  };

  const momentoAccentLine = {
    position:"absolute",
    left:16,
    top:10,
    bottom:0,
    width:3,
    background:"#8B6914",
    borderRadius:1,
  };

  const glyphMark = (size=16) => (
    <svg width={size} height={Math.round(size*0.72)} viewBox="0 0 24 17" style={{display:"block"}}>
      <text x="6.7" y="13.4" fontFamily="'Playfair Display',serif" fontWeight="700" fontSize="14.8" fill="rgba(139,105,20,0.84)">t</text>
      <text x="11.0" y="11.2" fontFamily="'Playfair Display',serif" fontWeight="700" fontSize="14.8" fill="rgba(139,105,20,0.84)" transform="rotate(180 14.2 8.3)">t</text>
    </svg>
  );

  const signatureGlyph = (dark=false) => (
    <svg width="100%" height="100%" viewBox="0 0 66 70" preserveAspectRatio="xMidYMid meet">
      <rect x="10" y="12" width="46" height="55" rx="10" fill={dark ? "rgba(248,242,228,0.08)" : "rgba(139,105,20,0.12)"} stroke={dark ? "rgba(212,184,122,0.42)" : "rgba(139,105,20,0.24)"} strokeWidth="1.2"/>
      <text x="17" y="50" fontFamily="'Playfair Display',serif" fontWeight="700" fontSize="42" fill="#2D8A4E">t</text>
      <text x="49" y="50" fontFamily="'Playfair Display',serif" fontWeight="700" fontSize="42" fill="#C0392B" transform="translate(98,80) rotate(180)">t</text>
      <text x="26" y="60" fontFamily="'DM Sans',sans-serif" fontWeight="700" fontSize="9" fill="#2D8A4E" textAnchor="middle" letterSpacing="0.5">RES</text>
      <text x="40" y="26" fontFamily="'DM Sans',sans-serif" fontWeight="700" fontSize="9" fill="#C0392B" textAnchor="middle" letterSpacing="0.5">CON</text>
    </svg>
  );

  const userSignature = {
    t:{res:18, con:58, div:24},
    f:{res:61, con:21, div:18},
  };
  const sofiaSignature = sofiaProfile ? {
    t:{res:sofiaProfile.rt||sofiaProfile.r||0, con:sofiaProfile.ct||sofiaProfile.c||0, div:sofiaProfile.dt||sofiaProfile.d||0},
    f:{res:sofiaProfile.rf||sofiaProfile.r||0, con:sofiaProfile.cf||sofiaProfile.c||0, div:sofiaProfile.df||sofiaProfile.d||0},
  } : userSignature;
  const renderScoreBar = (label, values, labelColor) => {
    const segments = [
      {key:"res", value:values.res, color:"#2D8A4E"},
      {key:"con", value:values.con, color:"#C0392B"},
      {key:"div", value:values.div, color:"#C5A25A"},
    ];
    return (
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span className="font-serif" style={{width:12,fontSize:14,fontWeight:700,fontStyle:"italic",color:labelColor}}>{label}</span>
        <div style={{flex:1,height:8,borderRadius:999,overflow:"hidden",background:"rgba(139,105,20,0.08)",display:"flex"}}>
          {segments.map(segment=>(
            <div key={segment.key} style={{width:`${segment.value}%`,background:segment.color}}/>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position:"fixed",
      inset:0,
      zIndex:710,
      background:"linear-gradient(180deg, rgba(12,8,5,0.2) 0%, rgba(12,8,5,0.54) 100%)",
      display:"flex",
      alignItems:"flex-start",
      justifyContent:"center",
      padding:"96px 24px 20px",
    }}>
      <div style={shellCard}>
        <div style={{width:"100%"}}>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:16,marginBottom:6,position:"relative"}}>
            <p className="font-sans" style={guidePill}>
              Guide
            </p>
            <h3 className="font-serif" style={{margin:0,fontSize:30,lineHeight:1.04,fontWeight:600,color:"#2C1A08"}}>
              {renderStageTitle()}
            </h3>
          </div>
          <p className="font-reading" style={{margin:0,textAlign:"center",fontSize:14,lineHeight:1.58,color:"rgba(44,26,8,0.66)"}}>
            {renderStageDetail()}
          </p>
        </div>

        {step===0 && !selectedBook && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(3, minmax(0, 1fr))",gap:16,flex:1}}>
            {books.map((book)=>(
              <button
                key={book.id}
                onClick={()=>{
                  setSelectedBookId(book.id);
                  setSelectedPassageId(null);
                }}
                onMouseEnter={()=>setHoveredBookId(book.id)}
                onMouseLeave={()=>setHoveredBookId(prev=>prev===book.id ? null : prev)}
                style={{
                  ...softCard,
                  padding:"18px 18px 16px",
                  textAlign:"left",
                  cursor:"pointer",
                  color: hoveredBookId===book.id ? "#F8F2E4" : "#2C1A08",
                  display:"flex",
                  flexDirection:"column",
                  gap:12,
                  justifyContent:"space-between",
                  background: hoveredBookId===book.id ? "linear-gradient(160deg, #221508 0%, #1A0F08 40%, #0E0A05 100%)" : softCard.background,
                  border: hoveredBookId===book.id ? "1px solid rgba(212,184,122,0.42)" : softCard.border,
                  boxShadow: hoveredBookId===book.id ? "0 0 0 1px rgba(196,160,85,0.08), 0 8px 32px rgba(139,105,20,0.18)" : softCard.boxShadow,
                  transition:"background 260ms ease, border-color 260ms ease, color 260ms ease, box-shadow 260ms ease",
                }}
              >
                <div style={{height:228,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.78)",borderRadius:"6px 14px 14px 6px",boxShadow:"0 14px 24px rgba(0,0,0,0.1)",overflow:"hidden"}}>
                  <img src={book.cover} alt={book.title} style={{width:"100%",height:"100%",objectFit:"contain",display:"block"}}/>
                </div>
                <div>
                  <p className="font-serif" style={{margin:"0 0 4px",fontSize:19,lineHeight:1.08,fontWeight:700,color:hoveredBookId===book.id ? "#F8F2E4" : "#2C1A08",transition:"color 260ms ease"}}>{book.title}</p>
                  <p className="font-sans" style={{margin:0,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:700,color:hoveredBookId===book.id ? "#D4B87A" : "rgba(139,105,20,0.68)",transition:"color 260ms ease"}}>{book.author}</p>
                </div>
                <div style={{
                  minHeight:74,
                  padding:"12px 14px",
                  borderTop:"1px solid rgba(139,105,20,0.14)",
                  background:hoveredBookId===book.id ? "rgba(255,255,255,0.04)" : "transparent",
                  borderTop:hoveredBookId===book.id ? "1px solid rgba(212,184,122,0.18)" : "1px solid rgba(139,105,20,0.14)",
                  opacity:hoveredBookId===book.id ? 1 : 0.72,
                  transition:"background 260ms ease, opacity 260ms ease, border-color 260ms ease",
                }}>
                  <p className="font-reading" style={{margin:0,fontSize:13.5,lineHeight:1.55,color:hoveredBookId===book.id ? "rgba(248,242,228,0.72)" : "rgba(44,26,8,0.72)",transition:"color 260ms ease"}}>
                    {book.summary}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {step===0 && selectedBook && (
          <div style={{display:"grid",gridTemplateColumns:"0.68fr 1.32fr",gap:16,flex:1}}>
            <div style={{...softCard,padding:"18px 18px 14px",display:"flex",flexDirection:"column"}}>
              <p className="font-sans" style={{margin:"0 0 10px",fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:700,color:"rgba(139,105,20,0.72)"}}>
                Chosen Book
              </p>
              <div style={{height:340,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.78)",borderRadius:"6px 14px 14px 6px",boxShadow:"0 12px 22px rgba(0,0,0,0.1)",overflow:"hidden",marginBottom:12,padding:"14px 16px"}}>
                <img src={selectedBook.cover} alt={selectedBook.title} style={{width:"100%",height:"100%",objectFit:"contain",display:"block",maxWidth:"82%",maxHeight:"82%"}}/>
              </div>
              <p className="font-serif" style={{margin:"0 0 4px",fontSize:19,lineHeight:1.08,fontWeight:700,color:"#2C1A08"}}>{selectedBook.title}</p>
              <p className="font-sans" style={{margin:0,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:700,color:"rgba(139,105,20,0.68)"}}>{selectedBook.author}</p>
            </div>

            <div style={{...softCard,padding:"18px",display:"flex",flexDirection:"column",gap:12,justifyContent:"flex-start"}}>
              <p className="font-sans" style={{margin:0,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:700,color:"rgba(139,105,20,0.72)"}}>
                Click anywhere in a passage
              </p>
              {selectedBook.passages.map((passage, index)=>{
                const pid = `${selectedBook.id}-${index}`;
                const activePassage = selectedPassageId===pid;
                return (
                  <button
                    key={pid}
                    onClick={()=>{
                      setSelectedPassageId(pid);
                      setStep(1);
                    }}
                    onMouseEnter={()=>setHoveredPassageId(pid)}
                    onMouseLeave={()=>setHoveredPassageId(null)}
                    style={{
                      textAlign:"left",
                      padding:"16px 16px",
                      minHeight:106,
                      borderRadius:18,
                      border:hoveredPassageId===pid ? "1px solid rgba(212,184,122,0.42)" : activePassage ? "1.5px solid rgba(139,105,20,0.28)" : "1px solid rgba(139,105,20,0.1)",
                      background:hoveredPassageId===pid ? "linear-gradient(160deg, #221508 0%, #1A0F08 40%, #0E0A05 100%)" : activePassage ? "rgba(196,160,85,0.12)" : "rgba(255,255,255,0.72)",
                      boxShadow:hoveredPassageId===pid ? "0 0 0 1px rgba(196,160,85,0.08), 0 8px 32px rgba(139,105,20,0.18)" : "none",
                      cursor:"pointer",
                      color:hoveredPassageId===pid ? "#F8F2E4" : "#2C1A08",
                      transition:"background 260ms ease, border-color 260ms ease, color 260ms ease, box-shadow 260ms ease",
                    }}
                  >
                    {activePassage && (
                      <div style={{marginBottom:7}}>
                        <span className="font-sans" style={{fontSize:9.5,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:700,color:"rgba(139,105,20,0.74)"}}>
                          Captured
                        </span>
                      </div>
                    )}
                    <p className="font-reading" style={{margin:0,fontSize:14.5,lineHeight:1.52,fontStyle:"italic",color:hoveredPassageId===pid ? "rgba(248,242,228,0.88)" : "rgba(44,26,8,0.88)",transition:"color 260ms ease"}}>
                      "{passage}"
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step===1 && tutorialMoment && (
          <div style={{display:"grid",gridTemplateColumns:"0.92fr 1.08fr",gap:16,flex:1}}>
            <div style={{...softCard,padding:20}}>
              <p className="font-sans" style={{margin:"0 0 10px",fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:700,color:"rgba(139,105,20,0.72)"}}>
                Moment
              </p>
              <div style={{padding:"18px 20px",borderRadius:20,background:"rgba(255,255,255,0.74)",border:"1px solid rgba(139,105,20,0.08)"}}>
                <p className="font-reading" style={{margin:0,fontSize:16,lineHeight:1.86,fontStyle:"italic",color:"#2C1A08"}}>
                  "{tutorialMoment.passage}"
                </p>
              </div>
            </div>

            <div style={{...softCard,padding:20,display:"flex",flexDirection:"column",background:"linear-gradient(160deg, #221508 0%, #1A0F08 40%, #0E0A05 100%)",border:"1px solid rgba(212,184,122,0.42)",boxShadow:"0 0 0 1px rgba(196,160,85,0.08), 0 8px 32px rgba(139,105,20,0.18)"}}>
              <p className="font-sans" style={{margin:"0 0 10px",fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:700,color:"#D4B87A"}}>
                Momento
              </p>
              <div style={{...momentoCardShell,flex:1}}>
                <div style={momentoAccentLine}/>
                <div style={{padding:"14px 26px 14px 26px",position:"relative",height:"100%",display:"flex",flexDirection:"column"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
                    <span className="font-serif" style={{fontSize:10,fontStyle:"italic",color:"var(--amber)",fontWeight:500}}>{tutorialMoment.book}</span>
                    <span className="font-sans" style={{fontSize:8,color:"var(--text2)",letterSpacing:"0.04em"}}>{tutorialMoment.chapter}</span>
                  </div>
                  <textarea
                    value={interpretation}
                    onChange={e=>setInterpretation(e.target.value)}
                    placeholder="what do you think and feel of this moment..."
                    style={{
                      flex:1,
                      minHeight:250,
                      border:"none",
                      padding:0,
                      resize:"none",
                      background:"transparent",
                      color:"var(--text)",
                      fontFamily:"'Kalam', cursive",
                      fontSize:24,
                      lineHeight:1.55,
                      outline:"none",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step===2 && tutorialMoment && sofiaProfile && (
          <div style={{display:"flex",flexDirection:"column",gap:14,flex:1,minHeight:0}}>
            <div style={{position:"relative",display:"grid",gridTemplateColumns:"minmax(0,1fr) 210px minmax(0,1fr)",gap:16,alignItems:"stretch",minHeight:0}}>
              <div style={{...softCard,padding:20,display:"flex",flexDirection:"column",justifyContent:"space-between",minHeight:0,zIndex:1}}>
                <div>
                  <p className="font-sans" style={{margin:"0 0 10px",fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:700,color:"rgba(139,105,20,0.72)"}}>
                    Your momento
                  </p>
                  <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:3,boxShadow:"2px 0 6px rgba(139,105,20,0.06), -2px 0 6px rgba(139,105,20,0.06)",overflow:"hidden"}}>
                    <div style={{padding:"14px 14px 0 26px",position:"relative"}}>
                      <div style={{position:"absolute",left:16,top:10,bottom:-1,width:3,background:"#8B6914",borderRadius:1}}/>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
                        <span className="font-serif" style={{fontSize:10,fontStyle:"italic",color:"var(--amber)",fontWeight:500}}>{tutorialMoment.book}</span>
                        <span className="font-sans" style={{fontSize:8,color:"var(--text2)",letterSpacing:"0.04em"}}>{tutorialMoment.chapter}</span>
                      </div>
                      <p style={{fontFamily:"'Kalam',cursive",fontSize:14,lineHeight:1.6,color:"var(--text)",margin:0,fontWeight:400}}>
                        {tutorialMoment.interpretation}
                      </p>
                    </div>
                    <div style={{height:1,background:"rgba(255,255,255,0.2)"}}/>
                    <div style={{height:1,background:"rgba(0,0,0,0.08)"}}/>
                    <div style={{background:"var(--card)",padding:"8px 14px 14px 26px",position:"relative"}}>
                      <div style={{position:"absolute",left:16,top:0,bottom:0,width:3,background:"#8B6914"}}/>
                      <div style={{background:"var(--passage-bg,#fff)",borderRadius:"0 0 3px 3px",padding:"8px 9px",borderLeft:"2px solid rgba(139,105,20,0.2)"}}>
                        <p className="font-reading" style={{fontSize:12,lineHeight:1.8,color:"#2C2C2A",margin:0,fontStyle:"italic"}}>
                          "{tutorialMoment.passage}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="font-reading" style={{margin:"12px 0 0",fontSize:13,lineHeight:1.62,color:"rgba(44,26,8,0.64)",textAlign:"center"}}>
                  Worth reads what you write to find your readers.
                </p>
              </div>

              <div style={{...softCard,padding:"20px 16px",display:"flex",flexDirection:"column",justifyContent:"space-between",alignItems:"center",gap:14,position:"relative",zIndex:1,minHeight:0,background:"linear-gradient(160deg, #221508 0%, #1A0F08 40%, #0E0A05 100%)",border:"1px solid rgba(212,184,122,0.42)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(196,160,85,0.08), 0 8px 32px rgba(139,105,20,0.18)"}}>
                <div style={{position:"absolute",inset:0,borderRadius:"inherit",background:"radial-gradient(ellipse at 50% 30%, rgba(196,160,85,0.12) 0%, rgba(196,160,85,0) 65%)",pointerEvents:"none"}}/>
                <div style={{flex:1,width:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",paddingTop:8,minHeight:0}}>
                  <p className="font-sans" style={{margin:0,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:700,color:"#D4B87A",textAlign:"center"}}>
                    Closeness Signature
                  </p>
                  <div style={{width:168,height:168,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <div style={{width:168,height:168,display:"flex",alignItems:"center",justifyContent:"center",transform:"translateX(-2px)"}}>
                      {signatureGlyph(true)}
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5,marginTop:10,maxWidth:170}}>
                    <p className="font-reading" style={{margin:0,fontSize:13,lineHeight:1.62,color:"rgba(248,242,228,0.82)",textAlign:"center"}}>
                      Shows how you both think and feel through the same words.
                    </p>
                    <div style={{position:"relative",flexShrink:0}}>
                      <button
                        onMouseEnter={()=>setSignatureHovered(true)}
                        onMouseLeave={()=>setSignatureHovered(false)}
                        style={{width:16,height:16,borderRadius:"50%",border:"1px solid rgba(212,184,122,0.5)",background:"rgba(212,184,122,0.12)",color:"#D4B87A",fontSize:10,fontWeight:700,lineHeight:1,cursor:"help",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}
                      >i</button>
                      {signatureHovered && (
                        <div style={{position:"absolute",right:0,top:"calc(100% + 8px)",width:260,padding:"14px 16px",borderRadius:16,background:"rgba(255,252,245,0.98)",border:"1px solid rgba(139,105,20,0.14)",boxShadow:"0 16px 28px rgba(44,26,8,0.08)",zIndex:20}}>
                          <p className="font-reading" style={{margin:"0 0 7px",fontSize:12,lineHeight:1.55,color:"rgba(44,26,8,0.80)"}}>
                            The <strong style={{color:"#8B6914",fontStyle:"normal"}}>t</strong> glyph shows your Think dimension - how you analytically process a passage.
                          </p>
                          <p className="font-reading" style={{margin:"0 0 7px",fontSize:12,lineHeight:1.55,color:"rgba(44,26,8,0.80)"}}>
                            The <strong style={{color:"#8B6914",fontStyle:"normal"}}>f</strong> glyph shows your Feel dimension - how you emotionally respond to it.
                          </p>
                          <p className="font-reading" style={{margin:"0 0 4px",fontSize:12,lineHeight:1.55,color:"rgba(44,26,8,0.80)"}}>
                            <strong style={{color:"#2D8A4E",fontStyle:"normal"}}>RES</strong> - Resonance. Your readings are in Harmony.
                          </p>
                          <p className="font-reading" style={{margin:"0 0 4px",fontSize:12,lineHeight:1.55,color:"rgba(44,26,8,0.80)"}}>
                            <strong style={{color:"#C0392B",fontStyle:"normal"}}>CON</strong> - Contradiction. Your readings push directly against each other.
                          </p>
                          <p className="font-reading" style={{margin:"0 0 7px",fontSize:12,lineHeight:1.55,color:"rgba(44,26,8,0.80)"}}>
                            <strong style={{color:"#6B6B63",fontStyle:"normal"}}>DIV</strong> - Divergence. You each went somewhere entirely different.
                          </p>
                          <p className="font-reading" style={{margin:0,fontSize:12,lineHeight:1.55,color:"rgba(44,26,8,0.80)"}}>
                            The dominant color colors the glyph respectively.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{...softCard,padding:20,display:"flex",flexDirection:"column",justifyContent:"space-between",minHeight:0,zIndex:1}}>
                <div>
                  <p className="font-sans" style={{margin:"0 0 10px",fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:700,color:"rgba(139,105,20,0.72)"}}>
                    Reader who captured the same moment
                  </p>
                  <div style={{position:"relative",borderRadius:18,border:"1px solid rgba(196,160,85,0.28)",overflow:"hidden",background:"#F7F0DF"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:16,background:"#6B4E0A"}}>
                      <svg viewBox="0 0 360 16" preserveAspectRatio="none" style={{display:"block",width:"100%",height:"100%"}}>
                        {[6,27,48,69,90,111,132,153,174,195,216,237,258,279,300,321,342].map(x=>(
                          <g key={x}>
                            <rect x={x} y="1" width="2" height="14" rx="1" fill="#D4B87A"/>
                            <rect x={x+8} y="1" width="2" height="14" rx="1" fill="#D4B87A"/>
                          </g>
                        ))}
                      </svg>
                    </div>
                    <div style={{position:"relative",height:196,overflow:"hidden",background:"#CDB98A"}}>
                      <img src={sofiaProfile.photo} alt={sofiaProfile.name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block",filter:"saturate(0.92) contrast(1.02)"}}/>
                      <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg, rgba(28,22,12,0.08) 0%, rgba(28,22,12,0.02) 30%, rgba(28,22,12,0.72) 75%, rgba(28,22,12,0.86) 100%)"}}/>
                      <div style={{position:"absolute",left:7,top:7,zIndex:4,pointerEvents:"none"}}>
                        <svg width="66" height="67" viewBox="-6 9 66 67" style={{display:"block"}}>
                          <rect x="-3" y="12" width="46" height="55" rx="10" fill="rgba(12,8,2,0.58)" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
                          <text x="4" y="50" fontFamily="'Playfair Display',serif" fontWeight="700" fontSize="42" fill="#2D8A4E">t</text>
                          <text x="36" y="50" fontFamily="'Playfair Display',serif" fontWeight="700" fontSize="42" fill="#C0392B" transform="translate(72,80) rotate(180)">t</text>
                          <text x="13" y="62" fontFamily="'DM Sans',sans-serif" fontWeight="700" fontSize="9" fill="#2D8A4E" textAnchor="middle" letterSpacing="0.5">RES</text>
                          <text x="30" y="26" fontFamily="'DM Sans',sans-serif" fontWeight="700" fontSize="9" fill="#C0392B" textAnchor="middle" letterSpacing="0.5">CON</text>
                        </svg>
                      </div>
                      {(()=>{
                        const raw = getRCDTeaser({...sofiaProfile, rt:70, ct:20, dt:10, rf:20, cf:70, df:10});
                        const firstName = sofiaProfile.name.split(" ")[0];
                        const boldWords = ["You","Your",firstName,"alike","clash","differently","same","apart","drift","friction","everywhere","different","moment"];
                        const regex = new RegExp(`\\b(${boldWords.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")})\\b`,"g");
                        const segs = []; let last=0, m;
                        while((m=regex.exec(raw))!==null){
                          if(m.index>last) segs.push({t:raw.slice(last,m.index),bold:false});
                          segs.push({t:m[0],bold:true});
                          last=m.index+m[0].length;
                        }
                        if(last<raw.length) segs.push({t:raw.slice(last),bold:false});
                        return (
                          <p style={{position:"absolute",bottom:32,left:0,right:0,fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:20,color:"rgba(255,255,255,0.7)",textAlign:"center",lineHeight:1.35,margin:0,padding:"0 10px",zIndex:4}}>
                            {segs.map((s,i)=>{
                              if(s.bold){
                                const isName=s.t===firstName||s.t==="You";
                                return <span key={i} style={{fontWeight:700,fontStyle:"normal",color:"#C4A055",fontSize:isName?25:undefined}}>{s.t}</span>;
                              }
                              if(s.t.includes("Your")){
                                return <span key={i}>{s.t.split(/(Your)/g).map((part,j)=>
                                  part==="Your"
                                    ? <span key={j}><span style={{fontWeight:700,fontStyle:"normal",color:"#C4A055",fontSize:26}}>Y</span><span>our</span></span>
                                    : <span key={j}>{part}</span>
                                )}</span>;
                              }
                              return <span key={i}>{s.t}</span>;
                            })}
                          </p>
                        );
                      })()}
                      <p className="font-serif" style={{position:"absolute",left:16,bottom:8,margin:0,fontSize:16,fontWeight:700,color:"#F8F2E4"}}>
                        {sofiaProfile.name}
                      </p>
                    </div>
                    <div style={{padding:"12px 16px 14px",background:"linear-gradient(180deg, rgba(191,157,75,0.88) 0%, rgba(174,138,54,0.92) 100%)"}}>
                      <div style={{display:"flex",justifyContent:"center"}}>
                        <button
                          onClick={()=>{
                            const reader = tutorialCloseReaders[0] || demoCloseReaders.find(item=>item.name===sofiaProfile.name);
                            if(reader){
                              setCloseReaderMade(true);
                              setSelectedCloseReader(reader);
                            }
                          }}
                          style={{padding:"7px 18px",borderRadius:999,border:"1.2px solid rgba(238,224,196,0.72)",background:closeReaderMade?"rgba(139,105,20,0.18)":"#F4E8CB",fontFamily:"'Playfair Display',serif",fontSize:13,fontStyle:"italic",fontWeight:700,color:"#8B6914",cursor:closeReaderMade?"default":"pointer",transition:"background 200ms ease"}}
                        >
                          {closeReaderMade ? "~ Waved" : "~ Wave"}
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="font-reading" style={{margin:"12px 2px 0",fontSize:13,lineHeight:1.62,color:"rgba(44,26,8,0.64)",textAlign:"center"}}>
                    Wave to become Close Readers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step===3 && tutorialMoment && sofiaProfile && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,flex:1,minHeight:0}}>
            {/* ── Left: centered waved-back card ── */}
            <div style={{...softCard,padding:20,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center"}}>
              <p className="font-sans" style={{margin:"0 0 10px",fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:700,color:"rgba(139,105,20,0.72)",textAlign:"center"}}>
                Waved back
              </p>
              <div style={{width:220,padding:"11px 12px",borderRadius:12,border:"1px solid rgba(196,160,85,0.4)",background:"var(--card)",boxShadow:"0 10px 22px rgba(139,105,20,0.1), inset 0 1px 0 rgba(255,255,255,0.62)"}}>
                <div style={{height:3.5,borderRadius:999,background:"#7A5A0E",opacity:0.96,marginBottom:9}}/>
                <div style={{display:"flex",alignItems:"center",gap:9}}>
                  <div style={{width:24,height:31,borderRadius:7,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",background:"#8B6914",color:"var(--bg)",border:"1px solid rgba(139,105,20,0.12)",boxShadow:"0 4px 10px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.22)",flexShrink:0}}>
                    <span style={{fontFamily:"Playfair Display,serif",fontSize:9.5,fontWeight:700,color:"var(--bg)"}}>
                      {(selectedCloseReader?.name || sofiaProfile.name).split(" ").map(part=>part[0]).join("")}
                    </span>
                  </div>
                  <div style={{minWidth:0,flex:1}}>
                    <p className="font-serif" style={{fontSize:12.5,fontWeight:700,color:"var(--text)",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {selectedCloseReader?.name || sofiaProfile.name}
                    </p>
                    <p className="font-sans" style={{fontSize:10,color:"rgba(72,55,18,0.96)",margin:"3px 0 0",lineHeight:1.4,fontWeight:600}}>
                      is your Close Reader
                    </p>
                  </div>
                </div>
                <div style={{marginTop:8,display:"inline-flex",alignItems:"center",padding:"4px 8px",borderRadius:999,background:"rgba(255,255,255,0.48)",border:"1px solid rgba(196,160,85,0.4)"}}>
                  <span className="font-reading" style={{fontSize:9.5,fontStyle:"italic",color:"var(--text)",lineHeight:1.2,whiteSpace:"nowrap"}}>
                    {tutorialMoment.book}
                  </span>
                </div>
                <div style={{marginTop:9}}>
                  <button
                    onClick={()=>setWhisperOpen(true)}
                    style={{display:"inline-flex",alignItems:"center",justifyContent:"center",height:30,padding:"0 14px",borderRadius:999,border:"1.5px solid rgba(154,116,21,0.46)",background:"rgba(255,255,255,0.78)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.55)",cursor:"pointer",fontFamily:"Playfair Display,serif",fontSize:10.5,fontStyle:"italic",fontWeight:600,color:"#8B6914",letterSpacing:"0.01em",transition:"background 150ms ease"}}
                  >
                    Whisper
                  </button>
                </div>
              </div>
              <p className="font-reading" style={{margin:"12px 0 0",fontSize:12,lineHeight:1.55,color:"rgba(44,26,8,0.44)",textAlign:"center",fontStyle:"italic"}}>
                click Whisper to converse with {(selectedCloseReader?.name || sofiaProfile.name).split(" ")[0]} (Quietly)
              </p>
            </div>

            {/* ── Right: whisper thread (blurred until Whisper clicked) ── */}
            <div style={{...softCard,padding:0,overflow:"hidden",display:"flex",flexDirection:"column",position:"relative",minHeight:0,filter:whisperOpen?"none":"blur(5px)",opacity:whisperOpen?1:0.7,transition:"filter 420ms ease, opacity 420ms ease",pointerEvents:whisperOpen?"auto":"none"}}>
              {/* Header */}
              <div style={{flexShrink:0,padding:"12px 14px",borderBottom:"1px solid rgba(139,105,20,0.1)",display:"grid",gridTemplateColumns:"auto auto 1fr auto auto",alignItems:"center",columnGap:10}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:"50%",background:"rgba(139,105,20,0.07)",border:"1px solid rgba(139,105,20,0.22)",color:"var(--amber)",fontSize:14,lineHeight:1}}>←</div>
                <div style={{minWidth:100,flexShrink:0}}>
                  <p className="font-serif" style={{fontSize:13,fontWeight:600,color:"var(--text)",margin:0,whiteSpace:"nowrap"}}>{selectedCloseReader?.name || sofiaProfile.name}</p>
                  <p className="font-sans" style={{fontSize:8,color:"var(--text)",margin:"1px 0 0",letterSpacing:"0.04em"}}>Whisper</p>
                </div>
                <div/>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",width:36,height:26,borderRadius:13,border:"1px solid rgba(139,105,20,0.18)",background:"rgba(139,105,20,0.04)"}}>
                  <svg width="22" height="15" viewBox="0 0 24 16" style={{display:"block"}}>
                    <text x="6.8" y="13.2" fontFamily="'Playfair Display',serif" fontWeight="700" fontSize="15" fill="#2D8A4E">t</text>
                    <text x="10.9" y="11.0" fontFamily="'Playfair Display',serif" fontWeight="700" fontSize="15" fill="#C0392B" transform="rotate(180 14.2 8.2)">t</text>
                  </svg>
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:14,border:"1px solid rgba(139,105,20,0.22)"}}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="3" cy="7" r="1.2" fill="#8B6914"/>
                    <circle cx="7" cy="7" r="1.2" fill="#8B6914"/>
                    <circle cx="11" cy="7" r="1.2" fill="#8B6914"/>
                  </svg>
                </div>
              </div>
              {/* Thread body */}
              <div style={{flex:1,minHeight:0,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",justifyContent:whisperSent?"flex-start":"center"}}>
                {whisperSent ? (
                  <div style={{marginLeft:"auto",maxWidth:"80%",background:"rgba(139,105,20,0.12)",borderRadius:"12px 12px 4px 12px",padding:"8px 12px"}}>
                    <p style={{margin:0,fontSize:12,lineHeight:1.6,color:"var(--text)",fontFamily:"'DM Sans',sans-serif"}}>{whisperSent}</p>
                  </div>
                ) : (
                  <p className="font-reading" style={{fontSize:12,color:"rgba(44,26,8,0.28)",fontStyle:"italic",textAlign:"center",lineHeight:1.6}}>
                    Start your first whisper with {(selectedCloseReader?.name || sofiaProfile.name).split(" ")[0]}.
                  </p>
                )}
              </div>
              {/* Text bubble */}
              {!whisperSent && (
                <div style={{flexShrink:0,margin:"0 12px 12px",background:"var(--bg)",border:"1px solid rgba(139,105,20,0.25)",borderRadius:14,padding:"12px 14px",boxShadow:"0 4px 16px rgba(139,105,20,0.1)"}}>
                  <textarea
                    value={whisperText}
                    onChange={e=>setWhisperText(e.target.value)}
                    placeholder="hey! I read this too. feels like we landed somewhere different. curious where you went with it."
                    style={{width:"100%",minHeight:56,border:"none",outline:"none",fontSize:12,lineHeight:1.65,color:"rgba(44,26,8,0.76)",resize:"none",background:"transparent",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box"}}
                  />
                  <div style={{display:"flex",justifyContent:"flex-end",gap:6,marginTop:6}}>
                    <button className="font-sans" onClick={()=>setWhisperText("")} style={{padding:"4px 10px",borderRadius:12,border:"1px solid rgba(139,105,20,0.2)",background:"transparent",fontSize:9,color:"var(--text)",cursor:"pointer"}}>Cancel</button>
                    <button
                      className="font-sans"
                      onClick={()=>{if(whisperText.trim()){setWhisperSent(whisperText.trim());setWhisperText("");}}}
                      style={{padding:"4px 14px",borderRadius:12,border:"none",background:whisperText.trim()?"rgba(139,105,20,0.72)":"rgba(139,105,20,0.18)",fontSize:9,fontWeight:600,color:"var(--bg)",cursor:whisperText.trim()?"pointer":"default",letterSpacing:"0.04em",transition:"background 160ms ease"}}
                    >Send</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:14,position:"relative"}}>
          <button
            onClick={()=>{
              if(step===0 && selectedBook){
                setSelectedBookId(null);
                setSelectedPassageId(null);
                return;
              }
              setStep(prev=>Math.max(0, prev-1));
            }}
            className="font-sans"
            onMouseEnter={()=>setHoveredButton("back")}
            onMouseLeave={()=>setHoveredButton(null)}
            style={subtleButton(hoveredButton==="back")}
          >
            {step===0 && selectedBook ? "Choose Another Book" : "Back"}
          </button>

          {step===1 && (
            <button onClick={nextStep} className="font-sans" onMouseEnter={()=>setHoveredButton("proceed")} onMouseLeave={()=>setHoveredButton(null)} style={actionButton(canAdvance, hoveredButton==="proceed")}>
              Proceed to find close readers
            </button>
          )}

          {step===2 && (
            <button onClick={nextStep} className="font-sans" onMouseEnter={()=>setHoveredButton("proceed")} onMouseLeave={()=>setHoveredButton(null)} style={actionButton(canAdvance, hoveredButton==="proceed")}>
              Proceed to whisper
            </button>
          )}

          {step===3 && (
            <p className="font-reading" style={{position:"absolute",left:0,right:0,textAlign:"center",margin:0,fontSize:14,lineHeight:1.5,color:"rgba(44,26,8,0.62)",pointerEvents:"none"}}>
              Guide is over! You can now begin{" "}
              <button
                onClick={finish}
                onMouseEnter={()=>setHoveredButton("enter")}
                onMouseLeave={()=>setHoveredButton(null)}
                style={{
                  pointerEvents:"auto",
                  background:"none",border:"none",borderRadius:0,padding:"0 0 2px",
                  cursor:"pointer",
                  fontFamily:"inherit",fontSize:"inherit",lineHeight:"inherit",
                  color:"#8B6914",fontWeight:700,
                  borderBottom:`${hoveredButton==="enter"?2:1}px solid ${hoveredButton==="enter"?"rgba(139,105,20,0.82)":"rgba(139,105,20,0.52)"}`,
                  transform:hoveredButton==="enter"?"translateY(-1px)":"none",
                  transition:"border-color 160ms ease, transform 160ms ease",
                }}
              >READ</button>ing
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

