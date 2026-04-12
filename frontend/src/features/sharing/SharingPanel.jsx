/* â"€â"€ SHARING PANEL â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
const CLOSE_READERS = [
  {initials:"LR",name:"Lena R.",signalTime:"2026-04-04T11:00:00Z",unread:2,from:"them",bg:"#C0392B",activeBook:"Jane Eyre",signal:"whisper",momentBook:"Jane Eyre"},
  {initials:"OT",name:"Omar T.",signalTime:"2026-04-03T09:15:00Z",unread:1,from:"them",bg:"rgba(139,105,20,0.55)",activeBook:"Moby Dick",signal:"shared_moment",momentBook:"Moby Dick"},
  {initials:"JW",name:"Jenna W.",signalTime:"2026-04-02T14:30:00Z",unread:0,from:"you",bg:"#1C1C1A",activeBook:"The Great Gatsby",signal:"whisper",momentBook:"The Great Gatsby"},
];
const CLOSE_CIRCLE_FEED = [
  {id:"feed-whisper", initials:"LR", name:"Lena R.", bg:"#C0392B", signal:"whisper", activeBook:"Jane Eyre", momentBook:"Jane Eyre", signalTime:"2026-04-04T11:00:00Z", preview:"This passage hits differently when you consider Austen was writing it while unmarried herself."},
  {id:"feed-shared", initials:"OT", name:"Omar T.", bg:"rgba(139,105,20,0.55)", signal:"shared_moment", activeBook:"Moby Dick", momentBook:"Moby Dick", signalTime:"2026-04-03T09:15:00Z", preview:"His father's generosity sounds like wisdom but lands like a quiet accusation."},
  {id:"feed-wave", initials:"JW", name:"Jenna W.", bg:"#1C1C1A", signal:"wave", activeBook:"The Great Gatsby", momentBook:"The Great Gatsby", signalTime:"2026-04-02T14:30:00Z"},
];
const CLOSE_READER_PROFILES = [
  {
    name:"Lena R.", since:"Feb '25", bio:"Reads against the grain", gender:"she",
    r:25, c:65, d:10, rt:20, ct:70, dt:10, rf:28, cf:60, df:12,
    commonBooks:5, momentCount:18,
    photo:null,
    coverBg:"#7A1A1A", stripFill:"#5C1010", stitchColor:"#C0392B",
    glyphColBg:"rgba(0,0,0,0.22)", textColor:"#F2EDE2", teaserColor:"rgba(242,237,226,0.82)",
    mutedColor:"rgba(242,237,226,0.48)", borderColor:"rgba(192,57,43,0.28)",
    moments:[
      {passage:"I am no bird; and no net ensnares me: I am a free human being with an independent will.",book:"Jane Eyre"},
      {passage:"It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",book:"Pride and Prejudice"},
    ],
  },
  {
    name:"Omar T.", since:"Dec '24", bio:"Finds resonance in restraint", gender:"he",
    r:70, c:15, d:15, rt:72, ct:14, dt:14, rf:68, cf:16, df:16,
    commonBooks:4, momentCount:15,
    photo:null,
    coverBg:"#5C4A1A", stripFill:"#3E3010", stitchColor:"#8B6914",
    glyphColBg:"rgba(0,0,0,0.22)", textColor:"#F2EDE2", teaserColor:"rgba(242,237,226,0.82)",
    mutedColor:"rgba(242,237,226,0.48)", borderColor:"rgba(139,105,20,0.28)",
    moments:[
      {passage:"Call me Ishmael.",book:"Moby Dick"},
      {passage:"His father's generosity sounds like wisdom but lands like a quiet accusation.",book:"Moby Dick"},
    ],
  },
  {
    name:"Jenna W.", since:"Mar '25", bio:"Reads between the lines", gender:"she",
    r:30, c:20, d:50, rt:28, ct:22, dt:50, rf:32, cf:18, df:50,
    commonBooks:3, momentCount:12,
    photo:null,
    coverBg:"#1C1C1A", stripFill:"#141412", stitchColor:"#4A4A46",
    glyphColBg:"rgba(0,0,0,0.22)", textColor:"#F2EDE2", teaserColor:"rgba(242,237,226,0.82)",
    mutedColor:"rgba(242,237,226,0.48)", borderColor:"rgba(74,74,70,0.35)",
    moments:[
      {passage:"In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.",book:"The Great Gatsby"},
      {passage:"So we beat on, boats against the current, borne back ceaselessly into the past.",book:"The Great Gatsby"},
    ],
  },
];

const TREES = [
  {name:"The Dostoevsky Tree", members:14, lastMsg:"New moment on Crime and Punishment posted",
    activePassage:"On an exceptionally hot evening early in July...", activeBook:"Crime and Punishment"},
  {name:"Feminist Reads", members:23, lastMsg:"June pick: Persuasion by Austen",
    activePassage:"It is a truth universally acknowledged...", activeBook:"Persuasion"},
  {name:"Philosophy & Fiction", members:31, lastMsg:"Is Meursault truly indifferent?",
    activePassage:"Mother died today. Or maybe yesterday, I don't know.", activeBook:"The Stranger"},
];

function CloseGlyphMark({size=16, pill=false, compact=false}) {
  const width = pill ? Math.max(18, size + 6) : size;
  const height = pill ? Math.max(18, size + 6) : size;
  const markColor = "rgba(139,105,20,0.84)";
  const mark = (
    <svg width={size} height={Math.round(size*0.72)} viewBox="0 0 24 17" style={{display:"block"}}>
      <text x="6.7" y="13.4" fontFamily="'Playfair Display',serif" fontWeight="700" fontSize="14.8" fill={markColor}>t</text>
      <text x="11.0" y="11.2" fontFamily="'Playfair Display',serif" fontWeight="700" fontSize="14.8" fill={markColor} transform="rotate(180 14.2 8.3)">t</text>
    </svg>
  );
  if(!pill) return mark;
  return (
    <div style={{
      width,
      height,
      borderRadius:999,
      border:`1px solid ${markColor}`,
      background:compact?"rgba(139,105,20,0.07)":"rgba(139,105,20,0.05)",
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      boxShadow:"inset 0 1px 0 rgba(255,255,255,0.45)",
      flexShrink:0
    }}>
      {mark}
    </div>
  );
}

function CloseCircleRing() {
  const [expanded, setExpanded] = React.useState(false);

  // Segment colors pulled from Worth's getRCDGlyphColor — no new hardcoded values
  const COLOR_R = getRCDGlyphColor(100, 0, 0);
  const COLOR_C = getRCDGlyphColor(0, 100, 0);
  const COLOR_D = getRCDGlyphColor(0, 0, 100);

  // Equal-weight average of RCD scores across all Close Circle profiles
  const profs = CLOSE_READER_PROFILES;
  const n = profs.length || 1;
  const avg = (key) => profs.reduce((s,p)=>s+(p[key]||0),0)/n;
  const thinkR=avg("rt"), thinkC=avg("ct"), thinkD=avg("dt");
  const feelR =avg("rf"), feelC =avg("cf"), feelD =avg("df");

  // ── Ring geometry ────────────────────────────────────────────────────────────
  const S=160, cx=80, cy=80, r=60, sw=14;
  const C = 2 * Math.PI * r;   // full circumference
  const H = C / 2;             // each half spans exactly this arc length

  // ── Stroke-dasharray / dashoffset arc positioning ────────────────────────────
  // SVG circles draw clockwise starting at 3 o'clock.
  // Path positions are measured clockwise from that 3 o'clock origin.
  //
  //   Bottom half (Feel)  : 3 → 6 → 9 o'clock  →  positions  0 … H
  //   Top half    (Think) : 9 → 12 → 3 o'clock  →  positions  H … C
  //
  // For strokeDasharray = "len C" (period = len + C), the segment of length `len`
  // lands at path position P when:
  //
  //     strokeDashoffset = len + C − P
  //
  // Proof: the leading dash (pattern pos 0) maps to path pos (period − offset) mod period.
  //   (len + C − D) mod (len + C) = P  →  D = len + C − P  ✓
  //
  // Cumulative position arithmetic (p0→p1→p2→p3) eliminates floating-point drift
  // so the three segments tile each half with exactly zero gap and zero overlap.

  // buildSegs: place three arc segments end-to-end between path positions [start, end].
  // `cols` sets each segment's color; pass reversed for the bottom half.
  const buildSegs = (v0, v1, v2, start, end, cols) => {
    const [C0,C1,C2] = cols;
    const span = end - start;
    const tot  = v0 + v1 + v2 || 1;
    const p0 = start;
    const p1 = start + span * v0 / tot;
    const p2 = start + span * (v0 + v1) / tot;
    const p3 = end;
    return [
      {len: p1-p0, start: p0, color: C0},
      {len: p2-p1, start: p1, color: C1},
      {len: p3-p2, start: p2, color: C2},
    ];
  };

  // GAP: arc-length gap at each junction (3 o'clock and 9 o'clock)
  const GAP = 2;

  // Bottom half (Feel): 3→6→9 o'clock, positions GAP/2 … H−GAP/2.
  // Reversed segment order (D,C,R) so that left-to-right reads R→C→D, matching top half.
  const feelSegs  = buildSegs(feelD, feelC, feelR, GAP/2, H - GAP/2, [COLOR_D, COLOR_C, COLOR_R]);

  // Top half (Think): 9→12→3 o'clock, positions H+GAP/2 … C−GAP/2.
  const thinkSegs = buildSegs(thinkR, thinkC, thinkD, H + GAP/2, C - GAP/2, [COLOR_R, COLOR_C, COLOR_D]);

  // ── Interior text — y-positions computed from ring dimensions ────────────────
  // dominantBaseline="central" places the visual midpoint of each text element at y.
  // innerR = distance to inner edge of stroke.
  // t and f are placed at ±54% of innerR — mid-height of their respective interior.
  // Approximate non-overlap check (fontSize ≈ em height, cap ≈ 0.72em):
  //   t    : cy − innerR*0.54  ±  12*0.72/2  ≈  [39, 48]
  //   count: cy − 3            ±  22*0.72/2  ≈  [54, 70]
  //   label: cy + 12           ±  6*0.72/2   ≈  [71, 74]
  //   f    : cy + innerR*0.54  ±  12*0.72/2  ≈  [82, 91]  — all clear ✓
  const innerR = r - sw / 2;                          // 39.5
  const yT     = +(cy - innerR * 0.54).toFixed(2);   // ≈43.7
  const yCount = +(cy - 3).toFixed(2);               // 62
  const yLabel = +(cy + 12).toFixed(2);              // 77
  const yF     = +(cy + innerR * 0.54).toFixed(2);   // ≈86.3

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}}>
      <button
        onClick={()=>setExpanded(e=>!e)}
        style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"block"}}
      >
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
          {[...feelSegs,...thinkSegs].map((s,i)=>(
            <circle key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={sw}
              strokeLinecap="butt"
              strokeDasharray={`${s.len} ${C}`}
              strokeDashoffset={s.len + C - s.start}
            />
          ))}
          {/* t — upper interior */}
          <text x={cx} y={yT} textAnchor="middle" dominantBaseline="central"
            fontFamily="'Playfair Display',serif" fontWeight="700" fontSize="20" fill="var(--text2)">t</text>
          {/* count + label — centre */}
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
            fontFamily="'DM Sans',sans-serif" fontSize="8" fill="var(--text2)" letterSpacing="0.03em">
            <tspan fontWeight="700" fill="var(--text)">{profs.length}</tspan> close readers
          </text>
          {/* f — lower interior (inverted t) */}
          <text x={cx} y={yF} textAnchor="middle" dominantBaseline="central"
            fontFamily="'Playfair Display',serif" fontWeight="700" fontSize="20" fill="var(--text2)"
            transform={`rotate(180 ${cx} ${yF})`}>t</text>
        </svg>
      </button>

      {expanded && (
        <div style={{width:S,paddingTop:2}}>
          {[["Think",[thinkR,thinkC,thinkD]],["Feel",[feelR,feelC,feelD]]].map(([label,vals],gi)=>(
            <div key={label} style={{marginTop:gi===1?10:0}}>
              {gi===1 && <div style={{height:1,background:"rgba(139,105,20,0.14)",marginBottom:10}}/>}
              <p style={{fontFamily:"'Playfair Display',serif",fontSize:9,fontWeight:700,color:"var(--text2)",margin:"0 0 6px",letterSpacing:"0.08em",textTransform:"uppercase"}}>{label}</p>
              {[["Resonating",vals[0],COLOR_R],["Contradicting",vals[1],COLOR_C],["Diverging",vals[2],COLOR_D]].map(([k,v,c])=>{
                const tot = vals[0]+vals[1]+vals[2]||1;
                return (
                  <div key={k} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:7,color:"var(--text2)",width:60,flexShrink:0}}>{k}</span>
                    <div style={{flex:1,height:3,borderRadius:2,background:"rgba(139,105,20,0.1)"}}>
                      <div style={{width:`${Math.round(v/tot*100)}%`,height:"100%",background:c,borderRadius:2}}/>
                    </div>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:7,color:"var(--text2)",width:22,textAlign:"right",flexShrink:0}}>{Math.round(v/tot*100)}%</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CloseCircleIcon({closeReaders=CLOSE_READERS, onOpenThread}) {
  const [open, setOpen] = React.useState(false);
  const [overlayProfile, setOverlayProfile] = React.useState(null);
  const ref = React.useRef(null);

  React.useEffect(()=>{
    if(!open) return;
    const handler = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return ()=>document.removeEventListener("mousedown", handler);
  },[open]);

  return (
    <React.Fragment>
    <div ref={ref} style={{position:"relative",display:"inline-block",flexShrink:0}}>

      {/* â"€â"€ Stat pill â"€â"€ */}
      <button onClick={()=>setOpen(o=>!o)}
        style={{display:"inline-flex",alignItems:"center",gap:6,
          padding:"5px 10px 5px 8px",
          borderRadius:20,
          border:`1px solid ${open?"rgba(139,105,20,0.4)":"rgba(139,105,20,0.22)"}`,
          background:open?"rgba(139,105,20,0.08)":"rgba(139,105,20,0.04)",
          cursor:"pointer",transition:"all 150ms",lineHeight:1}}>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,letterSpacing:"0.05em",color:"var(--text2)",lineHeight:1}}><span style={{color:"var(--amber)"}}>close</span> circle</span>
        <svg width={8} height={8} viewBox="0 0 8 8" fill="none"
          style={{marginLeft:1,transition:"transform 200ms",transform:open?"rotate(180deg)":"none",flexShrink:0}}>
          <path d="M1 2.5L4 5.5L7 2.5" stroke="var(--amber)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* â"€â"€ Dropdown: close readers list â"€â"€ */}
      {open && (
        <div onClick={e=>e.stopPropagation()}
          style={{position:"absolute",top:"calc(100% + 6px)",right:0,
            background:"var(--bg2)",border:"1px solid rgba(139,105,20,0.18)",
            borderRadius:10,boxShadow:"0 6px 20px rgba(0,0,0,0.1),0 1px 4px rgba(0,0,0,0.06)",
            zIndex:40,width:240,padding:"8px 0",
            animation:"discoverExpand 200ms cubic-bezier(0.34,1.1,0.64,1) both"}}>
          <div style={{padding:"12px 12px 10px",borderBottom:"1px solid rgba(139,105,20,0.1)",display:"flex",flexDirection:"column",alignItems:"center"}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:"0.12em",color:"var(--amber)",marginBottom:8}}>Your Close Circle</span>
            <CloseCircleRing />
          </div>
          {closeReaders.map((reader,i)=>{
            const wp = CLOSE_READER_PROFILES.find(p=>p.name===reader.name) || (typeof PROFILES!=="undefined" ? PROFILES.find(p=>p.name===reader.name) : null);
            const prof = wp || {name:reader.name,r:60,c:25,d:15,rt:60,ct:25,dt:15,rf:55,cf:30,df:15,bio:"",gender:"they",coverBg:reader.bg,moments:[],photo:null};
            return (
              <div key={reader.name} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",borderBottom:i<closeReaders.length-1?"1px solid rgba(139,105,20,0.07)":"none"}}>
                {/* Name */}
                <span style={{flex:1,fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{reader.name}</span>
                {/* Glyph — profile's actual colors, no labels */}
                {(()=>{
                  const tC = typeof getRCDGlyphColor!=="undefined" ? getRCDGlyphColor(prof.rt||prof.r, prof.ct||prof.c, prof.dt||prof.d) : "#2D8A4E";
                  const fC = typeof getRCDGlyphColor!=="undefined" ? getRCDGlyphColor(prof.rf||prof.r, prof.cf||prof.c, prof.df||prof.d) : "#C0392B";
                  return (
                    <svg width="30" height="30" viewBox="-6 9 66 67" style={{display:"block",flexShrink:0}}>
                      <rect x="-3" y="12" width="46" height="55" rx="10" fill="var(--amber3)" stroke="var(--amber)" strokeOpacity="0.35" strokeWidth="1.2"/>
                      <text x="4" y="50" fontFamily="'Playfair Display',serif" fontWeight="700" fontSize="42" fill={tC}>t</text>
                      <text x="36" y="50" fontFamily="'Playfair Display',serif" fontWeight="700" fontSize="42" fill={fC} transform="translate(72,80) rotate(180)">t</text>
                    </svg>
                  );
                })()}
                {/* View them */}
                <button onClick={()=>{ setOpen(false); setOverlayProfile(prof); }}
                  style={{flexShrink:0,display:"inline-flex",alignItems:"center",justifyContent:"center",height:24,padding:"0 9px",borderRadius:999,border:"1px solid rgba(139,105,20,0.28)",background:"rgba(139,105,20,0.06)",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:7.5,fontWeight:700,color:"var(--amber)",letterSpacing:"0.1em",textTransform:"uppercase"}}>
                  view
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>

    {overlayProfile && ReactDOM.createPortal(
      <div onClick={()=>setOverlayProfile(null)}
        style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(20,14,4,0.72)",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>
        <div onClick={e=>e.stopPropagation()} style={{position:"relative",width:320,height:440}}>
          <ProfileCard
            profile={overlayProfile}
            isClose={true}
            showTeaser={true}
            showOverlays={true}
            showFooter={true}
            nameSize={22}
            seamless={false}
            onWhisper={()=>{ setOverlayProfile(null); onOpenThread&&onOpenThread(overlayProfile.name, null); }}
          />
          <button onClick={()=>setOverlayProfile(null)}
            style={{position:"absolute",top:-20,right:-20,width:28,height:28,borderRadius:"50%",border:"1.5px solid rgba(139,105,20,0.35)",background:"var(--bg)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.18)",color:"var(--text2)",fontSize:14,fontWeight:700,lineHeight:1}}>
            ×
          </button>
        </div>
      </div>,
      document.body
    )}
    </React.Fragment>
  );
}

function timeAgo(isoStr) {
  if(!isoStr) return "";
  const diff = (Date.now() - new Date(isoStr).getTime()) / 1000;
  if(diff < 60)     return "just now";
  if(diff < 3600)   return Math.floor(diff/60)    + "m ago";
  if(diff < 86400)  return Math.floor(diff/3600)  + "h ago";
  if(diff < 604800) return Math.floor(diff/86400) + "d ago";
  return Math.floor(diff/604800) + "w ago";
}

function getSignalCopy(item) {
  const isYou = item.from === "you";
  if(item.signal==="same_book")      return "is reading " + item.activeBook + " too";
  if(item.signal==="similar_moment") return "caught your moment";
  if(item.signal==="shared_moment")  return isYou ? "you shared a moment" : "shared a moment";
  if(item.signal==="wave_back")      return "is your Close Reader";
  if(item.signal==="wave")           return "waved at you";
  return isYou ? "you whispered" : "has whispered";
}

function CloseRow({reader, onClick, highlight=false}) {
  const [hov,setHov]=useState(false);
  const worthProfile = CLOSE_READER_PROFILES.find(p=>p.name===reader.name) || (typeof PROFILES!=="undefined" ? PROFILES.find(p=>p.name===reader.name) : null);
  return (
    <div data-reader-name={reader.name} onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer",
        background:hov?"rgba(139,105,20,0.06)":highlight?"rgba(139,105,20,0.03)":"var(--close-row-bg)",
        border:"1px solid rgba(139,105,20,0.08)",
        borderLeft:highlight?"3px solid rgba(139,105,20,0.35)":"3px solid transparent",
        borderRadius:12,
        boxShadow:hov?"0 8px 20px rgba(139,105,20,0.06)":"none",
        transition:"background 120ms, box-shadow 120ms"}}>
      <div style={{position:"relative",flexShrink:0}}>
        <div style={{
          width:40,
          height:52,
          borderRadius:10,
          overflow:"hidden",
          background:"#000000",
          boxShadow:"0 6px 14px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.28)",
          border:"1px solid rgba(139,105,20,0.12)",
          display:"flex",
          alignItems:"center",
          justifyContent:"center"
        }}>
          {worthProfile&&worthProfile.photo ? (
            <img
              src={worthProfile.photo}
              alt={reader.name}
              draggable={false}
              style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
            />
          ) : (
            <span style={{color:"#FFFFFF",fontFamily:"Playfair Display,serif",fontSize:14,fontWeight:600}}>{reader.initials}</span>
          )}
        </div>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
          <span className="font-sans" style={{fontSize:13,fontWeight:reader.from!=="you"&&reader.unread>0?700:400,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{reader.name}</span>
          {reader.from!=="you" && reader.signalTime && (
            <span className="font-sans" style={{fontSize:9,color:"var(--text2)",flexShrink:0,whiteSpace:"nowrap"}}>{timeAgo(reader.signalTime)}</span>
          )}
        </div>
        <p className="font-sans" style={{fontSize:11.5,color:reader.from!=="you"&&reader.unread>0?"var(--text)":"rgba(139,105,20,0.5)",margin:"3px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:reader.from!=="you"&&reader.unread>0?600:400}}>{getSignalCopy(reader)}</p>
      </div>
      {reader.from!=="you" && reader.unread>0 && (
        <div style={{minWidth:18,height:18,borderRadius:9,background:"#8B6914",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"var(--bg)",padding:"0 5px",flexShrink:0}}>{reader.unread}</div>
      )}
    </div>
  );
}

function CircleSignalCard({item, onWaveBack, onWhisper, onDismiss, onPromote, exiting=false}) {
  const worthProfile = CLOSE_READER_PROFILES.find(p=>p.name===item.name) || (typeof PROFILES!=="undefined" ? PROFILES.find(p=>p.name===item.name) : null);
  const [showProfileOverlay, setShowProfileOverlay] = useState(false);
  const isViewable = item.signal==="wave" || item.signal==="wave_back";
  const tone = item.signal==="wave_back"
    ? {
        border:"rgba(196,160,85,0.4)",
        background:"var(--signal-card-amber)",
        shadow:"0 10px 22px rgba(139,105,20,0.1)",
        text:"var(--text)",
        line:"#7A5A0E",
        buttonBg:"var(--card)",
        buttonBorder:"rgba(154,116,21,0.46)",
        buttonText:"var(--amber)",
      }
    : item.signal==="wave"
      ? {
          border:"rgba(196,160,85,0.4)",
          background:"var(--signal-card-amber)",
          shadow:"0 8px 18px rgba(139,105,20,0.08)",
          text:"var(--text)",
          line:"var(--amber)",
          buttonBg:"var(--card)",
          buttonBorder:"rgba(154,116,21,0.4)",
          buttonText:"var(--amber)",
        }
      : item.signal==="whisper" || item.signal==="shared_moment"
        ? {
            border:"var(--border)",
            background:"var(--signal-card-neutral)",
            shadow:"0 8px 18px rgba(44,44,42,0.04)",
            text:"var(--text)",
            line:"var(--text2)",
            buttonBg:"var(--card)",
            buttonBorder:"var(--border)",
            buttonText:"var(--text)",
          }
        : {
            border:"var(--border)",
            background:"var(--signal-card-neutral)",
            shadow:"0 8px 18px rgba(44,44,42,0.04)",
            text:"var(--text2)",
            line:"var(--border)",
            buttonBg:"var(--card)",
            buttonBorder:"var(--border)",
            buttonText:"var(--text2)",
          };
  const signalCopy = getSignalCopy(item);
  const bookTag = item.momentBook || item.activeBook || null;
  const isThreadCard = item.signal==="whisper" || item.signal==="shared_moment";
  const handleCardClick = () => {
    if(item.signal==="wave_back") { onWhisper&&onWhisper(); return; }
    onWhisper&&onWhisper();
    onDismiss&&onDismiss();
  };
  return (
    <React.Fragment>
    <div style={{flex:"0 0 auto",maxWidth:exiting?0:(item.signal==="whisper"||item.signal==="shared_moment"?250:220),overflow:"hidden",opacity:exiting?0:1,transition:"max-width 320ms ease, opacity 260ms ease"}}>
    <div
      onClick={handleCardClick}
      style={{minWidth:186,maxWidth:item.signal==="whisper"||item.signal==="shared_moment"?250:220,flex:"0 0 auto",padding:"11px 12px",borderRadius:12,border:`1px solid ${tone.border}`,background:tone.background,boxShadow:tone.shadow,cursor:item.signal==="wave_back"?"default":"pointer",transition:"background 180ms, box-shadow 180ms, border-color 180ms, transform 180ms",transform:item.signal==="wave_back"?"translateY(-1px)":"none",position:"relative"}}
    >
      <div style={{height:3.5,borderRadius:999,background:tone.line,opacity:0.96,marginBottom:9}}/>
      <div style={{display:"flex",alignItems:"center",gap:9}}>
        <div style={{width:24,height:31,borderRadius:7,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",background:"#000000",border:"1px solid rgba(139,105,20,0.12)",boxShadow:"0 4px 10px rgba(0,0,0,0.05)",flexShrink:0}}>
          {worthProfile&&worthProfile.photo ? (
            <img
              src={worthProfile.photo}
              alt={item.name}
              draggable={false}
              style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
            />
          ) : (
            <span style={{fontFamily:"Playfair Display,serif",fontSize:9.5,fontWeight:700,color:"#FFFFFF"}}>{item.initials}</span>
          )}
        </div>
        <div style={{minWidth:0,flex:1}}>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:4}}>
            <p className="font-serif" style={{fontSize:12.5,fontWeight:700,color:"var(--text)",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{item.name}</p>
            {item.signalTime && <span className="font-sans" style={{fontSize:8,color:"var(--text2)",flexShrink:0,whiteSpace:"nowrap"}}>{timeAgo(item.signalTime)}</span>}
          </div>
          <p className="font-sans" style={{fontSize:10,color:tone.text,margin:"3px 0 0",lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:item.signal==="wave_back"||item.signal==="whisper"?600:500}}>
            {signalCopy}
          </p>
        </div>
      </div>
      {isViewable ? (
        <div style={{marginTop:8}}>
          <button onClick={e=>{e.stopPropagation(); setShowProfileOverlay(true);}} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",height:26,padding:"0 12px",borderRadius:999,border:`1.5px solid ${tone.buttonBorder}`,background:"var(--card)",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:8,fontWeight:700,color:tone.buttonText,letterSpacing:"0.1em",textTransform:"uppercase"}}>
            view them
          </button>
        </div>
      ) : (
        bookTag && (
          <div style={{marginTop:8,display:"inline-flex",alignItems:"center",padding:"4px 8px",borderRadius:999,background:"var(--card)",border:`1px solid ${tone.border}`}}>
            <span className="font-reading" style={{fontSize:9.5,fontStyle:"italic",color:"var(--text)",lineHeight:1.2,whiteSpace:"nowrap"}}>
              {bookTag}
            </span>
          </div>
        )
      )}
      {(item.signal==="whisper" || item.signal==="shared_moment") && item.preview && (
        <p className="font-sans" style={{fontSize:9.75,color:tone.line,margin:"8px 0 0",lineHeight:1.45,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
          {item.preview}
        </p>
      )}
      {item.signal==="wave" && (
        <div style={{marginTop:9}}>
          <button onClick={e=>{e.stopPropagation(); onWaveBack&&onWaveBack();}} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",height:30,padding:"0 14px",borderRadius:999,border:`1.5px solid ${tone.buttonBorder}`,background:"var(--card)",cursor:"pointer",fontFamily:"'Playfair Display',serif",fontSize:11,fontStyle:"italic",fontWeight:700,color:tone.buttonText,letterSpacing:"0.03em"}}>
            Wave back
          </button>
        </div>
      )}
      {item.signal==="wave_back" && (
        <div style={{marginTop:9}}>
          <button onClick={e=>{e.stopPropagation(); onWhisper&&onWhisper();}} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",height:30,padding:"0 14px",borderRadius:999,border:`1.5px solid ${tone.buttonBorder}`,background:"var(--card)",cursor:"pointer",fontFamily:"'Playfair Display',serif",fontSize:11,fontStyle:"italic",fontWeight:700,color:tone.buttonText,letterSpacing:"0.03em"}}>
            Whisper
          </button>
        </div>
      )}
      <button
        onClick={e=>{e.stopPropagation(); onDismiss&&onDismiss();}}
        style={{position:"absolute",bottom:7,right:7,width:16,height:16,borderRadius:"50%",border:"1px solid rgba(139,105,20,0.18)",background:"var(--card)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,lineHeight:1,fontSize:9,color:"var(--amber)",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}
      >×</button>
    </div>
    </div>

    {showProfileOverlay && ReactDOM.createPortal(
      (()=>{
        const overlayProfile = worthProfile || {name:item.name,r:60,c:25,d:15,rt:60,ct:25,dt:15,rf:55,cf:30,df:15,bio:"",gender:"they",coverBg:item.bg,moments:[],photo:null};
        return (
          <div onClick={()=>setShowProfileOverlay(false)}
            style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(20,14,4,0.72)",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>
            <div onClick={e=>e.stopPropagation()} style={{position:"relative",width:320,height:440}}>
              <ProfileCard
                profile={overlayProfile}
                isClose={item.signal==="wave_back"}
                waveBackMode={item.signal==="wave"}
                showTeaser={true}
                showOverlays={true}
                showFooter={true}
                nameSize={22}
                seamless={false}
                onWhisper={()=>{ setShowProfileOverlay(false); onWhisper&&onWhisper(); }}
                onWaveBack={()=>{ setShowProfileOverlay(false); onWaveBack&&onWaveBack(); }}
              />
              <button onClick={()=>setShowProfileOverlay(false)}
                style={{position:"absolute",top:-20,right:-20,width:28,height:28,borderRadius:"50%",border:"1.5px solid rgba(139,105,20,0.35)",background:"var(--bg)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.18)",color:"var(--text2)",fontSize:14,fontWeight:700,lineHeight:1}}>
                ×
              </button>
            </div>
          </div>
        );
      })(),
      document.body
    )}
    </React.Fragment>
  );
}

function TreeRow({tree}) {
  const [hov,setHov]=useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 24px",cursor:"pointer",background:hov?"rgba(139,105,20,0.04)":"transparent",borderBottom:"1px solid rgba(139,105,20,0.06)",transition:"background 120ms"}}>
      <div style={{position:"relative",flexShrink:0,marginTop:2}}>
        <div style={{width:36,height:36,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(139,105,20,0.08)"}}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L13.5 7H11.5L14 11H11V18H9V11H6L8.5 7H6.5L10 2Z" fill="#8B6914"/></svg>
        </div>
        <div style={{position:"absolute",top:-4,right:-4,minWidth:16,height:16,borderRadius:8,background:"#8B6914",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:"var(--bg)",padding:"0 4px"}}>{tree.members}</div>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p className="font-sans" style={{fontSize:13,fontWeight:500,color:"var(--text)",margin:0}}>{tree.name}</p>
        {/* Active passage */}
        {tree.activePassage && (
          <div style={{margin:"5px 0 3px",borderLeft:"2px solid rgba(139,105,20,0.25)",paddingLeft:7}}>
            <p className="font-reading" style={{fontSize:10,fontStyle:"italic",color:"rgba(44,44,42,0.8)",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.4}}>
              "{tree.activePassage}"
            </p>
            <p className="font-sans" style={{fontSize:8,color:"var(--text)",margin:"2px 0 0"}}>{tree.activeBook}</p>
          </div>
        )}
        <p className="font-sans" style={{fontSize:10,color:"var(--text)",margin:"2px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tree.lastMsg}</p>
      </div>
    </div>
  );
}

/* Maps passages to which close readers the moment was shared with */
const SHARED_WITH = [
  {passage:"It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.", readers:["Sofia A.","Kento M."]},
  {passage:"In my younger and more vulnerable years my father gave me some advice.", readers:["Sofia A."]},
  {passage:"There was no possibility of taking a walk that day.", readers:["Lena R.","Kento M."]},
];

function _sharingColor(str) {
  var cols = ["#C0392B","#8B6914","#2D8A4E","#1C5A8A","#7A3E8A","#4A6A3E"];
  var h = 0;
  for (var i = 0; i < (str||"").length; i++) h = (str.charCodeAt(i) + ((h << 5) - h)) | 0;
  return cols[Math.abs(h) % cols.length];
}

function SharingPanel({authUser, focusedMoment, onClear, whisperTarget, onClearWhisperTarget, onSnip, sharingDropZone, openBookInRead, onOpenMoments, activeThreadName, activeThreadPendingMoment, onOpenThread, onCloseThread, onResolveThreadPendingMoment, feedAdditions, hideHeader, sectionCount=1}) {
  const threadKey = useRef(0);
  const [feedItems, setFeedItems] = useState([]);
  const [closeReaders, setCloseReaders] = useState([]);
  const [sharingLoaded, setSharingLoaded] = useState(false);
  const [threadHistory, setThreadHistory] = useState({});
  const [exitingFeedIds, setExitingFeedIds] = useState(new Set());

  useEffect(function() {
    if (!authUser) return;
    var readersPromise = apiGet("/sharing/close-readers").then(function(rows) {
      setCloseReaders((rows||[]).map(function(r) {
        var name = (r.first_name||"") + " " + ((r.last_name||"")[0]||"") + ".";
        return {
          initials: ((r.first_name||"?")[0]+(r.last_name||"?")[0]).toUpperCase(),
          name: name,
          signalTime: r.created_at || new Date().toISOString(),
          unread: 0, from: "them",
          bg: _sharingColor(r.reader_firebase_uid || name),
          signal: "wave", activeBook: "", momentBook: "",
          firebase_uid: r.reader_firebase_uid,
        };
      }));
    }).catch(function(){ setCloseReaders(CLOSE_READERS); });

    var threadsPromise = apiGet("/sharing/threads").then(function(threads) {
      setFeedItems((threads||[]).map(function(t) {
        var name = (t.first_name||"") + " " + ((t.last_name||"")[0]||"") + ".";
        return {
          id: t.id,
          initials: ((t.first_name||"?")[0]+(t.last_name||"?")[0]).toUpperCase(),
          name: name,
          bg: _sharingColor(t.other_uid || name),
          signal: t.last_message ? "whisper" : "wave",
          activeBook: "", momentBook: "",
          signalTime: t.updated_at || t.created_at,
          preview: t.last_message || "",
          unread: t.unread_count || 0,
        };
      }));
    }).catch(function(){ setFeedItems(CLOSE_CIRCLE_FEED); });

    Promise.all([readersPromise, threadsPromise]).then(function(){ setSharingLoaded(true); });
  }, [authUser]);

  useEffect(()=>{
    if(!feedAdditions || feedAdditions.length===0) return;
    setFeedItems(prev=>{
      const existingIds = new Set(prev.map(f=>f.id));
      const newItems = feedAdditions.filter(f=>!existingIds.has(f.id));
      return newItems.length ? [...newItems, ...prev] : prev;
    });
    feedAdditions.forEach(item=>{
      if(item.signal==="wave_back") {
        setCloseReaders(prev=>prev.some(r=>r.name===item.name) ? prev : [...prev, {initials:item.initials,name:item.name,signalTime:new Date().toISOString(),unread:1,from:"them",bg:item.bg,activeBook:item.activeBook,signal:"wave_back",momentBook:item.momentBook}]);
      }
    });
  },[feedAdditions]);

  useEffect(()=>{
    if(!whisperTarget) return;
    threadKey.current += 1;
    onOpenThread&&onOpenThread(whisperTarget.name, whisperTarget.pendingMoment||null);
    onClearWhisperTarget&&onClearWhisperTarget();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[whisperTarget]);

  useEffect(()=>{
    if(!activeThreadName) return;
    // Clear unread count when thread is opened
    setCloseReaders(prev=>prev.map(r=>r.name===activeThreadName ? {...r, unread:0} : r));
    const matchingIds = feedItems
      .filter(f=>f.name===activeThreadName && (f.signal==="whisper"||f.signal==="shared_moment"))
      .map(f=>f.id);
    if(!matchingIds.length) return;
    setExitingFeedIds(prev=>new Set([...prev,...matchingIds]));
    setTimeout(()=>{
      setFeedItems(prev=>prev.filter(f=>!matchingIds.includes(f.id)));
      setExitingFeedIds(prev=>{const s=new Set(prev);matchingIds.forEach(id=>s.delete(id));return s;});
    },340);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[activeThreadName]);

  if(activeThreadName) {
    const profile = PROFILES.find(p=>p.name===activeThreadName)
      || CLOSE_READER_PROFILES.find(p=>p.name===activeThreadName)
      || {name:activeThreadName, gender:"they", r:60,c:25,d:15,rt:60,ct:25,dt:15,rf:55,cf:30,df:15};
    return <WhisperThread
      key={threadKey.current}
      profile={profile}
      onClose={()=>{ onCloseThread&&onCloseThread(); }}
      onSnip={onSnip}
      onOpenMoments={onOpenMoments}
      pendingMoment={activeThreadPendingMoment}
      onResolvePendingMoment={onResolveThreadPendingMoment}
      savedThread={threadHistory[activeThreadName]||null}
      onThreadUpdate={(msgs)=>setThreadHistory(prev=>({...prev,[activeThreadName]:msgs}))}
      currentUser={authUser}
      onSent={(type)=>{
        setCloseReaders(prev=>prev.map(r=>r.name===activeThreadName
          ? {...r, signal:type==="card"?"shared_moment":"whisper", from:"you", signalTime:new Date().toISOString(), unread:0}
          : r
        ));
      }}/>;
  }

  const sharedNames = focusedMoment
    ? (SHARED_WITH.find(s=>s.passage===focusedMoment.passage)||{readers:[]}).readers
    : null;

  const whisperedReaders    = sharedNames ? closeReaders.filter(r=> sharedNames.includes(r.name)) : closeReaders;
  const notWhisperedReaders = sharedNames ? closeReaders.filter(r=>!sharedNames.includes(r.name)) : closeReaders;

  const displayReaders = !focusedMoment         ? closeReaders
    : sharingDropZone==="whispered"     ? whisperedReaders
    : sharingDropZone==="not-whispered" ? notWhisperedReaders
    : closeReaders;

  const zoneLabel = sharingDropZone==="whispered"     ? "Whispered Moment already"
                  : sharingDropZone==="not-whispered" ? "Yet to Whisper"
                  : null;
  const currentBookTitle = openBookInRead?.title || SHELF_BOOKS.find(b=>b.id===LAST_READ_SHELF_ID)?.title || SHELF_BOOKS[0]?.title;
  const handleDismissCard = (item) => {
    setExitingFeedIds(prev=>new Set([...prev,item.id]));
    setTimeout(()=>{
      setFeedItems(prev=>prev.filter(f=>f.id!==item.id));
      setExitingFeedIds(prev=>{const s=new Set(prev);s.delete(item.id);return s;});
    },340);
  };
  const handlePromoteWaveCard = (item) => {
    setFeedItems(prev=>prev.map(f=>f.id===item.id?{...f,signal:"wave_back"}:f));
    setCloseReaders(prev=>prev.some(r=>r.name===item.name)?prev:[...prev,{initials:item.initials,name:item.name,signalTime:new Date().toISOString(),unread:1,from:"them",bg:item.bg,activeBook:item.activeBook,signal:"wave_back",momentBook:item.momentBook}]);
  };
  const handleWaveBack = (item) => {
    setFeedItems(prev=>prev.map(feedItem=>feedItem.id===item.id ? ({...feedItem, signal:"wave_back"}) : feedItem));
    setCloseReaders(prev=>{
      if(prev.some(r=>r.name===item.name)) return prev;
      return [...prev, {initials:item.initials, name:item.name, lastMsg:"Waved back", signalTime:new Date().toISOString(), unread:1, bg:item.bg, activeBook:item.activeBook, signal:"wave_back", momentBook:item.momentBook}];
    });
  };
  const handleWhisperFromFeed = (item) => {
    threadKey.current += 1;
    onOpenThread&&onOpenThread(item.name, null);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",paddingTop:48,boxSizing:"border-box"}}>
      {focusedMoment && (
        <div style={{flexShrink:0,padding:"10px 24px",background:"rgba(139,105,20,0.06)",borderBottom:"1px solid rgba(139,105,20,0.12)",display:"flex",alignItems:"flex-start",gap:12}}>
          <div style={{flex:1,minWidth:0}}>
            <p className="font-sans" style={{fontSize:9,letterSpacing:"0.04em",textTransform:"uppercase",color:"var(--amber)",margin:"0 0 3px",fontWeight:600}}>
              {zoneLabel || "Whispers for this moment"}
            </p>
            <p className="font-reading" style={{fontSize:11,fontStyle:"italic",color:"var(--text)",margin:0,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>"{focusedMoment.passage}"</p>
            <p className="font-sans" style={{fontSize:9,color:"var(--text)",margin:"2px 0 0",fontStyle:"italic"}}>{focusedMoment.book}</p>
          </div>
          <button onClick={onClear} style={{flexShrink:0,width:20,height:20,borderRadius:"50%",background:"rgba(139,105,20,0.12)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"var(--amber)"}}>x</button>
        </div>
      )}
      <div className={`panel-scroll${sectionCount===4?" scroll-dim":""}`} style={{flex:1,overflowY:"auto",scrollbarColor:sectionCount===4?"rgba(139,105,20,0.04) transparent":undefined}}>
        {!focusedMoment && (
          <div style={{padding:"16px 24px 10px"}}>
            <div style={{borderRadius:14,border:"1px solid var(--border2)",background:"var(--card)",padding:"14px 14px 12px"}}>
              <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <CloseGlyphMark size={13} pill compact />
                      <p className="font-sans" style={{fontSize:8,letterSpacing:"0.12em",textTransform:"uppercase",margin:0,fontWeight:700}}>
                        <span style={{color:"var(--amber)"}}>Close Circle</span>
                        <span style={{color:"var(--text2)",fontWeight:500}}> Activity</span>
                      </p>
                    </div>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,fontWeight:600,color:"var(--text2)",background:"var(--bg2)",borderRadius:20,padding:"2px 8px"}}>{feedItems.length} signals</span>
                  </div>
                  {feedItems.length>0 ? (
                    <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4,scrollSnapType:"x proximity"}}>
                      {feedItems.map(item=><CircleSignalCard key={item.id} item={item} onWaveBack={()=>handleWaveBack(item)} onWhisper={()=>handleWhisperFromFeed(item)} onDismiss={()=>handleDismissCard(item)} onPromote={()=>handlePromoteWaveCard(item)} exiting={exitingFeedIds.has(item.id)}/>)}
                    </div>
                  ) : (
                    <div style={{padding:"8px 0 2px"}}>
                      <p className="font-sans" style={{fontSize:10.5,color:"var(--text2)",margin:0,lineHeight:1.6}}>
                        Signals from your Close Circle will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        <div style={{padding:"0 24px 10px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 0 8px"}}>
            <p className="font-sans" style={{fontSize:10,letterSpacing:"0.08em",color:"var(--text)",margin:0}}>
              <strong style={{color:"var(--amber)"}}>Close</strong> Whispers
              {focusedMoment && displayReaders.length===0 && (
                  <span style={{fontWeight:400,fontStyle:"italic",color:"var(--text)",marginLeft:8}}>— none</span>
              )}
            </p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {displayReaders.map(r=>(
              <CloseRow key={r.name} reader={r} highlight={!!focusedMoment}
                onClick={()=>{
                  const pm = (sharingDropZone==="whispered" && focusedMoment) ? focusedMoment : null;
                  threadKey.current += 1;
                  onOpenThread&&onOpenThread(r.name, pm);
                }}/>
            ))}
            {displayReaders.length === 0 && (
              <p className="font-sans" style={{fontSize:11,fontStyle:"italic",color:"var(--text2)",margin:"4px 0 0",lineHeight:1.6}}>
                no whispers yet
              </p>
            )}
          </div>
        </div>
        {!focusedMoment && (<>
          <div style={{height:1,background:"rgba(139,105,20,0.1)",margin:"8px 0"}}/>
          <div style={{padding:"18px 24px 24px"}}>
            <div style={{position:"relative",overflow:"hidden",borderRadius:14,border:"1px solid var(--border)",background:"var(--card)",boxShadow:"0 10px 28px rgba(139,105,20,0.06)",padding:"24px 26px 22px"}}>
              <div style={{position:"absolute",right:-12,top:-8,opacity:0.1,pointerEvents:"none"}}>
                <svg width="170" height="120" viewBox="0 0 170 120" fill="none">
                  <path d="M84 18V102" stroke="#8B6914" strokeWidth="2.2" strokeLinecap="round"/>
                  <path d="M84 42C65 42 53 35 40 22" stroke="#8B6914" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M84 58C109 58 124 45 141 28" stroke="#8B6914" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M84 74C60 74 46 86 31 101" stroke="#8B6914" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M84 82C106 82 121 90 138 104" stroke="#8B6914" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="40" cy="22" r="6" fill="#8B6914"/>
                  <circle cx="141" cy="28" r="6" fill="#8B6914"/>
                  <circle cx="31" cy="101" r="6" fill="#8B6914"/>
                  <circle cx="138" cy="104" r="6" fill="#8B6914"/>
                  <circle cx="84" cy="18" r="6" fill="#8B6914"/>
                </svg>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,margin:"0 0 8px",position:"relative"}}>
                <p className="font-sans" style={{fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--amber)",margin:0,fontWeight:700}}>Coming Soon</p>
                <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 8px",borderRadius:999,border:"1px solid rgba(139,105,20,0.16)",background:"rgba(139,105,20,0.06)"}}>
                  <svg width="10" height="10" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2L13.5 7H11.5L14 11H11V18H9V11H6L8.5 7H6.5L10 2Z" fill="var(--amber)"/>
                  </svg>
                  <span className="font-sans" style={{fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--amber)",fontWeight:600,lineHeight:1}}>Thicket</span>
                </div>
              </div>
              <p className="font-serif" style={{fontSize:22,fontWeight:700,color:"var(--text)",margin:"0 0 10px",lineHeight:1.2,position:"relative"}}>Reading Trees are growing soon.</p>
              <p className="font-reading" style={{fontSize:13,fontStyle:"italic",color:"var(--text2)",margin:"0 0 16px",lineHeight:1.7,maxWidth:540,position:"relative"}}>
                In <span style={{color:"var(--amber)",fontWeight:700,fontStyle:"normal"}}>Thicket</span>, you&apos;ll be able to gather three or more Close Readers into a shared reading group called <span style={{color:"var(--amber)",fontWeight:700,fontStyle:"normal"}}>Tree</span> <span style={{display:"inline-flex",verticalAlign:"middle",marginLeft:3,transform:"translateY(-1px)"}}><svg width="11" height="11" viewBox="0 0 20 20" fill="none"><path d="M10 2L13.5 7H11.5L14 11H11V18H9V11H6L8.5 7H6.5L10 2Z" fill="var(--amber)"/></svg></span>.
              </p>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",position:"relative"}}>
                {[
                  "Create groups of Close Readers",
                  "Share moments inside the group",
                  "Read together in smaller circles",
                ].map(item=>(
                  <div key={item} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 10px",borderRadius:999,background:"rgba(139,105,20,0.08)",border:"1px solid rgba(139,105,20,0.1)"}}>
                    <span style={{width:5,height:5,borderRadius:"50%",background:"var(--amber)",display:"inline-block"}}/>
                    <span className="font-sans" style={{fontSize:9.5,color:"var(--text)",letterSpacing:"0.02em"}}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>)}
      </div>
    </div>
  );
}


