/* Worth presentation helpers */

function GlyphWithHoverBars({tColor, fColor, rt, ct, dt, rf, cf, df, domLabelFull, firstName}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,position:"relative"}}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
        <p style={{fontFamily:"'Playfair Display',serif",fontSize:11.5,fontWeight:400,fontStyle:"italic",fontVariantCaps:"small-caps",letterSpacing:"0.08em",color:"var(--amber)",margin:"0 0 5px",lineHeight:1,textAlign:"center"}}>
          Signature
        </p>
        <svg style={{width:80,height:80,display:"block"}} viewBox="-6 9 66 67" preserveAspectRatio="xMidYMid meet">
          <rect x="-3" y="12" width="46" height="55" rx="10" fill="var(--amber3)" stroke="var(--amber)" strokeOpacity="0.35" strokeWidth="1.2"/>
          <text x="4" y="50" fontFamily="'Playfair Display',serif" fontWeight="700" fontSize="42" fill={tColor}>t</text>
          <text x="36" y="50" fontFamily="'Playfair Display',serif" fontWeight="700" fontSize="42" fill={fColor} transform="translate(72,80) rotate(180)">t</text>
          <text x="13" y="60" fontFamily="'DM Sans',sans-serif" fontWeight="700" fontSize="9" fill={tColor} textAnchor="middle" letterSpacing="0.5">{domLabelFull(rt,ct,dt).slice(0,3).toUpperCase()}</text>
          <text x="27" y="26" fontFamily="'DM Sans',sans-serif" fontWeight="700" fontSize="9" fill={fColor} textAnchor="middle" letterSpacing="0.5">{domLabelFull(rf,cf,df).slice(0,3).toUpperCase()}</text>
        </svg>
      </div>
      {hovered && (
        <div style={{position:"absolute",right:"calc(50% + 44px)",top:"50%",transform:"translateY(-50%)",zIndex:10,background:"var(--bg)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",boxShadow:"0 6px 20px rgba(139,105,20,0.14)",display:"flex",flexDirection:"column",gap:8,width:300}}>
          <MatchBar label="think" resonate={rt} contradict={ct} diverge={dt} name={firstName} />
          <MatchBar label="feel" resonate={rf} contradict={cf} diverge={df} name={firstName} />
        </div>
      )}
    </div>
  );
}

