/* Profile drawer */

function ProfileDrawer({showProfile, setShowProfile, darkMode, setDarkMode, onSignOut, allMoments, readerProfile}) {
  if(!showProfile) return null;

  const panelBg = "var(--card)";
  const panelBorder = darkMode ? "rgba(196,160,85,0.25)" : "rgba(196,160,85,0.4)";
  const panelText = darkMode ? "var(--amber)" : "rgba(139,105,20,0.95)";
  const panelMuted = darkMode ? "var(--text2)" : "rgba(139,105,20,0.62)";
  const panelSoft = "rgba(139,105,20,0.12)";
  const rowHover = darkMode ? "rgba(196,160,85,0.08)" : "rgba(255,255,255,0.42)";
  const pillBg = darkMode ? "var(--bg2)" : "rgba(255,255,255,0.72)";

  const iconStroke = panelText;
  const profileItems = [
    {
      icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6v3.5L2 11h12l-1.5-1.5V6C12.5 3.5 10.5 1.5 8 1.5Z" stroke={iconStroke} strokeWidth="1.1" strokeLinejoin="round"/><path d="M6.5 11.5 C6.5 12.3 7.2 13 8 13 C8.8 13 9.5 12.3 9.5 11.5" stroke={iconStroke} strokeWidth="1.1" strokeLinecap="round"/></svg>,
      label: "Notifications",
      sub: "Waves, Momentos, Whispers",
    },
    {
      icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="5" width="12" height="9" rx="2" stroke={iconStroke} strokeWidth="1.1"/><path d="M5 5V4a3 3 0 0 1 6 0v1" stroke={iconStroke} strokeWidth="1.1" strokeLinecap="round"/></svg>,
      label: "Privacy",
      sub: "Who can wave, who can see",
    },
    {
      icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke={iconStroke} strokeWidth="1.1"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4" stroke={iconStroke} strokeWidth="1.1" strokeLinecap="round"/></svg>,
      label: "Settings",
      sub: "Display, language, account",
    },
  ];

  const momentIcon = (
    <svg width="13" height="16" viewBox="0 0 30 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 2 H26 V28 Q23 30 20 27 Q17 24 14 27 Q11 30 8 27 Q5 24 4 28 Z" fill="none" stroke={panelMuted} strokeWidth="2.5"/>
      <line x1="8" y1="10" x2="22" y2="10" stroke={panelMuted} strokeWidth="2"/>
      <line x1="8" y1="15" x2="22" y2="15" stroke={panelMuted} strokeWidth="2"/>
      <line x1="8" y1="20" x2="16" y2="20" stroke={panelMuted} strokeWidth="2"/>
    </svg>
  );
  const momentoIcon = (
    <svg width="13" height="16" viewBox="0 0 30 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 2 H26 V28 Q23 30 20 27 Q17 24 14 27 Q11 30 8 27 Q5 24 4 28 Z" fill="none" stroke={panelMuted} strokeWidth="2.5"/>
      <line x1="8" y1="10" x2="22" y2="10" stroke={panelMuted} strokeWidth="2" opacity="0.5"/>
      <line x1="8" y1="15" x2="22" y2="15" stroke={panelMuted} strokeWidth="2" opacity="0.5"/>
      <line x1="8" y1="20" x2="16" y2="20" stroke={panelMuted} strokeWidth="2" opacity="0.5"/>
      <path d="M7 35 Q14 31 22 36" fill="none" stroke={panelMuted} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
  const booksIcon = (
    <svg width="16" height="13" viewBox="0 0 20 16" fill="none">
      <rect x="1" y="2" width="4" height="13" rx="0.5" stroke={panelMuted} strokeWidth="1.3"/>
      <rect x="7" y="0" width="4" height="15" rx="0.5" stroke={panelMuted} strokeWidth="1.3"/>
      <rect x="13" y="3" width="4" height="12" rx="0.5" stroke={panelMuted} strokeWidth="1.3"/>
      <line x1="0" y1="15.5" x2="20" y2="15.5" stroke={panelMuted} strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  );
  const closeIcon = <CloseGlyphMark size={22}/>;
  const _moments = allMoments || [];
  const stats = [
    { label:"books",    icon:booksIcon,   value:SHELF_BOOKS.length },
    { label:"moments",  icon:momentIcon,  value:_moments.length },
    { label:"momentos", icon:momentoIcon, value:_moments.filter(m=>!!m.interpretation).length },
    { label:"close",    icon:closeIcon,   value:CLOSE_READERS.length },
  ];

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",justifyContent:"flex-start"}} onClick={()=>setShowProfile(false)}>
      <div onClick={e=>e.stopPropagation()} style={{width:280,height:"100%",display:"flex",flexDirection:"column",animation:"slideInLeft 250ms cubic-bezier(0.4,0,0.2,1)"}}>
        <div style={{position:"relative",height:10,marginBottom:-3,zIndex:2,flexShrink:0}}>
          <NotebookBinding stripFill="#C4A882" stitchColor="#8B6914"/>
        </div>

        <div style={{flex:1,display:"flex",flexDirection:"column",borderRadius:"0 0 8px 8px",border:`1px solid ${panelBorder}`,background:panelBg,overflow:"hidden",boxShadow:"8px 0 32px rgba(139,105,20,0.12)"}}>
          <div style={{position:"relative",flex:"0 0 220px",overflow:"hidden",background:darkMode?"linear-gradient(to bottom, var(--bg2), var(--bg))":"linear-gradient(to bottom, rgba(245,238,216,0.88), rgba(231,214,176,0.74))"}}>
            <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom, rgba(255,255,255,0.08) 10%, rgba(139,105,20,0.16) 100%)"}}/>
            <button onClick={()=>setShowProfile(false)} style={{position:"absolute",top:10,right:10,background:pillBg,border:`1px solid ${panelBorder}`,cursor:"pointer",width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:panelText,lineHeight:1,zIndex:2}}>×</button>
            <div style={{position:"absolute",top:10,left:10,zIndex:5}}>
              <p style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:panelText,lineHeight:1.15,margin:0,background:pillBg,border:`1px solid ${panelBorder}`,borderRadius:20,padding:"4px 12px"}}>{readerProfile?.firstName || "Reader"}</p>
            </div>
            <div style={{position:"absolute",bottom:8,left:0,right:0,display:"flex",justifyContent:"center",zIndex:5}}>
              <div style={{display:"flex",background:pillBg,borderRadius:20,border:`1px solid ${panelBorder}`}}>
                {stats.map((s,i)=>(
                  <div key={i} style={{padding:"10px 16px",display:"flex",flexDirection:"column",alignItems:"center",gap:4,borderRight:i<3?`1px solid ${panelSoft}`:"none"}}>
                    <span style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:panelText,lineHeight:1}}>{s.value}</span>
                    {s.icon
                      ? <span style={{display:"flex",alignItems:"center"}}>{s.icon}</span>
                      : <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,color:panelMuted,letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{s.label}</span>
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{flex:1,overflowY:"auto",background:panelBg}}>
            {profileItems.map((item,i)=>(
              <button
                key={i}
                className="font-sans"
                style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"13px 20px",border:"none",background:"transparent",cursor:"pointer",textAlign:"left",transition:"background 120ms"}}
                onMouseEnter={e=>e.currentTarget.style.background=rowHover}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              >
                <span style={{flexShrink:0,width:22,display:"flex",alignItems:"center",justifyContent:"center"}}>{item.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:12,fontWeight:500,color:panelText,margin:0}}>{item.label}</p>
                  <p style={{fontSize:9,color:panelMuted,margin:"1px 0 0"}}>{item.sub}</p>
                </div>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{flexShrink:0,opacity:0.42}}>
                  <path d="M3 2l4 3-4 3" stroke={panelText} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))}

            <button
              className="font-sans"
              onClick={()=>setDarkMode(d=>!d)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"13px 20px",border:"none",background:"transparent",cursor:"pointer",textAlign:"left",transition:"background 120ms"}}
              onMouseEnter={e=>e.currentTarget.style.background=rowHover}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            >
              <span style={{flexShrink:0,width:22,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {darkMode ? (
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="3" stroke={iconStroke} strokeWidth="1.1"/>
                    <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.2 3.2l1.1 1.1M11.7 11.7l1.1 1.1M3.2 12.8l1.1-1.1M11.7 4.3l1.1-1.1" stroke={iconStroke} strokeWidth="1.1" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z" stroke={iconStroke} strokeWidth="1.1" strokeLinejoin="round"/>
                    <path d="M10 3.5l.5.5M12 5l.5.5" stroke={iconStroke} strokeWidth="1.1" strokeLinecap="round"/>
                  </svg>
                )}
              </span>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:12,fontWeight:500,color:panelText,margin:0}}>{darkMode ? "Parchment mode" : "Ink mode"}</p>
                <p style={{fontSize:9,color:panelMuted,margin:"1px 0 0"}}>{darkMode ? "Switch to light" : "Switch to dark"}</p>
              </div>
              <div style={{width:32,height:18,borderRadius:9,background:darkMode?"#8B6914":"rgba(139,105,20,0.18)",position:"relative",transition:"background 300ms",flexShrink:0,border:`1px solid ${panelBorder}`}}>
                <div style={{position:"absolute",top:1,left:darkMode?14:2,width:14,height:14,borderRadius:"50%",background:darkMode?"#F5EED8":"#8B6914",transition:"left 300ms"}}/>
              </div>
            </button>
          </div>

          <div style={{padding:"8px 20px 20px",background:panelBg}}>
            <button className="font-sans" onClick={onSignOut} style={{width:"100%",padding:"10px 0",borderRadius:20,border:`1px solid ${panelBorder}`,background:pillBg,fontSize:10,fontWeight:500,color:panelText,cursor:"pointer",fontFamily:"'Playfair Display',serif",fontStyle:"italic",letterSpacing:"0.03em"}}>
              ~ Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
