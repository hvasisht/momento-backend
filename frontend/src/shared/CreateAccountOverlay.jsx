
function CreateAccountOverlay({onBack, onSubmit}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [createdProfile, setCreatedProfile] = useState(null);
  const [hoveredAction, setHoveredAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [readernameStatus, setReadernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken'

  // Debounced readername availability check — public endpoint, no auth token needed
  useEffect(function() {
    var name = username.trim();
    if (name.length < 2) { setReadernameStatus(null); return; }
    setReadernameStatus('checking');
    var timer = setTimeout(function() {
      fetch(API_BASE + "/users/readername/" + encodeURIComponent(name) + "/available")
        .then(function(r) { return r.json(); })
        .then(function(data) { setReadernameStatus(data.available ? 'available' : 'taken'); })
        .catch(function() { setReadernameStatus(null); });
    }, 500);
    return function() { clearTimeout(timer); };
  }, [username]);

  const canContinue = !!(firstName.trim() && lastName.trim() && email.trim() && username.trim() && password.trim() && confirmPassword.trim() && password === confirmPassword && readernameStatus !== 'taken');

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

  const actionLinkBase = {
    border:"none",
    background:"transparent",
    padding:0,
    cursor:"pointer",
    fontFamily:"'Kalam', cursive",
    fontStyle:"italic",
    lineHeight:1,
    letterSpacing:"0.01em",
    fontWeight:700,
    transition:"transform 160ms ease, border-bottom-width 160ms ease, color 160ms ease",
  };

  const accentWordStyle = {
    color:"rgba(139,105,20,0.76)",
    fontFamily:"'Playfair Display', Georgia, serif",
    fontStyle:"italic",
    fontWeight:500,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canContinue || loading) return;
    setLoading(true);
    setError(null);
    var firebaseUser = null;
    try {
      // 1. Create Firebase account
      var cred = await firebase.auth().createUserWithEmailAndPassword(email.trim(), password);
      firebaseUser = cred.user;
      await firebaseUser.updateProfile({ displayName: firstName.trim() + " " + lastName.trim() });

      // 2. Create user record in our DB
      await apiPost("/users/me", {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        readername: username.trim(),
      });

      // 3. Send verification email (best-effort — don't block on failure)
      firebaseUser.sendEmailVerification().catch(function() {});

      // 4. Show success screen
      setCreatedProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        username: username.trim(),
      });
    } catch(err) {
      // If DB insert failed after Firebase user was created, delete the Firebase user
      if (firebaseUser) {
        firebaseUser.delete().catch(function() {});
      }
      var msg = err.message || "Something went wrong. Try again.";
      if (err.code === "auth/email-already-in-use") msg = "An account with this email already exists.";
      else if (err.code === "auth/weak-password") msg = "Password should be at least 6 characters.";
      else if (err.code === "auth/invalid-email") msg = "Invalid email address.";
      else if (msg.includes("readername")) msg = "That readername is already taken.";
      else if (msg === "Failed to fetch" || msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("networkerror")) msg = "Unable to connect. Please try again in a moment.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isSuccess = !!createdProfile;

  return (
    <div style={{
      position:"fixed",
      inset:0,
      zIndex:720,
      background:"linear-gradient(180deg, rgba(16,10,6,0.64) 0%, rgba(16,10,6,0.8) 100%)",
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      padding:"84px 24px 28px",
    }}>
      <div style={{
        width:isSuccess ? "min(820px, 100%)" : "min(760px, 100%)",
        minHeight:isSuccess ? "auto" : "min(510px, calc(100vh - 190px))",
        borderRadius:32,
        background:"linear-gradient(180deg, rgba(248,242,228,0.98) 0%, rgba(241,231,211,0.98) 100%)",
        boxShadow:"0 42px 90px rgba(0,0,0,0.28)",
        position:"relative",
        padding:isSuccess ? "26px 38px 30px" : "28px 38px 32px",
        display:"flex",
        flexDirection:"column",
      }}>
        {!isSuccess && (
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
        )}

        {!isSuccess ? (
          <div style={{maxWidth:570,margin:"12px auto 0",width:"100%"}}>
            <p className="font-sans" style={{fontSize:11,letterSpacing:"0.16em",textTransform:"uppercase",color:"rgba(139,105,20,0.72)",margin:"0 0 10px",fontWeight:700}}>
              Create Account
            </p>
            <h3 className="font-serif" style={{fontSize:36,lineHeight:1.06,margin:"0 0 18px",color:"#2C1A08",fontWeight:600}}>
              Start your first chapter.
            </h3>

            <form onSubmit={handleSubmit} style={{display:"grid",gap:14}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <label>
                  <span className="font-sans" style={labelStyle}>First name</span>
                  <input value={firstName} onChange={e=>{setFirstName(e.target.value);setError(null);}} placeholder="Enter first name" style={inputStyle}/>
                </label>
                <label>
                  <span className="font-sans" style={labelStyle}>Last name</span>
                  <input value={lastName} onChange={e=>{setLastName(e.target.value);setError(null);}} placeholder="Enter last name" style={inputStyle}/>
                </label>
              </div>
              <label>
                <span className="font-sans" style={labelStyle}>Email</span>
                <input value={email} onChange={e=>{setEmail(e.target.value);setError(null);}} placeholder="Enter email" type="email" style={inputStyle}/>
              </label>
              <div style={{position:"relative"}}>
                <label>
                  <span className="font-sans" style={labelStyle}>Readername</span>
                  <input value={username} onChange={e=>{setUsername(e.target.value);setError(null);setReadernameStatus(null);}} placeholder="Choose a readername" style={{...inputStyle,paddingRight:48}}/>
                </label>
                <button
                  type="button"
                  onMouseEnter={()=>setHoveredAction("readername-info")}
                  onMouseLeave={()=>setHoveredAction(null)}
                  aria-label="What is a readername?"
                  style={{
                    position:"absolute",
                    top:"calc(50% + 10px)",
                    right:14,
                    transform:"translateY(-50%)",
                    width:22,
                    height:22,
                    borderRadius:"50%",
                    border:"1px solid rgba(139,105,20,0.22)",
                    background:"rgba(255,251,242,0.96)",
                    color:"rgba(139,105,20,0.76)",
                    fontSize:12,
                    fontWeight:700,
                    lineHeight:1,
                    cursor:"help",
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"center",
                    boxShadow:"0 6px 16px rgba(44,26,8,0.08)",
                  }}
                >
                  i
                </button>
                <div
                  style={{
                    position:"absolute",
                    right:0,
                    top:"calc(100% + 8px)",
                    maxWidth:248,
                    padding:"8px 10px",
                    borderRadius:12,
                    background:"rgba(44,26,8,0.92)",
                    color:"rgba(255,247,232,0.96)",
                    fontSize:12,
                    lineHeight:1.45,
                    boxShadow:"0 16px 30px rgba(0,0,0,0.18)",
                    opacity:hoveredAction==="readername-info" ? 1 : 0,
                    transform:hoveredAction==="readername-info" ? "translateY(0)" : "translateY(-4px)",
                    pointerEvents:"none",
                    transition:"opacity 160ms ease, transform 160ms ease",
                    zIndex:2,
                  }}
                >
                  Readername is basically the username for momento.
                </div>
                {readernameStatus && (
                  <p className="font-sans" style={{
                    fontSize:11, margin:"5px 0 0", letterSpacing:"0.02em",
                    fontStyle: readernameStatus === 'checking' ? 'italic' : 'normal',
                    color: readernameStatus === 'available' ? "#4a7c59"
                         : readernameStatus === 'taken'     ? "#c0392b"
                         : "rgba(139,105,20,0.5)",
                    transition:"color 160ms ease",
                  }}>
                    {readernameStatus === 'checking'  && "checking\u2026"}
                    {readernameStatus === 'available' && "\u2713 available"}
                    {readernameStatus === 'taken'     && "\u2717 already taken"}
                  </p>
                )}
              </div>
              <div>
                <label>
                  <span className="font-sans" style={labelStyle}>Password</span>
                  <input value={password} onChange={e=>{setPassword(e.target.value);setError(null);}} placeholder="Enter password (min 6 characters)" type="password" style={inputStyle}/>
                </label>
                {password.length > 0 && (
                  <p className="font-sans" style={{
                    fontSize:11, margin:"5px 0 0", letterSpacing:"0.02em",
                    color: password.length >= 6 ? "#4a7c59" : "#c0392b",
                    transition:"color 200ms ease",
                  }}>
                    {password.length >= 6 ? "\u2713 At least 6 characters" : "\u25CB At least 6 characters"}
                  </p>
                )}
              </div>
              <div>
                <label>
                  <span className="font-sans" style={labelStyle}>Confirm password</span>
                  <input value={confirmPassword} onChange={e=>{setConfirmPassword(e.target.value);setError(null);}} placeholder="Re-enter your password" type="password" style={inputStyle}/>
                </label>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="font-sans" style={{fontSize:11,color:"#c0392b",margin:"5px 0 0",letterSpacing:"0.02em"}}>
                    Passwords don&rsquo;t match.
                  </p>
                )}
              </div>

              {error && (
                <p className="font-sans" style={{fontSize:12,color:"#c0392b",margin:"0",letterSpacing:"0.02em"}}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="font-sans"
                disabled={!canContinue || loading}
                onMouseEnter={()=>setHoveredAction("create")}
                onMouseLeave={()=>setHoveredAction(null)}
                style={{
                  marginTop:10,
                  background:"none",
                  border:"none",
                  borderRadius:0,
                  padding:"0 0 6px",
                  cursor:canContinue && !loading ? "pointer" : "default",
                  color:canContinue && !loading ? "#8B6914" : "rgba(139,105,20,0.35)",
                  fontSize:13,
                  fontWeight:700,
                  letterSpacing:"0.18em",
                  textTransform:"uppercase",
                  borderBottom:`${hoveredAction==="create" && canContinue ? 2 : 1}px solid ${canContinue ? (hoveredAction==="create" ? "rgba(139,105,20,0.82)" : "rgba(139,105,20,0.52)") : "rgba(139,105,20,0.18)"}`,
                  transform:hoveredAction==="create" && canContinue ? "translateY(-1px)" : "none",
                  transition:"color 160ms ease, border-color 160ms ease, transform 180ms ease",
                }}
              >
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>
          </div>
        ) : (
          <div style={{maxWidth:760,margin:"-10px auto 0",width:"100%",textAlign:"center"}}>
            <p className="font-sans" style={{fontSize:11,letterSpacing:"0.16em",textTransform:"uppercase",color:"rgba(139,105,20,0.72)",margin:"0 0 8px",fontWeight:700}}>
              Welcome, {createdProfile.firstName}.
            </p>
            <h3 className="font-serif" style={{fontSize:38,lineHeight:1.04,margin:"0 0 18px",color:"#2C1A08",fontWeight:600,whiteSpace:"nowrap"}}>
              Your first chapter is open.
            </h3>

            <p className="font-sans" style={{fontSize:11,color:"rgba(44,26,8,0.42)",margin:"0 0 14px",letterSpacing:"0.02em"}}>
              A verification link was sent to {createdProfile.email} — check your spam if you don't see it.
            </p>

            <div style={{width:"min(480px, 100%)",margin:"0 auto 18px",height:1,background:"rgba(139,105,20,0.18)"}}/>

            <div style={{margin:"0 auto 10px",maxWidth:680}}>
              <p style={{fontFamily:"'Kalam', cursive",fontSize:24,lineHeight:1.6,margin:0,color:"rgba(44,26,8,0.82)"}}>
                Your{" "}
                <button
                  type="button"
                  onClick={()=>onSubmit(createdProfile)}
                  onMouseEnter={()=>setHoveredAction("guide")}
                  onMouseLeave={()=>setHoveredAction(null)}
                  style={{
                    ...actionLinkBase,
                    fontFamily:"'Playfair Display', Georgia, serif",
                    fontStyle:"italic",
                    fontWeight:500,
                    color:"#8B6914",
                    fontSize:24,
                    borderBottom:`${hoveredAction==="guide" ? 2 : 1}px solid rgba(139,105,20,0.7)`,
                    transform:`translateY(${hoveredAction==="guide" ? "-1px" : "0"})`,
                  }}
                >
                  Guide
                </button>{" "}
                is waiting. We will show you how <span style={{...accentWordStyle,fontFamily:"'Montserrat', sans-serif",fontStyle:"normal",fontWeight:500}}>momento</span> works.
              </p>
            </div>

            <p style={{fontFamily:"'Kalam', cursive",fontSize:18,lineHeight:1.45,margin:"12px 0 2px",color:"rgba(44,26,8,0.66)"}}>
              Or{" "}
              <button
                type="button"
                onClick={()=>onSubmit(createdProfile, { skipGuide:true })}
                onMouseEnter={()=>setHoveredAction("skip")}
                onMouseLeave={()=>setHoveredAction(null)}
                style={{
                  ...actionLinkBase,
                  fontFamily:"'Playfair Display', Georgia, serif",
                  fontStyle:"italic",
                  fontWeight:500,
                  color:"rgba(44,26,8,0.74)",
                  fontSize:18,
                  borderBottom:`${hoveredAction==="skip" ? 2 : 1}px solid rgba(44,26,8,0.34)`,
                  transform:`translateY(${hoveredAction==="skip" ? "-1px" : "0"})`,
                }}
              >
                Skip
              </button>{" "}
              to begin at once.
            </p>
            <p style={{fontFamily:"'Kalam', cursive",fontSize:13,lineHeight:1.4,margin:0,color:hoveredAction==="skip" ? "rgba(139,105,20,0.72)" : "rgba(44,26,8,0.3)",transition:"color 160ms ease"}}>
              {hoveredAction==="skip" ? "You'll miss the head start." : " "}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
