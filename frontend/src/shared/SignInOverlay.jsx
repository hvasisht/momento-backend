function SignInOverlay({onBack, onSubmit, onCreateAccount, onGoogleSignIn}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hoveredAction, setHoveredAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);

  const canSignIn = email.trim() && password.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSignIn || loading) return;
    setLoading(true);
    setError(null);
    try {
      await firebase.auth().signInWithEmailAndPassword(email.trim(), password);
      onSubmit && onSubmit();
    } catch(err) {
      setError(
        err.code === "auth/wrong-password" || err.code === "auth/user-not-found" || err.code === "auth/invalid-credential"
          ? "Invalid email or password."
          : "Sign in failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width:"100%",
    border:"none",
    borderBottom:"1.5px solid rgba(139,105,20,0.42)",
    background:"transparent",
    borderRadius:0,
    padding:"8px 0 10px",
    fontSize:15,
    color:"#2C1A08",
    outline:"none",
    boxShadow:"none",
  };

  const labelStyle = {
    display:"block",
    margin:"0 0 7px",
    fontSize:11,
    letterSpacing:"0.08em",
    color:"rgba(139,105,20,0.76)",
    fontWeight:700,
    textTransform:"uppercase",
  };

  return (
    <div style={{
      position:"fixed",
      inset:0,
      zIndex:720,
      background:"linear-gradient(180deg, rgba(16,10,6,0.64) 0%, rgba(16,10,6,0.8) 100%)",
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      padding:"32px 24px 28px",
    }}>
      <div style={{
        width:"min(760px, 100%)",
        minHeight:"min(420px, calc(100vh - 190px))",
        borderRadius:32,
        background:"linear-gradient(180deg, rgba(248,242,228,0.98) 0%, rgba(241,231,211,0.98) 100%)",
        boxShadow:"0 42px 90px rgba(0,0,0,0.28)",
        position:"relative",
        padding:"28px 38px 32px",
        display:"flex",
        flexDirection:"column",
      }}>
        <button
          onClick={onBack}
          className="font-sans"
          style={{
            position:"absolute",
            top:24,
            left:28,
            border:"none",
            background:"transparent",
            color:"rgba(139,105,20,0.74)",
            cursor:"pointer",
            padding:0,
            fontSize:11,
            letterSpacing:"0.16em",
            textTransform:"uppercase",
            fontWeight:700,
          }}
        >
          ← Back
        </button>

        <div style={{maxWidth:570,margin:"12px auto 0",width:"100%"}}>
          <h3 className="font-serif" style={{fontSize:36,lineHeight:1.06,margin:"0 0 22px",color:"#2C1A08",fontWeight:600,textAlign:"center"}}>
            Millions of <span style={{color:"#8B6914"}}>Moments</span> waiting for <span style={{color:"#8B6914"}}>you</span>!
          </h3>

          <form onSubmit={handleSubmit} style={{display:"grid",gap:16}}>
            <label>
              <span className="font-sans" style={labelStyle}>Email</span>
              <input
                value={email}
                onChange={e=>{setEmail(e.target.value);setError(null);}}
                placeholder="Enter your email"
                type="email"
                autoComplete="email"
                style={inputStyle}
              />
            </label>
            <label>
              <span className="font-sans" style={labelStyle}>Password</span>
              <input
                value={password}
                onChange={e=>{setPassword(e.target.value);setError(null);}}
                placeholder="Enter your password"
                type="password"
                autoComplete="current-password"
                style={inputStyle}
              />
            </label>

            {error && (
              <p className="font-sans" style={{fontSize:12,color:"#c0392b",margin:"0",letterSpacing:"0.02em"}}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="font-sans"
              disabled={!canSignIn || loading}
              onMouseEnter={()=>setHoveredAction("signin")}
              onMouseLeave={()=>setHoveredAction(null)}
              style={{
                marginTop:6,
                background:"none",
                border:"none",
                borderRadius:0,
                padding:"0 0 6px",
                cursor:canSignIn && !loading ? "pointer" : "default",
                color:canSignIn && !loading ? "#8B6914" : "rgba(139,105,20,0.35)",
                fontSize:13,
                fontWeight:700,
                letterSpacing:"0.18em",
                textTransform:"uppercase",
                borderBottom:`${hoveredAction==="signin" && canSignIn ? 2 : 1}px solid ${canSignIn ? (hoveredAction==="signin" ? "rgba(139,105,20,0.82)" : "rgba(139,105,20,0.52)") : "rgba(139,105,20,0.18)"}`,
                transform:hoveredAction==="signin" && canSignIn ? "translateY(-1px)" : "none",
                transition:"color 160ms ease, border-color 160ms ease, transform 180ms ease",
                alignSelf:"flex-start",
              }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>

            <div style={{display:"flex",alignItems:"center",gap:10,margin:"4px 0 2px"}}>
              <div style={{flex:1,height:1,background:"rgba(139,105,20,0.18)"}}/>
              <span className="font-sans" style={{fontSize:10,letterSpacing:"0.1em",color:"rgba(139,105,20,0.45)",textTransform:"uppercase"}}>or</span>
              <div style={{flex:1,height:1,background:"rgba(139,105,20,0.18)"}}/>
            </div>

            <button
              type="button"
              disabled={googleLoading||loading}
              onClick={async ()=>{
                if(!onGoogleSignIn||googleLoading||loading) return;
                setGoogleLoading(true); setError(null);
                try { await onGoogleSignIn(); }
                catch(e) {
                  if(e.code!=="auth/popup-closed-by-user"&&e.code!=="auth/cancelled-popup-request") setError("Google sign-in failed. Please try again.");
                }
                finally { setGoogleLoading(false); }
              }}
              style={{
                display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                width:"100%",padding:"9px 16px",borderRadius:8,
                border:"1.5px solid rgba(139,105,20,0.28)",background:"rgba(255,252,245,0.9)",
                cursor:googleLoading||loading?"default":"pointer",
                transition:"border-color 160ms ease, background 160ms ease",
                opacity:googleLoading||loading?0.6:1,
              }}
              onMouseEnter={e=>{if(!googleLoading&&!loading){e.currentTarget.style.borderColor="rgba(139,105,20,0.55)";e.currentTarget.style.background="rgba(255,252,245,1)";}}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(139,105,20,0.28)";e.currentTarget.style.background="rgba(255,252,245,0.9)";}}
            >
              {!googleLoading && (
                <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
              )}
              <span className="font-sans" style={{fontSize:12,fontWeight:600,letterSpacing:"0.06em",color:"rgba(44,26,8,0.72)"}}>
                {googleLoading ? "Signing in…" : "Continue with Google"}
              </span>
            </button>

            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <p className="font-sans" style={{fontSize:11,color:"rgba(139,105,20,0.55)",margin:0,letterSpacing:"0.03em"}}>
                Not a reader yet?
              </p>
              <button
                type="button"
                onClick={()=>onCreateAccount&&onCreateAccount()}
                onMouseEnter={()=>setHoveredAction("create-from-signin")}
                onMouseLeave={()=>setHoveredAction(null)}
                className="font-sans"
                style={{
                  background:"none",
                  border:"none",
                  borderRadius:0,
                  padding:"0 0 3px",
                  cursor:"pointer",
                  color:"#8B6914",
                  fontSize:11,
                  fontWeight:700,
                  letterSpacing:"0.16em",
                  textTransform:"uppercase",
                  borderBottom:`${hoveredAction==="create-from-signin" ? 2 : 1}px solid ${hoveredAction==="create-from-signin" ? "rgba(139,105,20,0.82)" : "rgba(139,105,20,0.42)"}`,
                  transform:hoveredAction==="create-from-signin" ? "translateY(-1px)" : "none",
                  transition:"border-color 160ms ease, transform 180ms ease",
                }}
              >
                Create an Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
