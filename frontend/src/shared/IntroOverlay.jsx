/* Landing intro */

function IntroOverlay({dark, onDone, onCreateAccount, onSignIn, onGoogleSignIn, showForeground=true}) {
  const [showEntryOptions, setShowEntryOptions] = useState(false);
  const [showContinueOptions, setShowContinueOptions] = useState(false);
  const [showReaderOptions, setShowReaderOptions] = useState(false);
  const [hoveredAction, setHoveredAction] = useState(null);
  const [momentsRevealRect, setMomentsRevealRect] = useState(null);

  useLayoutEffect(()=>{
    if(!showForeground) {
      setMomentsRevealRect(null);
      return;
    }

    let animationFrameId = null;
    let followUntil = 0;

    const updateRevealRect = ()=>{
      const frameElement = document.querySelector("[data-opening-moments-frame]");
      if(!frameElement) {
        setMomentsRevealRect(null);
        return;
      }
      const rect = frameElement.getBoundingClientRect();
      setMomentsRevealRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    const trackFrameDuringLayout = ()=>{
      updateRevealRect();
      if(performance.now() < followUntil){
        animationFrameId = window.requestAnimationFrame(trackFrameDuringLayout);
      }
    };

    const startTracking = (duration = 700)=>{
      followUntil = performance.now() + duration;
      if(animationFrameId !== null) window.cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(trackFrameDuringLayout);
    };

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(()=>startTracking(700))
      : null;
    const frameElement = document.querySelector("[data-opening-moments-frame]");
    if(frameElement && resizeObserver) resizeObserver.observe(frameElement);
    const handleResize = ()=>startTracking(900);
    window.addEventListener("resize", handleResize);
    startTracking(900);

    return ()=>{
      if(animationFrameId !== null) window.cancelAnimationFrame(animationFrameId);
      if(resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [showForeground, showEntryOptions, showContinueOptions, showReaderOptions]);

  return (
    <div style={{
      position:"fixed",
      inset:0,
      zIndex:600,
      overflow:"hidden",
      background:"#110b07",
    }}>
      <img
        src="./opening page image.png"
        alt="Library shelf opening scene"
        style={{
          position:"absolute",
          inset:0,
          width:"100%",
          height:"100%",
          objectFit:"cover",
          objectPosition:"center center",
          display:"block",
          opacity:showForeground ? 1 : 0.5,
          transition:"opacity 220ms ease",
        }}
      />

      <div style={{
        position:"absolute",
        inset:0,
        background:showForeground
          ? "radial-gradient(circle at 50% 19%, rgba(255,222,168,0.54) 0%, rgba(255,222,168,0.3) 12%, rgba(255,222,168,0.12) 22%, rgba(255,222,168,0) 36%), radial-gradient(circle at 50% 50%, rgba(255,190,108,0.16) 0%, rgba(255,190,108,0) 44%), radial-gradient(circle at top left, rgba(7,4,2,0.78) 0%, rgba(7,4,2,0.22) 30%, rgba(7,4,2,0) 52%), radial-gradient(circle at top right, rgba(7,4,2,0.78) 0%, rgba(7,4,2,0.22) 30%, rgba(7,4,2,0) 52%), radial-gradient(circle at bottom left, rgba(7,4,2,0.82) 0%, rgba(7,4,2,0.28) 30%, rgba(7,4,2,0) 52%), radial-gradient(circle at bottom right, rgba(7,4,2,0.82) 0%, rgba(7,4,2,0.28) 30%, rgba(7,4,2,0) 52%), linear-gradient(180deg, rgba(17,11,7,0.06) 0%, rgba(17,11,7,0.05) 22%, rgba(17,11,7,0.08) 54%, rgba(17,11,7,0.22) 100%)"
          : "radial-gradient(circle at 50% 19%, rgba(255,222,168,0.38) 0%, rgba(255,222,168,0.18) 12%, rgba(255,222,168,0.07) 22%, rgba(255,222,168,0) 36%), radial-gradient(circle at 50% 50%, rgba(255,190,108,0.1) 0%, rgba(255,190,108,0) 44%), radial-gradient(circle at top left, rgba(7,4,2,0.82) 0%, rgba(7,4,2,0.28) 30%, rgba(7,4,2,0) 52%), radial-gradient(circle at top right, rgba(7,4,2,0.82) 0%, rgba(7,4,2,0.28) 30%, rgba(7,4,2,0) 52%), radial-gradient(circle at bottom left, rgba(7,4,2,0.86) 0%, rgba(7,4,2,0.34) 30%, rgba(7,4,2,0) 52%), radial-gradient(circle at bottom right, rgba(7,4,2,0.86) 0%, rgba(7,4,2,0.34) 30%, rgba(7,4,2,0) 52()), linear-gradient(180deg, rgba(17,11,7,0.14) 0%, rgba(17,11,7,0.12) 22%, rgba(17,11,7,0.18) 54%, rgba(17,11,7,0.34) 100%)",
      }}/>

      {showForeground && momentsRevealRect ? (
        <div
          style={{
            position:"absolute",
            top:momentsRevealRect.top,
            left:momentsRevealRect.left,
            width:momentsRevealRect.width,
            height:momentsRevealRect.height,
            overflow:"hidden",
            pointerEvents:"none",
          }}>
          <img
            src="./opening page image.png"
            alt=""
            aria-hidden="true"
            style={{
              position:"absolute",
              top:-momentsRevealRect.top,
              left:-momentsRevealRect.left,
              width:"100vw",
              height:"100vh",
              objectFit:"cover",
              objectPosition:"center center",
              display:"block",
              maxWidth:"none",
            }}
          />
        </div>
      ) : null}

      <div style={{
        position:"absolute",
        inset:0,
        display:"flex",
        flexDirection:"column",
        padding:"32px 32px 46px",
        zIndex:760,
        opacity:showForeground ? 1 : 0,
        pointerEvents:showForeground ? "auto" : "none",
        transition:"opacity 220ms ease",
      }}>
        <div style={{
          display:"flex",
          alignItems:"flex-start",
          justifyContent:"flex-start",
          width:"clamp(168px, 18.5vw, 296px)",
          marginLeft:"8px",
          position:"relative",
          zIndex:4,
          isolation:"isolate",
        }}>
          <img
            data-opening-logo
            src="./logo-clean.png"
            alt="momento"
            style={{
              width:"100%",
              height:"auto",
              display:"block",
              opacity:1,
              filter:"brightness(0) invert(1) contrast(1.22) drop-shadow(0 10px 24px rgba(0,0,0,0.08))",
            }}
          />
        </div>

        <div style={{
          flex:1,
          display:"flex",
          flexDirection:"column",
          alignItems:"center",
          justifyContent:"center",
          width:"100%",
          textAlign:"center",
          gap:18,
        }}>
          <div style={{
            width:"min(1320px, 94vw)",
            minHeight:180,
          }}/>

          <div
            style={{
              minHeight:74,
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
            }}
          >
            <div
              style={{
                position:"relative",
                width:"min(420px, 72vw)",
                height:74,
                zIndex:4,
              }}
            >
              <button
                data-opening-enter
                onClick={()=>setShowEntryOptions(true)}
                onMouseEnter={()=>setHoveredAction("enter")}
                onMouseLeave={()=>setHoveredAction(null)}
                className="font-sans"
                style={{
                  position:"absolute",
                  left:"50%",
                  bottom:0,
                  transform:showEntryOptions
                    ? "translateX(-50%) translateY(6px)"
                    : `translateX(-50%) translateY(${hoveredAction==="enter" ? "-3px" : "0"})`,
                  transformOrigin:"center center",
                  padding:"0 0 8px",
                  minWidth:92,
                  borderRadius:0,
                  border:"none",
                  background:"transparent",
                  color:showEntryOptions ? "rgba(240,192,64,0)" : "#F0C040",
                  cursor:"pointer",
                  fontSize:18,
                  fontWeight:700,
                  letterSpacing:"0.24em",
                  textTransform:"uppercase",
                  borderBottom:`${hoveredAction==="enter" ? 2 : 1}px solid ${showEntryOptions ? "rgba(240,192,64,0)" : hoveredAction==="enter" ? "#F0C040" : "rgba(240,192,64,0.78)"}`,
                  textShadow:"0 4px 16px rgba(0,0,0,0.1)",
                  opacity:showEntryOptions ? 0 : 1,
                  pointerEvents:showEntryOptions ? "none" : "auto",
                  transition:"opacity 180ms ease, transform 260ms ease, color 180ms ease, border-color 180ms ease, border-bottom-width 180ms ease",
                }}
              >
                Enter
              </button>

              <div
                style={{
                  position:"absolute",
                  inset:0,
                  display:"flex",
                  alignItems:"flex-start",
                  justifyContent:"center",
                  gap:34,
                  opacity:showEntryOptions ? 1 : 0,
                  pointerEvents:showEntryOptions ? "auto" : "none",
                  transition:"opacity 220ms ease",
                }}
              >
                <button
                  onClick={()=>setShowContinueOptions(v=>!v)}
                  onMouseEnter={()=>setHoveredAction("continue")}
                  onMouseLeave={()=>setHoveredAction(null)}
                  className="font-sans"
                  style={{
                    position:"absolute",
                    left:"50%",
                    bottom:showContinueOptions ? 24 : 0,
                    transform:showEntryOptions ? "translateX(18px)" : "translateX(-50%)",
                    minWidth:160,
                    padding:0,
                    border:"none",
                    background:"transparent",
                    color:"rgba(255,248,234,0.98)",
                    cursor:"pointer",
                    display:"flex",
                    flexDirection:"column",
                    alignItems:"center",
                    gap:10,
                    transition:"transform 420ms cubic-bezier(0.22, 1, 0.36, 1), bottom 320ms ease",
                  }}
                >
                  <span style={{
                    fontSize:14,
                    fontWeight:700,
                    letterSpacing:"0.18em",
                    textTransform:"uppercase",
                    textShadow:"0 4px 16px rgba(0,0,0,0.18)",
                    opacity:showEntryOptions ? 1 : 0,
                    transform:showEntryOptions
                      ? `translateY(${hoveredAction==="continue" ? "-3px" : "0"})`
                      : "translateY(8px)",
                    transition:"opacity 220ms ease 120ms, transform 260ms ease 120ms",
                  }}>
                    Continue Reading
                  </span>
                  <span style={{
                    width:showEntryOptions ? "100%" : 92,
                    height:hoveredAction==="continue" ? 2 : 1,
                    background:hoveredAction==="continue" ? "rgba(255,248,234,0.82)" : "rgba(255,248,234,0.48)",
                    boxShadow:"0 4px 16px rgba(0,0,0,0.12)",
                    transition:"width 420ms cubic-bezier(0.22, 1, 0.36, 1), height 180ms ease, background 180ms ease",
                  }}/>
                </button>

                <div
                  style={{
                    position:"absolute",
                    left:"50%",
                    top:showContinueOptions ? 66 : 84,
                    transform:"translateX(18px)",
                    width:160,
                    display:"flex",
                    flexDirection:"column",
                    alignItems:"center",
                    gap:12,
                    opacity:showContinueOptions ? 1 : 0,
                    pointerEvents:showContinueOptions ? "auto" : "none",
                    transition:"opacity 220ms ease, top 320ms ease",
                  }}
                >
                  <button
                    onMouseEnter={()=>setHoveredAction("google")}
                    onMouseLeave={()=>setHoveredAction(null)}
                    onClick={()=>onGoogleSignIn&&onGoogleSignIn()}
                    className="font-sans"
                    style={{
                      width:"100%",
                      padding:0,
                      border:"none",
                      background:"transparent",
                      color:"rgba(255,248,234,0.98)",
                      cursor:"pointer",
                      display:"flex",
                      flexDirection:"column",
                      alignItems:"center",
                      gap:8,
                    }}
                  >
                    <span style={{
                      display:"inline-flex",
                      alignItems:"center",
                      justifyContent:"center",
                      gap:6,
                      fontSize:11,
                      fontWeight:700,
                      letterSpacing:"0.16em",
                      textTransform:"uppercase",
                      textShadow:"0 4px 16px rgba(0,0,0,0.18)",
                      transform:`translateY(${hoveredAction==="google" ? "-3px" : "0"})`,
                      transition:"transform 180ms ease",
                    }}>
                      <span style={{
                        display:"inline-flex",
                        alignItems:"center",
                        justifyContent:"center",
                        width:12,
                        height:12,
                        flexShrink:0,
                        fontSize:16,
                        fontWeight:700,
                        color:"rgba(255,248,234,0.98)",
                        lineHeight:1,
                        transform:"translateY(-1px)",
                      }}>
                        G
                      </span>
                      <span>With Google</span>
                    </span>
                    <span style={{
                      width:"100%",
                      height:hoveredAction==="google" ? 2 : 1,
                      background:hoveredAction==="google" ? "rgba(255,248,234,0.82)" : "rgba(255,248,234,0.42)",
                      transition:"height 180ms ease, background 180ms ease",
                    }}/>
                  </button>

                  <button
                    onMouseEnter={()=>setHoveredAction("username")}
                    onMouseLeave={()=>setHoveredAction(null)}
                    onClick={()=>onSignIn&&onSignIn()}
                    className="font-sans"
                    style={{
                      width:"100%",
                      padding:0,
                      border:"none",
                      background:"transparent",
                      color:"rgba(255,248,234,0.98)",
                      cursor:"pointer",
                      display:"flex",
                      flexDirection:"column",
                      alignItems:"center",
                      gap:8,
                    }}
                  >
                    <span style={{
                      fontSize:11,
                      fontWeight:700,
                      letterSpacing:"0.16em",
                      textTransform:"uppercase",
                      textShadow:"0 4px 16px rgba(0,0,0,0.18)",
                      transform:`translateY(${hoveredAction==="username" ? "-3px" : "0"})`,
                      transition:"transform 180ms ease",
                    }}>
                      With Readername
                    </span>
                    <span style={{
                      width:"100%",
                      height:hoveredAction==="username" ? 2 : 1,
                      background:hoveredAction==="username" ? "rgba(255,248,234,0.82)" : "rgba(255,248,234,0.42)",
                      transition:"height 180ms ease, background 180ms ease",
                    }}/>
                  </button>
                </div>

                <button
                  onClick={()=>setShowReaderOptions(v=>!v)}
                  onMouseEnter={()=>setHoveredAction("reader")}
                  onMouseLeave={()=>setHoveredAction(null)}
                  className="font-sans"
                  style={{
                    position:"absolute",
                    left:"50%",
                    bottom:showReaderOptions ? 24 : 0,
                    transform:showEntryOptions ? "translateX(calc(-100% - 18px))" : "translateX(-50%)",
                    minWidth:160,
                    padding:0,
                    border:"none",
                    background:"transparent",
                    color:"#F0C040",
                    cursor:"pointer",
                    display:"flex",
                    flexDirection:"column",
                    alignItems:"center",
                    gap:10,
                    transition:"transform 420ms cubic-bezier(0.22, 1, 0.36, 1), bottom 320ms ease",
                  }}
                >
                  <span style={{
                    fontSize:14,
                    fontWeight:700,
                    letterSpacing:"0.18em",
                    textTransform:"uppercase",
                    textShadow:"0 4px 16px rgba(0,0,0,0.18)",
                    opacity:showEntryOptions ? 1 : 0,
                    transform:showEntryOptions
                      ? `translateY(${hoveredAction==="reader" ? "-3px" : "0"})`
                      : "translateY(8px)",
                    transition:"opacity 220ms ease 120ms, transform 260ms ease 120ms",
                  }}>
                    Become a Reader
                  </span>
                  <span style={{
                    width:showEntryOptions ? "100%" : 92,
                    height:hoveredAction==="reader" ? 2 : 1,
                    background:hoveredAction==="reader" ? "rgba(240,192,64,0.9)" : "rgba(240,192,64,0.5)",
                    boxShadow:"0 4px 16px rgba(0,0,0,0.12)",
                    transition:"width 420ms cubic-bezier(0.22, 1, 0.36, 1), height 180ms ease, background 180ms ease",
                  }}/>
                </button>

                <div
                  style={{
                    position:"absolute",
                    left:"50%",
                    top:showReaderOptions ? 66 : 84,
                    transform:"translateX(calc(-100% - 18px))",
                    width:160,
                    display:"flex",
                    flexDirection:"column",
                    alignItems:"center",
                    gap:12,
                    opacity:showReaderOptions ? 1 : 0,
                    pointerEvents:showReaderOptions ? "auto" : "none",
                    transition:"opacity 220ms ease, top 320ms ease",
                  }}
                >
                  <button
                    onMouseEnter={()=>setHoveredAction("reader-google")}
                    onMouseLeave={()=>setHoveredAction(null)}
                    onClick={()=>onGoogleSignIn&&onGoogleSignIn()}
                    className="font-sans"
                    style={{
                      width:"100%",
                      padding:0,
                      border:"none",
                      background:"transparent",
                      color:hoveredAction==="reader-google" ? "#F0C040" : "#C4A055",
                      transition:"color 180ms ease",
                      cursor:"pointer",
                      display:"flex",
                      flexDirection:"column",
                      alignItems:"center",
                      gap:8,
                    }}
                  >
                    <span style={{
                      display:"inline-flex",
                      alignItems:"center",
                      justifyContent:"center",
                      gap:6,
                      fontSize:11,
                      fontWeight:700,
                      letterSpacing:"0.16em",
                      textTransform:"uppercase",
                      textShadow:"0 4px 16px rgba(0,0,0,0.18)",
                      transform:`translateY(${hoveredAction==="reader-google" ? "-3px" : "0"})`,
                      transition:"transform 180ms ease",
                    }}>
                      <span style={{
                        display:"inline-flex",
                        alignItems:"center",
                        justifyContent:"center",
                        width:12,
                        height:12,
                        flexShrink:0,
                        fontSize:16,
                        fontWeight:700,
                        color:hoveredAction==="reader-google" ? "#F0C040" : "#C4A055",
                        lineHeight:1,
                        transform:"translateY(-1px)",
                      }}>
                        G
                      </span>
                      <span>With Google</span>
                    </span>
                    <span style={{
                      width:"100%",
                      height:hoveredAction==="reader-google" ? 2 : 1,
                      background:hoveredAction==="reader-google" ? "rgba(196,160,85,0.9)" : "rgba(196,160,85,0.45)",
                      transition:"height 180ms ease, background 180ms ease",
                    }}/>
                  </button>

                  <button
                    onMouseEnter={()=>setHoveredAction("create-account")}
                    onMouseLeave={()=>setHoveredAction(null)}
                    onClick={onCreateAccount}
                    className="font-sans"
                    style={{
                      width:"100%",
                      padding:0,
                      border:"none",
                      background:"transparent",
                      color:hoveredAction==="create-account" ? "#F0C040" : "#C4A055",
                      transition:"color 180ms ease",
                      cursor:"pointer",
                      display:"flex",
                      flexDirection:"column",
                      alignItems:"center",
                      gap:8,
                    }}
                  >
                    <span style={{
                      fontSize:11,
                      fontWeight:700,
                      letterSpacing:"0.16em",
                      textTransform:"uppercase",
                      textShadow:"0 4px 16px rgba(0,0,0,0.18)",
                      transform:`translateY(${hoveredAction==="create-account" ? "-3px" : "0"})`,
                      transition:"transform 180ms ease",
                    }}>
                      Create an Account
                    </span>
                    <span style={{
                      width:"100%",
                      height:hoveredAction==="create-account" ? 2 : 1,
                      background:hoveredAction==="create-account" ? "rgba(196,160,85,0.9)" : "rgba(196,160,85,0.45)",
                      transition:"height 180ms ease, background 180ms ease",
                    }}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
