function HeroTaglineAnchor({mode="hero", activeStage=-1}) {
  const isHero = mode==="hero";
  const words = ["Read", "moments", "worth", "sharing."];
  const frameRef = useRef(null);

  return (
    <>
      {!isHero && (
        <img
          src="./logo-clean.png"
          alt="momento"
          style={{
            position:"fixed",
            left:32,
            top:38,
            transform:"translateY(-50%)",
            height:22,
            width:"auto",
            display:"block",
            filter:"brightness(0) invert(1) contrast(1.1) drop-shadow(0 2px 8px rgba(0,0,0,0.18))",
            opacity:0.92,
            zIndex:740,
            pointerEvents:"none",
          }}
        />
      )}
      <div style={{
        position:"fixed",
        left:"50%",
        top:isHero ? "calc(50vh - 54px)" : "10px",
        transform:"translateX(-50%)",
        zIndex:740,
        width:isHero ? "min(1320px, 94vw)" : "min(980px, 92vw)",
        textAlign:"center",
        pointerEvents:"none",
        transition:"top 460ms cubic-bezier(0.22, 1, 0.36, 1), width 460ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}>
        <div
          style={{
            position:"relative",
            display:"inline-block",
          }}
        >
          <h1
            className="font-serif"
            style={{
              position:"relative",
              zIndex:1,
              margin:0,
              fontSize:isHero ? "clamp(40px, 4.4vw, 72px)" : "clamp(26px, 2.7vw, 40px)",
              lineHeight:0.98,
              fontWeight:500,
              fontStyle:"italic",
              letterSpacing:"-0.04em",
              textShadow:"0 8px 30px rgba(0,0,0,0.26)",
              whiteSpace:"nowrap",
              transition:"font-size 460ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {words.map((word, index)=>{
              const isMomentsWord = index===1;
              const isActive = !isHero && index===activeStage;
              const activeColor = isActive ? "#FFD966" : "#FFF7E8";
              const color = isHero && !isMomentsWord ? "#FFF7E8" : activeColor;

              return (
                <span
                  key={word}
                  style={{
                    position:"relative",
                    zIndex:isHero && isMomentsWord ? 2 : 1,
                    color,
                    transition:"color 220ms ease",
                  }}
                >
                  {index>0 ? " " : ""}
                  <span style={{position:"relative", display:"inline-block"}}>
                    {isHero && isMomentsWord ? (
                        <span
                          style={{
                            position:"relative",
                            display:"inline-block",
                            lineHeight:0.9,
                            verticalAlign:"baseline",
                          }}
                        >
                        <span
                          ref={frameRef}
                          data-opening-moments-frame
                          style={{
                            position:"absolute",
                            top:"-0.12em",
                            right:"-0.1em",
                            bottom:"-0.06em",
                            left:"-0.08em",
                            border:"1.5px dashed rgba(255,247,232,1)",
                            borderRadius:0,
                            pointerEvents:"none",
                            transform:"translateY(0.14em)",
                          }}
                        />
                        <span
                          style={{
                            position:"relative",
                            display:"inline-block",
                            lineHeight:0.9,
                          }}
                        >
                          {word}
                        </span>
                      </span>
                    ) : (
                      word
                    )}
                    {!isHero && (
                      <span style={{
                        position:"absolute",
                        bottom:"-4px",
                        left:0,
                        right:0,
                        height:"2px",
                        background:"#FFD966",
                        borderRadius:"1px",
                        transform:isActive ? "scaleX(1)" : "scaleX(0)",
                        transformOrigin:"center",
                        transition:"transform 280ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease",
                        opacity:isActive ? 1 : 0,
                        pointerEvents:"none",
                      }}/>
                    )}
                  </span>
                </span>
              );
            })}
          </h1>
        </div>
      </div>
    </>
  );
}
