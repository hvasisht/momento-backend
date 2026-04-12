function EmailVerificationOverlay({ email, onVerified, onSignOut }) {
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredAction, setHoveredAction] = useState(null);

  const handleVerified = async () => {
    setChecking(true);
    setError(null);
    try {
      await firebase.auth().currentUser.reload();
      if (firebase.auth().currentUser.emailVerified) {
        onVerified();
      } else {
        setError("Email not verified yet. Check your inbox and click the link.");
      }
    } catch(e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      await firebase.auth().currentUser.sendEmailVerification();
      setResent(true);
      setTimeout(function() { setResent(false); }, 4000);
    } catch(e) {
      setError("Couldn't resend. Try again in a moment.");
    } finally {
      setResending(false);
    }
  };

  const actionBase = {
    border: "none",
    background: "none",
    borderRadius: 0,
    padding: "0 0 6px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    transition: "color 160ms ease, border-color 160ms ease, transform 180ms ease",
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
      padding: "32px 24px 28px",
    }}>
      <div style={{
        width: "min(600px, 100%)",
        borderRadius: 32,
        background: "linear-gradient(180deg, rgba(248,242,228,0.98) 0%, rgba(241,231,211,0.98) 100%)",
        boxShadow: "0 42px 90px rgba(0,0,0,0.28)",
        padding: "38px 44px 36px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}>
        <p className="font-sans" style={{
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "rgba(139,105,20,0.72)",
          margin: "0 0 10px",
          fontWeight: 700,
        }}>
          One more step
        </p>

        <h3 className="font-serif" style={{
          fontSize: 34,
          lineHeight: 1.08,
          margin: "0 0 14px",
          color: "#2C1A08",
          fontWeight: 600,
        }}>
          Verify your email.
        </h3>

        <p className="font-sans" style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: "rgba(44,26,8,0.62)",
          margin: "0 0 6px",
          maxWidth: 400,
        }}>
          We sent a verification link to
        </p>
        <p className="font-sans" style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#8B6914",
          margin: "0 0 28px",
          wordBreak: "break-all",
        }}>
          {email}
        </p>

        <div style={{
          width: "min(340px, 100%)",
          height: 1,
          background: "rgba(139,105,20,0.18)",
          margin: "0 0 24px",
        }}/>

        <p className="font-sans" style={{
          fontSize: 12,
          lineHeight: 1.5,
          color: "rgba(44,26,8,0.5)",
          margin: "0 0 22px",
          maxWidth: 380,
        }}>
          Click the link in your inbox, then come back and tap below. Check your spam if you don't see it.
        </p>

        <button
          className="font-sans"
          disabled={checking}
          onClick={handleVerified}
          onMouseEnter={() => setHoveredAction("verified")}
          onMouseLeave={() => setHoveredAction(null)}
          style={{
            ...actionBase,
            color: checking ? "rgba(139,105,20,0.4)" : "#8B6914",
            cursor: checking ? "default" : "pointer",
            borderBottom: `${hoveredAction === "verified" && !checking ? 2 : 1}px solid ${!checking ? (hoveredAction === "verified" ? "rgba(139,105,20,0.82)" : "rgba(139,105,20,0.52)") : "rgba(139,105,20,0.18)"}`,
            transform: hoveredAction === "verified" && !checking ? "translateY(-1px)" : "none",
            marginBottom: 18,
          }}
        >
          {checking ? "Checking…" : "I've verified my email"}
        </button>

        {error && (
          <p className="font-sans" style={{
            fontSize: 12,
            color: "#c0392b",
            margin: "0 0 16px",
            letterSpacing: "0.02em",
          }}>
            {error}
          </p>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            className="font-sans"
            disabled={resending}
            onClick={handleResend}
            onMouseEnter={() => setHoveredAction("resend")}
            onMouseLeave={() => setHoveredAction(null)}
            style={{
              border: "none",
              background: "none",
              padding: 0,
              cursor: resending ? "default" : "pointer",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: resent ? "#4a7c59" : "rgba(139,105,20,0.55)",
              transition: "color 160ms ease",
            }}
          >
            {resending ? "Sending…" : resent ? "✓ Sent!" : "Resend email"}
          </button>

          <span style={{ color: "rgba(139,105,20,0.22)", fontSize: 11 }}>·</span>

          <button
            className="font-sans"
            onClick={onSignOut}
            onMouseEnter={() => setHoveredAction("signout")}
            onMouseLeave={() => setHoveredAction(null)}
            style={{
              border: "none",
              background: "none",
              padding: 0,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: hoveredAction === "signout" ? "rgba(44,26,8,0.6)" : "rgba(139,105,20,0.4)",
              transition: "color 160ms ease",
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
