/* Consent screen — shown once after onboarding, before app loads */

function ConsentScreen({onAccept, onDecline}) {
  const [canContinue, setCanContinue] = useState(false);
  const [showDeclinePopup, setShowDeclinePopup] = useState(false);
  const scrollRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setCanContinue(true), 5000);
    return () => clearTimeout(timerRef.current);
  }, []);

  const handleScroll = useCallback(() => {
    if (canContinue) return;
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 28) {
      setCanContinue(true);
      clearTimeout(timerRef.current);
    }
  }, [canContinue]);

  const divider = (
    <div style={{width:"100%",height:1,background:"rgba(196,160,85,0.18)",margin:"28px 0"}}/>
  );

  return (
    <div style={{
      position:"fixed",inset:0,zIndex:800,
      background:"#0d0904",
      display:"flex",flexDirection:"column",
      alignItems:"center",
      overflow:"hidden",
    }}>
      {/* Warm radial glow */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",
        background:"radial-gradient(ellipse at 50% -10%, rgba(196,160,85,0.1) 0%, rgba(196,160,85,0) 55%)",
      }}/>

      {/* Logo */}
      <div style={{position:"absolute",top:22,left:26,zIndex:2,pointerEvents:"none"}}>
        <img
          src="./logo-clean.png"
          alt="momento"
          style={{height:16,width:"auto",display:"block",
            filter:"brightness(0) invert(1) contrast(1.1)",opacity:0.45}}
        />
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          position:"relative",zIndex:1,
          width:"min(620px, 88vw)",
          flex:1,
          overflowY:"auto",
          paddingTop:72,
          paddingBottom:120,
          scrollbarWidth:"none",
          msOverflowStyle:"none",
        }}
      >
        <h2 className="font-serif" style={{
          fontSize:30,fontWeight:600,fontStyle:"italic",
          color:"rgba(255,247,232,0.95)",
          margin:"0 0 18px",letterSpacing:"-0.02em",lineHeight:1.1,
        }}>
          Before you begin
        </h2>
        <p className="font-sans" style={{fontSize:13,lineHeight:1.82,color:"rgba(220,204,178,0.72)",margin:0}}>
          Momento is built on the way you interpret what you read. Before you continue, here is exactly what that means for your data.
        </p>

        {divider}

        <h3 className="font-serif" style={{fontSize:15,fontWeight:600,fontStyle:"italic",color:"rgba(196,160,85,0.9)",margin:"0 0 12px",letterSpacing:"0.01em"}}>
          Your interpretations and Google Gemini
        </h3>
        <p className="font-sans" style={{fontSize:13,lineHeight:1.82,color:"rgba(220,204,178,0.72)",margin:"0 0 14px"}}>
          When you save a Momento, your interpretation is sent to Google Gemini to help us understand your reading style. When matching you with other readers, pairs of interpretations are compared. They are never linked to your name or identity, only to an anonymous ID we generate for your profile.
        </p>
        <p className="font-sans" style={{fontSize:13,lineHeight:1.82,color:"rgba(220,204,178,0.72)",margin:0}}>
          We never send your name, your email, the passages you read, or any personally identifiable information. Matching is the only reason your interpretations ever leave your device.
        </p>

        {divider}

        <h3 className="font-serif" style={{fontSize:15,fontWeight:600,fontStyle:"italic",color:"rgba(196,160,85,0.9)",margin:"0 0 12px",letterSpacing:"0.01em"}}>
          What other readers can see
        </h3>
        <p className="font-sans" style={{fontSize:13,lineHeight:1.82,color:"rgba(220,204,178,0.72)",margin:0}}>
          When you appear in someone's Worth, they may see Momentos you have chosen to share. You decide which Momentos are visible to others. Nothing is shared without your selection. Your Closeness Signature, derived from your interpretations, is visible to readers you appear alongside in Worth.
        </p>

        {divider}

        <h3 className="font-serif" style={{fontSize:15,fontWeight:600,fontStyle:"italic",color:"rgba(196,160,85,0.9)",margin:"0 0 12px",letterSpacing:"0.01em"}}>
          Your data rights
        </h3>
        <p className="font-sans" style={{fontSize:13,lineHeight:1.82,color:"rgba(220,204,178,0.72)",margin:0}}>
          Under GDPR and CCPA, you have the right to request full deletion of your data at any time, regardless of where you are in the world. To do so, contact us at themomentofolio@gmail.com. We will action your request within 30 days.
        </p>

        {divider}

        <h3 className="font-serif" style={{fontSize:15,fontWeight:600,fontStyle:"italic",color:"rgba(196,160,85,0.9)",margin:"0 0 12px",letterSpacing:"0.01em"}}>
          How we learn your preferences
        </h3>
        <p className="font-sans" style={{fontSize:13,lineHeight:1.82,color:"rgba(220,204,178,0.72)",margin:0}}>
          To improve who we show you in Worth, Momento observes how you engage with the platform. This includes which profiles you explore, who you choose to connect with, and how you interact with your matches. This behaviour is linked only to your anonymous ID, never to your name or identity. It is used solely to refine your matches over time and help Worth find Close readers who are genuinely worth your attention.
        </p>

        {divider}

        <h3 className="font-serif" style={{fontSize:15,fontWeight:600,fontStyle:"italic",color:"rgba(196,160,85,0.9)",margin:"0 0 12px",letterSpacing:"0.01em"}}>
          Age
        </h3>
        <p className="font-sans" style={{fontSize:13,lineHeight:1.82,color:"rgba(220,204,178,0.72)",margin:0}}>
          You must be 13 or older to use Momento.
        </p>

        {divider}

        <p className="font-serif" style={{
          fontSize:14,fontStyle:"italic",lineHeight:1.75,
          color:"rgba(255,247,232,0.72)",
          margin:0,textAlign:"center",
        }}>
          By continuing you confirm you have read and understood this, and that you are 13 or older.
        </p>
      </div>

      {/* Bottom fade + buttons */}
      <div style={{
        position:"absolute",bottom:0,left:0,right:0,
        display:"flex",flexDirection:"column",alignItems:"center",
        gap:12,
        padding:"0 24px 36px",
        background:"linear-gradient(to top, #0d0904 62%, rgba(13,9,4,0) 100%)",
        zIndex:2,
        pointerEvents:"none",
      }}>
        <button
          onClick={canContinue ? onAccept : undefined}
          className="font-sans"
          style={{
            pointerEvents: canContinue ? "auto" : "none",
            padding:"11px 52px",
            borderRadius:999,
            border:`1px solid ${canContinue ? "rgba(196,160,85,0.55)" : "rgba(196,160,85,0.18)"}`,
            background: canContinue ? "rgba(196,160,85,0.14)" : "transparent",
            color: canContinue ? "rgba(196,160,85,0.95)" : "rgba(196,160,85,0.28)",
            fontSize:11,
            fontWeight:700,
            letterSpacing:"0.2em",
            textTransform:"uppercase",
            cursor: canContinue ? "pointer" : "default",
            transition:"border-color 500ms ease, background 500ms ease, color 500ms ease",
          }}
        >
          Continue
        </button>
        <button
          onClick={canContinue ? ()=>setShowDeclinePopup(true) : undefined}
          className="font-sans"
          style={{
            pointerEvents: canContinue ? "auto" : "none",
            padding:"8px 32px",
            borderRadius:999,
            border:"none",
            background:"transparent",
            color: canContinue ? "rgba(196,160,85,0.38)" : "rgba(196,160,85,0.15)",
            fontSize:10,
            fontWeight:500,
            letterSpacing:"0.12em",
            textTransform:"uppercase",
            cursor: canContinue ? "pointer" : "default",
            transition:"color 500ms ease",
          }}
        >
          I do not agree
        </button>
      </div>

      {/* Decline popup */}
      {showDeclinePopup && (
        <div style={{
          position:"absolute",inset:0,zIndex:10,
          display:"flex",alignItems:"center",justifyContent:"center",
          background:"rgba(13,9,4,0.82)",
          backdropFilter:"blur(4px)",
        }}>
          <div style={{
            width:"min(360px,82vw)",
            background:"#1a1208",
            border:"1px solid rgba(196,160,85,0.28)",
            borderRadius:12,
            padding:"32px 28px 28px",
            display:"flex",flexDirection:"column",alignItems:"center",
            gap:20,
            boxShadow:"0 8px 40px rgba(0,0,0,0.6)",
          }}>
            <p className="font-sans" style={{
              fontSize:13,lineHeight:1.8,
              color:"rgba(220,204,178,0.8)",
              margin:0,textAlign:"center",
            }}>
              Momento's matching is built on how you interpret passages. Without this, we can't find your readers. You can review this again anytime.
            </p>
            <div style={{display:"flex",gap:10,width:"100%"}}>
              <button
                onClick={onDecline}
                className="font-sans"
                style={{
                  flex:1,padding:"10px 0",borderRadius:999,
                  border:"1px solid rgba(196,160,85,0.28)",
                  background:"transparent",
                  color:"rgba(196,160,85,0.55)",
                  fontSize:10,fontWeight:700,
                  letterSpacing:"0.15em",textTransform:"uppercase",
                  cursor:"pointer",
                }}
              >
                Home
              </button>
              <button
                onClick={()=>setShowDeclinePopup(false)}
                className="font-sans"
                style={{
                  flex:1,padding:"10px 0",borderRadius:999,
                  border:"1px solid rgba(196,160,85,0.55)",
                  background:"rgba(196,160,85,0.12)",
                  color:"rgba(196,160,85,0.95)",
                  fontSize:10,fontWeight:700,
                  letterSpacing:"0.15em",textTransform:"uppercase",
                  cursor:"pointer",
                }}
              >
                Review again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
