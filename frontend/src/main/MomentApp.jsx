/* â"€ï¿½ï¿½ï¿½ MAIN APP â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
function MomentApp() {
  const [authUser, setAuthUser] = useState(undefined); // undefined = loading, null = signed out
  const [introActive, setIntroActive] = useState(true);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showGoogleComplete, setShowGoogleComplete] = useState(false);
  const [googleUserData, setGoogleUserData] = useState(null);
  const [onboardingStage, setOnboardingStage] = useState(0);
  const [readerProfile, setReaderProfile] = useState(null);
  const [momentEdits, setMomentEdits] = useState({});
  const [expandedSections,setExpandedSections] = useState(new Set([0]));
  const [cubeIndex,setCubeIndex]   = useState(0);
  const [isRotating,setIsRotating] = useState(false);
  const [pairSide,setPairSide]     = useState("left");
  const [draggedMoment,setDraggedMoment] = useState(null);
  const [ghostPos,setGhostPos]     = useState({x:0,y:0});
  const [dropTarget,setDropTarget] = useState(null);
  const [dropZone,setDropZone] = useState(null); // reserved for future drag-zone variants
  const [readDropMoment,setReadDropMoment] = useState(null);
  const [focusedMoments,setFocusedMoments] = useState({worth:null,sharing:null});
  const [snippedMoments,setSnippedMoments] = useState([]);
  const [deletedMomentIds,setDeletedMomentIds] = useState(new Set());
  const [worthMessage,setWorthMessage] = useState("Snip Moments to create Momentos and shape your circle.");
  const [firstMomentToast, setFirstMomentToast] = useState(null); // null | 'normal' | 'combined'
  const [momentsSavedBlink,setMomentsSavedBlink] = useState(false);
  const [worthNotif,setWorthNotif] = useState(false);
  const [sharingNotifCount,setSharingNotifCount] = useState(0);
  const [sharingFeedAdditions,setSharingFeedAdditions] = useState([]);
  const [wavedProfileNames,setWavedProfileNames] = useState(new Set());
  const firstProfileShownRef = useRef(false);
  // Tracks whether user is in an explicit sign-in/create-account flow so the
  // onAuthStateChanged listener doesn't try to auto-launch at the same time.
  const inExplicitAuthFlowRef = useRef(false);
  const [activeWhisper,setActiveWhisper] = useState(null);
  const [sharingDropZone,setSharingDropZone] = useState(null);
  const [expandedMomentId,setExpandedMomentId] = useState(null);
  const [whisperTarget,setWhisperTarget] = useState(null);
  const [sharingActiveThread,setSharingActiveThread] = useState({name:null,pendingMoment:null});
  const [showProfile,setShowProfile] = useState(false);
  const [showHint,setShowHint] = useState(false);
  const [darkMode,setDarkMode] = useState(false);
  const [headerSearchExpanded,setHeaderSearchExpanded] = useState(false);
  const [readSearchQuery,setReadSearchQuery] = useState("");
  const [sharingAssistMode,setSharingAssistMode] = useState(false);
  const searchInputRef = useRef(null);
  const [momentsLayoutMode, setMomentsLayoutMode] = useState("clip-by-books");
  const [momentsPassageFirst, setMomentsPassageFirst] = useState(true);
  const [momentsShowLayoutMenu, setMomentsShowLayoutMenu] = useState(false);
  const [openBookInRead,setOpenBookInRead] = useState(null);
  const [lastOpenedBook,setLastOpenedBook] = useState(null);
  const [momentsBrowsingBook,setMomentsBrowsingBook] = useState(false);
  const heroAnchorVisible = (introActive || showCreateAccount || showSignIn || showOnboarding) && !showEmailVerification && !showGoogleComplete;
  const heroAnchorMode = (showCreateAccount || showSignIn || showOnboarding) ? "top" : "hero";
  const isMomentsSolo = expandedSections.size===1 && cubeIndex===1;
  const isWorthSolo = expandedSections.size===1 && cubeIndex===2;
  const isSharingSolo = expandedSections.size===1 && cubeIndex===3;
  const _allMomentsFlat = [...(snippedMoments||[])]
    .filter(m => !deletedMomentIds.has(m.id))
    .map(m => momentEdits[m.id] !== undefined ? {...m, interpretation: momentEdits[m.id]} : m);
  const _filteredMomentsFlat = openBookInRead ? _allMomentsFlat.filter(m=>m.book===openBookInRead.title) : _allMomentsFlat;
  const momentsWithMomento = _filteredMomentsFlat.filter(m=>m.interpretation).length;
  const _momBooksSet = new Set(_filteredMomentsFlat.map(m=>m.book||"—"));
  const momentsBookCount = _momBooksSet.size;

  // Load moments from DB after login
  const loadMomentsFromDB = useCallback(function() {
    apiGet("/moments").then(function(data) {
      var mapped = data.map(function(m) {
        return {
          id: m.id,
          passage: m.passage,
          book: m.book_title,
          chapter: m.chapter,
          pg: m.page_num,
          interpretation: m.interpretation,
        };
      });
      setSnippedMoments(mapped);
    }).catch(function(e) { console.warn("Failed to load moments:", e); });
  }, []);

  // Load user preferences from DB — fills localStorage if on a new device
  const loadPreferencesFromDB = useCallback(function() {
    apiGet("/users/me").then(function(prefs) {
      // Hero book — only set if localStorage is empty (new device)
      if (prefs.last_hero_gut_id && !localStorage.getItem('momento_lastCapturedGut')) {
        localStorage.setItem('momento_lastCapturedGut', JSON.stringify({
          gutId: prefs.last_hero_gut_id,
          title: prefs.last_hero_title || '',
          author: prefs.last_hero_author || '',
          passage: null,
        }));
        localStorage.setItem('momento_lastCapturedType', 'gut');
      }
      // Guide book
      if (prefs.guide_book_gut_id && !localStorage.getItem('momento_guide_book')) {
        localStorage.setItem('momento_guide_book', prefs.guide_book_gut_id);
      }
      // Scroll positions — only fill missing entries
      if (prefs.reading_state && typeof prefs.reading_state === 'object') {
        Object.entries(prefs.reading_state).forEach(function(entry) {
          var gutId = entry[0]; var state = entry[1];
          if (!localStorage.getItem('momento_scrollTop_' + gutId)) {
            localStorage.setItem('momento_scrollTop_' + gutId, state.scroll_top || 0);
          }
          if (!localStorage.getItem('momento_pg_' + gutId)) {
            localStorage.setItem('momento_pg_' + gutId, state.pg || 0);
          }
        });
      }
      // Custom shelf books — only fill if localStorage is empty
      if (prefs.shelf && prefs.shelf.length > 0 && !localStorage.getItem('momento_recentShelf')) {
        localStorage.setItem('momento_recentShelf', JSON.stringify(prefs.shelf.map(function(b) {
          return { gutId: b.gut_id, title: b.title, author: b.author, cover: b.cover_url };
        })));
      }
      // Last captured type + shelf id
      if (prefs.last_captured_type && !localStorage.getItem('momento_lastCapturedType')) {
        localStorage.setItem('momento_lastCapturedType', prefs.last_captured_type);
      }
      if (prefs.last_captured_shelf_id && !localStorage.getItem('momento_lastCapturedShelfId')) {
        localStorage.setItem('momento_lastCapturedShelfId', prefs.last_captured_shelf_id);
      }
      // Consent — if DB says consented, trust it on any device
      if (prefs.consent_given) {
        localStorage.setItem('momento_consent_given', '1');
      }
    }).catch(function(e) { console.warn("Failed to load preferences:", e); });
  }, []);

  // Firebase auth state listener
  useEffect(()=>{
    var unsubscribe = firebase.auth().onAuthStateChanged(function(user) {
      setAuthUser(user || null);
      // Skip if user is actively going through sign-in or account creation — those
      // flows call requestLaunch() explicitly when ready.
      if (inExplicitAuthFlowRef.current) return;
      // Auto-launch for page-refresh with an existing session
      if (user && introActive) {
        if (localStorage.getItem('momento_consent_given')) {
          if (!user.emailVerified) {
            setShowEmailVerification(true);
            return;
          }
          loadPreferencesFromDB();
          loadMomentsFromDB();
          launchApp();
        } else {
          // New device — check DB for consent
          apiGet("/users/me").then(function(prefs) {
            if (prefs.consent_given) {
              localStorage.setItem('momento_consent_given', '1');
              if (!user.emailVerified) {
                setShowEmailVerification(true);
                return;
              }
              loadPreferencesFromDB();
              loadMomentsFromDB();
              launchApp();
            }
          }).catch(function(){});
        }
      }
    });
    return function() { unsubscribe(); };
  }, []); // eslint-disable-line

  const launchApp = useCallback(()=>{
    setShowConsent(false);
    setShowOnboarding(false);
    setIntroActive(false);
    setExpandedSections(new Set([0]));
    setCubeIndex(0);
    setPairSide("left");
    loadPreferencesFromDB();
    loadMomentsFromDB();
  },[loadMomentsFromDB, loadPreferencesFromDB]);

  const requestLaunch = useCallback(()=>{
    var user = firebase.auth().currentUser;
    if(localStorage.getItem('momento_consent_given')){
      // Returning user — enforce email verification before entry
      if (user && !user.emailVerified) {
        setShowEmailVerification(true);
        return;
      }
      launchApp();
    } else {
      setShowOnboarding(false);
      setShowConsent(true);
    }
  },[launchApp]);

  const handleConsentAccepted = useCallback(()=>{
    localStorage.setItem('momento_consent_given','1');
    var now = new Date().toISOString();
    apiPatch("/users/me/preferences", { consent_given: true, consent_at: now }).catch(function(){});
    launchApp();
  },[launchApp]);

  const handleGoogleSignIn = useCallback(async ()=>{
    inExplicitAuthFlowRef.current = true;
    var provider = new firebase.auth.GoogleAuthProvider();
    var result = await firebase.auth().signInWithPopup(provider);
    var firebaseUser = result.user;
    setShowCreateAccount(false);
    setShowSignIn(false);
    // Check if this user already has a DB record
    try {
      await apiGet("/users/me");
      // Existing user — go straight to launch
      requestLaunch();
    } catch(e) {
      // New user — collect readername before creating DB record
      setGoogleUserData({
        displayName: firebaseUser.displayName || "",
        email: firebaseUser.email || "",
      });
      setShowGoogleComplete(true);
    }
  }, [requestLaunch]);

  const handleCreateAccount = useCallback((profile, options={})=>{
    // Always clear consent for new accounts — previous user on this device may have consented
    try{ localStorage.removeItem('momento_consent_given'); }catch(e){}
    setReaderProfile(profile);
    setShowCreateAccount(false);
    if(options.skipGuide){
      setShowOnboarding(false);
      setShowConsent(true);
      return;
    }
    setOnboardingStage(0);
    setShowOnboarding(true);
  },[]);

  const handleOnboardingComplete = useCallback(({moment, closeReader})=>{
    if(moment){
      var tempId = moment.id;
      setSnippedMoments(prev=>[moment, ...prev]);
      setExpandedMomentId(tempId || null);
      setWorthNotif(true);
      setWorthMessage(closeReader
        ? `${closeReader.name} is your first Close Reader. Worth will keep shaping your circle from what you write.`
        : "Your first Momento is saved. Worth will now start shaping your circle."
      );
      /* Save guide book so READ hero defaults to the book they chose */
      if(moment.book && typeof FIXED_SHELF !== 'undefined'){
        var _fx = FIXED_SHELF.find(function(b){ return b.title===moment.book; });
        if(_fx){
          try{ localStorage.setItem('momento_guide_book', _fx.gutId); }catch(e){}
          try{ localStorage.setItem('momento_lastCapturedGut', JSON.stringify({title:_fx.title,author:_fx.author,passage:moment.passage,gutId:_fx.gutId})); }catch(e){}
          try{ localStorage.setItem('momento_lastCapturedType','gut'); }catch(e){}
          // Sync guide book to DB for cross-device
          apiPatch("/users/me/preferences", { guide_book_gut_id: _fx.gutId, last_hero_gut_id: _fx.gutId })
            .catch(function(e){ console.warn("Could not save guide book:", e); });
        }
      }
      // Save onboarding moment to DB so it persists across page reloads
      apiPost("/moments", {
        passage: moment.passage,
        book_title: moment.book || "",
        chapter: moment.chapter || null,
        page_num: moment.pg != null ? moment.pg : (moment.page != null ? moment.page : null),
        interpretation: moment.interpretation || null,
      }).then(function(saved) {
        setSnippedMoments(function(prev) {
          return prev.map(function(x) { return x.id === tempId ? {...x, id: saved.id} : x; });
        });
      }).catch(function(e) { console.warn("Failed to save onboarding moment:", e); });
    }
    requestLaunch();
  },[requestLaunch]);

  // Dark mode color tokens
  const dm = darkMode ? {
    bg:"#1C1710",
    bgSecondary:"var(--bg2)",
    bgCard:"var(--card)",
    bgCardAlt:"var(--card2)",
    text:"#E8DCC8",
    textMuted:"rgba(232,220,200,0.45)",
    amber:"#C4A055",
    amberMuted:"rgba(196,160,85,0.35)",
    border:"rgba(196,160,85,0.18)",
    borderStrong:"rgba(196,160,85,0.3)",
    headerBg:"var(--bg)",
    navBg:"#161210",
    white:"#2A2318",
  } : {
    bg:"var(--bg)",
    bgSecondary:"#FAF7EF",
    bgCard:"var(--card)",
    bgCardAlt:"#FAF7EF",
    text:"#1C1C1A",
    textMuted:"var(--text2)",
    amber:"#8B6914",
    amberMuted:"rgba(139,105,20,0.35)",
    border:"rgba(139,105,20,0.18)",
    borderStrong:"rgba(139,105,20,0.3)",
    headerBg:"var(--bg2)",
    headerAmber:"#8B6914",
    headerAmberMuted:"rgba(139,105,20,0.4)",
    headerBorder:"rgba(139,105,20,0.22)",
    headerBorderStrong:"rgba(139,105,20,0.35)",
    navBg:"var(--bg)",
    white:"#FFFFFF",
  };


  const onUpdateMoment = useCallback((id, interpretation) => {
    setMomentEdits(prev => ({...prev, [id]: interpretation}));
    // Persist to DB if it's a real DB id (uuid format), not a temp or tutorial id
    if (id && !String(id).startsWith('snip_') && !String(id).startsWith('tutorial-')) {
      apiPatch("/moments/" + id, { interpretation: interpretation })
        .catch(function(e) { console.warn("Failed to update moment:", e); });
    }
  }, []);

  const onSnip = useCallback((m)=>{
    const tempId = 'snip_'+Date.now()+'_'+Math.random().toString(36).slice(2,7);
    const withId = m.id ? m : {...m, id: tempId};
    setSnippedMoments(prev=>{
      const next=[...prev,withId];
      setMomentsSavedBlink(true);
      setTimeout(()=>setMomentsSavedBlink(false), 2000);
      if(prev.length === 0) {
        var _wc = m.interpretation ? m.interpretation.trim().split(/\s+/).filter(Boolean).length : 0;
        var _type = (m.interpretation && _wc < 10) ? 'combined' : 'normal';
        setFirstMomentToast(_type);
        setTimeout(()=>setFirstMomentToast(null), 5000);
      }
      if(m.interpretation) {
        setWorthNotif(true);
        const totalWithInterp = next.filter(x=>x.interpretation).length;
        if(totalWithInterp<=3) setWorthMessage("Worth is just getting to know you. Keep writing.");
        else if(totalWithInterp<=6) setWorthMessage("Worth is shaping your circle from your Momentos.");
        else setWorthMessage("Your circle is coming into focus. Keep reading.");
      }
      return next;
    });
    // Save to DB
    apiPost("/moments", {
      passage: m.passage,
      book_title: m.book || "",
      chapter: m.chapter || null,
      page_num: m.pg != null ? m.pg : null,
      interpretation: m.interpretation || null,
    }).then(function(saved) {
      // Replace temp id with real DB id
      setSnippedMoments(prev => prev.map(function(x) {
        return x.id === withId.id ? {...x, id: saved.id} : x;
      }));
    }).catch(function(e) { console.warn("Failed to save moment:", e); });
  },[]);
  const onDeleteMoment = useCallback((id)=>{
    setSnippedMoments(prev=>prev.filter(m=>m.id!==id));
    setDeletedMomentIds(prev=>new Set([...prev,id]));
    if (id && !String(id).startsWith('snip_')) {
      apiDelete("/moments/" + id)
        .catch(function(e) { console.warn("Failed to delete moment:", e); });
    }
  },[]);
  const openCountRef = useRef({});
  const closeCountRef = useRef({});
  const lastOpenedRef = useRef({index: null, direction: 'right'});
  const [closingSections, setClosingSections] = useState(new Set());
  const dragStateRef = useRef({active:false,moment:null});

  const expandedArray = Array.from(expandedSections).sort((a,b)=>a-b);
  const isLeftPair  = expandedArray.length===2&&expandedArray[0]===0&&expandedArray[1]===1;
  const isRightPair = expandedArray.length===2&&expandedArray[0]===2&&expandedArray[1]===3;
  const isAdjacentPair = isLeftPair||isRightPair;
  const activeLabels = expandedArray.map(i=>SECTIONS[i].label).join(" · ");

  const rotateTo = useCallback((newIndex)=>{
    if(newIndex===cubeIndex||isRotating||newIndex<0||newIndex>3) return;
    setIsRotating(true); setCubeIndex(newIndex);
    if(expandedSections.size===1){setExpandedSections(new Set([newIndex]));setPairSide(newIndex<=1?"left":"right");}
    setTimeout(()=>setIsRotating(false),350);
  },[cubeIndex,isRotating,expandedSections]);

  const rotateToPair = useCallback((target)=>{
    if(isRotating||target===pairSide) return;
    setIsRotating(true); setPairSide(target);
    setExpandedSections(new Set(target==="left"?[0,1]:[2,3]));
    setCubeIndex(target==="left"?0:2);
    setTimeout(()=>setIsRotating(false),350);
  },[isRotating,pairSide]);

  const toggleSection = useCallback((index)=>{
    setExpandedSections(prev=>{
      const next=new Set(prev);
      if(next.has(index)){
        if(next.size>1){next.delete(index);const rem=Array.from(next).sort((a,b)=>a-b);setCubeIndex(rem[0]);if(rem.every(i=>i<=1))setPairSide("left");else if(rem.every(i=>i>=2))setPairSide("right");}
      }else{
        next.add(index);const all=[...Array.from(prev),index];
        if(all.every(i=>i<=1))setPairSide("left");else if(all.every(i=>i>=2))setPairSide("right");
        openCountRef.current[index] = (openCountRef.current[index]||0) + 1;
        const existingMin = prev.size > 0 ? Math.min(...Array.from(prev)) : index;
        lastOpenedRef.current = { index, direction: index < existingMin ? 'left' : 'right' };
      }
      return next;
    });
  },[]);

  const handleClose = useCallback((index)=>{
    if(index===3) setSharingAssistMode(false);
    if(index===3) setSharingActiveThread({name:null,pendingMoment:null});
    closeCountRef.current[index] = (closeCountRef.current[index]||0) + 1;
    setClosingSections(prev=>new Set([...prev, index]));
    setTimeout(()=>{
      setClosingSections(prev=>{ const n=new Set(prev); n.delete(index); return n; });
      toggleSection(index);
    }, 420);
  },[toggleSection]);

  const expandSection = useCallback((index)=>{
    if(!expandedSections.has(index))setExpandedSections(prev=>new Set([...prev,index]));
  },[expandedSections]);

  useEffect(()=>{
    if(expandedSections.has(3)) setSharingNotifCount(0);
  },[expandedSections]);

  const openMomentsSection = useCallback(()=>{
    setSharingAssistMode(false);
    setExpandedSections(new Set([1]));
    setCubeIndex(1);
    setPairSide("left");
  },[]);

  const openMomentsAlongsideSharing = useCallback(()=>{
    setSharingAssistMode(true);
    setExpandedSections(new Set([1,3]));
    setCubeIndex(1);
    setPairSide("left");
  },[]);

  const onDragStart = useCallback((moment,clientX,clientY)=>{
    dragStateRef.current={active:true,moment};
    setDraggedMoment(moment); setGhostPos({x:clientX,y:clientY});
    document.body.classList.add("dragging-moment");
  },[]);

  useEffect(()=>{
    const onMove=e=>{
      if(!dragStateRef.current.active) return;
      setGhostPos({x:e.clientX,y:e.clientY});
      const el=document.elementFromPoint(e.clientX,e.clientY);
      const face=el?.closest("[data-section]")?.getAttribute("data-section");
      setDropTarget(face||null);
      if(face==="sharing"){
        const readerName = el?.closest("[data-reader-name]")?.getAttribute("data-reader-name");
        setDropZone(readerName||"thread");
      } else {
        setDropZone(null);
      }
    };
    const onUp=e=>{
      if(!dragStateRef.current.active) return;
      const el=document.elementFromPoint(e.clientX,e.clientY);
      const face=el?.closest("[data-section]")?.getAttribute("data-section");
      const readerName = face==="sharing" ? el?.closest("[data-reader-name]")?.getAttribute("data-reader-name") : null;
      const droppedMoment = dragStateRef.current.moment;
      if(face && droppedMoment){
        if(face==="read"){
          var fixedMatch = typeof FIXED_SHELF!=='undefined' ? FIXED_SHELF.find(function(b){
            var t1=b.title.toLowerCase(), t2=(droppedMoment.book||'').toLowerCase();
            return t1===t2||t1.includes(t2)||t2.includes(t1);
          }) : null;
          if(fixedMatch){ setReadDropMoment({...droppedMoment, book:fixedMatch.title}); rotateTo(0); }
        } else if(face==="moments"){
          setExpandedMomentId(droppedMoment.id||null);
          expandSection(1);
        } else {
          if(face==="sharing"){
            if(readerName){
              setSharingActiveThread({name:readerName, pendingMoment:droppedMoment});
              expandSection(3);
            } else {
              setSharingActiveThread(prev=> prev.name ? ({...prev, pendingMoment:droppedMoment}) : prev);
            }
          }
        }
      }
      dragStateRef.current={active:false,moment:null};
      setDraggedMoment(null); setDropTarget(null); setDropZone(null);
      document.body.classList.remove("dragging-moment");
    };
    window.addEventListener("mousemove",onMove); window.addEventListener("mouseup",onUp);
    return()=>{window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);};
  },[]);

  const getPanelProps = (sid) => {
    if(sid==="read")    return {onSnip, headerSearchExpanded, setHeaderSearchExpanded, searchInputRef, readSearchQuery, setReadSearchQuery, onBookOpen:(book)=>{setOpenBookInRead(book);setLastOpenedBook(book);}, onBookClose:()=>setOpenBookInRead(null), shelfOnly:expandedSections.size===4, sectionCount:expandedSections.size, allMoments:_allMomentsFlat, dropMoment:readDropMoment, onDropMomentHandled:()=>setReadDropMoment(null), initialOpenBook:openBookInRead};
    if(sid==="moments") return {onDragStart, snippedMoments, onUpdateMoment, onDeleteMoment, onBrowsingBookChange:setMomentsBrowsingBook, expandedMomentId, onClearExpanded:()=>setExpandedMomentId(null), openBookInRead, sharingAssistMode:sharingAssistMode&&expandedSections.has(3), layoutMode:momentsLayoutMode, setLayoutMode:setMomentsLayoutMode, passageFirst:momentsPassageFirst, setPassageFirst:setMomentsPassageFirst, showLayoutMenu:momentsShowLayoutMenu, setShowLayoutMenu:setMomentsShowLayoutMenu, hideHeader:isMomentsSolo, sectionCount:expandedSections.size};
    if(sid==="worth")   return {
      authUser,
      focusedMoment:focusedMoments.worth,
      onClear:()=>{setFocusedMoments(p=>({...p,worth:null}));},
      worthMessage, onDismissMessage:()=>{setWorthMessage(null);setWorthNotif(false);},
      activeWhisper, onSnip, onCloseWhisper:()=>setActiveWhisper(null),
      snippedMoments, openBookInRead, lastOpenedBook, onOpenMoments:openMomentsAlongsideSharing,
      hideHeader:isWorthSolo||expandedSections.size===4,
      sectionCount:expandedSections.size,
      onOpenWhisper:(name,moment)=>{
        setWhisperTarget({name, pendingMoment:moment||null});
        setSharingActiveThread({name, pendingMoment:moment||null});
        expandSection(3);
      },
      wavedNames:wavedProfileNames,
      onAddWaved:(name)=>setWavedProfileNames(prev=>new Set([...prev,name])),
      onFirstProfileShown:()=>{
        if(!firstProfileShownRef.current){
          firstProfileShownRef.current = true;
          setWorthMessage("Hooray! You just found your first close reader.");
          setWorthNotif(true);
        }
      },
      onAnotherProfileShown:()=>{
        if(firstProfileShownRef.current){
          firstProfileShownRef.current = false;
          setWorthMessage("Snip Moments to create Momentos and shape your circle.");
          setWorthNotif(false);
        }
      },
      onWave:(profile)=>{
        if(firstProfileShownRef.current){
          firstProfileShownRef.current = false;
          setWorthMessage("Snip Moments to create Momentos and shape your circle.");
          setWorthNotif(false);
        }
        setTimeout(()=>{
          const initials = profile.name.split(" ").map(n=>n[0]).join("");
          const entry = {
            id:`feed-waveback-${profile.name}-${Date.now()}`,
            initials, name:profile.name,
            bg: profile.coverBg||"#8B6914",
            signal:"wave_back",
            activeBook: profile.moments?.[0]?.book||"",
            momentBook: profile.moments?.[0]?.book||"",
          };
          setSharingFeedAdditions(prev=>[entry,...prev]);
          setSharingNotifCount(prev=>prev+1);
        }, 3000);
      },
    };
    if(sid==="sharing") return {
      authUser,
      focusedMoment:focusedMoments.sharing,
      onClear:()=>{setFocusedMoments(p=>({...p,sharing:null}));setSharingDropZone(null);},
      whisperTarget, onClearWhisperTarget:()=>setWhisperTarget(null),
      activeThreadName:sharingActiveThread.name,
      activeThreadPendingMoment:sharingActiveThread.pendingMoment,
      onOpenThread:(name,pendingMoment=null)=>setSharingActiveThread({name,pendingMoment}),
      onResolveThreadPendingMoment:()=>setSharingActiveThread(prev=>({...prev,pendingMoment:null})),
      onCloseThread:()=>setSharingActiveThread({name:null,pendingMoment:null}),
      onSnip, sharingDropZone, openBookInRead, onOpenMoments:openMomentsAlongsideSharing,
      feedAdditions:sharingFeedAdditions,
      hideHeader: isSharingSolo,
      sectionCount: expandedSections.size,
    };
    return {};
  };

  const renderPanel = (section, canClose, onClose) => {
    const PC = PANEL_COMPONENTS[section.id];
    const isDropTarget = dropTarget===section.id;
    return (
      <div data-section={section.id} className="section-panel" style={{flex:1,height:"100%",background:dm.bg,display:"flex",flexDirection:"column",position:"relative",outline:isDropTarget?`3px solid ${section.accent}`:"none",transition:"outline 150ms, background 400ms ease",border:`1.5px solid ${dm.border}`,boxSizing:"border-box"}}>
        {canClose&&onClose&&(
          <button className="section-close-btn" onClick={onClose} style={{position:"absolute",top:0,right:0,zIndex:20,width:24,height:24,borderRadius:"0 0 0 6px",border:"none",background:"rgba(139,105,20,0.12)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(139,105,20,0.6)",transition:"opacity 150ms, color 150ms, background 150ms"}}
            onMouseEnter={e=>{e.currentTarget.style.background=`${section.accent}33`;e.currentTarget.style.color=section.accent;}}
            onMouseLeave={e=>{e.currentTarget.style.background="rgba(139,105,20,0.12)";e.currentTarget.style.color="rgba(139,105,20,0.6)";}}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        )}
        {section.id==="read" ? (
          <div style={{flex:1,minHeight:0,overflow:"hidden"}}><PC {...getPanelProps(section.id)}/></div>
        ) : (
          <div className="panel-scroll" style={{flex:1,overflowY:"auto"}}><PC {...getPanelProps(section.id)}/></div>
        )}
        {isDropTarget && section.id==="sharing" ? (
          <div style={{position:"absolute",inset:0,background:"rgba(139,105,20,0.12)",display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none",zIndex:50}}>
            <div style={{padding:"10px 20px",background:section.accent,borderRadius:20,color:"#fff",fontSize:12,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",boxShadow:"0 4px 16px rgba(0,0,0,0.15)"}}>Drop to share in thread</div>
          </div>
        ) : isDropTarget && section.id==="read" ? (
          <div style={{position:"absolute",inset:0,background:"rgba(139,105,20,0.08)",display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none",zIndex:50}}>
            <div style={{padding:"10px 20px",background:section.accent,borderRadius:20,color:"#fff",fontSize:12,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",boxShadow:"0 4px 16px rgba(0,0,0,0.15)"}}>Drop to open passage</div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className={[darkMode?"dark":"",expandedSections.size===4?"four-panel":""].filter(Boolean).join(" ")} style={{display:"flex",flexDirection:"column",width:"100vw",height:"100vh",overflow:"hidden",background:darkMode?"#181410":"#FAF7EF",transition:"background 400ms ease"}}>
      {heroAnchorVisible && <HeroTaglineAnchor mode={heroAnchorMode} activeStage={showOnboarding ? onboardingStage : -1}/>}
      {/* â"€â"€ Intro overlay â"€â"€ */}
      {introActive && !showEmailVerification && <IntroOverlay dark={darkMode} onDone={()=>setIntroActive(false)} onCreateAccount={()=>{inExplicitAuthFlowRef.current=true;setShowCreateAccount(true);}} onSignIn={()=>{inExplicitAuthFlowRef.current=true;setShowSignIn(true);}} onGoogleSignIn={handleGoogleSignIn} showForeground={!showCreateAccount && !showSignIn && !showOnboarding}/>}
      {showCreateAccount && <CreateAccountOverlay onBack={()=>setShowCreateAccount(false)} onSubmit={handleCreateAccount}/>}
      {showSignIn && <SignInOverlay onBack={()=>setShowSignIn(false)} onSubmit={()=>{setShowSignIn(false);requestLaunch();}} onCreateAccount={()=>{setShowSignIn(false);setShowCreateAccount(true);}} onGoogleSignIn={handleGoogleSignIn}/>}
      {showGoogleComplete && googleUserData && (
        <GoogleCompleteProfileOverlay
          googleUser={googleUserData}
          onSubmit={(profile, options)=>{
            setShowGoogleComplete(false);
            setGoogleUserData(null);
            handleCreateAccount(profile, options);
          }}
          onBack={()=>{
            firebase.auth().signOut();
            setShowGoogleComplete(false);
            setGoogleUserData(null);
            inExplicitAuthFlowRef.current = false;
            setShowSignIn(true);
          }}
        />
      )}
      {showOnboarding && <ReaderOnboardingOverlay profile={readerProfile} onStageChange={setOnboardingStage} onComplete={handleOnboardingComplete}/>}
      {showEmailVerification && (
        <EmailVerificationOverlay
          email={firebase.auth().currentUser ? firebase.auth().currentUser.email : ""}
          onVerified={()=>{
            setShowEmailVerification(false);
            launchApp();
          }}
          onSignOut={()=>{
            inExplicitAuthFlowRef.current = false;
            firebase.auth().signOut();
            setShowEmailVerification(false);
            setShowGoogleComplete(false);
            setShowOnboarding(false);
            setShowConsent(false);
            setShowCreateAccount(false);
            setShowSignIn(false);
            setGoogleUserData(null);
            setIntroActive(true);
            setReaderProfile(null);
            setSnippedMoments([]);
            setMomentEdits({});
            setDeletedMomentIds(new Set());
          }}
        />
      )}
      {showConsent && <ConsentScreen onAccept={handleConsentAccepted} onDecline={()=>{
        apiDelete("/users/me").catch(function(){}).finally(function(){
          firebase.auth().signOut().catch(function(){});
          try{ localStorage.removeItem('momento_consent_given'); }catch(e){}
          setShowConsent(false);
          setIntroActive(true);
        });
      }}/>}

      <TopChrome
        expandedSections={expandedSections}
        cubeIndex={cubeIndex}
        expandedArray={expandedArray}
        setShowHint={setShowHint}
        darkMode={darkMode}
        dm={dm}
        TRACK_W={TRACK_W}
        SECTIONS={SECTIONS}
        momentsSavedBlink={momentsSavedBlink}
        worthNotif={worthNotif}
        sharingNotifCount={sharingNotifCount}
        rotateTo={rotateTo}
        handleClose={handleClose}
        toggleSection={toggleSection}
        expandSection={expandSection}
        searchInputRef={searchInputRef}
        readSearchQuery={readSearchQuery}
        setReadSearchQuery={setReadSearchQuery}
        setShowProfile={setShowProfile}
        showProfile={showProfile}
        isWorthSolo={isWorthSolo}
        worthMessage={worthMessage}
        isMomentsSolo={isMomentsSolo}
        momentsWithMomento={momentsWithMomento}
        momentsBookCount={momentsBookCount}
        momentsLayoutMode={momentsLayoutMode}
        setMomentsLayoutMode={setMomentsLayoutMode}
        momentsPassageFirst={momentsPassageFirst}
        setMomentsPassageFirst={setMomentsPassageFirst}
        momentsShowLayoutMenu={momentsShowLayoutMenu}
        setMomentsShowLayoutMenu={setMomentsShowLayoutMenu}
        isSharingSolo={isSharingSolo}
        onSharingOpenThread={(name,pendingMoment=null)=>setSharingActiveThread({name,pendingMoment})}
        bookOpen={openBookInRead !== null}
        momentsBrowsingBook={momentsBrowsingBook}
      />

      <ProfileDrawer
        showProfile={showProfile}
        setShowProfile={setShowProfile}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onSignOut={()=>{
          inExplicitAuthFlowRef.current = false;
          firebase.auth().signOut();
          setShowProfile(false);
          setShowEmailVerification(false);
          setShowGoogleComplete(false);
          setShowOnboarding(false);
          setShowConsent(false);
          setShowCreateAccount(false);
          setShowSignIn(false);
          setGoogleUserData(null);
          setIntroActive(true);
          setReaderProfile(null);
          setSnippedMoments([]);
          setMomentEdits({});
          setDeletedMomentIds(new Set());
        }}
        allMoments={_allMomentsFlat}
        readerProfile={readerProfile}
      />
      <div style={{display:"flex",flex:1,minHeight:0,position:"relative",animation:"shelfRise 600ms cubic-bezier(0.34,1.2,0.64,1) 1800ms both",marginTop:0}}>
        <div style={{flex:1,position:"relative",overflow:"hidden"}}>
          {expandedSections.size===1 ? (
            <div style={{width:"400%",height:"100%",display:"flex",position:"absolute",top:0,left:0,
              transform:`translateX(${-cubeIndex*25}%)`,
              transition:isRotating?"transform 350ms cubic-bezier(0.4,0,0.2,1)":"none"}}>
              {SECTIONS.map((section,index)=>(
                <div key={section.id} style={{width:"25%",height:"100%",flexShrink:0,display:"flex",flexDirection:"column",background:dm.bg,transition:"background 400ms ease"}}>
                  {renderPanel(section,false,null)}
                </div>
              ))}
            </div>
          ) : (
            <div style={{width:"100%",height:"100%",display:"flex"}}>
              {(()=>{
                const allSi = [...new Set([...expandedArray, ...Array.from(closingSections)])].sort((a,b)=>a-b);
                return allSi.map((si,i,arr)=>{
                  const section=SECTIONS[si];
                  const isClosing = closingSections.has(si);
                  const foldDir = i===0 ? "fold-out-left" : "fold-out-right";
                  return (
                    <div key={isClosing ? `${section.id}-close-${closeCountRef.current[si]||0}` : `${section.id}-${openCountRef.current[si]||0}`}
                      className={isClosing ? foldDir : (lastOpenedRef.current.index===si && lastOpenedRef.current.direction==='left' ? "unfold-panel-left" : "unfold-panel")}
                      style={{
                        display:"flex",flexDirection:"column",
                        flex:"1 1 0%",
                        overflow:"hidden",
                        borderRight:i<arr.length-1?"1px solid rgba(139,105,20,0.12)":"none",
                        transformOrigin:i===0?"right center":"left center",
                        pointerEvents:isClosing?"none":"auto"}}>
                      {renderPanel(section,expandedSections.size>1,()=>!isClosing&&closingSections.size===0?handleClose(si):null)}
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>

      {draggedMoment&&(
        <div style={{position:"fixed",left:ghostPos.x+12,top:ghostPos.y-20,width:220,background:"var(--bg)",border:"1px solid rgba(139,105,20,0.2)",borderRadius:4,boxShadow:"6px 8px 24px rgba(0,0,0,0.18)",pointerEvents:"none",zIndex:9999,transform:"rotate(2deg)",opacity:0.95}}>
          <div className="notebook-line" style={{padding:"12px 12px 12px 16px"}}>
            <p className="font-handwriting" style={{fontSize:13,lineHeight:1.7,color:"var(--text)",margin:0,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{draggedMoment.interpretation}</p>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderTop:"1px solid rgba(139,105,20,0.08)",background:"rgba(139,105,20,0.02)"}}>
            <span className="font-serif" style={{fontSize:10,fontStyle:"italic",color:"var(--amber)"}}>{draggedMoment.book}</span>
            <span className="font-sans" style={{fontSize:9,color:"var(--text)"}}>p. {draggedMoment.page}</span>
          </div>
        </div>
      )}

      {/* â"€â"€ Cube tooltip â€" at root to escape transform stacking context â"€â"€ */}
      <CubeHint showHint={showHint}/>

      {/* â"€â"€ First moment toast â"€â"€ */}
      <div style={{
        position:"fixed",
        bottom:28,
        left:"50%",
        transform:`translateX(-50%) translateY(${firstMomentToast ? 0 : 20}px)`,
        opacity: firstMomentToast ? 1 : 0,
        pointerEvents: firstMomentToast ? "auto" : "none",
        transition:"opacity 360ms ease, transform 360ms ease",
        zIndex:999,
        background:"linear-gradient(135deg, #1C1209 0%, #2C1A08 100%)",
        border:"1px solid rgba(196,160,85,0.35)",
        borderRadius:16,
        padding:"12px 20px",
        boxShadow:"0 8px 32px rgba(0,0,0,0.32)",
        maxWidth:"min(420px, calc(100vw - 48px))",
        textAlign:"center",
      }}>
        <p className="font-sans" style={{margin:0,fontSize:13,lineHeight:1.55,color:"rgba(248,242,228,0.92)"}}>
          {firstMomentToast === 'combined' ? (
            <>
              <span style={{color:"#D4B87A",fontWeight:700}}>You captured your first moment!</span>
              {" "}To find readers, you need to write a little more.
            </>
          ) : (
            <>
              <span style={{color:"#D4B87A",fontWeight:700}}>You just captured your first Moment!</span>
              {" "}More the moments, more closer you get to other readers.
            </>
          )}
        </p>
      </div>

    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(MomentApp));