function ProfileScrollCard({p, i, cardWidth, cardHeight, showTeaser, isHovered, onOpenWhisper, onWave, isExiting, onMouseEnter, onMouseLeave}) {
  const [openMomentTick, setOpenMomentTick] = useState(0);
  const [externalMomentAction, setExternalMomentAction] = useState(null);
  const [momentState, setMomentState] = useState({flipped:false,momentoIdx:0,momentsLength:p.moments?.length||0});
  const firstName = p.name.split(" ")[0];
  return (
    <div
      key={p.name+"-"+i}
      style={{width:isExiting?0:cardWidth,minWidth:isExiting?0:cardWidth,height:cardHeight,flexShrink:0,scrollSnapAlign:"start",display:"flex",flexDirection:"column",overflow:"hidden",opacity:isExiting?0:1,transform:isExiting?"scale(0.94)":"none",transition:isExiting?"opacity 240ms ease, transform 240ms ease, width 300ms ease 200ms, min-width 300ms ease 200ms":"none",position:"relative"}}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={e=>{
        const el=e.currentTarget;
        const rect=el.getBoundingClientRect();
        const par=el.parentElement.getBoundingClientRect();
        if(rect.right>par.right-10||rect.left<par.left+10){
          el.parentElement.scrollLeft += rect.left - par.left;
        }
      }}
    >
      <ProfileCard
        profile={p}
        isClose={false}
        focusedMoment={null}
        showTeaser={showTeaser||isHovered}
        externalNav={true}
        openMomentTick={openMomentTick}
        externalMomentAction={externalMomentAction}
        onMomentStateChange={setMomentState}
        onWhisper={(moment)=>onOpenWhisper(p.name, moment)}
        onWave={onWave}
      />
      {(p.moments?.length||0)>0 && momentState.flipped && (
        <div style={{position:"absolute",left:cardWidth-66,bottom:18,zIndex:4,width:48,height:48,borderRadius:8,background:"rgba(238,224,196,0.92)",border:"1px solid rgba(196,160,85,0.3)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:0,gap:2}}>
          <button onClick={e=>{e.stopPropagation(); if(momentState.momentoIdx<momentState.momentsLength-1) setExternalMomentAction({type:"next",nonce:Date.now()}); }} disabled={momentState.momentoIdx>=momentState.momentsLength-1} style={{width:30,height:30,borderRadius:"50%",border:"none",background:"transparent",cursor:momentState.momentoIdx>=momentState.momentsLength-1?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,color:"#1C1C1A",opacity:momentState.momentoIdx>=momentState.momentsLength-1?0.28:1}}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 7L6 3l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button onClick={e=>{e.stopPropagation(); setExternalMomentAction(momentState.momentoIdx>0?{type:"prev",nonce:Date.now()}:{type:"close",nonce:Date.now()});}} style={{width:30,height:30,borderRadius:"50%",border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,color:"#1C1C1A"}}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}

function ProfileScrollRow({profiles, showTeaser=false, cardWidth=235, cardHeight=370, focusedMoment, onOpenWhisper, onWave, exitingNames}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  return (
    <div
      className="profile-scroll-row"
      style={{padding:"6px 8px 12px 8px",overflowX:"auto",scrollSnapType:"x mandatory",scrollBehavior:"smooth",display:"flex",gap:8,alignItems:"stretch",WebkitOverflowScrolling:"touch"}}
    >
      {profiles.map((p,i)=>{
        const isExiting = exitingNames && exitingNames.has(p.name);
        return (
          <ProfileScrollCard
            key={p.name+"-"+i}
            p={p} i={i}
            cardWidth={cardWidth} cardHeight={cardHeight}
            showTeaser={showTeaser}
            isHovered={hoveredIdx===i}
            isExiting={isExiting}
            onOpenWhisper={onOpenWhisper}
            onWave={onWave}
            onMouseEnter={()=>setHoveredIdx(i)}
            onMouseLeave={()=>setHoveredIdx(null)}
          />
        );
      })}
    </div>
  );
}

function CardNavigator({profiles, exitingNames, cardWidth=300, cardHeight=380, focusedMoment, onOpenWhisper, onWave, sectionCount=1}) {
  const [idx, setIdx] = useState(0);
  const [waveState, setWaveState] = useState("none");
  const [openMomentTick, setOpenMomentTick] = useState(0);
  const [externalMomentAction, setExternalMomentAction] = useState(null);
  const [momentState, setMomentState] = useState({flipped:false,momentoIdx:0,momentsLength:0});
  const touchStartX = useRef(null);
  const visibleProfiles = profiles.slice(0,5);
  const profile = visibleProfiles[idx];
  useEffect(()=>{
    if(idx >= visibleProfiles.length) setIdx(0);
  }, [idx, visibleProfiles.length]);
  useEffect(()=>{
    setWaveState("none");
    setExternalMomentAction(null);
    setMomentState({flipped:false,momentoIdx:0,momentsLength:profile?.moments?.length||0});
  }, [idx]);

  if(!profile) return null;

  const total = visibleProfiles.length;
  const rt=profile.rt||profile.r||0, ct=profile.ct||profile.c||0, dt=profile.dt||profile.d||0;
  const rf=profile.rf||profile.r||0, cf=profile.cf||profile.c||0, df=profile.df||profile.d||0;
  const totalT=rt+ct+dt, totalF=rf+cf+df;
  const domLabelFull=(r,c,d)=>Math.max(r,c,d)===r?"Resonating":Math.max(r,c,d)===c?"Contradicting":"Diverging";
  const tColor = getRCDGlyphColor(rt,ct,dt);
  const fColor = getRCDGlyphColor(rf,cf,df);
  const teaser = getRCDTeaser(profile);
  const firstName = profile.name.split(" ")[0];
  const tPct = totalT ? Math.round((rt/totalT)*100) : 0;
  const fPct = totalF ? Math.round((rf/totalF)*100) : 0;
  const bookOverlap = profile.commonBooks||0;
  const overlapLabel = bookOverlap >= 8 ? "high overlap" : bookOverlap >= 4 ? "solid overlap" : "some overlap";
  const relationshipLabel = "Reader";
  const teaserKeywords = ["You","Your",firstName,"same","alike","apart","differently","friction","clash","drift","everywhere","moment","moments","thought","thoughts","feeling","feelings"];
  const teaserRegex = new RegExp(`\\b(${teaserKeywords.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")})\\b`,"g");
  const teaserParts = [];
  let teaserLast = 0;
  let teaserMatch;
  while((teaserMatch=teaserRegex.exec(teaser))!==null){
    if(teaserMatch.index>teaserLast) teaserParts.push({text:teaser.slice(teaserLast,teaserMatch.index),highlight:false});
    teaserParts.push({text:teaserMatch[0],highlight:true});
    teaserLast = teaserMatch.index + teaserMatch[0].length;
  }
  if(teaserLast<teaser.length) teaserParts.push({text:teaser.slice(teaserLast),highlight:false});
  const goPrev = ()=>setIdx(i=>(i-1+total)%total);
  const goNext = ()=>setIdx(i=>(i+1)%total);
  const hasMomentos = (profile.moments?.length || 0) > 0;

  if(sectionCount===4) {
    return (
      <div style={{borderRadius:"0 0 14px 14px",border:"1.5px solid rgba(196,160,85,0.5)",borderTop:"none",overflow:"hidden",background:"var(--card)"}}>
        <ProfileScrollRow
          profiles={visibleProfiles}
          exitingNames={exitingNames}
          focusedMoment={focusedMoment}
          onOpenWhisper={onOpenWhisper}
          onWave={onWave}
          cardWidth={280}
          cardHeight={cardHeight}
        />
      </div>
    );
  }

  const isExiting = exitingNames?.has(profile?.name);

  if(sectionCount===3) {
    return (
      <div style={{padding:0,position:"relative"}}>
        <div style={{height:cardHeight,borderRadius:"0 0 14px 14px",background:"var(--card)",border:"1.5px solid rgba(196,160,85,0.5)",borderTop:"none",overflow:"hidden",display:"flex",touchAction:"pan-y",opacity:isExiting?0:1,transform:isExiting?"scale(0.97) translateY(8px)":"none",transition:"opacity 300ms ease, transform 300ms ease"}}
          onTouchStart={e=>{ touchStartX.current = e.changedTouches[0]?.clientX ?? null; }}
          onTouchEnd={e=>{
            const endX = e.changedTouches[0]?.clientX;
            if(touchStartX.current==null || endX==null) return;
            const deltaX = endX - touchStartX.current;
            if(Math.abs(deltaX) < 40) return;
            if(deltaX < 0) goNext(); else goPrev();
            touchStartX.current = null;
          }}
        >
          {/* Card column */}
          <div style={{width:cardWidth,minWidth:cardWidth,flexShrink:0,position:"relative",display:"flex",flexDirection:"column"}}>
            <span style={{position:"absolute",top:10,right:14,zIndex:8,fontFamily:"'DM Sans',sans-serif",fontSize:7.5,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(255,255,255,0.55)",whiteSpace:"nowrap",pointerEvents:"none"}}>{profile.since}</span>
            <ProfileCard
              profile={profile}
              isClose={false}
              focusedMoment={null}
              showTeaser={true}
              showOverlays={true}
              showFooter={true}
              externalNav={true}
              nameSize={20}
              openMomentTick={openMomentTick}
              externalMomentAction={externalMomentAction}
              onMomentStateChange={setMomentState}
              onWhisper={(moment)=>onOpenWhisper(profile.name, moment)}
            />
            {hasMomentos && momentState.flipped && (
              <div style={{position:"absolute",left:cardWidth-66,bottom:18,zIndex:4,width:48,height:48,borderRadius:8,background:"rgba(238,224,196,0.92)",border:"1px solid rgba(196,160,85,0.3)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:0,gap:2}}>
                <button onClick={()=>{ if(momentState.momentoIdx<momentState.momentsLength-1) setExternalMomentAction({type:"next",nonce:Date.now()}); }} disabled={momentState.momentoIdx>=momentState.momentsLength-1} style={{width:30,height:30,borderRadius:"50%",border:"none",background:"transparent",cursor:momentState.momentoIdx>=momentState.momentsLength-1?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,color:"#1C1C1A",opacity:momentState.momentoIdx>=momentState.momentsLength-1?0.28:1}}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 7L6 3l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button onClick={()=>setExternalMomentAction(momentState.momentoIdx>0?{type:"prev",nonce:Date.now()}:{type:"close",nonce:Date.now()})} style={{width:30,height:30,borderRadius:"50%",border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,color:"#1C1C1A"}}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            )}
          </div>
          {/* Reader nav — right side, same pill as 1-section mode */}
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderLeft:"1px solid rgba(196,160,85,0.2)"}}>
            <div style={{background:"rgba(255,255,255,0.24)",borderRadius:999,padding:"8px 10px",display:"flex",alignItems:"center",gap:7,boxShadow:"inset 0 1px 0 rgba(255,255,255,0.34)",opacity:total>1?1:0.62}}>
              <button onClick={goPrev} disabled={total<=1} style={{width:28,height:28,borderRadius:"50%",border:"1.4px solid var(--amber)",background:"transparent",cursor:total>1?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--amber)",opacity:total>1?1:0.45}}>
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <span className="font-sans" style={{fontSize:8,color:"var(--text2)",letterSpacing:"0.12em",textTransform:"uppercase",minWidth:28,textAlign:"center"}}>{idx+1}/{total}</span>
              <button onClick={goNext} disabled={total<=1} style={{width:28,height:28,borderRadius:"50%",border:"1.4px solid var(--amber)",background:"transparent",cursor:total>1?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--amber)",opacity:total>1?1:0.45}}>
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
          <span className="font-sans" style={{position:"absolute",bottom:14,right:18,fontSize:8,color:"var(--text2)",letterSpacing:"0.08em",textTransform:"uppercase",background:"rgba(139,105,20,0.08)",borderRadius:999,padding:"4px 8px",fontWeight:600,whiteSpace:"nowrap",zIndex:3,pointerEvents:"none"}}>
            {total} {total===1?"reader":"readers"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:0,position:"relative"}}>
      <div
        style={{display:"flex",alignItems:"stretch",gap:0,height:cardHeight,borderRadius:"0 0 14px 14px",background:"var(--card)",border:"1.5px solid rgba(196,160,85,0.5)",borderTop:"none",overflow:"hidden",touchAction:"pan-y",opacity:isExiting?0:1,transform:isExiting?"scale(0.97) translateY(8px)":"none",transition:"opacity 300ms ease, transform 300ms ease"}}
        onTouchStart={e=>{ touchStartX.current = e.changedTouches[0]?.clientX ?? null; }}
        onTouchEnd={e=>{
          const endX = e.changedTouches[0]?.clientX;
          if(touchStartX.current==null || endX==null) return;
          const deltaX = endX - touchStartX.current;
          if(Math.abs(deltaX) < 40) return;
          if(deltaX < 0) goNext(); else goPrev();
          touchStartX.current = null;
        }}
      >
        <div style={{width:cardWidth,minWidth:cardWidth,flexShrink:0,display:"flex",flexDirection:"column",borderRight:"1px solid var(--border)",position:"relative"}}>
          <span style={{position:"absolute",top:10,right:14,zIndex:5,fontFamily:"'DM Sans',sans-serif",fontSize:7.5,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(61,52,43,0.46)",whiteSpace:"nowrap",pointerEvents:"none"}}>{profile.since}</span>
          <ProfileCard
            profile={profile}
            isClose={false}
            focusedMoment={null}
            showTeaser={false}
            showOverlays={false}
            seamless={false}
            showFooter={false}
            externalNav={true}
            nameSize={28}
            openMomentTick={openMomentTick}
            externalMomentAction={externalMomentAction}
            onMomentStateChange={setMomentState}
            onWhisper={(moment)=>onOpenWhisper(profile.name, moment)}
          />
          {hasMomentos && (
            momentState.flipped ? (
              <div style={{position:"absolute",left:cardWidth-66,bottom:18,zIndex:4,width:48,height:48,borderRadius:8,background:"rgba(238,224,196,0.92)",border:"1px solid rgba(196,160,85,0.3)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:0,gap:2}}>
                <button onClick={()=>{ if(momentState.momentoIdx<momentState.momentsLength-1) setExternalMomentAction({type:"next",nonce:Date.now()}); }} disabled={momentState.momentoIdx>=momentState.momentsLength-1} style={{width:30,height:30,borderRadius:"50%",border:"none",background:"transparent",cursor:momentState.momentoIdx>=momentState.momentsLength-1?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,color:"#1C1C1A",opacity:momentState.momentoIdx>=momentState.momentsLength-1?0.28:1}}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 7L6 3l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button onClick={()=>setExternalMomentAction(momentState.momentoIdx>0?{type:"prev",nonce:Date.now()}:{type:"close",nonce:Date.now()})} style={{width:30,height:30,borderRadius:"50%",border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,color:"#1C1C1A"}}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            ) : (
              <button
                onClick={()=>{ setOpenMomentTick(t=>t+1); setExternalMomentAction({type:"open",nonce:Date.now()}); }}
                title={`Tap for ${firstName}'s top Momento.`}
                onMouseEnter={e=>e.currentTarget.style.border="1.5px solid rgba(196,160,55,0.85)"}
                onMouseLeave={e=>e.currentTarget.style.border="1.5px solid transparent"}
                style={{position:"absolute",left:cardWidth-66,bottom:18,zIndex:4,width:48,height:48,borderRadius:8,border:"1.5px solid transparent",background:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,transition:"border-color 180ms ease"}}
              >
                <svg width="34" height="42" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg"><path d="M4 2 H26 V28 Q23 30 20 27 Q17 24 14 27 Q11 30 8 27 Q5 24 4 28 Z" fill="none" stroke="#C4A030" strokeWidth="2.5"/><line x1="8" y1="10" x2="22" y2="10" stroke="#C4A030" strokeWidth="2" opacity="0.85"/><line x1="8" y1="15" x2="22" y2="15" stroke="#C4A030" strokeWidth="2" opacity="0.85"/><line x1="8" y1="20" x2="16" y2="20" stroke="#C4A030" strokeWidth="2" opacity="0.85"/><path d="M7 35 Q14 31 22 36" fill="none" stroke="#C4A030" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            )
          )}
        </div>

        <div style={{position:"absolute",left:cardWidth+10,bottom:13,height:40,zIndex:2,pointerEvents:"none",display:"flex",flexDirection:"column",justifyContent:"center",gap:4}} />

        <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"space-between",alignItems:"stretch",gap:8,padding:"14px 18px 18px",minWidth:0,animation:"fadeSlideUp 400ms ease both"}}>
          <div style={{background:"linear-gradient(180deg, var(--bg) 0%, color-mix(in srgb, var(--bg) 90%, var(--amber2) 10%) 100%)",borderRadius:12,padding:"0 20px 10px",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.55), 0 6px 16px rgba(139,105,20,0.05)",position:"relative",overflow:"hidden"}}>
            <div style={{margin:"0 -20px 10px",padding:"5px 14px",background:"rgba(196,160,85,0.13)",borderRadius:"12px 12px 0 0",borderBottom:"1px solid rgba(196,160,85,0.18)"}}>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:6.5,letterSpacing:"0.18em",textTransform:"lowercase",color:"var(--amber)",fontWeight:700,opacity:0.75,userSelect:"none"}}>Closeness</span>
            </div>
            <p style={{fontFamily:"'Playfair Display',serif",fontSize:11.5,fontWeight:400,fontStyle:"italic",fontVariantCaps:"small-caps",letterSpacing:"0.08em",color:"var(--amber)",margin:"0 0 8px",textAlign:"center",lineHeight:1}}>
              Teaser
            </p>
            <p style={{fontFamily:"'Lora',serif",fontSize:20,lineHeight:1.68,color:"var(--text)",margin:"0 0 14px",fontStyle:"italic",letterSpacing:"-0.01em",textAlign:"center"}}>
              {teaserParts.map((part,i)=>(
                part.highlight
                  ? <span key={i} style={{fontWeight:700,fontStyle:"normal",color:"var(--amber)"}}>{part.text}</span>
                  : <span key={i}>{part.text}</span>
              ))}
            </p>
            <div style={{marginTop:8,borderTop:"1px solid rgba(139,105,20,0.10)",paddingTop:8}}>
              {sectionCount===2 ? (
                <GlyphWithHoverBars tColor={tColor} fColor={fColor} rt={rt} ct={ct} dt={dt} rf={rf} cf={cf} df={df} domLabelFull={domLabelFull} firstName={firstName}/>
              ) : (
                <div style={{display:"flex",alignItems:"stretch",gap:14}}>
                  <div style={{flexShrink:0,width:80,alignSelf:"stretch",display:"flex",flexDirection:"column"}}>
                    <p style={{fontFamily:"'Playfair Display',serif",fontSize:11.5,fontWeight:400,fontStyle:"italic",fontVariantCaps:"small-caps",letterSpacing:"0.08em",color:"var(--amber)",margin:"0 0 5px",lineHeight:1,paddingLeft:4}}>
                      Signature
                    </p>
                    <svg style={{flex:1,width:"100%",display:"block"}} viewBox="-6 9 66 67" preserveAspectRatio="xMidYMid meet">
                      <rect x="-3" y="12" width="46" height="55" rx="10" fill="var(--amber3)" stroke="var(--amber)" strokeOpacity="0.35" strokeWidth="1.2"/>
                      <text x="4" y="50" fontFamily="'Playfair Display',serif" fontWeight="700" fontSize="42" fill={tColor}>t</text>
                      <text x="36" y="50" fontFamily="'Playfair Display',serif" fontWeight="700" fontSize="42" fill={fColor} transform="translate(72,80) rotate(180)">t</text>
                      <text x="13" y="60" fontFamily="'DM Sans',sans-serif" fontWeight="700" fontSize="9" fill={tColor} textAnchor="middle" letterSpacing="0.5">{domLabelFull(rt,ct,dt).slice(0,3).toUpperCase()}</text>
                      <text x="27" y="26" fontFamily="'DM Sans',sans-serif" fontWeight="700" fontSize="9" fill={fColor} textAnchor="middle" letterSpacing="0.5">{domLabelFull(rf,cf,df).slice(0,3).toUpperCase()}</text>
                    </svg>
                  </div>
                  <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",gap:8}}>
                    <MatchBar label="think" resonate={rt} contradict={ct} diverge={dt} name={firstName} />
                    <MatchBar label="feel" resonate={rf} contradict={cf} diverge={df} name={firstName} />
                  </div>
                </div>
              )}
            </div>
            <div style={{display:"flex",gap:8,alignItems:"stretch",justifyContent:"flex-start",marginTop:9,paddingTop:8,borderTop:"1px solid rgba(139,105,20,0.08)"}}>
              <div style={{background:"var(--card)",borderRadius:10,padding:"10px 13px",display:"flex",alignItems:"center",gap:10,border:"1px solid var(--border2)",flex:"0 0 auto",minWidth:132}}>
                <div>
                  <div style={{display:"flex",alignItems:"baseline",gap:3}}>
                    <span style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"var(--amber)",lineHeight:1}}>{profile.commonBooks||0}</span>
                    <span style={{fontSize:11,color:"rgba(139,105,20,0.35)"}}>/</span>
                    <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:"var(--text2)"}}>{SHELF_BOOKS.length}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:4,marginTop:3}}>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,color:"var(--amber)",letterSpacing:"0.07em",textTransform:"uppercase",fontWeight:600}}>Books</span>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,color:"var(--text)",letterSpacing:"0.07em",textTransform:"uppercase"}}>in common</span>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:7,color:"var(--amber)",background:"var(--amber2)",borderRadius:3,padding:"1px 4px",letterSpacing:"0.05em"}}>{overlapLabel}</span>
                  </div>
                </div>
              </div>
              <div style={{background:"var(--card)",borderRadius:10,padding:"10px 13px",display:"flex",alignItems:"center",gap:10,border:"1px solid var(--border2)",flex:"0 0 auto",minWidth:132}}>
                <div>
                  <div style={{display:"flex",alignItems:"baseline",gap:3}}>
                    <span style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"var(--amber)",lineHeight:1}}>{profile.momentCount||0}</span>
                    <span style={{fontSize:11,color:"rgba(139,105,20,0.35)"}}>/</span>
                    <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:"var(--text2)"}}>{profile.moments?.length||0}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:4,marginTop:3}}>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,color:"var(--amber)",letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600}}>Shared</span>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,color:"var(--text)",letterSpacing:"0.06em",textTransform:"uppercase"}}>moments</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"0 0 2px"}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(139,105,20,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span className="font-sans" style={{fontSize:9,color:"rgba(139,105,20,0.45)",letterSpacing:"0.02em",fontStyle:"italic"}}>Drag and drop a momento to find readers</span>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,paddingRight:60}}>
            <button
              onClick={()=>{ if(waveState==="none"){setWaveState("waved");onWave&&onWave(profile);}else if(waveState==="waved")setWaveState("close"); }}
              title="Wave first. If they wave back, you become Close Readers."
              style={{minWidth:140,height:46,padding:"0 22px",borderRadius:999,border:"1.2px solid rgba(196,160,85,0.4)",background:"rgba(255,255,255,0.95)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.75), 0 4px 12px rgba(139,105,20,0.08)",fontFamily:"'Playfair Display',serif",fontSize:16,fontStyle:"italic",fontWeight:700,color:"var(--amber)",letterSpacing:"0.03em",cursor:"pointer",whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",justifyContent:"center"}}
            >
              {waveState==="close" ? "~ Close" : waveState==="waved" ? "~ Waved" : "~ Wave"}
            </button>
            <div style={{background:"rgba(255,255,255,0.24)",borderRadius:999,padding:"8px 10px",display:"flex",alignItems:"center",gap:7,boxShadow:"inset 0 1px 0 rgba(255,255,255,0.34)",opacity:total>1?1:0.62}}>
              <button onClick={goPrev} disabled={total<=1} style={{width:28,height:28,borderRadius:"50%",border:"1.4px solid var(--amber)",background:"transparent",cursor:total>1?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--amber)",opacity:total>1?1:0.45}}>
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <span className="font-sans" style={{fontSize:8,color:"var(--text2)",letterSpacing:"0.12em",textTransform:"uppercase",minWidth:28,textAlign:"center"}}>{idx+1}/{total}</span>
              <button onClick={goNext} disabled={total<=1} style={{width:28,height:28,borderRadius:"50%",border:"1.4px solid var(--amber)",background:"transparent",cursor:total>1?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--amber)",opacity:total>1?1:0.45}}>
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
          <span className="font-sans" style={{position:"absolute",bottom:18,right:18,fontSize:8,color:"var(--text2)",letterSpacing:"0.08em",textTransform:"uppercase",background:"rgba(139,105,20,0.08)",borderRadius:999,padding:"4px 8px",fontWeight:600,whiteSpace:"nowrap"}}>
            {total} {total===1?"reader":"readers"}
          </span>
        </div>
      </div>
    </div>
  );
}
