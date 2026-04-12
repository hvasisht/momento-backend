function GoogleCompleteProfileOverlay({ googleUser, onSubmit, onBack }) {
  var parts = (googleUser.displayName || "").trim().split(" ");
  var firstName = parts[0] || googleUser.email.split("@")[0];
  var lastName = parts.slice(1).join(" ");

  const [readername, setReadername] = useState("");
  const [readernameStatus, setReadernameStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredAction, setHoveredAction] = useState(null);

  useEffect(function() {
    var name = readername.trim();
    if (name.length < 2) { setReadernameStatus(null); return; }
    setReadernameStatus("checking");
    var timer = setTimeout(function() {
      fetch(API_BASE + "/users/readername/" + encodeURIComponent(name) + "/available")
        .then(function(r) { return r.json(); })
        .then(function(data) { setReadernameStatus(data.available ? "available" : "taken"); })
        .catch(function() { setReadernameStatus(null); });
    }, 500);
    return function() { clearTimeout(timer); };
  }, [readername]);

  const canContinue = readername.trim().length >= 2 && readernameStatus === "available" && !loading;

  const inputStyle = {
    width: "100%",
    border: "none",
    borderBottom: "1.5px solid rgba(139,105,20,0.42)",
    background: "transparent",
    borderRadius: 0,
    padding: "8px 0 10px",
    fontSize: 15,
    color: "#2C1A08",
    outline: "none",
    boxShadow: "none",
  };

  const labelStyle = {
    display: "block",
    margin: "0 0 7px",
    fontSize: 11,
    letterSpacing: "0.08em",
    color: "rgba(139,105,20,0.76)",
    fontWeight: 700,
    textTransform: "uppercase",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canContinue) return;
    setLoading(true);
    setError(null);
    try {
      await apiPost("/users/me", {
        first_name: firstName,
        last_name: lastName,
        email: googleUser.email,
        readername: readername.trim(),
      });
      onSubmit({ firstName, lastName, email: googleUser.email, username: readername.trim() });
    } catch(err) {
      var msg = err.message || "Something went wrong. Try again.";
      if (msg.includes("readername")) msg = "That readername is already taken.";
      else if (msg === "Failed to fetch" || msg.toLowerCase().includes("failed to fetch")) msg = "Unable to connect. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 720,
      background: "linear-gradient(180deg, rgba(16,10,6,0.64) 0%, rgba(16,10,6,0.8) 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "84px 24px 28px",
    }}>
      <div style={{
        width: "min(600px, 100%)",
        borderRadius: 32,
        background: "linear-gradient(180deg, rgba(248,242,228,0.98) 0%, rgba(241,231,211,0.98) 100%)",
        boxShadow: "0 42px 90px rgba(0,0,0,0.28)",
        position: "relative",
        padding: "28px 38px 32px",
        display: "flex",
        flexDirection: "column",
      }}>
        <button
          onClick={onBack}
          className="font-sans"
          style={{
            position: "absolute",
            top: 24,
            left: 28,
            border: "none",
            background: "transparent",
            color: "rgba(139,105,20,0.74)",
            cursor: "pointer",
            padding: 0,
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          ← Back
        </button>

        <div style={{ maxWidth: 440, margin: "12px auto 0", width: "100%" }}>
          <p className="font-sans" style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(139,105,20,0.72)", margin: "0 0 10px", fontWeight: 700 }}>
            One last thing
          </p>
          <h3 className="font-serif" style={{ fontSize: 34, lineHeight: 1.06, margin: "0 0 6px", color: "#2C1A08", fontWeight: 600 }}>
            Choose your readername.
          </h3>
          <p className="font-sans" style={{ fontSize: 12, color: "rgba(44,26,8,0.5)", margin: "0 0 20px", lineHeight: 1.5 }}>
            Signed in as <span style={{ color: "#8B6914", fontWeight: 600 }}>{googleUser.email}</span>
          </p>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
            <div style={{ position: "relative" }}>
              <label>
                <span className="font-sans" style={labelStyle}>Readername</span>
                <input
                  value={readername}
                  onChange={e => { setReadername(e.target.value); setReadernameStatus(null); setError(null); }}
                  placeholder="Choose a readername"
                  style={{ ...inputStyle, paddingRight: 4 }}
                  autoFocus
                />
              </label>
              {readernameStatus && (
                <p className="font-sans" style={{
                  fontSize: 11, margin: "5px 0 0", letterSpacing: "0.02em",
                  fontStyle: readernameStatus === "checking" ? "italic" : "normal",
                  color: readernameStatus === "available" ? "#4a7c59"
                       : readernameStatus === "taken"     ? "#c0392b"
                       : "rgba(139,105,20,0.5)",
                  transition: "color 160ms ease",
                }}>
                  {readernameStatus === "checking"  && "checking\u2026"}
                  {readernameStatus === "available" && "\u2713 available"}
                  {readernameStatus === "taken"     && "\u2717 already taken"}
                </p>
              )}
            </div>

            {error && (
              <p className="font-sans" style={{ fontSize: 12, color: "#c0392b", margin: 0, letterSpacing: "0.02em" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="font-sans"
              disabled={!canContinue}
              onMouseEnter={() => setHoveredAction("submit")}
              onMouseLeave={() => setHoveredAction(null)}
              style={{
                marginTop: 10,
                background: "none",
                border: "none",
                borderRadius: 0,
                padding: "0 0 6px",
                cursor: canContinue ? "pointer" : "default",
                color: canContinue ? "#8B6914" : "rgba(139,105,20,0.35)",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                borderBottom: `${hoveredAction === "submit" && canContinue ? 2 : 1}px solid ${canContinue ? (hoveredAction === "submit" ? "rgba(139,105,20,0.82)" : "rgba(139,105,20,0.52)") : "rgba(139,105,20,0.18)"}`,
                transform: hoveredAction === "submit" && canContinue ? "translateY(-1px)" : "none",
                transition: "color 160ms ease, border-color 160ms ease, transform 180ms ease",
                alignSelf: "flex-start",
              }}
            >
              {loading ? "Setting up\u2026" : "Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
